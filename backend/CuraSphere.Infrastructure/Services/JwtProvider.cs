using CuraSphere.Application.Interfaces;
using CuraSphere.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CuraSphere.Infrastructure.Services;

public class JwtProvider : IJwtProvider
{
    private readonly IConfiguration _configuration;

    public JwtProvider(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(UserAccount user, List<string> permissions, Guid sessionId)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT Secret is not configured.");
        var issuer = _configuration["JwtSettings:Issuer"] ?? "CuraSphereApi";
        var audience = _configuration["JwtSettings:Audience"] ?? "CuraSphereClient";
        var expiryMinutes = double.Parse(_configuration["JwtSettings:ExpiryInMinutes"] ?? "60");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(ClaimTypes.Role, user.Role.RoleName),
            new("SessionId", sessionId.ToString())
        };

        if (user.Employee != null)
        {
            claims.Add(new Claim("EmployeeName", $"{user.Employee.FirstName} {user.Employee.LastName}"));
        }

        // Add permissions as custom claims
        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
