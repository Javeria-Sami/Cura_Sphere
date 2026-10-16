using System;

namespace CuraSphere.Application.DTOs;

public class InvoiceDto
{
    public long InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string InvoiceDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class CreateInvoiceDto
{
    public long PatientId { get; set; }
    public string ServiceType { get; set; } = "OPD";
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
    public string PaymentMethod { get; set; } = string.Empty;
    public string CashierName { get; set; } = string.Empty;
    public string PaymentDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class ProcessPaymentDto
{
    public long InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string CashierName { get; set; } = "Main Cashier";
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
