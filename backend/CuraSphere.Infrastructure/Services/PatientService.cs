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

public class PatientService : IPatientService
{
    private readonly CuraSphereDbContext _context;

    public PatientService(CuraSphereDbContext context)
    {
        _context = context;
    }

    public async Task<PatientDetailDto?> RegisterPatientAsync(RegisterPatientDto request, long currentUserId)
    {
        // 1. Generate Unique MRN
        var mrn = await GenerateMedicalRecordNumberAsync();

        // 2. Create Patient Entity
        var patient = new Patient
        {
            MedicalRecordNumber = mrn,
            FirstName = request.FirstName.Trim(),
            MiddleName = request.MiddleName?.Trim(),
            LastName = request.LastName.Trim(),
            Gender = request.Gender,
            DateOfBirth = request.DateOfBirth.ToUniversalTime(),
            Age = CalculateAge(request.DateOfBirth),
            CnicPassport = request.CnicPassport?.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            AlternatePhone = request.AlternatePhone?.Trim(),
            Email = request.Email?.Trim(),
            BloodGroupId = request.BloodGroupId,
            MaritalStatusId = request.MaritalStatusId,
            NationalityId = request.NationalityId,
            ReligionId = request.ReligionId,
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            Province = request.Province.Trim(),
            PostalCode = request.PostalCode?.Trim(),
            EmergencyContactName = request.EmergencyContactName.Trim(),
            EmergencyContactPhone = request.EmergencyContactPhone.Trim(),
            EmergencyRelationship = request.EmergencyRelationship.Trim(),
            PatientPhoto = request.PatientPhoto,
            RegistrationDate = DateTime.UtcNow,
            PatientStatus = request.PatientStatus
        };

        // 3. Map Guardians
        if (request.Guardians != null)
        {
            foreach (var g in request.Guardians)
            {
                patient.Guardians.Add(new PatientGuardian
                {
                    GuardianName = g.GuardianName.Trim(),
                    Relationship = g.Relationship.Trim(),
                    PhoneNumber = g.PhoneNumber.Trim(),
                    Email = g.Email?.Trim(),
                    Address = g.Address.Trim()
                });
            }
        }

        // 4. Map Insurances
        if (request.Insurances != null)
        {
            foreach (var ins in request.Insurances)
            {
                patient.Insurances.Add(new PatientInsurance
                {
                    InsuranceProviderId = ins.InsuranceProviderId,
                    PolicyNumber = ins.PolicyNumber.Trim(),
                    MemberId = ins.MemberId.Trim(),
                    CoverageType = ins.CoverageType.Trim(),
                    ValidFrom = ins.ValidFrom.ToUniversalTime(),
                    ValidTo = ins.ValidTo.ToUniversalTime(),
                    CoveragePercentage = ins.CoveragePercentage,
                    DeductibleAmount = ins.DeductibleAmount,
                    Status = "Active"
                });
            }
        }

        _context.Patients.Add(patient);

        // 5. Audit Log entry
        var audit = new AuditLog
        {
            UserId = currentUserId,
            ModuleName = "Patient Management",
            ActionType = "Create",
            AffectedRecord = $"Patient MRN: {mrn}",
            PreviousValue = null,
            NewValue = $"{{\"PatientName\": \"{patient.FirstName} {patient.LastName}\", \"MRN\": \"{mrn}\"}}",
            ActionTime = DateTime.UtcNow
        };
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return await GetPatientByIdAsync(patient.PatientId);
    }

