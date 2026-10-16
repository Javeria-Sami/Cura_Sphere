using System;

namespace CuraSphere.Domain.Entities;

public abstract class BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public long CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
    public bool IsActive { get; set; } = true;
}
