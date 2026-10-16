using System;

namespace CuraSphere.Domain.Entities;

public class InventoryItem : BaseEntity
{
    public long ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "Consumables"; // Consumables, Equipment, PPE, Surgical
    public int QuantityOnHand { get; set; }
    public string UnitOfMeasure { get; set; } = "Pcs";
    public int ReorderThreshold { get; set; } = 50;
    public decimal UnitCost { get; set; }
    public string Status { get; set; } = "In Stock"; // In Stock, Low Stock, Critical
}

public class AttendanceRecord : BaseEntity
{
    public long AttendanceId { get; set; }
    public long EmployeeId { get; set; }
    public virtual Employee Employee { get; set; } = null!;
    
    public DateTime AttendanceDate { get; set; } = DateTime.UtcNow.Date;
    public TimeSpan? CheckInTime { get; set; }
    public TimeSpan? CheckOutTime { get; set; }
    public decimal WorkHours { get; set; }
    public decimal OvertimeHours { get; set; }
    public string Status { get; set; } = "Present"; // Present, Late, Absent, On Leave
}
