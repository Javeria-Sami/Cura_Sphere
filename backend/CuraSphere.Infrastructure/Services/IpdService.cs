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

public class IpdService : IIpdService
{
    private readonly CuraSphereDbContext _context;

    public IpdService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<IpdAdmissionDto>> GetAdmissionsAsync(string? search, string? ward)
    {
        var query = _context.IpdAdmissions
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(a => a.Bed)
                .ThenInclude(b => b.Ward)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(ward))
        {
            query = query.Where(a => a.Bed.Ward.WardName.ToLower().Contains(ward.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(a => 
                a.AdmissionNumber.ToLower().Contains(term) ||
                a.Patient.FirstName.ToLower().Contains(term) ||
                a.Patient.LastName.ToLower().Contains(term) ||
                a.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(a => a.AdmissionDate).ToListAsync();
        return list.Select(MapToDto);
    }

    public async Task<IpdAdmissionDto> AdmitPatientAsync(CreateIpdAdmissionDto dto)
    {
        var admissionNo = $"IPD-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";

        var admission = new IpdAdmission
        {
            AdmissionNumber = admissionNo,
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            BedId = dto.BedId,
            PrimaryDiagnosis = dto.PrimaryDiagnosis,
            PatientCondition = dto.PatientCondition,
            AdmissionDate = DateTime.UtcNow,
            Status = "Admitted"
        };

        var bed = await _context.Beds.FindAsync(dto.BedId);
        if (bed != null)
        {
            bed.Status = "Occupied";
        }

        _context.IpdAdmissions.Add(admission);
        await _context.SaveChangesAsync();

        var created = await _context.IpdAdmissions
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(a => a.Bed)
                .ThenInclude(b => b.Ward)
            .AsNoTracking()
            .FirstAsync(a => a.AdmissionId == admission.AdmissionId);

        return MapToDto(created);
    }

    public async Task<bool> DischargePatientAsync(long admissionId)
    {
        var admission = await _context.IpdAdmissions.Include(a => a.Bed).FirstOrDefaultAsync(a => a.AdmissionId == admissionId);
        if (admission == null) return false;

        admission.Status = "Discharged";
        admission.DischargeDate = DateTime.UtcNow;
        admission.PatientCondition = "Discharged";

        if (admission.Bed != null)
        {
            admission.Bed.Status = "Available";
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static IpdAdmissionDto MapToDto(IpdAdmission a)
    {
        var doctorName = a.Doctor?.Employee != null 
            ? $"Dr. {a.Doctor.Employee.FirstName} {a.Doctor.Employee.LastName}"
            : "Doctor";

        var days = (int)Math.Max(1, (DateTime.UtcNow - a.AdmissionDate).TotalDays);

        return new IpdAdmissionDto
        {
            AdmissionId = a.AdmissionId,
            AdmissionNumber = a.AdmissionNumber,
            PatientId = a.PatientId,
            PatientName = a.Patient != null ? $"{a.Patient.FirstName} {a.Patient.LastName}" : "Unknown",
            MedicalRecordNumber = a.Patient?.MedicalRecordNumber ?? "",
            WardName = a.Bed?.Ward?.WardName ?? "General Ward",
            BedNumber = a.Bed?.BedNumber ?? "B-01",
            DoctorId = a.DoctorId,
            DoctorName = doctorName,
            AdmissionDate = a.AdmissionDate.ToString("yyyy-MM-dd"),
            DaysAdmitted = days,
            PrimaryDiagnosis = a.PrimaryDiagnosis,
            PatientCondition = a.PatientCondition,
            Status = a.Status
        };
    }
}
