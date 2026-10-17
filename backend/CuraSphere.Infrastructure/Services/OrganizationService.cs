using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Persistence;

namespace CuraSphere.Infrastructure.Services;

public class OrganizationService : IOrganizationService
{
    private readonly CuraSphereDbContext _context;

    public OrganizationService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto dto, long currentUserId)
    {
        // 1. Validation
        if (string.IsNullOrWhiteSpace(dto.OrganizationName))
        {
            throw new ArgumentException("Organization name cannot be empty.", nameof(dto.OrganizationName));
        }

        var normalizedCode = Organization.NormalizeCode(dto.OrganizationCode);
        if (!Organization.IsValidCodeFormat(normalizedCode))
        {
            throw new ArgumentException(
                $"Organization code '{dto.OrganizationCode}' is invalid. Code must be 3-30 uppercase alphanumeric characters or hyphens.",
                nameof(dto.OrganizationCode));
        }

        // 2. Uniqueness Check
        var codeExists = await _context.Organizations
            .AnyAsync(o => o.OrganizationCode == normalizedCode);
        if (codeExists)
        {
            throw new InvalidOperationException($"An organization with code '{normalizedCode}' already exists.");
        }

        // 3. Entity Instantiation
        var organization = new Organization
        {
            OrganizationCode = normalizedCode,
            OrganizationName = dto.OrganizationName.Trim(),
            LegalRegistrationNumber = dto.LegalRegistrationNumber?.Trim(),
            TaxId = dto.TaxId?.Trim(),
            PrimaryEmail = dto.PrimaryEmail?.Trim(),
            PrimaryPhone = dto.PrimaryPhone?.Trim(),
            Timezone = string.IsNullOrWhiteSpace(dto.Timezone) ? "UTC" : dto.Timezone.Trim(),
            CurrencyCode = string.IsNullOrWhiteSpace(dto.CurrencyCode) ? "PKR" : dto.CurrencyCode.Trim().ToUpperInvariant(),
            Status = "Active",
            SettingsJson = "{}",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Organizations.Add(organization);

        // 4. Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId,
            ModuleName = "Enterprise",
            ActionType = "CREATE_ORGANIZATION",
            AffectedRecord = $"Organization Code: {normalizedCode}",
            NewValue = $"{{\"Name\": \"{organization.OrganizationName}\", \"Code\": \"{normalizedCode}\"}}",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToDto(organization);
    }

    public async Task<OrganizationDto?> GetOrganizationByIdAsync(long organizationId)
    {
        var org = await _context.Organizations
            .AsNoTracking()
            .Include(o => o.Facilities)
            .FirstOrDefaultAsync(o => o.OrganizationId == organizationId);

        return org != null ? MapToDto(org) : null;
    }

    public async Task<OrganizationDto?> GetOrganizationByCodeAsync(string organizationCode)
    {
        var normalizedCode = Organization.NormalizeCode(organizationCode);
        var org = await _context.Organizations
            .AsNoTracking()
            .Include(o => o.Facilities)
            .FirstOrDefaultAsync(o => o.OrganizationCode == normalizedCode);

        return org != null ? MapToDto(org) : null;
    }

    public async Task<PagedResultDto<OrganizationDto>> GetOrganizationsAsync(string? search, string? status, int pageNumber, int pageSize)
    {
        var query = _context.Organizations
            .AsNoTracking()
            .Include(o => o.Facilities)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status.ToLowerInvariant() != "all")
        {
            query = query.Where(o => o.Status.ToLower() == status.ToLower().Trim());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(o =>
                o.OrganizationCode.ToLower().Contains(term) ||
                o.OrganizationName.ToLower().Contains(term) ||
                (o.PrimaryEmail != null && o.PrimaryEmail.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();

        var safePage = pageNumber > 0 ? pageNumber : 1;
        var safeSize = pageSize > 0 && pageSize <= 100 ? pageSize : 20;

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .ToListAsync();

        var totalPages = (int)Math.Ceiling((double)totalCount / safeSize);

        return new PagedResultDto<OrganizationDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = safePage,
            PageSize = safeSize,
            TotalPages = totalPages == 0 ? 1 : totalPages
        };
    }

    public async Task<OrganizationDto> UpdateOrganizationAsync(long organizationId, UpdateOrganizationDto dto, long currentUserId)
    {
        var org = await _context.Organizations
            .Include(o => o.Facilities)
            .FirstOrDefaultAsync(o => o.OrganizationId == organizationId);

        if (org == null)
        {
            throw new KeyNotFoundException($"Organization with ID {organizationId} was not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.OrganizationName))
        {
            throw new ArgumentException("Organization name cannot be empty.", nameof(dto.OrganizationName));
        }

        if (!string.IsNullOrWhiteSpace(dto.Status) && !Organization.ValidStatuses.Contains(dto.Status))
        {
            throw new ArgumentException($"Invalid organization status '{dto.Status}'. Valid statuses are: Active, Suspended, Inactive.", nameof(dto.Status));
        }

        org.OrganizationName = dto.OrganizationName.Trim();
        org.LegalRegistrationNumber = dto.LegalRegistrationNumber?.Trim();
        org.TaxId = dto.TaxId?.Trim();
        org.PrimaryEmail = dto.PrimaryEmail?.Trim();
        org.PrimaryPhone = dto.PrimaryPhone?.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Timezone)) org.Timezone = dto.Timezone.Trim();
        if (!string.IsNullOrWhiteSpace(dto.CurrencyCode)) org.CurrencyCode = dto.CurrencyCode.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(dto.Status)) org.Status = dto.Status.Trim();
        if (!string.IsNullOrWhiteSpace(dto.SettingsJson)) org.SettingsJson = dto.SettingsJson.Trim();

        org.UpdatedAt = DateTime.UtcNow;
        org.UpdatedBy = currentUserId;

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId,
            ModuleName = "Enterprise",
            ActionType = "UPDATE_ORGANIZATION",
            AffectedRecord = $"Organization Code: {org.OrganizationCode}",
            NewValue = $"{{\"Name\": \"{org.OrganizationName}\", \"Status\": \"{org.Status}\"}}",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToDto(org);
    }

    public async Task<bool> DeactivateOrganizationAsync(long organizationId, long currentUserId)
    {
        var org = await _context.Organizations.FindAsync(organizationId);
        if (org == null) return false;

        org.Status = "Inactive";
        org.IsActive = false;
        org.DeletedAt = DateTime.UtcNow;
        org.DeletedBy = currentUserId;
        org.UpdatedAt = DateTime.UtcNow;
        org.UpdatedBy = currentUserId;

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId,
            ModuleName = "Enterprise",
            ActionType = "DEACTIVATE_ORGANIZATION",
            AffectedRecord = $"Organization Code: {org.OrganizationCode}",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FacilityDto> CreateFacilityAsync(long organizationId, CreateFacilityDto dto, long currentUserId)
    {
        // 1. Verify Organization Exists and is Active
        var org = await _context.Organizations.FindAsync(organizationId);
        if (org == null)
        {
            throw new KeyNotFoundException($"Parent organization with ID {organizationId} was not found.");
        }
        if (org.Status != "Active" || !org.IsActive)
        {
            throw new InvalidOperationException($"Cannot create a facility under inactive or suspended organization '{org.OrganizationCode}'.");
        }

        // 2. Validate Code & Names
        if (string.IsNullOrWhiteSpace(dto.BranchName))
        {
            throw new ArgumentException("Facility branch name cannot be empty.", nameof(dto.BranchName));
        }

        var normalizedCode = BranchFacility.NormalizeCode(dto.BranchCode);
        if (string.IsNullOrWhiteSpace(normalizedCode) || normalizedCode.Length < 2)
        {
            throw new ArgumentException("Facility code is required (min 2 characters).", nameof(dto.BranchCode));
        }

        // 3. Compound Uniqueness Check within this Organization
        var codeExists = await _context.BranchFacilities
            .AnyAsync(f => f.OrganizationId == organizationId && f.BranchCode == normalizedCode);
        if (codeExists)
        {
            throw new InvalidOperationException($"A facility with code '{normalizedCode}' already exists in organization '{org.OrganizationCode}'.");
        }

        var facilityType = BranchFacility.ValidFacilityTypes.Contains(dto.FacilityType) ? dto.FacilityType.Trim() : "Clinic";
        var editionProfile = string.Equals(dto.EditionProfile, "Hospital", StringComparison.OrdinalIgnoreCase) ? "Hospital" : "Clinic";

        var facility = new BranchFacility
        {
            OrganizationId = organizationId,
            BranchCode = normalizedCode,
            BranchName = dto.BranchName.Trim(),
            FacilityType = facilityType,
            EditionProfile = editionProfile,
            Address = dto.Address.Trim(),
            City = dto.City.Trim(),
            Province = dto.Province.Trim(),
            ContactPhone = dto.ContactPhone.Trim(),
            ContactEmail = dto.ContactEmail?.Trim(),
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.BranchFacilities.Add(facility);

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId,
            ModuleName = "Enterprise",
            ActionType = "CREATE_FACILITY",
            AffectedRecord = $"Org: {org.OrganizationCode}, Facility: {normalizedCode}",
            NewValue = $"{{\"BranchName\": \"{facility.BranchName}\", \"Type\": \"{facilityType}\"}}",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToFacilityDto(facility, org.OrganizationName);
    }

    public async Task<FacilityDto?> GetFacilityByIdAsync(long facilityId)
    {
        var facility = await _context.BranchFacilities
            .AsNoTracking()
            .Include(f => f.Organization)
            .Include(f => f.Departments)
            .FirstOrDefaultAsync(f => f.BranchFacilityId == facilityId);

        return facility != null ? MapToFacilityDto(facility, facility.Organization?.OrganizationName ?? "Organization") : null;
    }

    public async Task<IEnumerable<FacilityDto>> GetFacilitiesByOrganizationAsync(long organizationId, string? status = null)
    {
        var query = _context.BranchFacilities
            .AsNoTracking()
            .Include(f => f.Organization)
            .Include(f => f.Departments)
            .Where(f => f.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(status) && status.ToLowerInvariant() != "all")
        {
            query = query.Where(f => f.Status.ToLower() == status.ToLower().Trim());
        }

        var list = await query
            .OrderBy(f => f.BranchCode)
            .ToListAsync();

        return list.Select(f => MapToFacilityDto(f, f.Organization?.OrganizationName ?? "Organization"));
    }

    public async Task<FacilityDto> UpdateFacilityAsync(long facilityId, UpdateFacilityDto dto, long currentUserId)
    {
        var facility = await _context.BranchFacilities
            .Include(f => f.Organization)
            .Include(f => f.Departments)
            .FirstOrDefaultAsync(f => f.BranchFacilityId == facilityId);

        if (facility == null)
        {
            throw new KeyNotFoundException($"Facility with ID {facilityId} was not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.BranchName))
        {
            throw new ArgumentException("Facility branch name cannot be empty.", nameof(dto.BranchName));
        }

        if (!string.IsNullOrWhiteSpace(dto.Status) && !BranchFacility.ValidStatuses.Contains(dto.Status))
        {
            throw new ArgumentException($"Invalid facility status '{dto.Status}'.", nameof(dto.Status));
        }

        facility.BranchName = dto.BranchName.Trim();
        if (BranchFacility.ValidFacilityTypes.Contains(dto.FacilityType)) facility.FacilityType = dto.FacilityType.Trim();
        if (!string.IsNullOrWhiteSpace(dto.EditionProfile)) facility.EditionProfile = dto.EditionProfile.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Address)) facility.Address = dto.Address.Trim();
        if (!string.IsNullOrWhiteSpace(dto.City)) facility.City = dto.City.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Province)) facility.Province = dto.Province.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ContactPhone)) facility.ContactPhone = dto.ContactPhone.Trim();
        facility.ContactEmail = dto.ContactEmail?.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Status)) facility.Status = dto.Status.Trim();

        facility.UpdatedAt = DateTime.UtcNow;
        facility.UpdatedBy = currentUserId;

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId,
            ModuleName = "Enterprise",
            ActionType = "UPDATE_FACILITY",
            AffectedRecord = $"Facility ID: {facilityId}, Code: {facility.BranchCode}",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToFacilityDto(facility, facility.Organization?.OrganizationName ?? "Organization");
    }

    public async Task<bool> DeactivateFacilityAsync(long facilityId, long currentUserId)
    {
        var facility = await _context.BranchFacilities.FindAsync(facilityId);
        if (facility == null) return false;

        facility.Status = "Inactive";
        facility.IsActive = false;
        facility.DeletedAt = DateTime.UtcNow;
        facility.DeletedBy = currentUserId;
        facility.UpdatedAt = DateTime.UtcNow;
        facility.UpdatedBy = currentUserId;

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId,
            ModuleName = "Enterprise",
            ActionType = "DEACTIVATE_FACILITY",
            AffectedRecord = $"Facility ID: {facilityId}, Code: {facility.BranchCode}",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    private static OrganizationDto MapToDto(Organization o)
    {
        return new OrganizationDto
        {
            OrganizationId = o.OrganizationId,
            OrganizationCode = o.OrganizationCode,
            OrganizationName = o.OrganizationName,
            LegalRegistrationNumber = o.LegalRegistrationNumber,
            TaxId = o.TaxId,
            PrimaryEmail = o.PrimaryEmail,
            PrimaryPhone = o.PrimaryPhone,
            Timezone = o.Timezone,
            CurrencyCode = o.CurrencyCode,
            Status = o.Status,
            SettingsJson = o.SettingsJson,
            CreatedAt = o.CreatedAt,
            FacilityCount = o.Facilities?.Count ?? 0
        };
    }

    private static FacilityDto MapToFacilityDto(BranchFacility f, string orgName)
    {
        return new FacilityDto
        {
            BranchFacilityId = f.BranchFacilityId,
            OrganizationId = f.OrganizationId,
            OrganizationName = orgName,
            BranchCode = f.BranchCode,
            BranchName = f.BranchName,
            FacilityType = f.FacilityType,
            EditionProfile = f.EditionProfile,
            Address = f.Address,
            City = f.City,
            Province = f.Province,
            ContactPhone = f.ContactPhone,
            ContactEmail = f.ContactEmail,
            Status = f.Status,
            CreatedAt = f.CreatedAt,
            DepartmentCount = f.Departments?.Count ?? 0
        };
    }
}
