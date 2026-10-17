using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IFinancialService
{
    Task<IEnumerable<InvoiceDto>> GetInvoicesAsync(string? search, string? status);
    Task<InvoiceDetailDto?> GetInvoiceByIdAsync(long invoiceId);
    Task<IEnumerable<InvoiceDto>> GetPatientInvoicesAsync(long patientId);
    Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto dto, long currentUserId = 0);
    Task<IEnumerable<PaymentRecordDto>> GetPaymentsAsync(string? search);
    Task<PaymentRecordDto> ProcessPaymentAsync(ProcessPaymentDto dto, long currentUserId = 0);
    Task<BillingSummaryDto> GetBillingSummaryAsync();
    Task<IEnumerable<InsuranceClaimDto>> GetInsuranceClaimsAsync(string? search, string? status);
}
