using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Infrastructure.Persistence;

namespace CuraSphere.Infrastructure.Services;

public class LookupService : ILookupService
{
    private readonly CuraSphereDbContext _context;

    public LookupService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<LookupDto>> GetBloodGroupsAsync()
    {
        return await _context.BloodGroups
            .Where(x => x.IsActive)
            .OrderBy(x => x.BloodGroupName)
            .Select(x => new LookupDto
            {
                Id = x.BloodGroupId,
                Name = x.BloodGroupName
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<LookupDto>> GetMaritalStatusesAsync()
    {
        return await _context.MaritalStatuses
            .Where(x => x.IsActive)
            .OrderBy(x => x.StatusName)
            .Select(x => new LookupDto
            {
                Id = x.MaritalStatusId,
                Name = x.StatusName
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<LookupDto>> GetReligionsAsync()
    {
        return await _context.Religions
            .Where(x => x.IsActive)
            .OrderBy(x => x.ReligionName)
            .Select(x => new LookupDto
            {
                Id = x.ReligionId,
                Name = x.ReligionName
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<LookupDto>> GetNationalitiesAsync()
    {
        return await _context.Nationalities
            .Where(x => x.IsActive)
            .OrderBy(x => x.CountryName)
            .Select(x => new LookupDto
            {
                Id = x.NationalityId,
                Name = x.CountryName
            })
            .ToListAsync();
    }
}
