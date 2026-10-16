using Microsoft.EntityFrameworkCore;
using CuraSphere.Infrastructure.Persistence;
using CuraSphere.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CuraSphere.Application.Interfaces;
using CuraSphere.Infrastructure.Services;
using Microsoft.OpenApi;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using System;

var builder = WebApplication.CreateBuilder(args);

// Register DB Context with PostgreSQL
builder.Services.AddDbContext<CuraSphereDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("CuraSphere.Infrastructure")
    )
);

// Register Dependency Injection Services
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

// Configure JWT Authentication
var secret = builder.Configuration["JwtSettings:Secret"] ?? "CuraSphereHMS_Secure_Authentication_Secret_Key_2026_DoubleStrong!";
var key = Encoding.UTF8.GetBytes(secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "CuraSphereApi",
        ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "CuraSphereClient",
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddSignalR();

var app = builder.Build();

app.UseMiddleware<CuraSphere.Api.Middleware.RequestLoggingMiddleware>();
app.MapHealthChecks("/health");
app.MapHub<CuraSphere.Api.Hubs.HospitalHub>("/hubs/hospital");
app.MapHub<CuraSphere.Api.Hubs.NotificationHub>("/hubs/notifications");
app.MapHub<CuraSphere.Api.Hubs.TelemetryHub>("/hubs/telemetry");

// Automatically apply migrations and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<CuraSphereDbContext>();
        
        // Apply pending database migrations and ensure missing tables are created
        app.Logger.LogInformation("Applying database migrations and table creation...");
        try
        {
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "MigrateAsync warning, ensuring tables via database creator...");
        }

        try
        {
            var databaseCreator = context.Database.GetService<IRelationalDatabaseCreator>();
            if (databaseCreator != null)
            {
                await databaseCreator.CreateTablesAsync();
            }
        }
        catch
        {
            // Tables already exist or partially created
        }
        
        // Seed initial lookups and default data
        app.Logger.LogInformation("Seeding database...");
        await DbContextSeed.SeedAsync(context);
        
        app.Logger.LogInformation("Database migration and seeding completed successfully.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred while migrating or seeding the database.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
