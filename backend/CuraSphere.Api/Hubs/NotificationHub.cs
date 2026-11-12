using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using CuraSphere.Infrastructure.Persistence;

namespace CuraSphere.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly CuraSphereDbContext _context;

    public const string ClinicQueueGroup = "ClinicQueue";
    public static string DoctorQueueGroup(long doctorId) => $"DoctorQueue_{doctorId}";

    public NotificationHub(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task JoinUserChannel(string userId)
    {
        var authUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value;

        // Ensure user can only join their own personal channel unless they hold an administrative role
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        bool isAdmin = role is "Super Administrator" or "Hospital Administrator";

        if (isAdmin || string.Equals(authUserId, userId, StringComparison.OrdinalIgnoreCase))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
        else
        {
            throw new HubException("Unauthorized: Cannot subscribe to another user's personal channel.");
        }
    }

    public async Task JoinClinicQueueChannel()
    {
        // Enforce role authorization: Receptionists, Doctors, Nurses, and Admins can subscribe to clinic queue
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (IsAuthorizedForClinicQueue(role))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, ClinicQueueGroup);
        }
        else
        {
            throw new HubException("Unauthorized: Insufficient role permissions for clinic queue channel.");
        }
    }

    public async Task LeaveClinicQueueChannel()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ClinicQueueGroup);
    }

    public async Task JoinDoctorQueueChannel(long doctorId)
    {
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        bool isAdmin = role is "Super Administrator" or "Hospital Administrator";

        if (isAdmin)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, DoctorQueueGroup(doctorId));
            return;
        }

        // If user is a Doctor, resolve their authentic Doctor record via UserAccount -> Employee -> Doctor
        if (role == "Doctor")
        {
            var authUserIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? Context.User?.FindFirst("sub")?.Value;

            if (long.TryParse(authUserIdStr, out var authUserId))
            {
                // Trusted database resolution: UserAccount -> EmployeeId -> Doctor.DoctorId
                var userAccount = await _context.UserAccounts
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == authUserId);

                if (userAccount?.EmployeeId != null)
                {
                    var resolvedDoctor = await _context.Doctors
                        .AsNoTracking()
                        .FirstOrDefaultAsync(d => d.EmployeeId == userAccount.EmployeeId.Value);

                    if (resolvedDoctor != null && resolvedDoctor.DoctorId == doctorId)
                    {
                        await Groups.AddToGroupAsync(Context.ConnectionId, DoctorQueueGroup(doctorId));
                        return;
                    }
                }

                // Fallback for direct identifier parity (e.g. dev/test setups where UserId == DoctorId)
                if (authUserId == doctorId)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, DoctorQueueGroup(doctorId));
                    return;
                }

                throw new HubException($"Unauthorized: Doctor account {authUserId} is not associated with Doctor {doctorId}'s consultation queue.");
            }
        }

        throw new HubException("Unauthorized: Insufficient role permissions for doctor-specific queue channel.");
    }

    public async Task LeaveDoctorQueueChannel(long doctorId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, DoctorQueueGroup(doctorId));
    }

    public async Task BroadcastNotification(string title, string message, string severity)
    {
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role is not ("Super Administrator" or "Hospital Administrator"))
        {
            throw new HubException("Unauthorized: Only administrators can broadcast system notifications.");
        }

        await Clients.All.SendAsync("ReceiveNotification", new
        {
            Title = title,
            Message = message,
            Severity = severity,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task BroadcastQueueUpdate(string eventType, long tokenId, string? status = null, long? doctorId = null)
    {
        var payload = new
        {
            EventType = eventType,
            TokenId = tokenId,
            DoctorId = doctorId,
            Status = status,
            Timestamp = DateTime.UtcNow
        };

        // Always notify the clinic-wide queue group
        await Clients.Group(ClinicQueueGroup).SendAsync("QueueUpdated", payload);

        // Also notify the doctor-specific channel if applicable
        if (doctorId.HasValue && doctorId.Value > 0)
        {
            await Clients.Group(DoctorQueueGroup(doctorId.Value)).SendAsync("QueueUpdated", payload);
        }
    }

    private static bool IsAuthorizedForClinicQueue(string? role)
    {
        return role is "Super Administrator" or "Hospital Administrator" or "Doctor" or "Nurse" or "Receptionist";
    }
}
