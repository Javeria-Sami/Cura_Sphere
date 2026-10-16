using System;
using System.Text.Json;
using CuraSphere.Domain.Entities;

namespace CuraSphere.Infrastructure.Services.Integration;

public static class FhirConverter
{
    public static string ToFhirPatientJson(Patient patient)
    {
        var fhirPatient = new
        {
            resourceType = "Patient",
            id = patient.PatientId.ToString(),
            identifier = new[]
            {
                new
                {
                    system = "http://curasphere.hospital/mrn",
                    value = patient.MedicalRecordNumber
                },
                new
                {
                    system = "http://curasphere.hospital/cnic",
                    value = patient.CnicPassport ?? ""
                }
            },
            name = new[]
            {
                new
                {
                    use = "official",
                    family = patient.LastName,
                    given = new[] { patient.FirstName, patient.MiddleName ?? "" }
                }
            },
            gender = patient.Gender.ToLowerInvariant(),
            birthDate = patient.DateOfBirth.ToString("yyyy-MM-dd"),
            telecom = new[]
            {
                new { system = "phone", value = patient.PhoneNumber, use = "mobile" },
                new { system = "email", value = patient.Email ?? "", use = "home" }
            },
            address = new[]
            {
                new
                {
                    line = new[] { patient.Address },
                    city = patient.City,
                    state = patient.Province,
                    postalCode = patient.PostalCode ?? ""
                }
            }
        };

        return JsonSerializer.Serialize(fhirPatient, new JsonSerializerOptions { WriteIndented = true });
    }

    public static string ToHl7LabOrderMessage(LabOrder labOrder, Patient patient)
    {
        string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        return $"MSH|^~\\&|CURASPHERE_HMS|MAIN_HOSPITAL|LAB_SYSTEM|DIAGNOSTICS|{timestamp}||ORM^O01|MSG{labOrder.LabOrderId:D8}|P|2.3.1\r" +
               $"PID|1||{patient.MedicalRecordNumber}^^^CURASPHERE||{patient.LastName}^{patient.FirstName}||{patient.DateOfBirth:yyyyMMdd}|{patient.Gender[0]}\r" +
               $"ORC|NW|ORD{labOrder.LabOrderId:D6}|||||^^^20260824000000^^R\r" +
               $"OBR|1|ORD{labOrder.LabOrderId:D6}||{labOrder.OrderNumber}^{labOrder.TestName}|||{timestamp}";
    }
}
