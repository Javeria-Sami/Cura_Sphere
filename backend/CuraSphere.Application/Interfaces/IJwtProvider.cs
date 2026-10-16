using CuraSphere.Domain.Entities;
using System.Collections.Generic;

namespace CuraSphere.Application.Interfaces;

public interface IJwtProvider
{
    string GenerateToken(UserAccount user, List<string> permissions, Guid sessionId);
}
