using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CuraSphere.Infrastructure.Persistence;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Services.Integration;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentController : ControllerBase
{
    private readonly CuraSphereDbContext _context;

    public DocumentController(CuraSphereDbContext context)
    {
        _context = context;
    }

    [HttpGet("patient/{patientId:long}")]
    public async Task<IActionResult> GetPatientDocuments(long patientId)
    {
        var docs = await _context.PatientDocuments
            .Where(d => d.PatientId == patientId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
        return Ok(docs);
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadDocument([FromForm] long patientId, [FromForm] string category, [FromForm] string title, [FromForm] string uploadedBy)
    {
        var doc = new PatientDocument
        {
            PatientId = patientId,
            DocumentNumber = $"DOC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
            DocumentCategory = string.IsNullOrWhiteSpace(category) ? "General" : category,
            Title = string.IsNullOrWhiteSpace(title) ? "Uploaded Document" : title,
            FilePath = $"/uploads/patients/{patientId}/doc_{DateTime.UtcNow.Ticks}.pdf",
            FileExtension = ".pdf",
            FileSizeBytes = 1024 * 250,
            MimeType = "application/pdf",
            UploadedBy = string.IsNullOrWhiteSpace(uploadedBy) ? "System" : uploadedBy,
            UploadedAt = DateTime.UtcNow,
            DocumentVersion = 1,
            DigitalSignatureHash = Guid.NewGuid().ToString("N"),
            Status = "Active"
        };

        _context.PatientDocuments.Add(doc);
        await _context.SaveChangesAsync();

        return Ok(doc);
    }

    [HttpGet("fhir/patient/{patientId:long}")]
    public async Task<IActionResult> ExportFhirPatient(long patientId)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.PatientId == patientId);
        if (patient == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        string fhirJson = FhirConverter.ToFhirPatientJson(patient);
        return Content(fhirJson, "application/fhir+json");
    }
}
