using System;

namespace CuraSphere.Application.Common;

/// <summary>
/// Strongly-typed JWT configuration settings with strict validation rules.
/// </summary>
public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "CuraSphereApi";
    public string Audience { get; set; } = "CuraSphereClient";
    public int ExpiryInMinutes { get; set; } = 60;

    /// <summary>
    /// Validates that all required JWT parameters meet production cryptographic standards.
    /// Minimum secret key length is 32 characters (256 bits) for HMAC-SHA256.
    /// </summary>
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Secret))
        {
            throw new InvalidOperationException(
                "Security Configuration Error: 'JwtSettings:Secret' is missing or empty. " +
                "A strong signing key of at least 32 characters (256 bits) is required.");
        }

        if (Secret.Length < 32)
        {
            throw new InvalidOperationException(
                $"Security Configuration Error: 'JwtSettings:Secret' length ({Secret.Length} chars) is insufficient. " +
                "Cryptographic standard requires at least 32 characters (256-bit key) for HMAC-SHA256.");
        }

        if (string.IsNullOrWhiteSpace(Issuer))
        {
            throw new InvalidOperationException(
                "Security Configuration Error: 'JwtSettings:Issuer' is required for token validation.");
        }

        if (string.IsNullOrWhiteSpace(Audience))
        {
            throw new InvalidOperationException(
                "Security Configuration Error: 'JwtSettings:Audience' is required for token validation.");
        }

        if (ExpiryInMinutes <= 0)
        {
            throw new InvalidOperationException(
                "Security Configuration Error: 'JwtSettings:ExpiryInMinutes' must be greater than zero.");
        }
    }
}
