using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using CuraSphere.Api.Hubs;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OpdController : ControllerBase
{
    private readonly IOpdService _opdService;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<OpdController> _logger;

    public OpdController(
        IOpdService opdService,
        IHubContext<NotificationHub> hubContext,
        ILogger<OpdController> logger)
    {
        _opdService = opdService;
        _hubContext = hubContext;
        _logger = logger;
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

        // Best-effort SignalR dispatch: notify clients to refresh queue
        try
        {
            await _hubContext.Clients.Group("ClinicQueue").SendAsync("QueueUpdated", new
            {
                EventType = "TokenIssued",
                TokenId = created.OpdTokenId,
                Status = created.Status,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast QueueUpdated for new token {TokenId}", created.OpdTokenId);
        }

        return Ok(new { success = true, data = created });
    }

    [HttpPatch("token/{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateOpdTokenStatusDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
            return BadRequest(new { success = false, message = "Status cannot be empty." });

        var result = await _opdService.UpdateTokenStatusAsync(id, dto.Status);
        if (!result)
            return NotFound(new { success = false, message = "Token not found." });

        // Best-effort SignalR dispatch: notify clients to refresh queue
        try
        {
            await _hubContext.Clients.Group("ClinicQueue").SendAsync("QueueUpdated", new
            {
                EventType = "TokenStatusChanged",
                TokenId = id,
                Status = dto.Status,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast QueueUpdated for token {TokenId}", id);
        }

        return Ok(new { success = true, message = "Token status updated." });
    }
}
