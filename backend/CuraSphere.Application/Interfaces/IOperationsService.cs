using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IOperationsService
{
    Task<IEnumerable<InventoryItemDto>> GetInventoryItemsAsync(string? search, string? category);
    Task<InventoryItemDto> CreateInventoryItemAsync(CreateInventoryItemDto dto);
    Task<IEnumerable<AttendanceRecordDto>> GetAttendanceRecordsAsync(string? search, string? date);
}
