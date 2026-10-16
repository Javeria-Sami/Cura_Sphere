using System;
using System.Threading.Tasks;
using CuraSphere.Application.Common;
using CuraSphere.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace CuraSphere.Api.Filters;

/// <summary>
/// Enforces that the target controller or action is only accessible when the specified module is enabled in the active edition.
/// Returns HTTP 403 Forbidden if the module is disabled for the deployment.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public class RequireModuleAttribute : Attribute, IAsyncActionFilter
{
    public ModuleId RequiredModule { get; }

    public RequireModuleAttribute(ModuleId requiredModule)
    {
        RequiredModule = requiredModule;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var editionService = context.HttpContext.RequestServices.GetService<IEditionService>();

        if (editionService != null && !editionService.IsModuleEnabled(RequiredModule))
        {
            context.Result = new ObjectResult(new
            {
                success = false,
                error = new
                {
                    code = "EDITION_MODULE_DISABLED",
                    message = $"Module '{RequiredModule}' is not available in the current {editionService.EditionName} deployment."
                }
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        await next();
    }
}
