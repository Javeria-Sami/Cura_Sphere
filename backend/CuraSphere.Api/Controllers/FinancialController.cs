using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinancialController : ControllerBase
{
    private readonly IFinancialService _financialService;

    public FinancialController(IFinancialService financialService)
    {
        _financialService = financialService;
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] string? search, [FromQuery] string? status)
    {
        var list = await _financialService.GetInvoicesAsync(search, status);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("invoice")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid data." });

        var created = await _financialService.CreateInvoiceAsync(dto);
        return Ok(new { success = true, data = created });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] string? search)
    {
        var list = await _financialService.GetPaymentsAsync(search);
        return Ok(new { success = true, data = list });
    }

    [HttpPost("payment")]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid data." });

        var created = await _financialService.ProcessPaymentAsync(dto);
        return Ok(new { success = true, data = created });
    }

    [HttpGet("insurance/claims")]
    public async Task<IActionResult> GetInsuranceClaims([FromQuery] string? search, [FromQuery] string? status)
    {
        var list = await _financialService.GetInsuranceClaimsAsync(search, status);
        return Ok(new { success = true, data = list });
    }
}
