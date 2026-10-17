using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IOrganizationService
{
    // Organization operations
    Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto dto, long currentUserId);
    Task<OrganizationDto?> GetOrganizationByIdAsync(long organizationId);
    Task<OrganizationDto?> GetOrganizationByCodeAsync(string organizationCode);
    Task<PagedResultDto<OrganizationDto>> GetOrganizationsAsync(string? search, string? status, int pageNumber, int pageSize);
    Task<OrganizationDto> UpdateOrganizationAsync(long organizationId, UpdateOrganizationDto dto, long currentUserId);
    Task<bool> DeactivateOrganizationAsync(long organizationId, long currentUserId);

    // Facility operations
    Task<FacilityDto> CreateFacilityAsync(long organizationId, CreateFacilityDto dto, long currentUserId);
    Task<FacilityDto?> GetFacilityByIdAsync(long facilityId);
    Task<IEnumerable<FacilityDto>> GetFacilitiesByOrganizationAsync(long organizationId, string? status = null);
    Task<FacilityDto> UpdateFacilityAsync(long facilityId, UpdateFacilityDto dto, long currentUserId);
    Task<bool> DeactivateFacilityAsync(long facilityId, long currentUserId);
}
