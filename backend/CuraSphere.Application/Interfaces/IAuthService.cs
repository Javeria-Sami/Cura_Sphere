using CuraSphere.Application.DTOs;
using System;
using System.Threading.Tasks;

namespace CuraSphere.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, string ipAddress, string deviceInformation);
    Task LogoutAsync(Guid sessionId);
}
