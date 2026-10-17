using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Persistence;
using CuraSphere.Infrastructure.Services.Clinical;

namespace CuraSphere.Infrastructure.Services;

public class EmrService : IEmrService
{
    private readonly CuraSphereDbContext _context;
    private readonly CdssRuleEngine _cdssEngine;

    public EmrService(CuraSphereDbContext context)
    {
        _context = context;
        _cdssEngine = new CdssRuleEngine();
    }

    private class StructuredClinicalPayload
    {
        public long? AppointmentId { get; set; }
        public string? HistoryOfPresentIllness { get; set; }
        public string? ExaminationFindings { get; set; }
        public VitalSignsDto? Vitals { get; set; }
        public List<DiagnosisItemDto> Diagnoses { get; set; } = new();
        public List<PrescriptionItemDto> Prescriptions { get; set; } = new();
        public string? FreeTextNotes { get; set; }
        public int? FollowUpDays { get; set; }
        public string? FollowUpInstructions { get; set; }
    }

    public async Task<List<EmrEncounterDto>> GetPatientEncountersAsync(long patientId)
    {
        var encounters = await _context.EmrEncounters
            .AsNoTracking()
            .Where(e => e.PatientId == patientId && e.IsActive)
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Specialization)
            .OrderByDescending(e => e.EncounterDate)
            .ToListAsync();

