using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Api.Middleware;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/organizations")]
[Authorize]
public class OrganizationController : ControllerBase
{
    private readonly IOrganizationService _organizationService;

    public OrganizationController(IOrganizationService organizationService)
    {
        _organizationService = organizationService;
    }

    /// <summary>
    /// Creates a new Healthcare Organization tenant.
    /// Restricted to authorized platform and organization administrators.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateOrganizationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { success = false, message = "Invalid organization request payload.", errors = ModelState });
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var result = await _organizationService.CreateOrganizationAsync(dto, currentUserId);
            return CreatedAtAction(nameof(GetOrganizationById), new { id = result.OrganizationId }, new { success = true, data = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves a paginated list of organizations.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> GetOrganizations(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _organizationService.GetOrganizationsAsync(search, status, pageNumber, pageSize);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Retrieves details of an organization by ID.
    /// </summary>
    [HttpGet("{id:long}")]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> GetOrganizationById(long id)
    {
        var org = await _organizationService.GetOrganizationByIdAsync(id);
        if (org == null)
        {
            return NotFound(new { success = false, message = $"Organization with ID {id} was not found." });
        }
        return Ok(new { success = true, data = org });
    }

    /// <summary>
    /// Updates metadata for an organization.
    /// </summary>
    [HttpPut("{id:long}")]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> UpdateOrganization(long id, [FromBody] UpdateOrganizationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { success = false, errors = ModelState });
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var result = await _organizationService.UpdateOrganizationAsync(id, dto, currentUserId);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Deactivates an organization.
    /// </summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> DeactivateOrganization(long id)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _organizationService.DeactivateOrganizationAsync(id, currentUserId);
        if (!success)
        {
            return NotFound(new { success = false, message = $"Organization with ID {id} was not found." });
        }
        return Ok(new { success = true, message = "Organization deactivated successfully." });
    }

    #region Facility Endpoints

    /// <summary>
    /// Provisions a new branch facility under an organization.
    /// </summary>
    [HttpPost("{organizationId:long}/facilities")]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> CreateFacility(long organizationId, [FromBody] CreateFacilityDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { success = false, errors = ModelState });
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var result = await _organizationService.CreateFacilityAsync(organizationId, dto, currentUserId);
            return CreatedAtAction(nameof(GetFacilityById), new { id = result.BranchFacilityId }, new { success = true, data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Lists all facilities belonging to an organization.
    /// </summary>
    [HttpGet("{organizationId:long}/facilities")]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> GetFacilities(long organizationId, [FromQuery] string? status = null)
    {
        var facilities = await _organizationService.GetFacilitiesByOrganizationAsync(organizationId, status);
        return Ok(new { success = true, data = facilities });
    }

    /// <summary>
    /// Retrieves a single facility by ID.
    /// </summary>
    [HttpGet("/api/facilities/{id:long}")]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> GetFacilityById(long id)
    {
        var facility = await _organizationService.GetFacilityByIdAsync(id);
        if (facility == null)
        {
            return NotFound(new { success = false, message = $"Facility with ID {id} was not found." });
        }
        return Ok(new { success = true, data = facility });
    }

    /// <summary>
    /// Updates facility metadata.
    /// </summary>
    [HttpPut("/api/facilities/{id:long}")]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> UpdateFacility(long id, [FromBody] UpdateFacilityDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { success = false, errors = ModelState });
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var result = await _organizationService.UpdateFacilityAsync(id, dto, currentUserId);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Deactivates a facility.
    /// </summary>
    [HttpDelete("/api/facilities/{id:long}")]
    [Authorize(Roles = "SuperAdmin,Admin,PlatformAdmin")]
    public async Task<IActionResult> DeactivateFacility(long id)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _organizationService.DeactivateFacilityAsync(id, currentUserId);
        if (!success)
        {
            return NotFound(new { success = false, message = $"Facility with ID {id} was not found." });
        }
        return Ok(new { success = true, message = "Facility deactivated successfully." });
    }

    #endregion

    #region Helper Methods

    private long GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;
        return long.TryParse(subClaim, out var id) ? id : 1;
    }

    #endregion
}
