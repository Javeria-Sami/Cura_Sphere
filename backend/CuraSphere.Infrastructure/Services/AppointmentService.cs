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

    public AppointmentService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AppointmentListDto>> GetAppointmentsAsync(string? search, string? status)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(a => 
                a.AppointmentNumber.ToLower().Contains(term) ||
                a.Patient.FirstName.ToLower().Contains(term) ||
                a.Patient.LastName.ToLower().Contains(term) ||
                a.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(a => a.AppointmentDate).ToListAsync();

        return list.Select(a => MapToDto(a));
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
        var apptNumber = $"APT-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";
        
        var appt = new Appointment
        {
            AppointmentNumber = apptNumber,
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            DepartmentId = dto.DepartmentId,
            AppointmentDate = dto.AppointmentDate,
            AppointmentType = dto.AppointmentType,
            ReasonForVisit = dto.ReasonForVisit,
            Status = "Scheduled"
        };

        _context.Appointments.Add(appt);
        await _context.SaveChangesAsync();

        return (await GetAppointmentByIdAsync(appt.AppointmentId))!;
    }

    public async Task<bool> UpdateStatusAsync(long id, string status)
    {
        var appt = await _context.Appointments.FindAsync(id);
        if (appt == null) return false;

        appt.Status = status;
        await _context.SaveChangesAsync();
        return true;
    }

    private static AppointmentListDto MapToDto(Appointment a)
    {
        var doctorName = a.Doctor?.Employee != null 
            ? $"Dr. {a.Doctor.Employee.FirstName} {a.Doctor.Employee.LastName}"
            : "Doctor";

        return new AppointmentListDto
        {
            AppointmentId = a.AppointmentId,
            AppointmentNumber = a.AppointmentNumber,
            PatientId = a.PatientId,
            PatientName = a.Patient != null ? $"{a.Patient.FirstName} {a.Patient.LastName}" : "Unknown",
            MedicalRecordNumber = a.Patient?.MedicalRecordNumber ?? "",
            DoctorId = a.DoctorId,
            DoctorName = doctorName,
            DepartmentName = a.Department?.DepartmentName ?? "",
            AppointmentDate = a.AppointmentDate.ToString("yyyy-MM-dd"),
            AppointmentTime = a.AppointmentDate.ToString("hh:mm tt"),
            AppointmentType = a.AppointmentType,
            Status = a.Status,
            ReasonForVisit = a.ReasonForVisit
        };
    }
}
