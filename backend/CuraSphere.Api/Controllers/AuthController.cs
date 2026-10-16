using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";

        var response = await _authService.LoginAsync(request, ipAddress, userAgent);

        if (response == null)
        {
            return Unauthorized(new {
                success = false,
                error = new {
                    code = "INVALID_CREDENTIALS",
                    message = "Invalid username or password."
                }
            });
        }

        return Ok(new {
            success = true,
            data = response
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var sessionIdClaim = User.Claims.FirstOrDefault(c => c.Type == "SessionId")?.Value;

        if (Guid.TryParse(sessionIdClaim, out Guid sessionId))
        {
            await _authService.LogoutAsync(sessionId);
        }

        return Ok(new {
            success = true,
            message = "Logged out successfully."
        });
    }
}
