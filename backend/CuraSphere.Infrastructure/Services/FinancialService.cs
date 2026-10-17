using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
            .Where(i => i.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            query = query.Where(i => i.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(i => 
                i.InvoiceNumber.ToLower().Contains(term) ||
                i.Patient.FirstName.ToLower().Contains(term) ||
                i.Patient.LastName.ToLower().Contains(term) ||
                i.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(i => i.InvoiceDate).ToListAsync();
        return list.Select(MapToInvoiceDto);
    }

    public async Task<InvoiceDetailDto?> GetInvoiceByIdAsync(long invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Patient)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId && i.IsActive);

        if (invoice == null) return null;

        var payments = await _context.PaymentRecords
            .Where(p => p.InvoiceId == invoiceId && p.IsActive)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        var detail = new InvoiceDetailDto
        {
            InvoiceId = invoice.InvoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            PatientId = invoice.PatientId,
            PatientName = invoice.Patient != null ? $"{invoice.Patient.FirstName} {invoice.Patient.LastName}".Trim() : "Patient",
            MedicalRecordNumber = invoice.Patient?.MedicalRecordNumber ?? "",
            PatientPhone = invoice.Patient?.PhoneNumber ?? "",
            ServiceType = invoice.ServiceType,
            SubTotal = invoice.TotalAmount,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = invoice.PaidAmount,
            BalanceAmount = invoice.BalanceAmount,
            InvoiceDate = invoice.InvoiceDate.ToString("yyyy-MM-dd"),
            DueDate = invoice.InvoiceDate.AddDays(14).ToString("yyyy-MM-dd"),
            Status = invoice.Status,
            Payments = payments.Select(MapToPaymentDto).ToList(),
            LineItems = new List<InvoiceLineItemDto>
            {
                new()
                {
                    Description = invoice.ServiceType,
                    Category = "Consultation",
                    Quantity = 1,
                    UnitPrice = invoice.TotalAmount
                }
            }
        };

        return detail;
    }

    public async Task<IEnumerable<InvoiceDto>> GetPatientInvoicesAsync(long patientId)
    {
        var list = await _context.Invoices
            .Include(i => i.Patient)
            .AsNoTracking()
            .Where(i => i.PatientId == patientId && i.IsActive)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();

        return list.Select(MapToInvoiceDto);
    }

    public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto dto, long currentUserId = 0)
    {
        // 1. Authoritative Validation
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.PatientId == dto.PatientId && p.IsActive);
        if (patient == null)
            throw new KeyNotFoundException($"Patient with ID {dto.PatientId} not found.");

        // 2. Authoritative Server-side Price & Arithmetic Calculation
        decimal subTotal = 0;
        var validLineItems = new List<InvoiceLineItemDto>();

        if (dto.LineItems != null && dto.LineItems.Count > 0)
        {
            foreach (var item in dto.LineItems)
            {
                if (string.IsNullOrWhiteSpace(item.Description))
                    throw new ArgumentException("Every line item must have a valid description.");
                if (item.Quantity <= 0)
                    throw new ArgumentException("Line item quantity must be greater than zero.");
                if (item.UnitPrice < 0)
                    throw new ArgumentException("Line item unit price cannot be negative.");

                subTotal += (item.Quantity * item.UnitPrice);
                validLineItems.Add(new InvoiceLineItemDto
                {
                    Description = item.Description.Trim(),
                    Category = string.IsNullOrWhiteSpace(item.Category) ? "Consultation" : item.Category,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                });
            }
        }
        else
        {
            if (dto.TotalAmount <= 0)
                throw new ArgumentException("Invoice total amount must be greater than zero.");
            subTotal = dto.TotalAmount;
            validLineItems.Add(new InvoiceLineItemDto
            {
                Description = string.IsNullOrWhiteSpace(dto.ServiceType) ? "Outpatient Medical Service" : dto.ServiceType,
                Category = "Consultation",
                Quantity = 1,
                UnitPrice = dto.TotalAmount
            });
        }

        decimal discountPercent = Math.Clamp(dto.DiscountPercent, 0, 100);
        decimal discountAmount = Math.Round(subTotal * (discountPercent / 100m), 2);
        decimal taxableAmount = subTotal - discountAmount;
        decimal taxPercent = Math.Clamp(dto.TaxPercent, 0, 100);
        decimal taxAmount = Math.Round(taxableAmount * (taxPercent / 100m), 2);
        decimal finalTotal = Math.Round(taxableAmount + taxAmount, 2);

        if (finalTotal <= 0)
            throw new ArgumentException("Calculated invoice total amount must be greater than zero.");

        // 3. Number Generation & Entity Mapping
        var randomSuffix = new Random().Next(1000, 9999);
        var invNo = $"INV-{DateTime.UtcNow:yyyyMMdd}-{randomSuffix}";

        var invoice = new Invoice
        {
            InvoiceNumber = invNo,
            PatientId = dto.PatientId,
            ServiceType = string.IsNullOrWhiteSpace(dto.ServiceType) ? "OPD Consultation" : dto.ServiceType,
            TotalAmount = finalTotal,
            PaidAmount = 0,
            InvoiceDate = DateTime.UtcNow,
            Status = "Unpaid",
            CreatedBy = currentUserId
        };

        _context.Invoices.Add(invoice);

        // 4. Record Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId > 0 ? currentUserId : null,
            ModuleName = "Billing & Financial",
            ActionType = "INVOICE_CREATED",
            AffectedRecord = invNo,
            NewValue = JsonSerializer.Serialize(new
            {
                invoice.PatientId,
                invoice.TotalAmount,
                subTotal,
                discountPercent,
                taxPercent,
                ItemsCount = validLineItems.Count
            }),
            IpAddress = "127.0.0.1",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        invoice.Patient = patient;
        return MapToInvoiceDto(invoice);
    }

    public async Task<IEnumerable<PaymentRecordDto>> GetPaymentsAsync(string? search)
    {
        var query = _context.PaymentRecords
            .Include(p => p.Invoice)
                .ThenInclude(i => i.Patient)
            .AsNoTracking()
            .Where(p => p.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p => 
                p.PaymentNumber.ToLower().Contains(term) ||
                p.Invoice.InvoiceNumber.ToLower().Contains(term) ||
                p.Invoice.Patient.FirstName.ToLower().Contains(term) ||
                p.Invoice.Patient.LastName.ToLower().Contains(term) ||
                p.PaymentMethod.ToLower().Contains(term));
        }

        var list = await query.OrderByDescending(p => p.PaymentDate).ToListAsync();
        return list.Select(MapToPaymentDto);
    }

    public async Task<PaymentRecordDto> ProcessPaymentAsync(ProcessPaymentDto dto, long currentUserId = 0)
    {
        // 1. Authoritative Financial Validation
        if (dto.Amount <= 0)
            throw new ArgumentException("Payment amount must be greater than zero.");

        var validMethods = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Cash", "Card", "Bank Transfer", "Insurance Claim"
        };
        if (!validMethods.Contains(dto.PaymentMethod))
            throw new ArgumentException($"Unsupported payment method '{dto.PaymentMethod}'. Valid options: Cash, Card, Bank Transfer, Insurance Claim.");

        var invoice = await _context.Invoices
            .Include(i => i.Patient)
            .FirstOrDefaultAsync(i => i.InvoiceId == dto.InvoiceId && i.IsActive);

        if (invoice == null)
            throw new KeyNotFoundException($"Invoice with ID {dto.InvoiceId} not found.");

        if (invoice.Status == "Paid" || invoice.BalanceAmount <= 0)
            throw new InvalidOperationException("This invoice has already been fully paid.");

        if (dto.Amount > invoice.BalanceAmount)
            throw new ArgumentException($"Payment amount ({dto.Amount:N2}) exceeds outstanding balance ({invoice.BalanceAmount:N2}).");

        // 2. Atomic Database Transaction
        using var transaction = await _context.Database.BeginTransactionAsync();

        invoice.PaidAmount = Math.Round(invoice.PaidAmount + dto.Amount, 2);
        if (invoice.PaidAmount >= invoice.TotalAmount)
        {
            invoice.Status = "Paid";
        }
        else
        {
            invoice.Status = "Partial";
        }
        invoice.UpdatedBy = currentUserId;

        var randomSuffix = new Random().Next(1000, 9999);
        var paymentNo = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{randomSuffix}";
        var payment = new PaymentRecord
        {
            PaymentNumber = paymentNo,
            InvoiceId = dto.InvoiceId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            CashierName = string.IsNullOrWhiteSpace(dto.CashierName) ? "Main Cashier" : dto.CashierName,
            PaymentDate = DateTime.UtcNow,
            Status = "Confirmed",
            CreatedBy = currentUserId
        };

        _context.PaymentRecords.Add(payment);

        // 3. Record Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = currentUserId > 0 ? currentUserId : null,
            ModuleName = "Billing & Financial",
            ActionType = "PAYMENT_COLLECTED",
            AffectedRecord = paymentNo,
            NewValue = JsonSerializer.Serialize(new
            {
                payment.InvoiceId,
                payment.Amount,
                payment.PaymentMethod,
                RemainingBalance = invoice.BalanceAmount,
                NewStatus = invoice.Status
            }),
            IpAddress = "127.0.0.1",
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        payment.Invoice = invoice;
        return MapToPaymentDto(payment);
    }

    public async Task<BillingSummaryDto> GetBillingSummaryAsync()
    {
        var invoices = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.IsActive)
            .ToListAsync();

        var paymentCount = await _context.PaymentRecords
            .AsNoTracking()
            .Where(p => p.IsActive)
            .CountAsync();

        return new BillingSummaryDto
        {
            TotalBilled = invoices.Sum(i => i.TotalAmount),
            TotalCollected = invoices.Sum(i => i.PaidAmount),
            TotalOutstanding = invoices.Sum(i => i.BalanceAmount),
            PaidCount = invoices.Count(i => i.Status == "Paid"),
            PartialCount = invoices.Count(i => i.Status == "Partial"),
            UnpaidCount = invoices.Count(i => i.Status == "Unpaid"),
            TotalTransactions = paymentCount
        };
    }

    public async Task<IEnumerable<InsuranceClaimDto>> GetInsuranceClaimsAsync(string? search, string? status)
    {
        var query = _context.InsuranceClaims
            .Include(c => c.Patient)
            .AsNoTracking()
            .Where(c => c.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            query = query.Where(c => c.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
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
        PatientName = i.Patient != null ? $"{i.Patient.FirstName} {i.Patient.LastName}".Trim() : "Patient",
        MedicalRecordNumber = i.Patient?.MedicalRecordNumber ?? "",
        PatientPhone = i.Patient?.PhoneNumber ?? "",
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
        PatientName = p.Invoice?.Patient != null ? $"{p.Invoice.Patient.FirstName} {p.Invoice.Patient.LastName}".Trim() : "Patient",
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
        PatientName = c.Patient != null ? $"{c.Patient.FirstName} {c.Patient.LastName}".Trim() : "Unknown",
        MedicalRecordNumber = c.Patient?.MedicalRecordNumber ?? "",
        InsurerName = c.InsurerName,
        PolicyNumber = c.PolicyNumber,
        ServiceCategory = c.ServiceCategory,
        ClaimedAmount = c.ClaimedAmount,
        ApprovedAmount = c.ApprovedAmount,
        Status = c.Status
    };
}
