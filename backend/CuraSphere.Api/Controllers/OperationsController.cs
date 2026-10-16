using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OperationsController : ControllerBase
{
    private readonly IOperationsService _operationsService;

    public OperationsController(IOperationsService operationsService)
    {
        _operationsService = operationsService;
    }

    [HttpGet("inventory/items")]
    public async Task<IActionResult> GetInventory([FromQuery] string? search, [FromQuery] string? category)
    {
        var list = await _operationsService.GetInventoryItemsAsync(search, category);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("inventory/item")]
    public async Task<IActionResult> CreateInventoryItem([FromBody] CreateInventoryItemDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid data." });

        var created = await _operationsService.CreateInventoryItemAsync(dto);
        return Ok(new { success = true, data = created });
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendance([FromQuery] string? search, [FromQuery] string? date)
    {
        var list = await _operationsService.GetAttendanceRecordsAsync(search, date);
        return Ok(new { success = true, data = list });
    }
}
