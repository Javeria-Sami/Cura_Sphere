using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IReportsService
{
    Task<DashboardReportSummaryDto> GetDashboardSummaryAsync();
    Task<IEnumerable<UserAccountManagementDto>> GetUserAccountsAsync(string? search);
    Task<IEnumerable<AuditLogEntryDto>> GetAuditLogsAsync(string? search, string? module);
}
