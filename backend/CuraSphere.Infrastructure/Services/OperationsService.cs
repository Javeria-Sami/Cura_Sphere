using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Persistence;

namespace CuraSphere.Infrastructure.Services;

public class OperationsService : IOperationsService
{
    private readonly CuraSphereDbContext _context;

    public OperationsService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<InventoryItemDto>> GetInventoryItemsAsync(string? search, string? category)
    {
        var query = _context.InventoryItems.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(i => i.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(i => 
                i.ItemCode.ToLower().Contains(term) ||
                i.ItemName.ToLower().Contains(term) ||
                i.Category.ToLower().Contains(term));
        }

        var list = await query.OrderBy(i => i.ItemName).ToListAsync();
        return list.Select(MapToInventoryDto);
    }

    public async Task<InventoryItemDto> CreateInventoryItemAsync(CreateInventoryItemDto dto)
    {
        var code = $"ITM-{new Random().Next(100, 999)}";
        var status = dto.QuantityOnHand <= 0 ? "Critical" : dto.QuantityOnHand < dto.ReorderThreshold ? "Low Stock" : "In Stock";

        var item = new InventoryItem
        {
            ItemCode = code,
            ItemName = dto.ItemName,
            Category = dto.Category,
            QuantityOnHand = dto.QuantityOnHand,
            UnitOfMeasure = dto.UnitOfMeasure,
            ReorderThreshold = dto.ReorderThreshold,
            UnitCost = dto.UnitCost,
            Status = status
        };

        _context.InventoryItems.Add(item);
        await _context.SaveChangesAsync();

        return MapToInventoryDto(item);
    }

    public async Task<IEnumerable<AttendanceRecordDto>> GetAttendanceRecordsAsync(string? search, string? date)
    {
        var query = _context.AttendanceRecords
            .Include(a => a.Employee)
                .ThenInclude(e => e.Department)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(a => 
                a.Employee.FirstName.ToLower().Contains(term) ||
                a.Employee.LastName.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(a => a.AttendanceDate).ToListAsync();
        return list.Select(MapToAttendanceDto);
    }

    private static InventoryItemDto MapToInventoryDto(InventoryItem i) => new InventoryItemDto
    {
        ItemId = i.ItemId,
        ItemCode = i.ItemCode,
        ItemName = i.ItemName,
        Category = i.Category,
        QuantityOnHand = i.QuantityOnHand,
        UnitOfMeasure = i.UnitOfMeasure,
        ReorderThreshold = i.ReorderThreshold,
        UnitCost = i.UnitCost,
        Status = i.Status
    };

    private static AttendanceRecordDto MapToAttendanceDto(AttendanceRecord a) => new AttendanceRecordDto
    {
        AttendanceId = a.AttendanceId,
        EmployeeId = a.EmployeeId,
        EmployeeName = a.Employee != null ? $"{a.Employee.FirstName} {a.Employee.LastName}" : "Employee",
        DepartmentName = a.Employee?.Department?.DepartmentName ?? "Department",
        AttendanceDate = a.AttendanceDate.ToString("yyyy-MM-dd"),
        CheckInTime = a.CheckInTime.HasValue ? a.CheckInTime.Value.ToString(@"hh\:mm") : "—",
        CheckOutTime = a.CheckOutTime.HasValue ? a.CheckOutTime.Value.ToString(@"hh\:mm") : "—",
        WorkHours = a.WorkHours,
        OvertimeHours = a.OvertimeHours,
        Status = a.Status
    };
}
