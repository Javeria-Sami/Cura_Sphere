using System.Collections.Generic;

namespace CuraSphere.Application.DTOs;

public class LoginRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
}
