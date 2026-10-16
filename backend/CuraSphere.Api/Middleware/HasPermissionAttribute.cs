using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CuraSphere.Api.Middleware;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class HasPermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _permission;

    public HasPermissionAttribute(string permission)
    {
        _permission = permission;
    }

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return Task.CompletedTask;
        }

        // Check if user has the specified permission claim
        var hasPermission = user.Claims.Any(c => c.Type == "permission" && c.Value == _permission);

        if (!hasPermission)
        {
            context.Result = new ObjectResult(new {
                success = false,
                error = new {
                    code = "PERMISSION_DENIED",
                    message = $"You do not have the required permission: {_permission}"
                }
            }) { StatusCode = 403 };
        }

        return Task.CompletedTask;
    }
}
