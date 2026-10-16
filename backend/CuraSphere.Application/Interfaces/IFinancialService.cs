using System.Collections.Generic;
using System.Threading.Tasks;
using CuraSphere.Application.DTOs;

namespace CuraSphere.Application.Interfaces;

public interface IFinancialService
{
    Task<IEnumerable<InvoiceDto>> GetInvoicesAsync(string? search, string? status);
    Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto dto);
    Task<IEnumerable<PaymentRecordDto>> GetPaymentsAsync(string? search);
    Task<PaymentRecordDto> ProcessPaymentAsync(ProcessPaymentDto dto);
    Task<IEnumerable<InsuranceClaimDto>> GetInsuranceClaimsAsync(string? search, string? status);
}
