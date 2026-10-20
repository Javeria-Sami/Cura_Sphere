using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using CuraSphere.Infrastructure.Persistence;

namespace CuraSphere.Api.Health;

/// <summary>
/// Evaluates genuine PostgreSQL database connectivity for container readiness probes.
/// Resolves the gap where static health checks reported healthy status regardless of database reachability.
/// </summary>
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DatabaseHealthCheck> _logger;

    public DatabaseHealthCheck(IServiceScopeFactory scopeFactory, ILogger<DatabaseHealthCheck> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CuraSphereDbContext>();

            var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);
            if (canConnect)
            {
                return HealthCheckResult.Healthy("Database connectivity operational");
            }

            _logger.LogWarning("Database readiness check failed: CanConnectAsync returned false.");
            return HealthCheckResult.Unhealthy("Database connectivity failed: database server is unreachable or refusing connections.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Database readiness check timed out or was canceled.");
            return HealthCheckResult.Unhealthy("Database connectivity check timed out.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database readiness check encountered an unexpected error.");
            return HealthCheckResult.Unhealthy("Database connectivity check encountered an exception.", ex);
        }
    }
}
