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

public class EmergencyService : IEmergencyService
{
    private readonly CuraSphereDbContext _context;

    public EmergencyService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EmergencyCaseDto>> GetActiveCasesAsync(string? search, string? triage)
    {
        var query = _context.EmergencyCases
            .Include(e => e.Patient)
            .Include(e => e.AttendingDoctor)
                .ThenInclude(d => d!.Employee)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(triage))
        {
            query = query.Where(e => e.TriageLevel.ToLower() == triage.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(e => 
                e.CaseNumber.ToLower().Contains(term) ||
                e.Patient.FirstName.ToLower().Contains(term) ||
                e.Patient.LastName.ToLower().Contains(term) ||
                e.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        var list = await query.OrderBy(e => e.TriageLevel).ThenByDescending(e => e.ArrivalTime).ToListAsync();
        return list.Select(MapToDto);
    }

    public async Task<EmergencyCaseDto> CreateCaseAsync(CreateEmergencyCaseDto dto)
    {
        var caseNo = $"EM-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";

        var emergencyCase = new EmergencyCase
        {
            CaseNumber = caseNo,
            PatientId = dto.PatientId,
            ChiefComplaint = dto.ChiefComplaint,
            TriageLevel = dto.TriageLevel,
            AttendingDoctorId = dto.AttendingDoctorId,
            ArrivalTime = DateTime.UtcNow,
            Status = "Under Treatment"
        };

        _context.EmergencyCases.Add(emergencyCase);
        await _context.SaveChangesAsync();

        var created = await _context.EmergencyCases
            .Include(e => e.Patient)
            .Include(e => e.AttendingDoctor)
                .ThenInclude(d => d!.Employee)
            .AsNoTracking()
            .FirstAsync(e => e.EmergencyCaseId == emergencyCase.EmergencyCaseId);

        return MapToDto(created);
    }

    public async Task<bool> UpdateStatusAsync(long id, string status)
    {
        var item = await _context.EmergencyCases.FindAsync(id);
        if (item == null) return false;

        item.Status = status;
        await _context.SaveChangesAsync();
        return true;
    }

    private static EmergencyCaseDto MapToDto(EmergencyCase e)
    {
        var doctorName = e.AttendingDoctor?.Employee != null 
            ? $"Dr. {e.AttendingDoctor.Employee.FirstName} {e.AttendingDoctor.Employee.LastName}"
            : "Emergency Officer";

        return new EmergencyCaseDto
        {
            EmergencyCaseId = e.EmergencyCaseId,
            CaseNumber = e.CaseNumber,
            PatientId = e.PatientId,
            PatientName = e.Patient != null ? $"{e.Patient.FirstName} {e.Patient.LastName}" : "Unknown",
            MedicalRecordNumber = e.Patient?.MedicalRecordNumber ?? "",
            Age = e.Patient?.Age ?? 0,
            ChiefComplaint = e.ChiefComplaint,
            TriageLevel = e.TriageLevel,
            AttendingDoctorId = e.AttendingDoctorId,
            DoctorName = doctorName,
            ArrivalTime = e.ArrivalTime.ToString("hh:mm tt"),
            Status = e.Status
        };
    }
}
