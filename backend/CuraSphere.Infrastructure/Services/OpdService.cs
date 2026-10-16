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

public class OpdService : IOpdService
{
    private readonly CuraSphereDbContext _context;

    public OpdService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<OpdTokenDto>> GetOpdQueueAsync(string? search, string? status)
    {
        var query = _context.OpdTokens
            .Include(t => t.Patient)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(t => 
                t.TokenNumber.ToLower().Contains(term) ||
                t.Patient.FirstName.ToLower().Contains(term) ||
                t.Patient.LastName.ToLower().Contains(term) ||
                t.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        var list = await query.OrderBy(t => t.QueuePosition).ToListAsync();
        return list.Select(MapToDto);
    }

    public async Task<OpdTokenDto> IssueTokenAsync(CreateOpdTokenDto dto)
    {
        var todayCount = await _context.OpdTokens.CountAsync(t => t.TokenDate == DateTime.UtcNow.Date);
        var tokenNo = $"T-{(todayCount + 1):D3}";

        var token = new OpdToken
        {
            TokenNumber = tokenNo,
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            DepartmentId = dto.DepartmentId,
            QueuePosition = todayCount + 1,
            ChiefComplaint = dto.ChiefComplaint,
            Status = "Waiting",
            TokenDate = DateTime.UtcNow.Date
        };

        _context.OpdTokens.Add(token);
        await _context.SaveChangesAsync();

        var created = await _context.OpdTokens
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(t => t.Department)
            .AsNoTracking()
            .FirstAsync(t => t.OpdTokenId == token.OpdTokenId);

        return MapToDto(created);
    }

    public async Task<bool> UpdateTokenStatusAsync(long id, string status)
    {
        var token = await _context.OpdTokens.FindAsync(id);
        if (token == null) return false;

        token.Status = status;
        await _context.SaveChangesAsync();
        return true;
    }

    private static OpdTokenDto MapToDto(OpdToken t)
    {
        var doctorName = t.Doctor?.Employee != null 
            ? $"Dr. {t.Doctor.Employee.FirstName} {t.Doctor.Employee.LastName}"
            : "Doctor";

        return new OpdTokenDto
        {
            OpdTokenId = t.OpdTokenId,
            TokenNumber = t.TokenNumber,
            PatientId = t.PatientId,
            PatientName = t.Patient != null ? $"{t.Patient.FirstName} {t.Patient.LastName}" : "Unknown",
            MedicalRecordNumber = t.Patient?.MedicalRecordNumber ?? "",
            Age = t.Patient?.Age ?? 0,
            DoctorId = t.DoctorId,
            DoctorName = doctorName,
            DepartmentName = t.Department?.DepartmentName ?? "",
            QueuePosition = t.QueuePosition,
            Status = t.Status,
            Vitals = "Normal",
            ChiefComplaint = t.ChiefComplaint
        };
    }
}
