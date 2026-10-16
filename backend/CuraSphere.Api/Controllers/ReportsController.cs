using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reportsService;

    public ReportsController(IReportsService reportsService)
    {
        _reportsService = reportsService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var data = await _reportsService.GetDashboardSummaryAsync();
        return Ok(new { success = true, data });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUserAccounts([FromQuery] string? search)
    {
        var list = await _reportsService.GetUserAccountsAsync(search);
        return Ok(new { success = true, data = list });
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] string? search, [FromQuery] string? module)
    {
        var list = await _reportsService.GetAuditLogsAsync(search, module);
        return Ok(new { success = true, data = list });
    }
}
