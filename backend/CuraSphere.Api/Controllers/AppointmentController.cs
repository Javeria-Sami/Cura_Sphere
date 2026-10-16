using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CuraSphere.Application.DTOs;
using CuraSphere.Application.Interfaces;

namespace CuraSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAppointments([FromQuery] string? search, [FromQuery] string? status)
    {
        var appointments = await _appointmentService.GetAppointmentsAsync(search, status);
        return Ok(new { success = true, data = appointments });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAppointmentById(long id)
    {
        var appt = await _appointmentService.GetAppointmentByIdAsync(id);
        if (appt == null)
            return NotFound(new { success = false, message = "Appointment not found." });

        return Ok(new { success = true, data = appt });
    }

    [HttpPost]
    public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid data." });

        var created = await _appointmentService.CreateAppointmentAsync(dto);
        return CreatedAtAction(nameof(GetAppointmentById), new { id = created.AppointmentId }, new { success = true, data = created });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] string status)
    {
        var result = await _appointmentService.UpdateStatusAsync(id, status);
        if (!result)
            return NotFound(new { success = false, message = "Appointment not found." });

        return Ok(new { success = true, message = "Status updated successfully." });
    }
}
