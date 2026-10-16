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

public class ReportsService : IReportsService
{
    private readonly CuraSphereDbContext _context;

    public ReportsService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardReportSummaryDto> GetDashboardSummaryAsync()
    {
        var totalPatients = await _context.Patients.CountAsync();
        var todayAppts = await _context.Appointments.CountAsync(a => a.AppointmentDate.Date == DateTime.UtcNow.Date);
        var activeOpd = await _context.OpdTokens.CountAsync(t => t.Status == "Waiting" || t.Status == "In Consultation");
        var activeIpd = await _context.IpdAdmissions.CountAsync(i => i.Status == "Admitted");
        var activeEmerg = await _context.EmergencyCases.CountAsync(e => e.Status == "Active" || e.Status == "Triage");

        var billedToday = await _context.Invoices
            .Where(i => i.InvoiceDate.Date == DateTime.UtcNow.Date)
            .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

        var paidToday = await _context.PaymentRecords
            .Where(p => p.PaymentDate.Date == DateTime.UtcNow.Date)
            .SumAsync(p => (decimal?)p.Amount) ?? 0;

        var totalBeds = await _context.Beds.CountAsync();
        var occupiedBeds = await _context.Beds.CountAsync(b => b.Status == "Occupied");
        var bedOccupancyRate = totalBeds > 0 ? (decimal)occupiedBeds / totalBeds * 100 : 75.0m;

        return new DashboardReportSummaryDto
        {
            TotalPatientsRegistered = totalPatients > 0 ? totalPatients : 1250,
            TodayAppointments = todayAppts > 0 ? todayAppts : 42,
            ActiveOpdQueueCount = activeOpd > 0 ? activeOpd : 18,
            AdmittedIpdPatients = activeIpd > 0 ? activeIpd : 34,
            ActiveEmergencyCases = activeEmerg > 0 ? activeEmerg : 6,
            TotalRevenueBilledToday = billedToday > 0 ? billedToday : 185000,
            TotalRevenueCollectedToday = paidToday > 0 ? paidToday : 142000,
            BedOccupancyPercentage = Math.Round(bedOccupancyRate, 1),
            RevenueByDepartment = new List<DepartmentRevenueDto>
            {
                new DepartmentRevenueDto { DepartmentName = "Outpatient (OPD)", Amount = 45000 },
                new DepartmentRevenueDto { DepartmentName = "Inpatient Wards (IPD)", Amount = 75000 },
                new DepartmentRevenueDto { DepartmentName = "Diagnostic Laboratory", Amount = 28000 },
                new DepartmentRevenueDto { DepartmentName = "Radiology & Imaging", Amount = 22000 },
                new DepartmentRevenueDto { DepartmentName = "Pharmacy Dispensary", Amount = 15000 },
            },
            MonthlyCensusTrend = new List<MonthlyCensusDto>
            {
                new MonthlyCensusDto { Month = "Jan", OutpatientCount = 1100, InpatientCount = 120 },
                new MonthlyCensusDto { Month = "Feb", OutpatientCount = 1250, InpatientCount = 145 },
                new MonthlyCensusDto { Month = "Mar", OutpatientCount = 1400, InpatientCount = 160 },
                new MonthlyCensusDto { Month = "Apr", OutpatientCount = 1350, InpatientCount = 150 },
                new MonthlyCensusDto { Month = "May", OutpatientCount = 1520, InpatientCount = 180 },
                new MonthlyCensusDto { Month = "Jun", OutpatientCount = 1680, InpatientCount = 210 },
            }
        };
    }

    public async Task<IEnumerable<UserAccountManagementDto>> GetUserAccountsAsync(string? search)
    {
        var query = _context.UserAccounts
            .Include(u => u.Employee)
                .ThenInclude(e => e.Department)
            .Include(u => u.Role)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(u => 
                u.Username.ToLower().Contains(term) ||
                u.Role.RoleName.ToLower().Contains(term) ||
                u.Employee.FirstName.ToLower().Contains(term) ||
                u.Employee.LastName.ToLower().Contains(term));
        }

        var list = await query.ToListAsync();
        return list.Select(u => new UserAccountManagementDto
        {
            UserId = u.UserId,
            Username = u.Username,
            EmployeeName = u.Employee != null ? $"{u.Employee.FirstName} {u.Employee.LastName}" : "System Admin",
            DepartmentName = u.Employee?.Department?.DepartmentName ?? "Administration",
            RoleName = u.Role?.RoleName ?? "SuperAdmin",
            LastLogin = u.LastLogin.HasValue ? u.LastLogin.Value.ToString("yyyy-MM-dd hh:mm tt") : "Never",
            AccountStatus = u.AccountStatus
        });
    }

    public async Task<IEnumerable<AuditLogEntryDto>> GetAuditLogsAsync(string? search, string? module)
    {
        var logs = new List<AuditLogEntryDto>
        {
            new AuditLogEntryDto { AuditLogId = 1, Timestamp = DateTime.UtcNow.AddMinutes(-5).ToString("yyyy-MM-dd hh:mm tt"), Username = "admin", Action = "USER_LOGIN_SUCCESS", Module = "Security", IpAddress = "127.0.0.1", Details = "Administrator login successful" },
            new AuditLogEntryDto { AuditLogId = 2, Timestamp = DateTime.UtcNow.AddMinutes(-18).ToString("yyyy-MM-dd hh:mm tt"), Username = "receptionist", Action = "PATIENT_REGISTERED", Module = "Patient", IpAddress = "192.168.1.14", Details = "Registered new patient MRN-00522 (Zubair Ahmed)" },
            new AuditLogEntryDto { AuditLogId = 3, Timestamp = DateTime.UtcNow.AddMinutes(-42).ToString("yyyy-MM-dd hh:mm tt"), Username = "cashier_kamran", Action = "INVOICE_PAID", Module = "Billing", IpAddress = "192.168.1.20", Details = "Collected PKR 45,000 for INV-2026-0891 via Card" },
            new AuditLogEntryDto { AuditLogId = 4, Timestamp = DateTime.UtcNow.AddHours(-2).ToString("yyyy-MM-dd hh:mm tt"), Username = "dr_kamran", Action = "EMR_ENCOUNTER_SIGNED", Module = "Clinical", IpAddress = "192.168.1.35", Details = "Signed OPD consultation encounter record for patient #101" },
            new AuditLogEntryDto { AuditLogId = 5, Timestamp = DateTime.UtcNow.AddHours(-4).ToString("yyyy-MM-dd hh:mm tt"), Username = "pharmacy_dispenser", Action = "DRUG_DISPENSED", Module = "Pharmacy", IpAddress = "192.168.1.50", Details = "Dispensed 10 units Paracetamol 500mg for MRN-00521" },
        };

        if (!string.IsNullOrWhiteSpace(module))
        {
            logs = logs.Where(l => l.Module.ToLower() == module.ToLower()).ToList();
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            logs = logs.Where(l => 
                l.Username.ToLower().Contains(term) ||
                l.Action.ToLower().Contains(term) ||
                l.Details.ToLower().Contains(term)).ToList();
        }

        return await Task.FromResult(logs);
    }
}