        return encounters.Select(MapToDto).ToList();
    }

    public async Task<EmrEncounterDto?> GetEncounterByIdAsync(long encounterId)
    {
        var encounter = await _context.EmrEncounters
            .AsNoTracking()
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Specialization)
            .FirstOrDefaultAsync(e => e.EncounterId == encounterId && e.IsActive);

        return encounter == null ? null : MapToDto(encounter);
    }

    public async Task<List<EmrEncounterDto>> GetAllEncountersAsync(string? search = null)
    {
        var query = _context.EmrEncounters
            .AsNoTracking()
            .Where(e => e.IsActive)
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Specialization)
            .OrderByDescending(e => e.EncounterDate)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(e =>
                e.EncounterNumber.ToLower().Contains(s) ||
                e.Patient.FirstName.ToLower().Contains(s) ||
                e.Patient.LastName.ToLower().Contains(s) ||
                e.Patient.MedicalRecordNumber.ToLower().Contains(s) ||
                e.Diagnosis.ToLower().Contains(s)
            );
        }

        var list = await query.Take(100).ToListAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<EmrEncounterDto> CreateEncounterAsync(CreateEmrEncounterDto dto, long currentUserId = 0)
    {
        // 1. Authoritative Validation
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.PatientId == dto.PatientId && p.IsActive);
        if (patient == null)
            throw new KeyNotFoundException($"Patient with ID {dto.PatientId} not found.");

        var doctor = await _context.Doctors
            .Include(d => d.Employee)
            .Include(d => d.Specialization)
            .FirstOrDefaultAsync(d => d.DoctorId == dto.DoctorId && d.IsActive);
        if (doctor == null)
            throw new KeyNotFoundException($"Doctor with ID {dto.DoctorId} not found.");

        if (string.IsNullOrWhiteSpace(dto.ChiefComplaint))
            throw new ArgumentException("Chief complaint / presenting symptoms are required.");

        // 2. Format Primary Diagnosis & ICD Summary
        var primaryDiag = dto.Diagnoses.FirstOrDefault(d => d.IsPrimary) ?? dto.Diagnoses.FirstOrDefault();
        string diagnosisSummary = primaryDiag != null
            ? $"{primaryDiag.Description} ({primaryDiag.IcdCode})"
            : "Clinical Evaluation Pending";

        // 3. Serialize Clinical Payload
        var payload = new StructuredClinicalPayload
        {
            AppointmentId = dto.AppointmentId,
            HistoryOfPresentIllness = dto.HistoryOfPresentIllness,
            ExaminationFindings = dto.ExaminationFindings,
            Vitals = dto.Vitals,
            Diagnoses = dto.Diagnoses,
            Prescriptions = dto.Prescriptions,
            FreeTextNotes = dto.ClinicalNotes,
            FollowUpDays = dto.FollowUpDays,
            FollowUpInstructions = dto.FollowUpInstructions,
        };

        var notesJson = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        // 4. Create Entity
        var randomSuffix = new Random().Next(1000, 9999);
        var encounterNumber = $"EMR-{DateTime.UtcNow:yyyyMMdd}-{randomSuffix}";

        var encounter = new EmrEncounter
        {
            EncounterNumber = encounterNumber,
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            EncounterDate = DateTime.UtcNow,
            EncounterType = string.IsNullOrWhiteSpace(dto.EncounterType) ? "OPD" : dto.EncounterType,
            Symptoms = dto.ChiefComplaint,
            Diagnosis = diagnosisSummary,
            ClinicalNotes = notesJson,
            Status = dto.IsFinalized ? "Finalized" : "Draft",
            CreatedBy = currentUserId
        };

        _context.EmrEncounters.Add(encounter);

        // 5. Consequential Appointment Transition
        if (dto.IsFinalized && dto.AppointmentId.HasValue)
        {
            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.AppointmentId == dto.AppointmentId.Value && a.IsActive);
            if (appointment != null && appointment.Status != "Cancelled")
            {
                appointment.Status = "Completed";
                appointment.Remarks = $"Consultation finalized — {encounterNumber}";
                appointment.UpdatedBy = currentUserId;
            }
        }

        // 6. Record Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId > 0 ? currentUserId : null,
            ModuleName = "Clinical / EMR",
            ActionType = dto.IsFinalized ? "EMR_FINALIZED" : "EMR_DRAFT_CREATED",
            AffectedRecord = encounterNumber,
            NewValue = JsonSerializer.Serialize(new { encounter.PatientId, encounter.DoctorId, encounter.Status }),
            IpAddress = "127.0.0.1",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        encounter.Patient = patient;
        encounter.Doctor = doctor;
        return MapToDto(encounter);
    }

    public async Task<EmrEncounterDto> UpdateEncounterAsync(long encounterId, CreateEmrEncounterDto dto, long currentUserId = 0)
    {
        var encounter = await _context.EmrEncounters
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Specialization)
            .FirstOrDefaultAsync(e => e.EncounterId == encounterId && e.IsActive);

        if (encounter == null)
            throw new KeyNotFoundException($"Encounter with ID {encounterId} not found.");

        // Security / Clinical Integrity Rule: Do not overwrite finalized clinical records
        if (encounter.Status == "Finalized" || encounter.Status == "SignedOff")
        {
            throw new InvalidOperationException("Cannot modify or alter a finalized clinical record. Finalized records are sealed.");
        }

        if (string.IsNullOrWhiteSpace(dto.ChiefComplaint))
            throw new ArgumentException("Chief complaint is required.");

        var primaryDiag = dto.Diagnoses.FirstOrDefault(d => d.IsPrimary) ?? dto.Diagnoses.FirstOrDefault();
        string diagnosisSummary = primaryDiag != null
            ? $"{primaryDiag.Description} ({primaryDiag.IcdCode})"
            : "Clinical Evaluation Pending";

        var payload = new StructuredClinicalPayload
        {
            AppointmentId = dto.AppointmentId,
            HistoryOfPresentIllness = dto.HistoryOfPresentIllness,
            ExaminationFindings = dto.ExaminationFindings,
            Vitals = dto.Vitals,
            Diagnoses = dto.Diagnoses,
            Prescriptions = dto.Prescriptions,
            FreeTextNotes = dto.ClinicalNotes,
            FollowUpDays = dto.FollowUpDays,
            FollowUpInstructions = dto.FollowUpInstructions,
        };

        var notesJson = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        encounter.Symptoms = dto.ChiefComplaint;
        encounter.Diagnosis = diagnosisSummary;
        encounter.ClinicalNotes = notesJson;
        encounter.UpdatedBy = currentUserId;

        if (dto.IsFinalized)
        {
            encounter.Status = "Finalized";

            var appointmentIdToComplete = dto.AppointmentId;
            if (appointmentIdToComplete.HasValue)
            {
                var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.AppointmentId == appointmentIdToComplete.Value && a.IsActive);
                if (appointment != null && appointment.Status != "Cancelled")
                {
                    appointment.Status = "Completed";
                    appointment.Remarks = $"Consultation finalized — {encounter.EncounterNumber}";
                    appointment.UpdatedBy = currentUserId;
                }
            }
        }

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId > 0 ? currentUserId : null,
            ModuleName = "Clinical / EMR",
            ActionType = dto.IsFinalized ? "EMR_FINALIZED" : "EMR_DRAFT_UPDATED",
            AffectedRecord = encounter.EncounterNumber,
            NewValue = JsonSerializer.Serialize(new { encounter.PatientId, encounter.DoctorId, encounter.Status }),
            IpAddress = "127.0.0.1",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return MapToDto(encounter);
    }

    public async Task<EmrEncounterDto> FinalizeEncounterAsync(long encounterId, long currentUserId = 0)
    {
        var encounter = await _context.EmrEncounters
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Employee)
            .Include(e => e.Doctor)
                .ThenInclude(d => d.Specialization)
            .FirstOrDefaultAsync(e => e.EncounterId == encounterId && e.IsActive);

        if (encounter == null)
            throw new KeyNotFoundException($"Encounter with ID {encounterId} not found.");

        if (encounter.Status == "Finalized" || encounter.Status == "SignedOff")
        {
            return MapToDto(encounter);
        }

        encounter.Status = "Finalized";
        encounter.UpdatedBy = currentUserId;

        // Try extracting appointmentId from payload
        long? appointmentId = null;
        if (!string.IsNullOrWhiteSpace(encounter.ClinicalNotes))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<StructuredClinicalPayload>(encounter.ClinicalNotes, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                appointmentId = parsed?.AppointmentId;
            }
            catch { }
        }

        if (appointmentId.HasValue)
        {
            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.AppointmentId == appointmentId.Value && a.IsActive);
            if (appointment != null && appointment.Status != "Cancelled")
            {
                appointment.Status = "Completed";
                appointment.Remarks = $"Consultation finalized — {encounter.EncounterNumber}";
                appointment.UpdatedBy = currentUserId;
            }
        }

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId > 0 ? currentUserId : null,
            ModuleName = "Clinical / EMR",
            ActionType = "EMR_FINALIZED",
            AffectedRecord = encounter.EncounterNumber,
            NewValue = JsonSerializer.Serialize(new { encounter.PatientId, encounter.Status }),
            IpAddress = "127.0.0.1",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return MapToDto(encounter);
    }

    public Task<DrugInteractionCheckResponse> CheckInteractionsAsync(List<string> medications)
    {
        var alerts = _cdssEngine.CheckDrugInteractions(medications);
        var response = new DrugInteractionCheckResponse
        {
            HasInteractions = alerts.Count > 0,
            Alerts = alerts.Select(a => new InteractionAlertDto
            {
                DrugA = a.DrugA,
                DrugB = a.DrugB,
                Severity = a.Severity,
                Description = a.Description
            }).ToList()
        };

        return Task.FromResult(response);
    }

    private static EmrEncounterDto MapToDto(EmrEncounter e)
    {
        var dto = new EmrEncounterDto
        {
            EncounterId = e.EncounterId,
            EncounterNumber = e.EncounterNumber,
            PatientId = e.PatientId,
            PatientName = e.Patient != null ? $"{e.Patient.FirstName} {e.Patient.LastName}".Trim() : "Patient",
            MedicalRecordNumber = e.Patient?.MedicalRecordNumber ?? string.Empty,
            PatientAge = e.Patient?.Age,
            PatientGender = e.Patient?.Gender ?? string.Empty,
            DoctorId = e.DoctorId,
            DoctorName = e.Doctor?.Employee != null ? $"Dr. {e.Doctor.Employee.FirstName} {e.Doctor.Employee.LastName}".Trim() : "Attending Doctor",
            Specialization = e.Doctor?.Specialization?.SpecializationName ?? "General Practice",
            EncounterDate = e.EncounterDate,
            EncounterType = e.EncounterType,
            ChiefComplaint = e.Symptoms ?? string.Empty,
            Status = e.Status,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };

        if (!string.IsNullOrWhiteSpace(e.ClinicalNotes))
        {
            try
            {
                var payload = JsonSerializer.Deserialize<StructuredClinicalPayload>(e.ClinicalNotes, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (payload != null)
                {
                    dto.AppointmentId = payload.AppointmentId;
                    dto.HistoryOfPresentIllness = payload.HistoryOfPresentIllness;
                    dto.ExaminationFindings = payload.ExaminationFindings;
                    dto.Vitals = payload.Vitals;
                    dto.Diagnoses = payload.Diagnoses ?? new();
                    dto.Prescriptions = payload.Prescriptions ?? new();
                    dto.ClinicalNotes = payload.FreeTextNotes;
                    dto.FollowUpDays = payload.FollowUpDays;
                    dto.FollowUpInstructions = payload.FollowUpInstructions;
                }
            }
            catch
            {
                // Fallback for unstructured clinical notes
                dto.ClinicalNotes = e.ClinicalNotes;
                dto.Diagnoses = new List<DiagnosisItemDto>
                {
                    new() { IcdCode = "Z00.0", Description = e.Diagnosis, IsPrimary = true }
                };
            }
        }
        else if (!string.IsNullOrWhiteSpace(e.Diagnosis))
        {
            dto.Diagnoses = new List<DiagnosisItemDto>
            {
                new() { IcdCode = "Z00.0", Description = e.Diagnosis, IsPrimary = true }
            };
        }

        return dto;
    }
}
