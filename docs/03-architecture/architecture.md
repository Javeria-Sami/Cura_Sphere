# System Architecture

Browser
-> React + TypeScript
-> TanStack Query / Zustand
-> ASP.NET Core Web API
-> Application Services
-> Domain Rules
-> EF Core
-> PostgreSQL

Real-time:
Database commit -> event -> SignalR -> clients -> cache update -> UI

Rules:
1. Frontend never accesses PostgreSQL.
2. Backend owns business rules.
3. Database is source of truth.
4. Sensitive operations require authorization and audit.
