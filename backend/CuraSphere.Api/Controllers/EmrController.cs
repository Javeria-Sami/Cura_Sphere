using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Api.Middleware;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmrController : ControllerBase
{
    private readonly IEmrService _emrService;

    public EmrController(IEmrService emrService)
    {
        _emrService = emrService;
    }

    [HttpGet("encounters")]
    [HasPermission("emr.read")]
    public async Task<IActionResult> GetEncounters([FromQuery] string? search)
    {
        var list = await _emrService.GetAllEncountersAsync(search);
        return Ok(new { success = true, data = list });
    }

    [HttpGet("encounters/{id:long}")]
    [HasPermission("emr.read")]
    public async Task<IActionResult> GetEncounterById(long id)
    {
        var encounter = await _emrService.GetEncounterByIdAsync(id);
        if (encounter == null)
        {
            return NotFound(new { success = false, message = "Clinical encounter not found." });
        }
        return Ok(new { success = true, data = encounter });
    }

    [HttpGet("encounters/patient/{patientId:long}")]
    [HasPermission("emr.read")]
    public async Task<IActionResult> GetPatientEncounters(long patientId)
    {
        var list = await _emrService.GetPatientEncountersAsync(patientId);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("encounters")]
    [HasPermission("emr.create")]
    public async Task<IActionResult> CreateEncounter([FromBody] CreateEmrEncounterDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { success = false, message = "Invalid clinical encounter data." });
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var created = await _emrService.CreateEncounterAsync(dto, currentUserId);
            return CreatedAtAction(nameof(GetEncounterById), new { id = created.EncounterId }, new { success = true, data = created });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("encounters/{id:long}")]
    [HasPermission("emr.create")]
    public async Task<IActionResult> UpdateEncounter(long id, [FromBody] CreateEmrEncounterDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { success = false, message = "Invalid clinical encounter data." });
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var updated = await _emrService.UpdateEncounterAsync(id, dto, currentUserId);
            return Ok(new { success = true, data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("encounters/{id:long}/finalize")]
    [HasPermission("emr.diagnose")]
    public async Task<IActionResult> FinalizeEncounter(long id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var finalized = await _emrService.FinalizeEncounterAsync(id, currentUserId);
            return Ok(new { success = true, data = finalized, message = "Clinical encounter signed and finalized." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("check-interactions")]
    [HasPermission("emr.read")]
    public async Task<IActionResult> CheckInteractions([FromBody] DrugInteractionCheckRequest request)
    {
        if (!ModelState.IsValid || request.Medications == null)
        {
            return BadRequest(new { success = false, message = "Medication list is required." });
        }

        var result = await _emrService.CheckInteractionsAsync(request.Medications);
        return Ok(new { success = true, data = result });
    }

    private long GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;
        return long.TryParse(subClaim, out var id) ? id : 0;
    }
}
