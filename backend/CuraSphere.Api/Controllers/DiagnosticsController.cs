using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DiagnosticsController : ControllerBase
{
    private readonly IDiagnosticsService _diagnosticsService;

    public DiagnosticsController(IDiagnosticsService diagnosticsService)
    {
        _diagnosticsService = diagnosticsService;
    }

    [HttpGet("lab/orders")]
    public async Task<IActionResult> GetLabOrders([FromQuery] string? search, [FromQuery] string? category)
    {
        var list = await _diagnosticsService.GetLabOrdersAsync(search, category);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("lab/order")]
    public async Task<IActionResult> CreateLabOrder([FromBody] CreateLabOrderDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid data." });

        var created = await _diagnosticsService.CreateLabOrderAsync(dto);
        return Ok(new { success = true, data = created });
    }

    [HttpGet("radiology/studies")]
    public async Task<IActionResult> GetRadiologyStudies([FromQuery] string? search, [FromQuery] string? modality)
    {
        var list = await _diagnosticsService.GetRadiologyStudiesAsync(search, modality);
        return Ok(new { success = true, data = list });
    }
}
