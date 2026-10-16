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

public class ClinicalServicesService : IClinicalServicesService
{
    private readonly CuraSphereDbContext _context;

    public ClinicalServicesService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PharmacyStockDto>> GetPharmacyStockAsync(string? search)
    {
        var query = _context.PharmacyStocks.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p => 
                p.DrugCode.ToLower().Contains(term) ||
                p.DrugName.ToLower().Contains(term) ||
                p.GenericName.ToLower().Contains(term));
        }

        var list = await query.OrderBy(p => p.DrugName).ToListAsync();
        return list.Select(MapToPharmDto);
    }

    public async Task<IEnumerable<SurgicalProcedureDto>> GetSurgicalScheduleAsync(string? search)
    {
        var query = _context.SurgicalProcedures
            .Include(s => s.Patient)
            .Include(s => s.LeadSurgeon)
                .ThenInclude(d => d.Employee)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(s => 
                s.SurgeryNumber.ToLower().Contains(term) ||
                s.ProcedureName.ToLower().Contains(term) ||
                s.Patient.FirstName.ToLower().Contains(term) ||
                s.Patient.LastName.ToLower().Contains(term));
        }

        var list = await query.OrderBy(s => s.ScheduledStartTime).ToListAsync();
        return list.Select(MapToSurgDto);
    }

    public async Task<IEnumerable<IcuPatientVitalDto>> GetIcuVitalsAsync(string? search)
    {
        var query = _context.IcuPatientVitals
            .Include(v => v.Patient)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(v => 
                v.BedNumber.ToLower().Contains(term) ||
                v.Patient.FirstName.ToLower().Contains(term) ||
                v.Patient.LastName.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(v => v.RecordedAt).ToListAsync();
        return list.Select(MapToIcuDto);
    }

    private static PharmacyStockDto MapToPharmDto(PharmacyStock p) => new PharmacyStockDto
    {
        DrugId = p.DrugId,
        DrugCode = p.DrugCode,
        DrugName = p.DrugName,
        GenericName = p.GenericName,
        DosageForm = p.DosageForm,
        QuantityInStock = p.QuantityInStock,
        MinimumThreshold = p.MinimumThreshold,
        UnitPrice = p.UnitPrice,
        ExpiryDate = p.ExpiryDate.ToString("yyyy-MM-dd"),
        Status = p.Status
    };

    private static SurgicalProcedureDto MapToSurgDto(SurgicalProcedure s)
    {
        var doctorName = s.LeadSurgeon?.Employee != null 
            ? $"Dr. {s.LeadSurgeon.Employee.FirstName} {s.LeadSurgeon.Employee.LastName}"
            : "Surgeon";

        return new SurgicalProcedureDto
        {
            SurgeryId = s.SurgeryId,
            SurgeryNumber = s.SurgeryNumber,
            PatientId = s.PatientId,
            PatientName = s.Patient != null ? $"{s.Patient.FirstName} {s.Patient.LastName}" : "Patient",
            MedicalRecordNumber = s.Patient?.MedicalRecordNumber ?? "",
            ProcedureName = s.ProcedureName,
            OtRoomNumber = s.OtRoomNumber,
            LeadSurgeonName = doctorName,
            AnesthetistName = s.AnesthetistName,
            ScheduledStartTime = s.ScheduledStartTime.ToString("yyyy-MM-dd hh:mm tt"),
            Status = s.Status
        };
    }

    private static IcuPatientVitalDto MapToIcuDto(IcuPatientVital v) => new IcuPatientVitalDto
    {
        VitalId = v.VitalId,
        PatientId = v.PatientId,
        PatientName = v.Patient != null ? $"{v.Patient.FirstName} {v.Patient.LastName}" : "Patient",
        MedicalRecordNumber = v.Patient?.MedicalRecordNumber ?? "",
        BedNumber = v.BedNumber,
        BloodPressure = v.BloodPressure,
        HeartRate = v.HeartRate,
        SpO2 = v.SpO2,
        GcsScore = v.GcsScore,
        Temperature = v.Temperature,
        RecordedAt = v.RecordedAt.ToString("hh:mm tt"),
        AlertStatus = v.AlertStatus
    };
}
