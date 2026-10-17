using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IEmrService
{
    Task<List<EmrEncounterDto>> GetPatientEncountersAsync(long patientId);
    Task<EmrEncounterDto?> GetEncounterByIdAsync(long encounterId);
    Task<List<EmrEncounterDto>> GetAllEncountersAsync(string? search = null);
    Task<EmrEncounterDto> CreateEncounterAsync(CreateEmrEncounterDto dto, long currentUserId = 0);
    Task<EmrEncounterDto> UpdateEncounterAsync(long encounterId, CreateEmrEncounterDto dto, long currentUserId = 0);
    Task<EmrEncounterDto> FinalizeEncounterAsync(long encounterId, long currentUserId = 0);
    Task<DrugInteractionCheckResponse> CheckInteractionsAsync(List<string> medications);
}
