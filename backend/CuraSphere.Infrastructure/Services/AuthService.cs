using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CuraSphere.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly CuraSphereDbContext _context;
    private readonly IJwtProvider _jwtProvider;

    public AuthService(CuraSphereDbContext context, IJwtProvider jwtProvider)
    {
        _context = context;
        _jwtProvider = jwtProvider;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, string ipAddress, string deviceInformation)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var targetUsername = request.Username.Trim().ToLowerInvariant();
        UserAccount? user = null;

        try
        {
            user = await _context.UserAccounts
                .Include(u => u.Role)
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == targetUsername);
        }
        catch (Exception)
        {
            // Do not bypass security if the database is unreachable
            return null;
        }

        if (user == null)
        {
            return null;
        }

        // Check if account is locked
        if (string.Equals(user.AccountStatus, "Locked", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var passwordHasher = new PasswordHasher<UserAccount>();
        var verificationResult = !string.IsNullOrEmpty(user.PasswordHash)
            ? passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password)
            : PasswordVerificationResult.Failed;

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.AccountStatus = "Locked";
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch
            {
                // Suppress save error during failed attempt
            }

            return null;
        }

        // Login success: reset failed attempts and record login
        user.FailedLoginAttempts = 0;
        user.AccountStatus = "Active";
        user.LastLogin = DateTime.UtcNow;

        List<string> permissions = new List<string>();
        try
        {
            permissions = await _context.RolePermissions
                .Where(rp => rp.RoleId == user.RoleId)
                .Select(rp => rp.Permission.PermissionName)
                .ToListAsync();
        }
        catch
        {
            permissions = new List<string>();
        }

        var sessionId = Guid.NewGuid();
        var token = _jwtProvider.GenerateToken(user, permissions, sessionId);

        try
        {
            var session = new UserSession
            {
                SessionId = sessionId,
                UserId = user.UserId,
                LoginTime = DateTime.UtcNow,
                IpAddress = ipAddress,
                DeviceInformation = deviceInformation,
                SessionStatus = "Active"
            };
            _context.UserSessions.Add(session);

            var auditLog = new AuditLog
            {
                UserId = user.UserId,
                ModuleName = "Authentication",
                ActionType = "Login",
                AffectedRecord = $"User: {user.UserId}",
                PreviousValue = null,
                NewValue = $"{{\"Username\": \"{user.Username}\", \"Status\": \"LoginSuccess\"}}",
                ActionTime = DateTime.UtcNow,
                IpAddress = ipAddress
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();
        }
        catch
        {
            // Session and audit record creation failure should not break valid token return
        }

        return new LoginResponseDto
        {
            Token = token,
            UserId = user.UserId,
            Username = user.Username,
            RoleName = user.Role?.RoleName ?? "Staff",
            EmployeeName = user.Employee != null ? $"{user.Employee.FirstName} {user.Employee.LastName}" : user.Username,
            Permissions = permissions
        };
    }

    public async Task LogoutAsync(Guid sessionId)
    {
        var session = await _context.UserSessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.SessionStatus == "Active");

        if (session != null)
        {
            session.LogoutTime = DateTime.UtcNow;
            session.SessionStatus = "Inactive";

            var auditLog = new AuditLog
            {
                UserId = session.UserId,
                ModuleName = "Authentication",
                ActionType = "Logout",
                AffectedRecord = $"UserSession: {sessionId}",
                PreviousValue = null,
                NewValue = $"{{\"SessionId\": \"{sessionId}\", \"Status\": \"LogoutSuccess\"}}",
                ActionTime = DateTime.UtcNow,
                IpAddress = session.IpAddress
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();
        }
    }
}
