using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;
using CuraSphere.Api.Middleware;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/billing")]
[Authorize]
public class FinancialController : ControllerBase
{
    private readonly IFinancialService _financialService;

    public FinancialController(IFinancialService financialService)
    {
        _financialService = financialService;
    }

    [HttpGet("invoices")]
    [HasPermission("billing.read")]
    public async Task<IActionResult> GetInvoices([FromQuery] string? search, [FromQuery] string? status)
    {
        var list = await _financialService.GetInvoicesAsync(search, status);
        return Ok(new { success = true, data = list });
    }

    [HttpGet("invoices/{id:long}")]
    [HasPermission("billing.read")]
    public async Task<IActionResult> GetInvoiceById(long id)
    {
        var invoice = await _financialService.GetInvoiceByIdAsync(id);
        if (invoice == null)
            return NotFound(new { success = false, message = "Invoice not found." });

        return Ok(new { success = true, data = invoice });
    }

    [HttpGet("patient/{patientId:long}/invoices")]
    [HasPermission("billing.read")]
    public async Task<IActionResult> GetPatientInvoices(long patientId)
    {
        var list = await _financialService.GetPatientInvoicesAsync(patientId);
        return Ok(new { success = true, data = list });
    }

    [HttpGet("summary")]
    [HasPermission("billing.read")]
    public async Task<IActionResult> GetBillingSummary()
    {
        var summary = await _financialService.GetBillingSummaryAsync();
        return Ok(new { success = true, data = summary });
    }

    [HttpPost("invoice")]
    [HttpPost("consultation-invoice")]
    [HasPermission("billing.create")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid invoice data." });

        try
        {
            var currentUserId = GetCurrentUserId();
            var created = await _financialService.CreateInvoiceAsync(dto, currentUserId);
            return Ok(new { success = true, data = created, message = $"Invoice {created.InvoiceNumber} created successfully." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("payments")]
    [HasPermission("billing.read")]
    public async Task<IActionResult> GetPayments([FromQuery] string? search)
    {
        var list = await _financialService.GetPaymentsAsync(search);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("payment")]
    [HasPermission("billing.pay")]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid payment data." });

        try
        {
            var currentUserId = GetCurrentUserId();
            var created = await _financialService.ProcessPaymentAsync(dto, currentUserId);
            return Ok(new { success = true, data = created, message = $"Payment {created.PaymentNumber} recorded successfully." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("insurance/claims")]
    [HasPermission("billing.read")]
    public async Task<IActionResult> GetInsuranceClaims([FromQuery] string? search, [FromQuery] string? status)
    {
        var list = await _financialService.GetInsuranceClaimsAsync(search, status);
        return Ok(new { success = true, data = list });
    }

    private long GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;
        return long.TryParse(subClaim, out var id) ? id : 0;
    }
}