    public async Task<PatientDetailDto?> UpdatePatientAsync(long patientId, UpdatePatientDto request, long currentUserId)
    {
        var patient = await _context.Patients
            .Include(p => p.Guardians)
            .Include(p => p.Insurances)
            .FirstOrDefaultAsync(p => p.PatientId == patientId);

        if (patient == null) return null;

        // Save old values for auditing
        var oldValuesJson = $"{{\"PatientName\": \"{patient.FirstName} {patient.LastName}\", \"Status\": \"{patient.PatientStatus}\"}}";

        // Update basic details
        patient.FirstName = request.FirstName.Trim();
        patient.MiddleName = request.MiddleName?.Trim();
        patient.LastName = request.LastName.Trim();
        patient.Gender = request.Gender;
        patient.DateOfBirth = request.DateOfBirth.ToUniversalTime();
        patient.Age = CalculateAge(request.DateOfBirth);
        patient.CnicPassport = request.CnicPassport?.Trim();
        patient.PhoneNumber = request.PhoneNumber.Trim();
        patient.AlternatePhone = request.AlternatePhone?.Trim();
        patient.Email = request.Email?.Trim();
        patient.BloodGroupId = request.BloodGroupId;
        patient.MaritalStatusId = request.MaritalStatusId;
        patient.NationalityId = request.NationalityId;
        patient.ReligionId = request.ReligionId;
        patient.Address = request.Address.Trim();
        patient.City = request.City.Trim();
        patient.Province = request.Province.Trim();
        patient.PostalCode = request.PostalCode?.Trim();
        patient.EmergencyContactName = request.EmergencyContactName.Trim();
        patient.EmergencyContactPhone = request.EmergencyContactPhone.Trim();
        patient.EmergencyRelationship = request.EmergencyRelationship.Trim();
        patient.PatientPhoto = request.PatientPhoto;
        patient.PatientStatus = request.PatientStatus;

        // Update Guardians (Replace pattern)
        _context.RemoveRange(patient.Guardians);
        if (request.Guardians != null)
        {
            foreach (var g in request.Guardians)
            {
                patient.Guardians.Add(new PatientGuardian
                {
                    GuardianName = g.GuardianName.Trim(),
                    Relationship = g.Relationship.Trim(),
                    PhoneNumber = g.PhoneNumber.Trim(),
                    Email = g.Email?.Trim(),
                    Address = g.Address.Trim()
                });
            }
        }

        // Update Insurances (Replace pattern)
        _context.RemoveRange(patient.Insurances);
        if (request.Insurances != null)
        {
            foreach (var ins in request.Insurances)
            {
                patient.Insurances.Add(new PatientInsurance
                {
                    InsuranceProviderId = ins.InsuranceProviderId,
                    PolicyNumber = ins.PolicyNumber.Trim(),
                    MemberId = ins.MemberId.Trim(),
                    CoverageType = ins.CoverageType.Trim(),
                    ValidFrom = ins.ValidFrom.ToUniversalTime(),
                    ValidTo = ins.ValidTo.ToUniversalTime(),
                    CoveragePercentage = ins.CoveragePercentage,
                    DeductibleAmount = ins.DeductibleAmount,
                    Status = "Active"
                });
            }
        }

        // Audit Log Entry
        var audit = new AuditLog
        {
            UserId = currentUserId,
            ModuleName = "Patient Management",
            ActionType = "Update",
            AffectedRecord = $"Patient MRN: {patient.MedicalRecordNumber}",
            PreviousValue = oldValuesJson,
            NewValue = $"{{\"PatientName\": \"{patient.FirstName} {patient.LastName}\", \"Status\": \"{patient.PatientStatus}\"}}",
            ActionTime = DateTime.UtcNow
        };
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return await GetPatientByIdAsync(patient.PatientId);
    }

    public async Task<PatientDetailDto?> GetPatientByIdAsync(long patientId)
    {
        var patient = await _context.Patients
            .Include(p => p.BloodGroup)
            .Include(p => p.MaritalStatus)
            .Include(p => p.Religion)
            .Include(p => p.Nationality)
            .Include(p => p.Guardians)
            .Include(p => p.Insurances)
            .FirstOrDefaultAsync(p => p.PatientId == patientId);

        if (patient == null) return null;

        return new PatientDetailDto
        {
            PatientId = patient.PatientId,
            MedicalRecordNumber = patient.MedicalRecordNumber,
            FirstName = patient.FirstName,
            MiddleName = patient.MiddleName,
            LastName = patient.LastName,
            Gender = patient.Gender,
            DateOfBirth = patient.DateOfBirth,
            Age = patient.Age,
            CnicPassport = patient.CnicPassport,
            PhoneNumber = patient.PhoneNumber,
            AlternatePhone = patient.AlternatePhone,
            Email = patient.Email,
            BloodGroupId = patient.BloodGroupId,
            BloodGroupName = patient.BloodGroup?.BloodGroupName,
            MaritalStatusId = patient.MaritalStatusId,
            MaritalStatusName = patient.MaritalStatus?.StatusName,
            NationalityId = patient.NationalityId,
            CountryName = patient.Nationality?.CountryName,
            ReligionId = patient.ReligionId,
            ReligionName = patient.Religion?.ReligionName,
            Address = patient.Address,
            City = patient.City,
            Province = patient.Province,
            PostalCode = patient.PostalCode,
            EmergencyContactName = patient.EmergencyContactName,
            EmergencyContactPhone = patient.EmergencyContactPhone,
            EmergencyRelationship = patient.EmergencyRelationship,
            PatientPhoto = patient.PatientPhoto,
            RegistrationDate = patient.RegistrationDate,
            PatientStatus = patient.PatientStatus,
            Guardians = patient.Guardians.Select(g => new GuardianDto
            {
                GuardianId = g.GuardianId,
                GuardianName = g.GuardianName,
                Relationship = g.Relationship,
                PhoneNumber = g.PhoneNumber,
                Email = g.Email,
                Address = g.Address
            }).ToList(),
            Insurances = patient.Insurances.Select(ins => new InsuranceDto
            {
                PatientInsuranceId = ins.PatientInsuranceId,
                InsuranceProviderId = ins.InsuranceProviderId,
                PolicyNumber = ins.PolicyNumber,
                MemberId = ins.MemberId,
                CoverageType = ins.CoverageType,
                ValidFrom = ins.ValidFrom,
                ValidTo = ins.ValidTo,
                CoveragePercentage = ins.CoveragePercentage,
                DeductibleAmount = ins.DeductibleAmount,
                Status = ins.Status
            }).ToList()
        };
    }

