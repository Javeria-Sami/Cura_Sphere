using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Api.Middleware;
using System.Security.Claims;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet]
    [HasPermission("patients.read")]
    public async Task<IActionResult> GetPagedPatients(
        [FromQuery] string? search = "",
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _patientService.GetPagedPatientsAsync(search ?? "", pageNumber, pageSize);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id:long}")]
    [HasPermission("patients.read")]
    public async Task<IActionResult> GetPatientById(long id)
    {
        var patient = await _patientService.GetPatientByIdAsync(id);
        if (patient == null)
        {
            return NotFound(new { success = false, message = "Patient not found." });
        }
        return Ok(new { success = true, data = patient });
    }

    [HttpPost]
    [HasPermission("patients.create")]
    public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientDto request)
    {
        var currentUserId = GetCurrentUserId();
        var patient = await _patientService.RegisterPatientAsync(request, currentUserId);
        if (patient == null)
        {
            return BadRequest(new { success = false, message = "Failed to register patient." });
        }
        return CreatedAtAction(nameof(GetPatientById), new { id = patient.PatientId }, new { success = true, data = patient });
    }

    [HttpPost("check-duplicates")]
    [HasPermission("patients.create")]
    public async Task<IActionResult> CheckDuplicate([FromBody] DuplicateCheckRequest request)
    {
        var result = await _patientService.CheckDuplicateAsync(request);
        return Ok(new { success = true, data = result });
    }

    [HttpPut("{id:long}")]
    [HasPermission("patients.update")]
    public async Task<IActionResult> UpdatePatient(long id, [FromBody] UpdatePatientDto request)
    {
        var currentUserId = GetCurrentUserId();
        var patient = await _patientService.UpdatePatientAsync(id, request, currentUserId);
        if (patient == null)
        {
            return NotFound(new { success = false, message = "Patient not found or update failed." });
        }
        return Ok(new { success = true, data = patient });
    }

    #region Helper Methods

    private long GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;
        return long.TryParse(subClaim, out var id) ? id : 0;
    }

    #endregion
}
