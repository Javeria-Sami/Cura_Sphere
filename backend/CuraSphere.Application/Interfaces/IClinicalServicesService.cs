using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IClinicalServicesService
{
    Task<IEnumerable<PharmacyStockDto>> GetPharmacyStockAsync(string? search);
    Task<IEnumerable<SurgicalProcedureDto>> GetSurgicalScheduleAsync(string? search);
    Task<IEnumerable<IcuPatientVitalDto>> GetIcuVitalsAsync(string? search);
}
