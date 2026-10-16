using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface ILookupService
{
    Task<IEnumerable<LookupDto>> GetBloodGroupsAsync();
    Task<IEnumerable<LookupDto>> GetMaritalStatusesAsync();
    Task<IEnumerable<LookupDto>> GetReligionsAsync();
    Task<IEnumerable<LookupDto>> GetNationalitiesAsync();
}
