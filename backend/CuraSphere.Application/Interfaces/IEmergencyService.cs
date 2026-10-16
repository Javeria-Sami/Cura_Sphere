using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IEmergencyService
{
    Task<IEnumerable<EmergencyCaseDto>> GetActiveCasesAsync(string? search, string? triage);
    Task<EmergencyCaseDto> CreateCaseAsync(CreateEmergencyCaseDto dto);
    Task<bool> UpdateStatusAsync(long id, string status);
}
