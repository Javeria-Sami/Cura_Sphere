using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Persistence;

namespace CuraSphere.Infrastructure.Services;

public class AppointmentService : IAppointmentService
{
    private readonly CuraSphereDbContext _context;

    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Scheduled", "Confirmed", "Checked In", "In Consultation", "Completed", "Cancelled", "No Show"
    };

    public AppointmentService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AppointmentListDto>> GetAppointmentsAsync(string? search, string? status)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(a => a.Department)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            query = query.Where(a => a.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower().Trim();
            query = query.Where(a => 
                a.AppointmentNumber.ToLower().Contains(term) ||
                (a.Patient != null && (
                    a.Patient.FirstName.ToLower().Contains(term) ||
                    a.Patient.LastName.ToLower().Contains(term) ||
                    a.Patient.MedicalRecordNumber.ToLower().Contains(term) ||
                    a.Patient.PhoneNumber.Contains(term)
                )) ||
                (a.Doctor != null && a.Doctor.Employee != null && (
                    a.Doctor.Employee.FirstName.ToLower().Contains(term) ||
                    a.Doctor.Employee.LastName.ToLower().Contains(term)
                ))
            );
        }

        var list = await query
            .OrderByDescending(a => a.AppointmentDate)
            .ThenBy(a => a.AppointmentTime)
            .ToListAsync();

        return list.Select(MapToDto);
    }

    public async Task<AppointmentListDto?> GetAppointmentByIdAsync(long id)
    {
        var appt = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(a => a.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AppointmentId == id);

        return appt != null ? MapToDto(appt) : null;
    }

    public async Task<AppointmentListDto> CreateAppointmentAsync(CreateAppointmentDto dto)
    {
        // 1. Verify Patient exists
        var patient = await _context.Patients.FindAsync(dto.PatientId);
        if (patient == null)
        {
            throw new InvalidOperationException($"Patient record with ID {dto.PatientId} does not exist.");
        }

        // 2. Verify Doctor exists
        var doctor = await _context.Doctors
            .Include(d => d.Department)
            .FirstOrDefaultAsync(d => d.DoctorId == dto.DoctorId);
        if (doctor == null)
        {
            throw new InvalidOperationException($"Doctor with ID {dto.DoctorId} does not exist.");
        }

        // If department ID not specified or 0, fallback to doctor's assigned department
        var departmentId = dto.DepartmentId > 0 ? dto.DepartmentId : doctor.DepartmentId;

        // 3. Parse Time Slot
        var parsedTime = ParseTimeSpan(dto.AppointmentTime);

        // 4. Double-booking conflict prevention
        var conflict = await _context.Appointments.AnyAsync(a =>
            a.DoctorId == dto.DoctorId &&
            a.AppointmentDate.Date == dto.AppointmentDate.Date &&
            a.AppointmentTime == parsedTime &&
            a.Status != "Cancelled" &&
            a.Status != "No Show"
        );

        if (conflict)
        {
            throw new InvalidOperationException(
                $"Doctor already has an active consultation scheduled at {dto.AppointmentTime} on {dto.AppointmentDate:yyyy-MM-dd}. Please choose another time slot."
            );
        }

        var apptNumber = $"APT-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";
        
        var appt = new Appointment
        {
            AppointmentNumber = apptNumber,
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            DepartmentId = departmentId,
            AppointmentDate = dto.AppointmentDate.Date,
            AppointmentTime = parsedTime,
            AppointmentType = string.IsNullOrWhiteSpace(dto.AppointmentType) ? "OPD" : dto.AppointmentType,
            ReasonForVisit = dto.ReasonForVisit,
            Status = "Scheduled"
        };

        _context.Appointments.Add(appt);
        await _context.SaveChangesAsync();

        return (await GetAppointmentByIdAsync(appt.AppointmentId))!;
    }

    public async Task<bool> UpdateStatusAsync(long id, string status, string? remarks = null)
    {
        var appt = await _context.Appointments.FindAsync(id);
        if (appt == null) return false;

        var targetStatus = status.Trim();
        if (!ValidStatuses.Contains(targetStatus))
        {
            throw new ArgumentException($"'{status}' is not a recognized appointment status.");
        }

        // Business rule: Terminal states cannot be transitioned
        if (appt.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Cannot alter an appointment that is already Completed.");
        }
        if (appt.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Cannot alter an appointment that has been Cancelled.");
        }

        appt.Status = targetStatus;

        if (!string.IsNullOrWhiteSpace(remarks))
        {
            appt.Remarks = string.IsNullOrWhiteSpace(appt.Remarks)
                ? remarks.Trim()
                : $"{appt.Remarks} | {remarks.Trim()}";
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AppointmentListDto?> RescheduleAppointmentAsync(long id, RescheduleAppointmentDto dto)
    {
        var appt = await _context.Appointments.FindAsync(id);
        if (appt == null) return null;

        if (appt.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
            appt.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Cannot reschedule an appointment with status '{appt.Status}'.");
        }

        var targetDoctorId = dto.DoctorId ?? appt.DoctorId;
        var parsedTime = ParseTimeSpan(dto.AppointmentTime);

        // Check for double booking conflict in target slot (excluding current appointment)
        var conflict = await _context.Appointments.AnyAsync(a =>
            a.AppointmentId != id &&
            a.DoctorId == targetDoctorId &&
            a.AppointmentDate.Date == dto.AppointmentDate.Date &&
            a.AppointmentTime == parsedTime &&
            a.Status != "Cancelled" &&
            a.Status != "No Show"
        );

        if (conflict)
        {
            throw new InvalidOperationException(
                $"Doctor is already booked at {dto.AppointmentTime} on {dto.AppointmentDate:yyyy-MM-dd}."
            );
        }

        appt.AppointmentDate = dto.AppointmentDate.Date;
        appt.AppointmentTime = parsedTime;
        appt.DoctorId = targetDoctorId;

        // Reset No Show back to Scheduled on reschedule
        if (appt.Status.Equals("No Show", StringComparison.OrdinalIgnoreCase))
        {
            appt.Status = "Scheduled";
        }

        var auditNote = $"Rescheduled to {dto.AppointmentDate:yyyy-MM-dd} {dto.AppointmentTime}" +
            (!string.IsNullOrWhiteSpace(dto.Remarks) ? $": {dto.Remarks.Trim()}" : "");

        appt.Remarks = string.IsNullOrWhiteSpace(appt.Remarks)
            ? auditNote
            : $"{appt.Remarks} | {auditNote}";

        await _context.SaveChangesAsync();

        return await GetAppointmentByIdAsync(appt.AppointmentId);
    }

    public async Task<IEnumerable<DoctorLookupDto>> GetDoctorsAsync(string? status = null)
    {
        var query = _context.Doctors
            .Include(d => d.Employee)
            .Include(d => d.Specialization)
            .Include(d => d.Department)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(d => d.Status == status);
        }

        var doctors = await query
            .OrderBy(d => d.Employee != null ? d.Employee.LastName : "")
            .ThenBy(d => d.Employee != null ? d.Employee.FirstName : "")
            .ToListAsync();

        return doctors.Select(d => new DoctorLookupDto
        {
            DoctorId = d.DoctorId,
            DoctorCode = !string.IsNullOrWhiteSpace(d.DoctorCode) ? d.DoctorCode : $"DOC-{d.DoctorId:D3}",
            DoctorName = d.Employee != null 
                ? (d.Employee.FirstName.StartsWith("Dr.") ? $"{d.Employee.FirstName} {d.Employee.LastName}".Trim() : $"Dr. {d.Employee.FirstName} {d.Employee.LastName}".Trim())
                : "Dr. Provider",
            Specialization = d.Specialization?.SpecializationName ?? "General Practice",
            DepartmentId = d.DepartmentId,
            DepartmentName = d.Department?.DepartmentName ?? "Outpatient Clinic",
            ConsultationFee = d.ConsultationFee > 0 ? d.ConsultationFee : 1500,
            PhoneNumber = d.Employee?.PhoneNumber ?? string.Empty,
            Email = d.Employee?.Email ?? string.Empty,
            YearsOfExperience = d.YearsOfExperience,
            Status = d.Status
        });
    }

    public async Task<DoctorLookupDto> CreateDoctorAsync(CreateDoctorDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Doctor full name is required.");

        var cleanName = dto.Name.Trim();
        if (cleanName.StartsWith("Dr. ", StringComparison.OrdinalIgnoreCase))
            cleanName = cleanName.Substring(4).Trim();
        else if (cleanName.StartsWith("Dr.", StringComparison.OrdinalIgnoreCase))
            cleanName = cleanName.Substring(3).Trim();

        var nameParts = cleanName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var firstName = nameParts.Length > 0 ? nameParts[0] : "Doctor";
        var lastName = nameParts.Length > 1 ? nameParts[1] : string.Empty;

        // Resolve or create specialization
        var specName = !string.IsNullOrWhiteSpace(dto.Specialization) ? dto.Specialization.Trim() : "General Practice";
        var spec = await _context.Specializations.FirstOrDefaultAsync(s => s.SpecializationName.ToLower() == specName.ToLower());
        if (spec == null)
        {
            spec = new Specialization
            {
                SpecializationName = specName,
                Description = $"{specName} Clinical Specialty"
            };
            _context.Specializations.Add(spec);
            await _context.SaveChangesAsync();
        }

        // Resolve department
        Department? dept = null;
        if (dto.DepartmentId.HasValue && dto.DepartmentId.Value > 0)
        {
            dept = await _context.Departments.FindAsync(dto.DepartmentId.Value);
        }
        if (dept == null)
        {
            dept = await _context.Departments.FirstOrDefaultAsync() 
                   ?? new Department { DepartmentName = "Outpatient Clinic", DepartmentCode = "OPD", Location = "Building A" };
            if (dept.DepartmentId == 0)
            {
                _context.Departments.Add(dept);
                await _context.SaveChangesAsync();
            }
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        var randomSuffix = new Random().Next(1000, 9999);
        var employee = new Employee
        {
            EmployeeCode = $"EMP-DOC-{DateTime.UtcNow:yyMM}-{randomSuffix}",
            FirstName = firstName,
            LastName = lastName,
            Gender = "Not Specified",
            DateOfBirth = DateTime.UtcNow.AddYears(-35),
            PhoneNumber = !string.IsNullOrWhiteSpace(dto.PhoneNumber) ? dto.PhoneNumber.Trim() : "+923000000000",
            Email = !string.IsNullOrWhiteSpace(dto.Email) ? dto.Email.Trim() : $"{firstName.ToLower()}.{lastName.ToLower()}@curasphere.com",
            HireDate = DateTime.UtcNow,
            Designation = "Medical Specialist",
            DepartmentId = dept.DepartmentId,
            EmploymentStatus = "Active"
        };
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var doctor = new Doctor
        {
            DoctorCode = $"DOC-{DateTime.UtcNow:yyMM}-{randomSuffix}",
            EmployeeId = employee.EmployeeId,
            DepartmentId = dept.DepartmentId,
            SpecializationId = spec.SpecializationId,
            ConsultationFee = dto.ConsultationFee >= 0 ? dto.ConsultationFee : 1500,
            YearsOfExperience = dto.YearsOfExperience >= 0 ? dto.YearsOfExperience : 1,
            LicenseNumber = $"PMC-{randomSuffix}",
            Qualification = "MBBS, Specialist",
            ConsultationDuration = 15,
            Status = "Active"
        };
        _context.Doctors.Add(doctor);
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return new DoctorLookupDto
        {
            DoctorId = doctor.DoctorId,
            DoctorCode = doctor.DoctorCode,
            DoctorName = $"Dr. {employee.FirstName} {employee.LastName}".Trim(),
            Specialization = spec.SpecializationName,
            DepartmentId = dept.DepartmentId,
            DepartmentName = dept.DepartmentName,
            ConsultationFee = doctor.ConsultationFee,
            PhoneNumber = employee.PhoneNumber,
            Email = employee.Email,
            YearsOfExperience = doctor.YearsOfExperience,
            Status = doctor.Status
        };
    }

    public async Task<IEnumerable<DepartmentLookupDto>> GetDepartmentsAsync()
    {
        var departments = await _context.Departments
            .AsNoTracking()
            .OrderBy(d => d.DepartmentName)
            .ToListAsync();

        return departments.Select(d => new DepartmentLookupDto
        {
            DepartmentId = d.DepartmentId,
            DepartmentName = d.DepartmentName,
            DepartmentCode = d.DepartmentCode
        });
    }

    private static TimeSpan ParseTimeSpan(string? timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr))
        {
            return TimeSpan.FromHours(10);
        }

        if (DateTime.TryParse(timeStr, out var dt))
        {
            return dt.TimeOfDay;
        }

        if (TimeSpan.TryParse(timeStr, out var ts))
        {
            return ts;
        }

        return TimeSpan.FromHours(10);
    }

    private static AppointmentListDto MapToDto(Appointment a)
    {
        var doctorName = a.Doctor?.Employee != null 
            ? $"Dr. {a.Doctor.Employee.FirstName} {a.Doctor.Employee.LastName}"
            : "Dr. Clinic Provider";

        var timeString = a.AppointmentTime != TimeSpan.Zero
            ? DateTime.Today.Add(a.AppointmentTime).ToString("hh:mm tt")
            : a.AppointmentDate.ToString("hh:mm tt");

        return new AppointmentListDto
        {
            AppointmentId = a.AppointmentId,
            AppointmentNumber = a.AppointmentNumber,
            PatientId = a.PatientId,
            PatientName = a.Patient != null ? $"{a.Patient.FirstName} {a.Patient.LastName}" : "Unknown",
            MedicalRecordNumber = a.Patient?.MedicalRecordNumber ?? "",
            DoctorId = a.DoctorId,
            DoctorName = doctorName,
            DepartmentName = a.Department?.DepartmentName ?? "Outpatient Clinic",
            AppointmentDate = a.AppointmentDate.ToString("yyyy-MM-dd"),
            AppointmentTime = timeString,
            AppointmentType = a.AppointmentType,
            Status = a.Status,
            ReasonForVisit = a.ReasonForVisit
        };
    }
}
