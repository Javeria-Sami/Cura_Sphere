using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CuraSphere.Application.DTOs;

public class VitalSignsDto
{
    public string? BloodPressure { get; set; } // e.g. "120/80"
    public int? HeartRate { get; set; } // bpm
    public decimal? Temperature { get; set; } // Fahrenheit or Celsius
    public int? RespiratoryRate { get; set; } // breaths per minute
    public int? SpO2 { get; set; } // % Oxygen Saturation
    public decimal? WeightKg { get; set; } // kg
    public decimal? HeightCm { get; set; } // cm
    public decimal? Bmi { get; set; }
}

public class DiagnosisItemDto
{
    [Required]
    public string IcdCode { get; set; } = string.Empty; // e.g. "I10"
    [Required]
    public string Description { get; set; } = string.Empty; // e.g. "Essential (primary) hypertension"
    public bool IsPrimary { get; set; } = true;
    public string? Notes { get; set; }
}

public class PrescriptionItemDto
{
    [Required]
    public string MedicationName { get; set; } = string.Empty; // e.g. "Amlodipine"
    public string? GenericName { get; set; } // e.g. "Amlodipine Besylate"
    public string Dosage { get; set; } = "5mg"; // e.g. "5mg", "500mg"
    public string Route { get; set; } = "Oral"; // Oral, Topical, Inhalation, IV, IM, Sublingual
    public string Frequency { get; set; } = "OD"; // OD, BID, TID, QID, PRN, STAT
    public string Duration { get; set; } = "30 days"; // e.g. "5 days", "14 days", "30 days"
    public int? Quantity { get; set; } = 30;
    public string? Instructions { get; set; } // e.g. "Take once daily in the morning after meal"
}

public class CreateEmrEncounterDto
{
    [Required]
    public long PatientId { get; set; }

    [Required]
    public long DoctorId { get; set; }

    public long? AppointmentId { get; set; }

    public string EncounterType { get; set; } = "OPD"; // OPD, Follow-up, Consultation, Emergency

    [Required]
    public string ChiefComplaint { get; set; } = string.Empty;

    public string? HistoryOfPresentIllness { get; set; }

    public string? ExaminationFindings { get; set; }

    public VitalSignsDto? Vitals { get; set; }

    public List<DiagnosisItemDto> Diagnoses { get; set; } = new();

    public List<PrescriptionItemDto> Prescriptions { get; set; } = new();

    public string? ClinicalNotes { get; set; }

    public int? FollowUpDays { get; set; }

    public string? FollowUpInstructions { get; set; }

    public bool IsFinalized { get; set; } = false;
}

public class EmrEncounterDto
{
    public long EncounterId { get; set; }
    public string EncounterNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public int? PatientAge { get; set; }
    public string PatientGender { get; set; } = string.Empty;
    
    public long DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    
    public long? AppointmentId { get; set; }
    public DateTime EncounterDate { get; set; }
    public string EncounterType { get; set; } = "OPD";
    
    public string ChiefComplaint { get; set; } = string.Empty;
    public string? HistoryOfPresentIllness { get; set; }
    public string? ExaminationFindings { get; set; }
    
    public VitalSignsDto? Vitals { get; set; }
    public List<DiagnosisItemDto> Diagnoses { get; set; } = new();
    public List<PrescriptionItemDto> Prescriptions { get; set; } = new();
    
    public string? ClinicalNotes { get; set; }
    public int? FollowUpDays { get; set; }
    public string? FollowUpInstructions { get; set; }
    
    public string Status { get; set; } = "Draft"; // Draft, Finalized, SignedOff
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class DrugInteractionCheckRequest
{
    [Required]
    public List<string> Medications { get; set; } = new();
}

public class DrugInteractionCheckResponse
{
    public bool HasInteractions { get; set; }
    public List<InteractionAlertDto> Alerts { get; set; } = new();
}

public class InteractionAlertDto
{
    public string DrugA { get; set; } = string.Empty;
    public string DrugB { get; set; } = string.Empty;
    public string Severity { get; set; } = "High";
    public string Description { get; set; } = string.Empty;
}
