using System;

namespace CuraSphere.Application.DTOs;

public class InventoryItemDto
{
    public long ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public int ReorderThreshold { get; set; }
    public decimal UnitCost { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CreateInventoryItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "Consumables";
    public int QuantityOnHand { get; set; }
    public string UnitOfMeasure { get; set; } = "Pcs";
    public int ReorderThreshold { get; set; } = 50;
    public decimal UnitCost { get; set; }
}

public class AttendanceRecordDto
{
    public long AttendanceId { get; set; }
    public long EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string AttendanceDate { get; set; } = string.Empty;
    public string CheckInTime { get; set; } = string.Empty;
    public string CheckOutTime { get; set; } = string.Empty;
    public decimal WorkHours { get; set; }
    public decimal OvertimeHours { get; set; }
    public string Status { get; set; } = string.Empty;
}
