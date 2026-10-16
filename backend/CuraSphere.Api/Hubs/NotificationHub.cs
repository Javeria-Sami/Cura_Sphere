using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace CuraSphere.Api.Hubs;

public class NotificationHub : Hub
{
    public async Task JoinUserChannel(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public async Task BroadcastNotification(string title, string message, string severity)
    {
        await Clients.All.SendAsync("ReceiveNotification", new
        {
            Title = title,
            Message = message,
            Severity = severity,
            Timestamp = DateTime.UtcNow
        });
    }
}
