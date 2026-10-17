using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace CuraSphere.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    private const string CorrelationIdHeader = "X-Correlation-ID";

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Trace Correlation ID: propagate or generate
        if (!context.Request.Headers.TryGetValue(CorrelationIdHeader, out var correlationId) ||
            string.IsNullOrWhiteSpace(correlationId))
        {
            correlationId = Guid.NewGuid().ToString("N");
        }

        // Return correlation ID in response header so clients can trace requests
        context.Response.Headers[CorrelationIdHeader] = correlationId.ToString();

        var stopwatch = Stopwatch.StartNew();
        var request = context.Request;
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        using (_logger.BeginScope(new System.Collections.Generic.Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId.ToString(),
            ["ClientIP"] = ip
        }))
        {
            try
            {
                await _next(context);
                stopwatch.Stop();

                var statusCode = context.Response.StatusCode;
                var elapsedMs = stopwatch.ElapsedMilliseconds;

                if (statusCode >= 500)
                {
                    _logger.LogError(
                        "HTTP {Method} {Path} failed with server error {StatusCode} in {ElapsedMs}ms [CorrelationId: {CorrelationId}]",
                        request.Method, request.Path, statusCode, elapsedMs, correlationId);
                }
                else if (statusCode == 401 || statusCode == 403)
                {
                    _logger.LogWarning(
                        "HTTP {Method} {Path} rejected with auth failure {StatusCode} in {ElapsedMs}ms [CorrelationId: {CorrelationId}]",
                        request.Method, request.Path, statusCode, elapsedMs, correlationId);
                }
                else if (statusCode >= 400)
                {
                    _logger.LogInformation(
                        "HTTP {Method} {Path} returned client validation/not-found {StatusCode} in {ElapsedMs}ms [CorrelationId: {CorrelationId}]",
                        request.Method, request.Path, statusCode, elapsedMs, correlationId);
                }
                else
                {
                    _logger.LogInformation(
                        "HTTP {Method} {Path} completed {StatusCode} in {ElapsedMs}ms [CorrelationId: {CorrelationId}]",
                        request.Method, request.Path, statusCode, elapsedMs, correlationId);
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(
                    ex,
                    "HTTP {Method} {Path} unhandled exception after {ElapsedMs}ms [CorrelationId: {CorrelationId}]",
                    request.Method, request.Path, stopwatch.ElapsedMilliseconds, correlationId);
                throw;
            }
        }
    }
}
