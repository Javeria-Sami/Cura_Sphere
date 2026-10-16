using CuraSphere.Application.Common;
using CuraSphere.Application.Interfaces;
using CuraSphere.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CuraSphere.Infrastructure.Services;

public class JwtProvider : IJwtProvider
{
    private readonly JwtSettings _jwtSettings;

    public JwtProvider(IOptions<JwtSettings> jwtOptions)
    {
        _jwtSettings = jwtOptions?.Value ?? throw new ArgumentNullException(nameof(jwtOptions));
        _jwtSettings.Validate();
    }

    public JwtProvider(IConfiguration configuration)
    {
        _jwtSettings = new JwtSettings
        {
            Secret = configuration["JwtSettings:Secret"] ?? string.Empty,
            Issuer = configuration["JwtSettings:Issuer"] ?? "CuraSphereApi",
            Audience = configuration["JwtSettings:Audience"] ?? "CuraSphereClient",
            ExpiryInMinutes = int.TryParse(configuration["JwtSettings:ExpiryInMinutes"], out var exp) ? exp : 60
        };
        _jwtSettings.Validate();
    }

    public JwtProvider(JwtSettings jwtSettings)
    {
        _jwtSettings = jwtSettings ?? throw new ArgumentNullException(nameof(jwtSettings));
        _jwtSettings.Validate();
    }

    public string GenerateToken(UserAccount user, List<string> permissions, Guid sessionId)
    {
        ArgumentNullException.ThrowIfNull(user);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var roleName = user.Role?.RoleName ?? "Staff";

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(ClaimTypes.Role, roleName),
            new("SessionId", sessionId.ToString())
        };

        if (user.Employee != null)
        {
            claims.Add(new Claim("EmployeeName", $"{user.Employee.FirstName} {user.Employee.LastName}"));
        }

        // Add permissions as custom claims
        if (permissions != null)
        {
            foreach (var permission in permissions)
            {
                if (!string.IsNullOrWhiteSpace(permission))
                {
                    claims.Add(new Claim("permission", permission));
                }
            }
        }

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
