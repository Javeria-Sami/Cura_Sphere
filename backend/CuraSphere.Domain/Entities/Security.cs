using System;

namespace CuraSphere.Domain.Entities;

public class Role : BaseEntity
{
    public long RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class Permission
{
    public long PermissionId { get; set; }
    public string PermissionName { get; set; } = string.Empty; // Resource.Action format
    public string ModuleName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class RolePermission
{
    public long RolePermissionId { get; set; }
    public long RoleId { get; set; }
    public virtual Role Role { get; set; } = null!;
    public long PermissionId { get; set; }
    public virtual Permission Permission { get; set; } = null!;
}

public class UserAccount : BaseEntity
{
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public long? EmployeeId { get; set; }
    public virtual Employee? Employee { get; set; }
    public long RoleId { get; set; }
    public virtual Role Role { get; set; } = null!;
    public DateTime? LastLogin { get; set; }
    public string AccountStatus { get; set; } = "Active";
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? PasswordChangedAt { get; set; }
}

public class UserSession
{
    public Guid SessionId { get; set; }
    public long UserId { get; set; }
    public virtual UserAccount UserAccount { get; set; } = null!;
    public DateTime LoginTime { get; set; } = DateTime.UtcNow;
    public DateTime? LogoutTime { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string DeviceInformation { get; set; } = string.Empty;
    public string SessionStatus { get; set; } = "Active";
}
