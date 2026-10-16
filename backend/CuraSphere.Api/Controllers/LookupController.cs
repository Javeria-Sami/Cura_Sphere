using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/lookups")]
[Authorize]
public class LookupController : ControllerBase
{
    private readonly ILookupService _lookupService;

    public LookupController(ILookupService lookupService)
    {
        _lookupService = lookupService;
    }

    [HttpGet("blood-groups")]
    public async Task<IActionResult> GetBloodGroups()
    {
        var result = await _lookupService.GetBloodGroupsAsync();
        return Ok(new { success = true, data = result });
    }

    [HttpGet("marital-statuses")]
    public async Task<IActionResult> GetMaritalStatuses()
    {
        var result = await _lookupService.GetMaritalStatusesAsync();
        return Ok(new { success = true, data = result });
    }

    [HttpGet("religions")]
    public async Task<IActionResult> GetReligions()
    {
        var result = await _lookupService.GetReligionsAsync();
        return Ok(new { success = true, data = result });
    }

    [HttpGet("nationalities")]
    public async Task<IActionResult> GetNationalities()
    {
        var result = await _lookupService.GetNationalitiesAsync();
        return Ok(new { success = true, data = result });
    }
}
