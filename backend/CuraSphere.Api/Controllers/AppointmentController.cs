using System;
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
            return BadRequest(new { success = false, message = "Invalid appointment details provided." });

        try
        {
            var created = await _appointmentService.CreateAppointmentAsync(dto);
            return CreatedAtAction(
                nameof(GetAppointmentById),
                new { id = created.AppointmentId },
                new { success = true, data = created, message = "Appointment scheduled successfully." }
            );
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to create appointment: " + ex.Message });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateAppointmentStatusDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.Status))
            return BadRequest(new { success = false, message = "Status cannot be empty." });

        try
        {
            var result = await _appointmentService.UpdateStatusAsync(id, dto.Status, dto.Remarks);
            if (!result)
                return NotFound(new { success = false, message = "Appointment not found." });

            return Ok(new { success = true, message = $"Appointment status updated to '{dto.Status}'." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPatch("{id}/reschedule")]
    public async Task<IActionResult> Reschedule(long id, [FromBody] RescheduleAppointmentDto dto)
    {
        if (dto.AppointmentDate == default)
            return BadRequest(new { success = false, message = "A valid appointment date is required." });

        try
        {
            var updated = await _appointmentService.RescheduleAppointmentAsync(id, dto);
            if (updated == null)
                return NotFound(new { success = false, message = "Appointment not found." });

            return Ok(new { success = true, data = updated, message = "Appointment rescheduled successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("doctors")]
    public async Task<IActionResult> GetDoctors([FromQuery] string? status)
    {
        var doctors = await _appointmentService.GetDoctorsAsync(status);
        return Ok(new { success = true, data = doctors });
    }

    [HttpPost("doctors")]
    public async Task<IActionResult> CreateDoctor([FromBody] CreateDoctorDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid doctor details provided." });

        try
        {
            var created = await _appointmentService.CreateDoctorAsync(dto);
            return Ok(new { success = true, data = created, message = "Medical specialist registered successfully." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to register doctor: " + ex.Message });
        }
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _appointmentService.GetDepartmentsAsync();
        return Ok(new { success = true, data = departments });
    }
}
