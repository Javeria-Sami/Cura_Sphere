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

public class DiagnosticsService : IDiagnosticsService
{
    private readonly CuraSphereDbContext _context;

    public DiagnosticsService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<LabOrderDto>> GetLabOrdersAsync(string? search, string? category)
    {
        var query = _context.LabOrders
            .Include(l => l.Patient)
            .Include(l => l.Doctor)
                .ThenInclude(d => d.Employee)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(l => l.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(l => 
                l.OrderNumber.ToLower().Contains(term) ||
                l.TestName.ToLower().Contains(term) ||
                l.Patient.FirstName.ToLower().Contains(term) ||
                l.Patient.LastName.ToLower().Contains(term) ||
                l.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(l => l.OrderedAt).ToListAsync();
        return list.Select(MapToLabDto);
    }

    public async Task<LabOrderDto> CreateLabOrderAsync(CreateLabOrderDto dto)
    {
        var orderNo = $"LAB-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";

        var order = new LabOrder
        {
            OrderNumber = orderNo,
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            TestName = dto.TestName,
            Category = dto.Category,
            OrderedAt = DateTime.UtcNow,
            Status = "Pending"
        };

        _context.LabOrders.Add(order);
        await _context.SaveChangesAsync();

        var created = await _context.LabOrders
            .Include(l => l.Patient)
            .Include(l => l.Doctor)
                .ThenInclude(d => d.Employee)
            .AsNoTracking()
            .FirstAsync(l => l.LabOrderId == order.LabOrderId);

        return MapToLabDto(created);
    }

    public async Task<IEnumerable<RadiologyStudyDto>> GetRadiologyStudiesAsync(string? search, string? modality)
    {
        var query = _context.RadiologyStudies
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
                .ThenInclude(d => d.Employee)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(modality))
        {
            query = query.Where(r => r.Modality.ToLower() == modality.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(r => 
                r.StudyNumber.ToLower().Contains(term) ||
                r.StudyName.ToLower().Contains(term) ||
                r.Patient.FirstName.ToLower().Contains(term) ||
                r.Patient.LastName.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(r => r.OrderedAt).ToListAsync();
        return list.Select(MapToRadDto);
    }

    private static LabOrderDto MapToLabDto(LabOrder l)
    {
        var doctorName = l.Doctor?.Employee != null 
            ? $"Dr. {l.Doctor.Employee.FirstName} {l.Doctor.Employee.LastName}"
            : "Physician";

        return new LabOrderDto
        {
            LabOrderId = l.LabOrderId,
            OrderNumber = l.OrderNumber,
            PatientId = l.PatientId,
            PatientName = l.Patient != null ? $"{l.Patient.FirstName} {l.Patient.LastName}" : "Unknown",
            MedicalRecordNumber = l.Patient?.MedicalRecordNumber ?? "",
            DoctorName = doctorName,
            TestName = l.TestName,
            Category = l.Category,
            OrderedAt = l.OrderedAt.ToString("yyyy-MM-dd hh:mm tt"),
            Status = l.Status,
            ResultValue = l.ResultValue,
            ReferenceRange = l.ReferenceRange
        };
    }

    private static RadiologyStudyDto MapToRadDto(RadiologyStudy r)
    {
        var doctorName = r.Doctor?.Employee != null 
            ? $"Dr. {r.Doctor.Employee.FirstName} {r.Doctor.Employee.LastName}"
            : "Physician";

        return new RadiologyStudyDto
        {
            StudyId = r.StudyId,
            StudyNumber = r.StudyNumber,
            PatientId = r.PatientId,
            PatientName = r.Patient != null ? $"{r.Patient.FirstName} {r.Patient.LastName}" : "Unknown",
            MedicalRecordNumber = r.Patient?.MedicalRecordNumber ?? "",
            DoctorName = doctorName,
            StudyName = r.StudyName,
            Modality = r.Modality,
            Priority = r.Priority,
            OrderedAt = r.OrderedAt.ToString("yyyy-MM-dd hh:mm tt"),
            Status = r.Status,
            ImpressionReport = r.ImpressionReport
        };
    }
}
