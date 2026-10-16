using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IAppointmentService
{
    Task<IEnumerable<AppointmentListDto>> GetAppointmentsAsync(string? search, string? status);
    Task<AppointmentListDto?> GetAppointmentByIdAsync(long id);
    Task<AppointmentListDto> CreateAppointmentAsync(CreateAppointmentDto dto);
    Task<bool> UpdateStatusAsync(long id, string status);
}
