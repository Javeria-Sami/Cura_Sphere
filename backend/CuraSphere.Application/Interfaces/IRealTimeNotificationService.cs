using System.Threading.Tasks;

namespace CuraSphere.Application.Interfaces;

public interface IRealTimeNotificationService
{
    Task NotifyEmergencyCaseAsync(string caseNumber, string triageLevel, string patientName);
    Task NotifyIcuVitalAlertAsync(string bedNumber, string alertMessage);
    Task NotifyPaymentReceivedAsync(string paymentNumber, decimal amount);
}
