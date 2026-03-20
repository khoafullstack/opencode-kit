---
name: net-skill
description: C# / .NET development specialist covering ASP.NET Core, Entity Framework, Blazor, and modern C# patterns. Use when developing .NET APIs, web applications, or enterprise solutions.
---

# C# / .NET Development Specialist

Modern C# development with ASP.NET Core, Entity Framework Core, Blazor, and enterprise patterns.

## Quick Reference

Auto-Triggers: `.cs`, `.csproj`, `.sln` files, C# projects, .NET solutions, ASP.NET Core applications

Quick Commands:

To create a new .NET Web API project, run dotnet new webapi with -n flag for project name and --framework net8.0 or net9.0 or net10.0.

To create a Blazor Web App, run dotnet new blazor with -n flag for project name and --interactivity Auto.

To add Entity Framework Core, run dotnet add package Microsoft.EntityFrameworkCore.SqlServer followed by Microsoft.EntityFrameworkCore.Design.

To add FluentValidation and MediatR, run dotnet add package FluentValidation.AspNetCore and dotnet add package MediatR.

---

## Module Index

This skill uses progressive disclosure with specialized modules for deep coverage:

### Language Features

- [C# 12 Features](references/csharp12-features.md) - Primary constructors, collection expressions, type aliases, default lambdas
- [C# 13 Features](references/csharp13-features.md) - params collections, System.Threading.Lock, escape sequence \e, partial properties/indexers
- [C# 14 Features](references/csharp14-features.md) - Extension members, null-conditional assignment, field keyword, partial events/constructors

> **Note:** Newer C# versions are backward compatible — code targeting a higher C# version can use features from all previous versions.

### Web Development

- [ASP.NET Core](references/aspnet-core.md) - Minimal API, Controllers, Middleware, Authentication
- [Blazor Components](references/blazor-components.md) - Server, WASM, InteractiveServer, Components

### Data Access

- [Entity Framework Core](references/efcore-patterns.md) - DbContext, Repository pattern, Migrations, Query optimization

### Architecture Patterns

- [CQRS and Validation](references/cqrs-validation.md) - MediatR CQRS, FluentValidation, Handler patterns

---

## Implementation Quick Start

### Project Structure (Clean Architecture)

Organize projects in a src folder with four main projects. MyApp.Api contains the ASP.NET Core Web API layer with Controllers folder for API Controllers, Endpoints folder for Minimal API endpoints, and Program.cs as the application entry point. MyApp.Application contains business logic including Commands folder for CQRS Commands, Queries folder for CQRS Queries, and Validators folder for FluentValidation. MyApp.Domain contains domain entities including Entities folder for domain models and Interfaces folder for repository interfaces. MyApp.Infrastructure contains data access including Data folder for DbContext and Repositories folder for repository implementations.

### Essential Patterns

Primary Constructor with DI: Define a public class UserService with constructor parameters for IUserRepository and ILogger of UserService. Create async methods like GetByIdAsync that take Guid id, log information using the logger with structured logging for UserId, and return the result from repository.FindByIdAsync.

Minimal API Endpoint: Use app.MapGet with route pattern like "/api/users/{id:guid}" and an async lambda taking Guid id and IUserService. Call the service method, check for null result, and return Results.Ok for found entities or Results.NotFound otherwise. Chain WithName for route naming and WithOpenApi for OpenAPI documentation.

Entity Configuration: Create a class implementing IEntityTypeConfiguration of your entity type. In the Configure method taking EntityTypeBuilder, call HasKey to set the primary key, use Property to configure fields with HasMaxLength and IsRequired, and use HasIndex with IsUnique for unique constraints.

## Quick Troubleshooting

Build and Runtime: Run dotnet build with --verbosity detailed for detailed output. Run dotnet run with --launch-profile https for HTTPS profile. Run dotnet ef database update to apply EF migrations. Run dotnet ef migrations add with migration name to create new migrations.

Common Patterns:

For null reference handling, use ArgumentNullException.ThrowIfNull with the variable and nameof expression after fetching from context.

For async enumerable streaming, create async methods returning IAsyncEnumerable of your type. Add EnumeratorCancellation attribute to the CancellationToken parameter. Use await foreach with AsAsyncEnumerable and WithCancellation to iterate, yielding each item.
