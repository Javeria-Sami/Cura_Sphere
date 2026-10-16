# Multi-stage Dockerfile for CuraSphere.Api
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY CuraSphere.Domain/*.csproj CuraSphere.Domain/
COPY CuraSphere.Application/*.csproj CuraSphere.Application/
COPY CuraSphere.Infrastructure/*.csproj CuraSphere.Infrastructure/
COPY CuraSphere.Api/*.csproj CuraSphere.Api/

RUN dotnet restore CuraSphere.Api/CuraSphere.Api.csproj

# Copy full source and build
COPY . .
WORKDIR /src/CuraSphere.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Production ASP.NET Core Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "CuraSphere.Api.dll"]
