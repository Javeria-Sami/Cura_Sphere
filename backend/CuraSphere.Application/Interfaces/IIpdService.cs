using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IIpdService
{
    Task<IEnumerable<IpdAdmissionDto>> GetAdmissionsAsync(string? search, string? ward);
    Task<IpdAdmissionDto> AdmitPatientAsync(CreateIpdAdmissionDto dto);
    Task<bool> DischargePatientAsync(long admissionId);
}
