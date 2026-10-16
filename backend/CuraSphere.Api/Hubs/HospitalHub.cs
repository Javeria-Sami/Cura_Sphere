using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace CuraSphere.Api.Hubs;

public class HospitalHub : Hub
{
    public async Task JoinDepartmentGroup(string departmentName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, departmentName);
    }

    public async Task LeaveDepartmentGroup(string departmentName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, departmentName);
    }

    public async Task BroadcastEmergencyAlert(string caseNumber, string triageLevel, string patientName)
    {
        await Clients.All.SendAsync("ReceiveEmergencyAlert", new
        {
            CaseNumber = caseNumber,
            TriageLevel = triageLevel,
            PatientName = patientName,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task BroadcastIcuVitalAlert(string bedNumber, string alertMessage)
    {
        await Clients.Group("ICU").SendAsync("ReceiveIcuVitalAlert", new
        {
            BedNumber = bedNumber,
            AlertMessage = alertMessage,
            Timestamp = DateTime.UtcNow
        });
    }
}
