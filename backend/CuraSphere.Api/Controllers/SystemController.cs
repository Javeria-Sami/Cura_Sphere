using CuraSphere.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    private readonly IEditionService _editionService;

    public SystemController(IEditionService editionService)
    {
        _editionService = editionService;
    }

    /// <summary>
    /// Returns the authoritative software edition metadata and enabled module registry for the active deployment.
    /// </summary>
    [HttpGet("edition")]
    [AllowAnonymous]
    public IActionResult GetEditionInfo()
    {
        var info = new
        {
            CurrentEdition = _editionService.CurrentEdition.ToString(),
            EditionName = _editionService.EditionName,
            FacilityName = _editionService.FacilityName,
            EnabledModules = _editionService.GetEnabledModules(),
            DisabledModules = _editionService.GetDisabledModules()
        };

        return Ok(new
        {
            success = true,
            data = info
        });
    }
}
