using System;
using System.Collections.Generic;
using System.Linq;

namespace CuraSphere.Infrastructure.Services.Clinical;

public class CdssInteractionAlert
{
    public string DrugA { get; set; } = string.Empty;
    public string DrugB { get; set; } = string.Empty;
    public string Severity { get; set; } = "High"; // High, Moderate, Low
    public string Description { get; set; } = string.Empty;
}

public class CdssLabValueAlert
{
    public string TestName { get; set; } = string.Empty;
    public double ObservedValue { get; set; }
    public string ReferenceRange { get; set; } = string.Empty;
    public string AlertMessage { get; set; } = string.Empty;
}

public class CdssRuleEngine
{
    private static readonly Dictionary<string, List<string>> KnownInteractions = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Warfarin", new List<string> { "Aspirin", "Ibuprofen", "Ciprofloxacin" } },
        { "Aspirin", new List<string> { "Warfarin", "Heparin", "Ibuprofen" } },
        { "Metformin", new List<string> { "Contrast Medium", "Cimetidine" } },
        { "Lisinopril", new List<string> { "Spironolactone", "Potassium" } }
    };

    public List<CdssInteractionAlert> CheckDrugInteractions(IEnumerable<string> medications)
    {
        var alerts = new List<CdssInteractionAlert>();
        var medList = medications.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        for (int i = 0; i < medList.Count; i++)
        {
            for (int j = i + 1; j < medList.Count; j++)
            {
                string medA = medList[i];
                string medB = medList[j];

                if (KnownInteractions.TryGetValue(medA, out var interactiveMeds) &&
                    interactiveMeds.Contains(medB, StringComparer.OrdinalIgnoreCase))
                {
                    alerts.Add(new CdssInteractionAlert
                    {
                        DrugA = medA,
                        DrugB = medB,
                        Severity = "High",
                        Description = $"Potential severe interaction detected between {medA} and {medB}. Increased risk of adverse events."
                    });
                }
            }
        }

        return alerts;
    }

    public CdssLabValueAlert? CheckCriticalLabThreshold(string testName, double value)
    {
        if (testName.Equals("Potassium", StringComparison.OrdinalIgnoreCase))
        {
            if (value > 6.0)
            {
                return new CdssLabValueAlert
                {
                    TestName = testName,
                    ObservedValue = value,
                    ReferenceRange = "3.5 - 5.0 mEq/L",
                    AlertMessage = "CRITICAL HYPERKALEMIA ALERT: Patient potassium level exceeds 6.0 mEq/L. Risk of cardiac arrhythmia."
                };
            }
            if (value < 2.8)
            {
                return new CdssLabValueAlert
                {
                    TestName = testName,
                    ObservedValue = value,
                    ReferenceRange = "3.5 - 5.0 mEq/L",
                    AlertMessage = "CRITICAL HYPOKALEMIA ALERT: Patient potassium level below 2.8 mEq/L."
                };
            }
        }
        else if (testName.Equals("Glucose", StringComparison.OrdinalIgnoreCase))
        {
            if (value < 40.0)
            {
                return new CdssLabValueAlert
                {
                    TestName = testName,
                    ObservedValue = value,
                    ReferenceRange = "70 - 140 mg/dL",
                    AlertMessage = "CRITICAL HYPOGLYCEMIA ALERT: Patient blood glucose below 40 mg/dL."
                };
            }
        }

        return null;
    }
}
