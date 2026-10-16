using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IDiagnosticsService
{
    Task<IEnumerable<LabOrderDto>> GetLabOrdersAsync(string? search, string? category);
    Task<LabOrderDto> CreateLabOrderAsync(CreateLabOrderDto dto);
    Task<IEnumerable<RadiologyStudyDto>> GetRadiologyStudiesAsync(string? search, string? modality);
}
