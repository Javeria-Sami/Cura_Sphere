using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IpdController : ControllerBase
{
    private readonly IIpdService _ipdService;

    public IpdController(IIpdService ipdService)
    {
        _ipdService = ipdService;
    }

    [HttpGet("admissions")]
    public async Task<IActionResult> GetAdmissions([FromQuery] string? search, [FromQuery] string? ward)
    {
        var list = await _ipdService.GetAdmissionsAsync(search, ward);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("admit")]
    public async Task<IActionResult> AdmitPatient([FromBody] CreateIpdAdmissionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid data." });

        var created = await _ipdService.AdmitPatientAsync(dto);
        return Ok(new { success = true, data = created });
    }

    [HttpPost("discharge/{id}")]
    public async Task<IActionResult> DischargePatient(long id)
    {
        var result = await _ipdService.DischargePatientAsync(id);
        if (!result)
            return NotFound(new { success = false, message = "Admission not found." });

        return Ok(new { success = true, message = "Patient discharged successfully." });
    }
}
