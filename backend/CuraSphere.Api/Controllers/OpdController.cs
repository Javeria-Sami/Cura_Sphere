using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OpdController : ControllerBase
{
    private readonly IOpdService _opdService;

    public OpdController(IOpdService opdService)
    {
        _opdService = opdService;
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue([FromQuery] string? search, [FromQuery] string? status)
    {
        var list = await _opdService.GetOpdQueueAsync(search, status);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("token")]
    public async Task<IActionResult> IssueToken([FromBody] CreateOpdTokenDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid data." });

        var created = await _opdService.IssueTokenAsync(dto);
        return Ok(new { success = true, data = created });
    }

    [HttpPatch("token/{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] string status)
    {
        var result = await _opdService.UpdateTokenStatusAsync(id, status);
        if (!result)
            return NotFound(new { success = false, message = "Token not found." });

        return Ok(new { success = true, message = "Token status updated." });
    }
}
