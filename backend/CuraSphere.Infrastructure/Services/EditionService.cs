using System;
using System.Collections.Generic;
using System.Linq;
using CuraSphere.Application.Common;
using CuraSphere.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace CuraSphere.Infrastructure.Services;

/// <summary>
/// Authoritative service implementing module registries and edition capability mapping.
/// </summary>
public class EditionService : IEditionService
{
    private readonly EditionSettings _settings;
    private readonly HashSet<ModuleId> _enabledModules;
    private readonly HashSet<ModuleId> _disabledModules;

    // Shared capabilities enabled across all editions
    private static readonly ModuleId[] SharedModules = new[]
    {
        ModuleId.Dashboard,
        ModuleId.Patients,
        ModuleId.Doctors,
        ModuleId.Nurses,
        ModuleId.Appointments,
        ModuleId.Opd,
        ModuleId.Emr,
        ModuleId.Diagnostics,
        ModuleId.Laboratory,
        ModuleId.Radiology,
        ModuleId.Pharmacy,
        ModuleId.Billing,
        ModuleId.Payments,
        ModuleId.Insurance,
        ModuleId.Inventory,
        ModuleId.Hr,
        ModuleId.Attendance,
        ModuleId.Reports,
        ModuleId.Notifications,
        ModuleId.Audit,
        ModuleId.Administration
    };

    // Complex inpatient and surgical capabilities exclusive to Hospital Edition
    private static readonly ModuleId[] HospitalOnlyModules = new[]
    {
        ModuleId.Ipd,
        ModuleId.Emergency,
        ModuleId.Surgery,
        ModuleId.Icu
    };

    // Planned streamlined capabilities tailored for Clinic Edition
    private static readonly ModuleId[] ClinicSpecializedModules = new[]
    {
        ModuleId.ClinicWorkspace,
        ModuleId.ClinicQueue,
        ModuleId.ClinicBilling
    };

    public EditionService(IOptions<EditionSettings> options)
    {
        _settings = options?.Value ?? new EditionSettings();
        CurrentEdition = _settings.GetEditionType();
        FacilityName = _settings.FacilityName;

        _enabledModules = new HashSet<ModuleId>(SharedModules);
        _disabledModules = new HashSet<ModuleId>();

        if (CurrentEdition == EditionType.Hospital || CurrentEdition == EditionType.Enterprise)
        {
            // Hospital has full inpatient, ER, Surgery, and ICU capabilities enabled
            foreach (var mod in HospitalOnlyModules)
            {
                _enabledModules.Add(mod);
            }
        }
        else if (CurrentEdition == EditionType.Clinic)
        {
            // In Clinic edition, hospital-only modules are disabled
            foreach (var mod in HospitalOnlyModules)
            {
                _disabledModules.Add(mod);
            }

            // Clinic specialized modules enabled
            foreach (var mod in ClinicSpecializedModules)
            {
                _enabledModules.Add(mod);
            }
        }
    }

    public EditionType CurrentEdition { get; }

    public string EditionName => CurrentEdition switch
    {
        EditionType.Hospital => "Hospital Edition",
        EditionType.Clinic => "Clinic Edition",
        EditionType.Enterprise => "Enterprise Edition",
        _ => "Hospital Edition"
    };

    public string FacilityName { get; }

    public bool IsModuleEnabled(ModuleId module)
    {
        return _enabledModules.Contains(module);
    }

    public IReadOnlyCollection<ModuleId> GetEnabledModules()
    {
        return _enabledModules.ToList().AsReadOnly();
    }

    public IReadOnlyCollection<ModuleId> GetDisabledModules()
    {
        return _disabledModules.ToList().AsReadOnly();
    }
}
