using System;

namespace CuraSphere.Domain.Entities;

public class Invoice : BaseEntity
{
    public long InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public string ServiceType { get; set; } = "OPD"; // OPD, IPD, Surgery, Lab, Pharmacy
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount => TotalAmount - PaidAmount;
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Unpaid"; // Paid, Partial, Unpaid
}

public class PaymentRecord : BaseEntity
{
    public long PaymentId { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public long InvoiceId { get; set; }
    public virtual Invoice Invoice { get; set; } = null!;
    
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, Bank Transfer, Insurance
    public string CashierName { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Confirmed"; // Confirmed, Processing, Pending
}

public class InsuranceClaimRecord : BaseEntity
{
    public long ClaimId { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public string InsurerName { get; set; } = string.Empty;
    public string PolicyNumber { get; set; } = string.Empty;
    public string ServiceCategory { get; set; } = "General";
    public decimal ClaimedAmount { get; set; }
    public decimal ApprovedAmount { get; set; }
    public string Status { get; set; } = "Under Review"; // Approved, Under Review, Pending, Rejected
}
