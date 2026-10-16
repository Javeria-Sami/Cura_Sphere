using System;

namespace CuraSphere.Domain.Entities;

public class PatientDocument : BaseEntity
{
    public long DocumentId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;

    public string DocumentCategory { get; set; } = "General"; // Diagnostic Report, Lab Result, Radiology Image, Consent Form, ID Proof, Discharge Summary
    public string Title { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string MimeType { get; set; } = "application/pdf";
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public int DocumentVersion { get; set; } = 1;
    public string? DigitalSignatureHash { get; set; }
    public string Status { get; set; } = "Active"; // Active, Archived, Superseded
}
