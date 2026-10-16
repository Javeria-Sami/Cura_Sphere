using System;

namespace CuraSphere.Domain.Entities;

public class AuditLog
{
    public long AuditLogId { get; set; }
    public long? UserId { get; set; }
    public virtual UserAccount? UserAccount { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string AffectedRecord { get; set; } = string.Empty;
    public string? PreviousValue { get; set; } // Will be mapped to JSONB
    public string? NewValue { get; set; }      // Will be mapped to JSONB
    public DateTime ActionTime { get; set; } = DateTime.UtcNow;
    public string IpAddress { get; set; } = string.Empty;
}
