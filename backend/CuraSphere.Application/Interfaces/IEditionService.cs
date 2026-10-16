using CuraSphere.Application.Common;
using System.Collections.Generic;

namespace CuraSphere.Application.Interfaces;

/// <summary>
/// Authoritative application service determining feature enablement per edition.
/// </summary>
public interface IEditionService
{
    /// <summary>
    /// The currently active deployment edition.
    /// </summary>
    EditionType CurrentEdition { get; }

    /// <summary>
    /// User-friendly label for the current edition.
    /// </summary>
    string EditionName { get; }

    /// <summary>
    /// Name of the deploying healthcare facility.
    /// </summary>
    string FacilityName { get; }

    /// <summary>
    /// Checks whether a specific functional module is enabled in the active edition.
    /// </summary>
    bool IsModuleEnabled(ModuleId module);

    /// <summary>
    /// Returns all modules currently enabled for this edition.
    /// </summary>
    IReadOnlyCollection<ModuleId> GetEnabledModules();

    /// <summary>
    /// Returns all modules disabled in this edition.
    /// </summary>
    IReadOnlyCollection<ModuleId> GetDisabledModules();
}
