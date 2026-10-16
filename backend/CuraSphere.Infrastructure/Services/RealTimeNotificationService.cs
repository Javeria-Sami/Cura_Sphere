using System;
using System.Threading.Tasks;
using CuraSphere.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace CuraSphere.Infrastructure.Services;

public class RealTimeNotificationService : IRealTimeNotificationService
{
    private readonly IHubContext<HospitalHubProxy> _hubContext;

    public RealTimeNotificationService(IHubContext<HospitalHubProxy> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyEmergencyCaseAsync(string caseNumber, string triageLevel, string patientName)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveEmergencyAlert", new
        {
            CaseNumber = caseNumber,
            TriageLevel = triageLevel,
            PatientName = patientName,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyIcuVitalAlertAsync(string bedNumber, string alertMessage)
    {
        await _hubContext.Clients.Group("ICU").SendAsync("ReceiveIcuVitalAlert", new
        {
            BedNumber = bedNumber,
            AlertMessage = alertMessage,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyPaymentReceivedAsync(string paymentNumber, decimal amount)
    {
        await _hubContext.Clients.All.SendAsync("ReceivePaymentAlert", new
        {
            PaymentNumber = paymentNumber,
            Amount = amount,
            Timestamp = DateTime.UtcNow
        });
    }
}

public class HospitalHubProxy : Hub
{
}
