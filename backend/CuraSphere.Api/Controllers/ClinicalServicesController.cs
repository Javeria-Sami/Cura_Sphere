using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClinicalServicesController : ControllerBase
{
    private readonly IClinicalServicesService _clinicalServices;

    public ClinicalServicesController(IClinicalServicesService clinicalServices)
    {
        _clinicalServices = clinicalServices;
    }

    [HttpGet("pharmacy/stock")]
    public async Task<IActionResult> GetPharmacyStock([FromQuery] string? search)
    {
        var list = await _clinicalServices.GetPharmacyStockAsync(search);
        return Ok(new { success = true, data = list });
    }

    [HttpGet("surgery/schedules")]
    public async Task<IActionResult> GetSurgerySchedules([FromQuery] string? search)
    {
        var list = await _clinicalServices.GetSurgicalScheduleAsync(search);
        return Ok(new { success = true, data = list });
    }

    [HttpGet("icu/vitals")]
    public async Task<IActionResult> GetIcuVitals([FromQuery] string? search)
    {
        var list = await _clinicalServices.GetIcuVitalsAsync(search);
        return Ok(new { success = true, data = list });
    }
}
