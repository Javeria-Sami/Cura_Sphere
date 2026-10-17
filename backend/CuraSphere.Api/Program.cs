using Microsoft.EntityFrameworkCore;
using CuraSphere.Infrastructure.Persistence;
using CuraSphere.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CuraSphere.Application.Common;
using CuraSphere.Application.Interfaces;
using CuraSphere.Infrastructure.Services;
using Microsoft.AspNetCore.HttpOverrides;
using System;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Connection Configuration & Validation
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Security Configuration Error: ConnectionStrings:DefaultConnection is required and cannot be empty.");
}

builder.Services.AddDbContext<CuraSphereDbContext>(options =>
    options.UseNpgsql(
        connectionString,
        b => b.MigrationsAssembly("CuraSphere.Infrastructure")
    )
);

// 2. Strongly-typed JWT Settings Configuration & Strict Startup Validation
var jwtSettings = new JwtSettings();
builder.Configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);
jwtSettings.Validate();

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
builder.Services.AddSingleton(jwtSettings);

// 2.5. Strongly-typed Edition Configuration & Module Service
var editionSettings = new EditionSettings();
builder.Configuration.GetSection(EditionSettings.SectionName).Bind(editionSettings);
builder.Services.Configure<EditionSettings>(builder.Configuration.GetSection(EditionSettings.SectionName));
builder.Services.AddSingleton<IEditionService, EditionService>();

// 3. Register Dependency Injection Services
builder.Services.AddScoped<IJwtProvider, JwtProvider>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILookupService, LookupService>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IOpdService, OpdService>();
builder.Services.AddScoped<IIpdService, IpdService>();
builder.Services.AddScoped<IEmergencyService, EmergencyService>();
builder.Services.AddScoped<IDiagnosticsService, DiagnosticsService>();
builder.Services.AddScoped<IFinancialService, FinancialService>();
builder.Services.AddScoped<IOperationsService, OperationsService>();
builder.Services.AddScoped<IClinicalServicesService, ClinicalServicesService>();
builder.Services.AddScoped<IReportsService, ReportsService>();
builder.Services.AddScoped<IRealTimeNotificationService, RealTimeNotificationService>();
builder.Services.AddScoped<IEmrService, EmrService>();

// 4. Configure Secure JWT Bearer Authentication
var key = Encoding.UTF8.GetBytes(jwtSettings.Secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// 5. CORS Configuration (Explicit origins, disallowing arbitrary production origins)
var allowedOriginsConfig = builder.Configuration["Cors:AllowedOrigins"];
var allowedOrigins = !string.IsNullOrWhiteSpace(allowedOriginsConfig)
    ? allowedOriginsConfig.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    : new[] { "http://localhost:3000", "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("CuraSphereCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 6. Reverse Proxy Forwarded Headers Support
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddSignalR();

var app = builder.Build();

// Forwarded headers for reverse proxies (must run early in pipeline)
app.UseForwardedHeaders();

// Request logging middleware (sanitized, never logs tokens or credentials)
app.UseMiddleware<CuraSphere.Api.Middleware.RequestLoggingMiddleware>();

// Health checks endpoint
app.MapHealthChecks("/health");

// SignalR Realtime Hubs
app.MapHub<CuraSphere.Api.Hubs.HospitalHub>("/hubs/hospital").RequireCors("CuraSphereCorsPolicy");
app.MapHub<CuraSphere.Api.Hubs.NotificationHub>("/hubs/notifications").RequireCors("CuraSphereCorsPolicy");
app.MapHub<CuraSphere.Api.Hubs.TelemetryHub>("/hubs/telemetry").RequireCors("CuraSphereCorsPolicy");

// 7. Database Initialization and Controlled Seeding
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<CuraSphereDbContext>();

    try
    {
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect)
        {
            logger.LogWarning("Unable to connect to PostgreSQL database during startup check. Connection will be retried on incoming requests.");
        }
        else
        {
            // In Development or when explicit environment flag is set, apply EF migrations
            var autoMigrate = app.Environment.IsDevelopment() ||
                string.Equals(builder.Configuration["Database:ApplyMigrationsOnStartup"], "true", StringComparison.OrdinalIgnoreCase);

            if (autoMigrate)
            {
                logger.LogInformation("Applying database migrations...");
                await context.Database.MigrateAsync();
            }

            // Seed lookup tables; only seed dev admin if running in Development
            logger.LogInformation("Seeding database lookups...");
            await DbContextSeed.SeedAsync(context, isDevelopment: app.Environment.IsDevelopment());
            logger.LogInformation("Database initialization completed successfully.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database migration or seed startup check.");
        if (!app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// 8. Environment-specific Exception Handling and Swagger Exposure
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Hide internal exception details and stack traces in production
    app.UseExceptionHandler(exceptionHandlerApp =>
    {
        exceptionHandlerApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new
            {
                type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                title = "An internal server error occurred.",
                status = 500,
                instance = context.Request.Path.Value
            });
        });
    });
    app.UseHsts();
}

app.UseHttpsRedirection();

// 9. Apply CORS Policy before Auth
app.UseCors("CuraSphereCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers().RequireCors("CuraSphereCorsPolicy");

app.Run();
