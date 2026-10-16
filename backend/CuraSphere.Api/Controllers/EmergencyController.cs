using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmergencyController : ControllerBase
{
    private readonly IEmergencyService _emergencyService;

    public EmergencyController(IEmergencyService emergencyService)
    {
        _emergencyService = emergencyService;
    }

    [HttpGet("cases")]
    public async Task<IActionResult> GetCases([FromQuery] string? search, [FromQuery] string? triage)
    {
        var list = await _emergencyService.GetActiveCasesAsync(search, triage);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("case")]
    public async Task<IActionResult> CreateCase([FromBody] CreateEmergencyCaseDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid data." });

        var created = await _emergencyService.CreateCaseAsync(dto);
        return Ok(new { success = true, data = created });
    }

    [HttpPatch("case/{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] string status)
    {
        var result = await _emergencyService.UpdateStatusAsync(id, status);
        if (!result)
            return NotFound(new { success = false, message = "Case not found." });

        return Ok(new { success = true, message = "Emergency case status updated." });
    }
}