    public async Task<PagedResultDto<PatientListDto>> GetPagedPatientsAsync(string search, int pageNumber, int pageSize)
    {
        var query = _context.Patients.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchClean = search.Trim().ToLower();
            query = query.Where(p =>
                p.MedicalRecordNumber.ToLower().Contains(searchClean) ||
                p.FirstName.ToLower().Contains(searchClean) ||
                (p.MiddleName != null && p.MiddleName.ToLower().Contains(searchClean)) ||
                p.LastName.ToLower().Contains(searchClean) ||
                p.PhoneNumber.Contains(searchClean) ||
                (p.CnicPassport != null && p.CnicPassport.ToLower().Contains(searchClean))
            );
        }

        var totalCount = await query.CountAsync();
        
        var items = await query
            .OrderByDescending(p => p.RegistrationDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PatientListDto
            {
                PatientId = p.PatientId,
                MedicalRecordNumber = p.MedicalRecordNumber,
                FirstName = p.FirstName,
                MiddleName = p.MiddleName,
                LastName = p.LastName,
                Gender = p.Gender,
                DateOfBirth = p.DateOfBirth,
                Age = p.Age ?? 0,
                PhoneNumber = p.PhoneNumber,
                PatientStatus = p.PatientStatus
            })
            .ToListAsync();

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        return new PagedResultDto<PatientListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalPages == 0 ? 1 : totalPages
        };
    }

    public async Task<DuplicateCheckResponse> CheckDuplicateAsync(DuplicateCheckRequest request)
    {
        var matches = new List<PatientListDto>();

        // Check 1: Match by CNIC/Passport (if provided)
        if (!string.IsNullOrWhiteSpace(request.CnicPassport))
        {
            var cleanCnic = request.CnicPassport.Trim().ToLower();
            var matchesByCnic = await _context.Patients
                .Where(p => p.CnicPassport != null && p.CnicPassport.ToLower() == cleanCnic)
                .Select(p => new PatientListDto
                {
                    PatientId = p.PatientId,
                    MedicalRecordNumber = p.MedicalRecordNumber,
                    FirstName = p.FirstName,
                    MiddleName = p.MiddleName,
                    LastName = p.LastName,
                    Gender = p.Gender,
                    DateOfBirth = p.DateOfBirth,
                    Age = p.Age ?? 0,
                    PhoneNumber = p.PhoneNumber,
                    PatientStatus = p.PatientStatus
                })
                .ToListAsync();
            matches.AddRange(matchesByCnic);
        }

        // Check 2: Match by FirstName + LastName + DOB
        var cleanFirst = request.FirstName.Trim().ToLower();
        var cleanLast = request.LastName.Trim().ToLower();
        var targetDob = DateTime.SpecifyKind(request.DateOfBirth.Date, DateTimeKind.Utc);

        var matchesByNameAndDob = await _context.Patients
            .Where(p => p.FirstName.ToLower() == cleanFirst &&
                        p.LastName.ToLower() == cleanLast &&
                        p.DateOfBirth.Date == targetDob)
            .Select(p => new PatientListDto
            {
                PatientId = p.PatientId,
                MedicalRecordNumber = p.MedicalRecordNumber,
                FirstName = p.FirstName,
                MiddleName = p.MiddleName,
                LastName = p.LastName,
                Gender = p.Gender,
                DateOfBirth = p.DateOfBirth,
                Age = p.Age ?? 0,
                PhoneNumber = p.PhoneNumber,
                PatientStatus = p.PatientStatus
            })
            .ToListAsync();

        matches.AddRange(matchesByNameAndDob);

        // De-duplicate matches list by PatientId
        var distinctMatches = matches
            .GroupBy(m => m.PatientId)
            .Select(g => g.First())
            .ToList();

        return new DuplicateCheckResponse
        {
            IsPotentialDuplicate = distinctMatches.Count > 0,
            Matches = distinctMatches
        };
    }

    #region Helper Methods

    private async Task<string> GenerateMedicalRecordNumberAsync()
    {
        var todayStr = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"MRN-{todayStr}-";

        // Fetch maximum sequence suffix registered today
        var maxSuffix = await _context.Patients
            .Where(p => p.MedicalRecordNumber.StartsWith(prefix))
            .Select(p => p.MedicalRecordNumber.Substring(prefix.Length))
            .ToListAsync();

        var nextSequenceNumber = 1;
        if (maxSuffix.Count > 0)
        {
            var maxVal = maxSuffix
                .Select(s => int.TryParse(s, out var v) ? v : 0)
                .Max();
            nextSequenceNumber = maxVal + 1;
        }

        return $"{prefix}{nextSequenceNumber:D4}";
    }

    private int CalculateAge(DateTime dateOfBirth)
    {
        var today = DateTime.UtcNow.Date;
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth.Date > today.AddYears(-age)) age--;
        return age;
    }

    #endregion
}
