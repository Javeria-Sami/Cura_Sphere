using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IPatientService
{
    Task<PatientDetailDto?> RegisterPatientAsync(RegisterPatientDto request, long currentUserId);
    Task<PatientDetailDto?> UpdatePatientAsync(long patientId, UpdatePatientDto request, long currentUserId);
    Task<PatientDetailDto?> GetPatientByIdAsync(long patientId);
    Task<PagedResultDto<PatientListDto>> GetPagedPatientsAsync(string search, int pageNumber, int pageSize);
    Task<DuplicateCheckResponse> CheckDuplicateAsync(DuplicateCheckRequest request);
}
