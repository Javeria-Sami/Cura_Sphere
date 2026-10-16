using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace CuraSphere.Api.Hubs;

public class TelemetryHub : Hub
{
    public async Task SubscribeToPatientTelemetry(long patientId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"PatientTelemetry_{patientId}");
    }

    public async Task BroadcastVitalSignUpdate(long patientId, int heartRate, int spo2, string bp, double bodyTemp)
    {
        await Clients.Group($"PatientTelemetry_{patientId}").SendAsync("ReceiveVitalSignUpdate", new
        {
            PatientId = patientId,
            HeartRate = heartRate,
            SpO2 = spo2,
            BloodPressure = bp,
            BodyTemp = bodyTemp,
            Timestamp = DateTime.UtcNow
        });
    }
}
