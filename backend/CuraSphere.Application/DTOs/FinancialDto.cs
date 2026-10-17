using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CuraSphere.Application.DTOs;

public class InvoiceLineItemDto
{
    [Required]
    public string Description { get; set; } = string.Empty;

    public string Category { get; set; } = "Consultation"; // Consultation, Medication, Lab, Procedure, Other

    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;

    [Range(0, 1000000)]
    public decimal UnitPrice { get; set; }

    public decimal TotalPrice => Quantity * UnitPrice;
}

public class InvoiceDto
{
    public long InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string InvoiceDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Unpaid"; // Paid, Partial, Unpaid, Cancelled
}

public class InvoiceDetailDto : InvoiceDto
{
    public decimal SubTotal { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxPercent { get; set; }
    public decimal TaxAmount { get; set; }
    public string? DueDate { get; set; }
    public string? Notes { get; set; }
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
    public List<PaymentRecordDto> Payments { get; set; } = new();
}

public class CreateInvoiceDto
{
    [Required]
    public long PatientId { get; set; }

    public string ServiceType { get; set; } = "OPD";

    public long? DoctorId { get; set; }
    public long? AppointmentId { get; set; }
    public long? EncounterId { get; set; }

    [Range(0, 100)]
    public decimal DiscountPercent { get; set; } = 0;

    [Range(0, 100)]
    public decimal TaxPercent { get; set; } = 0;

    public string? Notes { get; set; }

    public List<InvoiceLineItemDto> LineItems { get; set; } = new();

    public decimal TotalAmount { get; set; }
}

public class PaymentRecordDto
{
    public long PaymentId { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public long InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, Bank Transfer, Insurance Claim
    public string CashierName { get; set; } = string.Empty;
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }
    public string PaymentDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Confirmed";
}

public class ProcessPaymentDto
{
    [Required]
    public long InvoiceId { get; set; }

    [Required]
    [Range(0.01, 1000000)]
    public decimal Amount { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, Bank Transfer, Insurance Claim

    public string CashierName { get; set; } = "Main Cashier";

    public string? TransactionReference { get; set; }

    public string? Notes { get; set; }
}

public class BillingSummaryDto
{
    public decimal TotalBilled { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalOutstanding { get; set; }
    public int PaidCount { get; set; }
    public int PartialCount { get; set; }
    public int UnpaidCount { get; set; }
    public int TotalTransactions { get; set; }
}

public class InsuranceClaimDto
{
    public long ClaimId { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string InsurerName { get; set; } = string.Empty;
    public string PolicyNumber { get; set; } = string.Empty;
    public string ServiceCategory { get; set; } = string.Empty;
    public decimal ClaimedAmount { get; set; }
    public decimal ApprovedAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}
