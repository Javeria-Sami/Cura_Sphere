using System;
using System.Collections.Generic;

namespace CuraSphere.Application.DTOs;

public class DashboardReportSummaryDto
{
    public int TotalPatientsRegistered { get; set; }
    public int TodayAppointments { get; set; }
    public int ActiveOpdQueueCount { get; set; }
    public int AdmittedIpdPatients { get; set; }
    public int ActiveEmergencyCases { get; set; }
    public decimal TotalRevenueBilledToday { get; set; }
    public decimal TotalRevenueCollectedToday { get; set; }
    public decimal BedOccupancyPercentage { get; set; }
    
    public List<DepartmentRevenueDto> RevenueByDepartment { get; set; } = new();
    public List<MonthlyCensusDto> MonthlyCensusTrend { get; set; } = new();
}

public class DepartmentRevenueDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class MonthlyCensusDto
{
    public string Month { get; set; } = string.Empty;
    public int OutpatientCount { get; set; }
    public int InpatientCount { get; set; }
}

public class UserAccountManagementDto
{
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string LastLogin { get; set; } = string.Empty;
    public string AccountStatus { get; set; } = string.Empty;
}

public class AuditLogEntryDto
{
    public long AuditLogId { get; set; }
    public string Timestamp { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
}
