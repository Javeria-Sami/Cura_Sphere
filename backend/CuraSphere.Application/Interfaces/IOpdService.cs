using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IOpdService
{
    Task<IEnumerable<OpdTokenDto>> GetOpdQueueAsync(string? search, string? status);
    Task<OpdTokenDto> IssueTokenAsync(CreateOpdTokenDto dto);
    Task<bool> UpdateTokenStatusAsync(long id, string status);
}
