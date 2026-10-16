using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using CuraSphere.Domain.Entities;

namespace CuraSphere.Infrastructure.Persistence.Interceptors;

public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is CuraSphereDbContext dbContext)
        {
            var auditEntries = dbContext.ChangeTracker.Entries()
                .Where(e => e.Entity is not AuditLog && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
                .ToList();

            foreach (var entry in auditEntries)
            {
                var auditLog = new AuditLog
                {
                    ModuleName = entry.Entity.GetType().Name,
                    ActionType = entry.State.ToString().ToUpperInvariant(),
                    AffectedRecord = $"{entry.Entity.GetType().Name}: {entry.Property("Id")?.CurrentValue ?? "New"}",
                    ActionTime = DateTime.UtcNow,
                    IpAddress = "127.0.0.1",
                    PreviousValue = entry.State == EntityState.Modified || entry.State == EntityState.Deleted
                        ? JsonSerializer.Serialize(entry.OriginalValues.ToObject())
                        : null,
                    NewValue = entry.State == EntityState.Added || entry.State == EntityState.Modified
                        ? JsonSerializer.Serialize(entry.CurrentValues.ToObject())
                        : null
                };

                dbContext.AuditLogs.Add(auditLog);
            }
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
