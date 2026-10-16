using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Persistence;

namespace CuraSphere.Infrastructure.Services;

public class FinancialService : IFinancialService
{
    private readonly CuraSphereDbContext _context;

    public FinancialService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<InvoiceDto>> GetInvoicesAsync(string? search, string? status)
    {
        var query = _context.Invoices
            .Include(i => i.Patient)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(i => i.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(i => 
                i.InvoiceNumber.ToLower().Contains(term) ||
                i.Patient.FirstName.ToLower().Contains(term) ||
                i.Patient.LastName.ToLower().Contains(term) ||
                i.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(i => i.InvoiceDate).ToListAsync();
        return list.Select(MapToInvoiceDto);
    }

    public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto dto)
    {
        var invNo = $"INV-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";

        var invoice = new Invoice
        {
            InvoiceNumber = invNo,
            PatientId = dto.PatientId,
            ServiceType = dto.ServiceType,
            TotalAmount = dto.TotalAmount,
            PaidAmount = 0,
            InvoiceDate = DateTime.UtcNow,
            Status = "Unpaid"
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        var created = await _context.Invoices.Include(i => i.Patient).FirstAsync(i => i.InvoiceId == invoice.InvoiceId);
        return MapToInvoiceDto(created);
    }

    public async Task<IEnumerable<PaymentRecordDto>> GetPaymentsAsync(string? search)
    {
        var query = _context.PaymentRecords
            .Include(p => p.Invoice)
                .ThenInclude(i => i.Patient)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p => 
                p.PaymentNumber.ToLower().Contains(term) ||
                p.Invoice.InvoiceNumber.ToLower().Contains(term) ||
                p.Invoice.Patient.FirstName.ToLower().Contains(term) ||
                p.Invoice.Patient.LastName.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(p => p.PaymentDate).ToListAsync();
        return list.Select(MapToPaymentDto);
    }

    public async Task<PaymentRecordDto> ProcessPaymentAsync(ProcessPaymentDto dto)
    {
        var invoice = await _context.Invoices.Include(i => i.Patient).FirstOrDefaultAsync(i => i.InvoiceId == dto.InvoiceId);
        if (invoice == null) throw new InvalidOperationException("Invoice not found");

        invoice.PaidAmount += dto.Amount;
        if (invoice.PaidAmount >= invoice.TotalAmount)
            invoice.Status = "Paid";
        else if (invoice.PaidAmount > 0)
            invoice.Status = "Partial";

        var paymentNo = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";
        var payment = new PaymentRecord
        {
            PaymentNumber = paymentNo,
            InvoiceId = dto.InvoiceId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            CashierName = dto.CashierName,
            PaymentDate = DateTime.UtcNow,
            Status = "Confirmed"
        };

        _context.PaymentRecords.Add(payment);
        await _context.SaveChangesAsync();

        return MapToPaymentDto(payment);
    }

    public async Task<IEnumerable<InsuranceClaimDto>> GetInsuranceClaimsAsync(string? search, string? status)
    {
        var query = _context.InsuranceClaims
            .Include(c => c.Patient)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(c => c.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(c => 
                c.ClaimNumber.ToLower().Contains(term) ||
                c.InsurerName.ToLower().Contains(term) ||
                c.Patient.FirstName.ToLower().Contains(term) ||
                c.Patient.LastName.ToLower().Contains(term));
        }

        var list = await query.ToListAsync();
        return list.Select(MapToClaimDto);
    }

    private static InvoiceDto MapToInvoiceDto(Invoice i) => new InvoiceDto
    {
        InvoiceId = i.InvoiceId,
        InvoiceNumber = i.InvoiceNumber,
        PatientId = i.PatientId,
        PatientName = i.Patient != null ? $"{i.Patient.FirstName} {i.Patient.LastName}" : "Unknown",
        MedicalRecordNumber = i.Patient?.MedicalRecordNumber ?? "",
        ServiceType = i.ServiceType,
        TotalAmount = i.TotalAmount,
        PaidAmount = i.PaidAmount,
        BalanceAmount = i.BalanceAmount,
        InvoiceDate = i.InvoiceDate.ToString("yyyy-MM-dd"),
        Status = i.Status
    };

    private static PaymentRecordDto MapToPaymentDto(PaymentRecord p) => new PaymentRecordDto
    {
        PaymentId = p.PaymentId,
        PaymentNumber = p.PaymentNumber,
        InvoiceId = p.InvoiceId,
        InvoiceNumber = p.Invoice?.InvoiceNumber ?? "",
        PatientName = p.Invoice?.Patient != null ? $"{p.Invoice.Patient.FirstName} {p.Invoice.Patient.LastName}" : "Patient",
        Amount = p.Amount,
        PaymentMethod = p.PaymentMethod,
        CashierName = p.CashierName,
        PaymentDate = p.PaymentDate.ToString("yyyy-MM-dd hh:mm tt"),
        Status = p.Status
    };

    private static InsuranceClaimDto MapToClaimDto(InsuranceClaimRecord c) => new InsuranceClaimDto
    {
        ClaimId = c.ClaimId,
        ClaimNumber = c.ClaimNumber,
        PatientId = c.PatientId,
        PatientName = c.Patient != null ? $"{c.Patient.FirstName} {c.Patient.LastName}" : "Unknown",
        MedicalRecordNumber = c.Patient?.MedicalRecordNumber ?? "",
        InsurerName = c.InsurerName,
        PolicyNumber = c.PolicyNumber,
        ServiceCategory = c.ServiceCategory,
        ClaimedAmount = c.ClaimedAmount,
        ApprovedAmount = c.ApprovedAmount,
        Status = c.Status
    };
}
