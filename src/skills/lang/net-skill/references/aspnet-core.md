# ASP.NET Core Development

Comprehensive guide to ASP.NET Core covering Minimal APIs, Controllers, Middleware, Authentication, CORS, Rate Limiting, Health Checks, and OpenAPI. Examples target .NET 10 (latest), with notable differences from .NET 8 and .NET 9 highlighted.

---

## Minimal APIs

### Basic Endpoint Setup

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddValidation();
builder.Services.AddOpenApi();
builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseHttpsRedirection();

app.MapGet("/", () =>
    TypedResults.Ok(new
    {
        message = "Hello ASP.NET Core",
        framework = ".NET 10",
        timestamp = DateTime.UtcNow
    }))
    .WithName("GetRoot")
    .WithTags("System");

app.MapGet("/health", () =>
    TypedResults.Ok(new
    {
        status = "healthy",
        uptime = Environment.TickCount64,
        timestamp = DateTime.UtcNow
    }))
    .WithName("GetHealth")
    .WithTags("System");

app.Run();
```

### Endpoint Groups

```csharp
public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .ProducesValidationProblem();

        group.MapGet("/", GetAllUsers);
        group.MapGet("/{id:guid}", GetUserById);
        group.MapPost("/", CreateUser);
        group.MapPut("/{id:guid}", UpdateUser);
        group.MapDelete("/{id:guid}", DeleteUser)
            .RequireAuthorization("Admin");

        return group;
    }

    private static async Task<Ok<IReadOnlyList<UserDto>>> GetAllUsers(
        IUserService service,
        CancellationToken ct)
    {
        var users = await service.GetAllAsync(ct);
        return TypedResults.Ok(users);
    }

    private static async Task<Results<Ok<UserDto>, NotFound>> GetUserById(
        Guid id,
        IUserService service,
        CancellationToken ct)
    {
        var user = await service.GetByIdAsync(id, ct);
        return user is not null
            ? TypedResults.Ok(user)
            : TypedResults.NotFound();
    }

    private static async Task<Results<Created<UserDto>, ValidationProblem>> CreateUser(
        CreateUserRequest request,
        IUserService service,
        CancellationToken ct)
    {
        var user = await service.CreateAsync(request, ct);
        return TypedResults.Created($"/api/users/{user.Id}", user);
    }

    private static async Task<Results<NoContent, NotFound>> UpdateUser(
        Guid id,
        UpdateUserRequest request,
        IUserService service,
        CancellationToken ct)
    {
        var updated = await service.UpdateAsync(id, request, ct);
        return updated ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Results<NoContent, NotFound>> DeleteUser(
        Guid id,
        IUserService service,
        CancellationToken ct)
    {
        var deleted = await service.DeleteAsync(id, ct);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}
```

### Request Binding

```csharp
// Route binding
app.MapGet("/users/{id:guid}", (Guid id) => TypedResults.Ok(new { id }));

// Query string binding
app.MapGet("/search", (string? q, int page = 1, int pageSize = 20) =>
    TypedResults.Ok(new { q, page, pageSize }));

// Header binding
app.MapGet("/headers", (
    [FromHeader(Name = "X-Request-Id")] string? requestId) =>
    TypedResults.Ok(new { requestId }));

// Body binding
app.MapPost("/users", (CreateUserRequest request) =>
    TypedResults.Ok(request));

// Mixed binding with services
app.MapGet("/profile/{id:guid}", (
    Guid id,
    [FromQuery] bool includePermissions,
    [FromHeader(Name = "X-Tenant-Id")] string? tenantId,
    [FromServices] IUserService service,
    CancellationToken ct) =>
    service.GetProfileAsync(id, includePermissions, tenantId, ct));
```

### Typed Results and Problem Details

```csharp
app.MapGet("/api/users/{id:guid}", async Task<Results<Ok<UserDto>, NotFound>> (
    Guid id,
    IUserService service,
    CancellationToken ct) =>
{
    var user = await service.GetByIdAsync(id, ct);
    return user is not null
        ? TypedResults.Ok(user)
        : TypedResults.NotFound();
});

app.MapPost("/api/users", async Task<Results<Created<UserDto>, ValidationProblem>> (
    CreateUserRequest request,
    IUserService service,
    CancellationToken ct) =>
{
    var user = await service.CreateAsync(request, ct);
    return TypedResults.Created($"/api/users/{user.Id}", user);
});

app.MapGet("/api/failure", () =>
    TypedResults.InternalServerError(new ProblemDetails
    {
        Title = "Unexpected server error",
        Detail = "A downstream dependency failed.",
        Status = StatusCodes.Status500InternalServerError
    }));
```

### Built-in Validation (.NET 10)

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddValidation();

var app = builder.Build();

app.MapPost("/products", (CreateProductRequest request) =>
    TypedResults.Created($"/products/{request.Sku}", request));

app.Run();

public sealed record CreateProductRequest(
    [Required] string Sku,
    [Required, StringLength(120)] string Name,
    [Range(1, 10000)] int Quantity);
```

In .NET 10, Minimal APIs automatically validate request body, query, and header inputs that use `DataAnnotations`. When validation fails, ASP.NET Core returns a `400 Bad Request` response. Register `IProblemDetailsService` behavior with `AddProblemDetails()` for consistent validation payloads.

### Built-in OpenAPI

```csharp
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi("public");
builder.Services.AddOpenApi("internal", options =>
{
    options.OpenApiVersion = OpenApiSpecVersion.OpenApi3_1;
    options.ShouldInclude = description =>
        description.GroupName is null || description.GroupName == "internal";
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/{documentName}.json");
    app.MapOpenApi("/openapi/{documentName}.yaml");
}

app.MapGet("/public/ping", () => "pong")
    .WithGroupName("public");

app.MapGet("/internal/ping", () => "pong")
    .WithGroupName("internal");

app.Run();
```

ASP.NET Core 10 generates OpenAPI 3.1 documents by default, supports JSON Schema draft 2020-12, can expose YAML at runtime, and supports build-time document generation through `Microsoft.Extensions.ApiDescription.Server`.

### JSON and `PipeReader` in .NET 10

Starting in .NET 10, ASP.NET Core uses `PipeReader`-based JSON deserialization in Minimal APIs, MVC, and `HttpRequestJsonExtensions`. Most apps get better performance automatically, but custom `JsonConverter` implementations may need to handle `Utf8JsonReader.HasValueSequence` correctly.

```csharp
public override T? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
{
    var span = reader.HasValueSequence
        ? reader.ValueSequence.ToArray()
        : reader.ValueSpan;

    // Continue parsing using span
}
```

If you need a temporary compatibility workaround, set the `Microsoft.AspNetCore.UseStreamBasedJsonParsing` AppContext switch to `true` while updating your converter.

---

## Controllers

### Base Controller Setup

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController(IUserService userService, ILogger<UsersController> logger)
    : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<UserDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UserDto>>> GetAll(CancellationToken ct)
    {
        var users = await userService.GetAllAsync(ct);
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetById(Guid id, CancellationToken ct)
    {
        var user = await userService.GetByIdAsync(id, ct);
        if (user is null)
        {
            logger.LogWarning("User {UserId} was not found", id);
            return NotFound();
        }

        return Ok(user);
    }

    [HttpPost]
    [ProducesResponseType<UserDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> Create(
        [FromBody] CreateUserRequest request,
        CancellationToken ct)
    {
        var user = await userService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateUserRequest request,
        CancellationToken ct)
    {
        var updated = await service.UpdateAsync(id, request, ct);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var deleted = await service.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
```

### Model Validation

```csharp
public class CreateUserRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
        ErrorMessage = "Password must contain uppercase, lowercase, and digit")]
    public string Password { get; set; } = string.Empty;

    [FutureDate]
    public DateTime? TrialEndsAtUtc { get; set; }
}

public sealed class FutureDateAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is DateTime date && date <= DateTime.UtcNow)
        {
            return new ValidationResult("Date must be in the future.");
        }

        return ValidationResult.Success;
    }
}
```

---

## Middleware

### Custom Middleware

```csharp
public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        context.Items["RequestId"] = requestId;

        logger.LogInformation(
            "Request {RequestId}: {Method} {Path}",
            requestId,
            context.Request.Method,
            context.Request.Path);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            await next(context);
        }
        finally
        {
            stopwatch.Stop();
            logger.LogInformation(
                "Response {RequestId}: {StatusCode} in {ElapsedMs} ms",
                requestId,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
    }
}

public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder app)
        => app.UseMiddleware<RequestLoggingMiddleware>();
}

// Program.cs
app.UseRequestLogging();
```

### Exception Handling and Problem Details

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.MapGet("/exception", () =>
{
    throw new InvalidOperationException("Sample exception.");
});

app.Run();
```

For more control, use `IProblemDetailsService` inside a custom exception pipeline:

```csharp
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var problemDetailsService = context.RequestServices.GetRequiredService<IProblemDetailsService>();

        if (!await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails
            {
                Title = "An unexpected error occurred.",
                Status = StatusCodes.Status500InternalServerError
            }
        }))
        {
            await context.Response.WriteAsync("Fallback: An error occurred.");
        }
    });
});
```

### Static Asset Delivery (.NET 9+)

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();

app.MapStaticAssets();
app.MapRazorPages();

app.Run();
```

`MapStaticAssets()` is new in ASP.NET Core 9 and optimizes known static assets using build and publish-time metadata. It remains the preferred endpoint-based static asset approach for modern ASP.NET Core apps.

### Middleware Order

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler();
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("Api");
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();
app.UseRateLimiter();

app.MapStaticAssets();
app.MapControllers();
app.MapHealthChecks("/healthz");
```

Important ordering rules:

- `UseCors` must run before `UseAuthorization` and before `UseResponseCaching`.
- `UseRateLimiter` must run after `UseRouting` when endpoint-specific rate limiting is used.
- Exception handling should run early so it can wrap the rest of the pipeline.

---

## Authentication

### JWT Bearer Authentication

```csharp
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Jwt:Authority"];
        options.Audience = builder.Configuration["Jwt:Audience"];
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero,
            ValidIssuers = builder.Configuration.GetSection("Jwt:ValidIssuers").Get<string[]>(),
            ValidAudiences = builder.Configuration.GetSection("Jwt:ValidAudiences").Get<string[]>()
        };
    });

builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());
```

JWT bearer validation should verify signature, issuer, audience, and expiration. The API should return `401` for invalid or missing tokens and `403` when the caller is authenticated but lacks permission.

### Token Generation Service

```csharp
public sealed class JwtTokenService(IConfiguration configuration)
{
    public string GenerateToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));

        var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("permissions", string.Join(',', user.Permissions))
        };

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}
```

For production systems, official guidance recommends using OIDC or OAuth standards for access token acquisition instead of rolling your own production token issuance flow.

### Authorization Policies

```csharp
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("Admin", policy => policy.RequireRole("Admin"))
    .AddPolicy("AdminOrManager", policy => policy.RequireRole("Admin", "Manager"))
    .AddPolicy("CanEdit", policy => policy.RequireClaim("permissions", "edit"))
    .AddPolicy("CanDelete", policy => policy.RequireClaim("permissions", "delete"))
    .AddPolicy("MinimumAge", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
```

### Custom Authorization Handler

```csharp
public sealed class MinimumAgeRequirement(int age) : IAuthorizationRequirement
{
    public int MinimumAge { get; } = age;
}

public sealed class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumAgeRequirement requirement)
    {
        var birthDateClaim = context.User.FindFirst("birthdate");

        if (birthDateClaim is null)
        {
            return Task.CompletedTask;
        }

        if (DateTime.TryParse(birthDateClaim.Value, out var birthDate))
        {
            var age = DateTime.Today.Year - birthDate.Year;
            if (birthDate.Date > DateTime.Today.AddYears(-age))
            {
                age--;
            }

            if (age >= requirement.MinimumAge)
            {
                context.Succeed(requirement);
            }
        }

        return Task.CompletedTask;
    }
}

builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();
```

### OpenID Connect Enhancements (.NET 9+)

```csharp
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie()
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = builder.Configuration["Oidc:Authority"];
        options.ClientId = builder.Configuration["Oidc:ClientId"];
        options.ClientSecret = builder.Configuration["Oidc:ClientSecret"];
        options.ResponseType = OpenIdConnectResponseType.Code;
        options.SaveTokens = true;

        options.PushedAuthorizationBehavior = PushedAuthorizationBehavior.UseIfAvailable;
        options.AdditionalAuthorizationParameters.Add("prompt", "login");
        options.AdditionalAuthorizationParameters.Add("audience", "https://api.contoso.com");
    });
```

ASP.NET Core 9 adds support for PAR (Pushed Authorization Requests) and a simpler `AdditionalAuthorizationParameters` API for OIDC/OAuth challenge customization.

### Recommended Token Guidance (.NET 10)

Official ASP.NET Core 10 guidance highlights these practices:

- prefer delegated user access tokens when a user is involved
- avoid using ID tokens to call APIs
- avoid creating access tokens from username and password requests
- prefer standards-based flows such as OIDC authorization code with PKCE or OAuth client credentials
- consider sender-constrained tokens such as DPoP or MTLS for stronger token protection

---

## CORS Configuration

```csharp
const string ApiCorsPolicy = "ApiCors";

builder.Services.AddCors(options =>
{
    options.AddPolicy(ApiCorsPolicy, policy =>
    {
        policy.WithOrigins("https://app.contoso.com", "https://admin.contoso.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });

    options.AddPolicy("WildcardSubdomains", policy =>
    {
        policy.WithOrigins("https://*.contoso.com")
              .SetIsOriginAllowedToAllowWildcardSubdomains()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

app.UseRouting();
app.UseCors(ApiCorsPolicy);
app.UseAuthorization();
```

You can also apply CORS per endpoint:

```csharp
app.MapGet("/api/public-data", () => TypedResults.Ok(new { value = 42 }))
    .RequireCors(ApiCorsPolicy);
```

Notes:

- `UseCors` must run after `UseRouting` and before `UseAuthorization`.
- When using response caching, call `UseCors` before `UseResponseCaching`.
- Avoid combining `AllowAnyOrigin()` with `AllowCredentials()`.
- If static files must be served cross-origin, call `UseCors` before `UseStaticFiles`.

---

## Rate Limiting

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name
                ?? httpContext.Connection.RemoteIpAddress?.ToString()
                ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddTokenBucketLimiter("api", limiterOptions =>
    {
        limiterOptions.TokenLimit = 50;
        limiterOptions.TokensPerPeriod = 10;
        limiterOptions.ReplenishmentPeriod = TimeSpan.FromSeconds(5);
        limiterOptions.QueueLimit = 5;
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.AutoReplenishment = true;
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                ((int)retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
        }

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Too many requests",
            traceId = context.HttpContext.TraceIdentifier
        }, cancellationToken);
    };
});
```

```csharp
app.UseRouting();
app.UseRateLimiter();

app.MapGroup("/api")
    .RequireRateLimiting("api")
    .MapGet("/orders", () => TypedResults.Ok(new[] { "A-100", "A-101" }));
```

### Partitioned and Chained Limiters (.NET 10)

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.CreateChained(
        PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Request.Headers.UserAgent.ToString(),
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 4,
                    Window = TimeSpan.FromSeconds(2),
                    AutoReplenishment = true
                })),
        PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Request.Headers.UserAgent.ToString(),
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromSeconds(30),
                    AutoReplenishment = true
                })));
});
```

Useful built-in strategies:

- Fixed window limiter
- Sliding window limiter
- Token bucket limiter
- Concurrency limiter
- Partitioned limiters by identity, IP, API key, or path
- Chained limiters via `PartitionedRateLimiter.CreateChained(...)`

Attributes can also be used for MVC, Razor Pages, and routable components:

- `[EnableRateLimiting("policy-name")]`
- `[DisableRateLimiting]`

---

## Health Checks

### Basic Health Check Setup

```csharp
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy())
    .AddDbContextCheck<AppDbContext>(tags: new[] { "ready" });

app.MapHealthChecks("/healthz");
```

### Readiness and Liveness Probes

```csharp
builder.Services.AddHealthChecks()
    .AddCheck<StartupHealthCheck>("startup", tags: new[] { "ready" });

app.MapHealthChecks("/healthz/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/healthz/live", new HealthCheckOptions
{
    Predicate = _ => false
});
```

### Custom JSON Response Writer

```csharp
app.MapHealthChecks("/healthz/details", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";

        var result = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                duration = entry.Value.Duration.TotalMilliseconds
            })
        };

        await context.Response.WriteAsJsonAsync(result);
    }
});
```

### Endpoint Security and Routing

```csharp
app.MapHealthChecks("/healthz")
    .RequireAuthorization();

app.MapHealthChecks("/healthz/management")
    .RequireHost("*:5001")
    .ShortCircuit();
```

`MapHealthChecks(...)` works well with endpoint-aware middleware and gives better control than `UseHealthChecks(...)` for most modern applications. ASP.NET Core 10 docs also highlight `RequireCors`, `RequireHost`, `RequireAuthorization`, and publisher-based health reporting with `IHealthCheckPublisher`.

---

## Version-Specific Highlights

### .NET 8

- Minimal APIs with typed results and endpoint groups
- Built-in OpenAPI support via `AddOpenApi()` and `WithOpenApi()`
- Problem Details integration for error responses
- Rate limiting middleware with `AddRateLimiter()`
- JWT bearer authentication with `JwtBearerDefaults`

### .NET 9

- `MapStaticAssets()` for optimized static asset delivery
- `IProblemDetailsService` for customizable problem details
- PAR (Pushed Authorization Requests) support for OIDC
- `AdditionalAuthorizationParameters` API for OIDC/OAuth
- OpenAPI YAML support at runtime
- Improved CORS with `SetPreflightMaxAge()`
- Health check `ShortCircuit()` method

### .NET 10

- `PipeReader`-based JSON deserialization for better performance
- OpenAPI 3.1 with JSON Schema draft 2020-12 support
- Built-in validation for Minimal APIs via `AddValidation()`
- `PartitionedRateLimiter.CreateChained()` for combined limiters
- `[EnableRateLimiting]` and `[DisableRateLimiting]` attributes
- Recommended token guidance emphasizing OIDC/OAuth standards
- `Microsoft.AspNetCore.UseStreamBasedJsonParsing` AppContext switch for compatibility

---

## Migration Guide

### From Controllers to Minimal APIs

```csharp
// Before (Controller)
[HttpPost("/users")]
public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
{
    var user = await _service.CreateAsync(request);
    return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
}

// After (Minimal API)
app.MapPost("/users", async Task<Results<Created<UserDto>, ValidationProblem>> (
    CreateUserRequest request,
    IUserService service,
    CancellationToken ct) =>
{
    var user = await service.CreateAsync(request, ct);
    return TypedResults.Created($"/users/{user.Id}", user);
});
```

### Adding Validation (.NET 10)

```csharp
// Program.cs
builder.Services.AddValidation();

// Endpoint with automatic validation
app.MapPost("/products", (CreateProductRequest request) =>
    TypedResults.Created($"/products/{request.Sku}", request));
```

### Enabling OpenAPI

```csharp
// Program.cs
builder.Services.AddOpenApi();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
```

### Configuring Rate Limiting

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
});

app.UseRateLimiter();
```

---

## References

- What's new in ASP.NET Core in .NET 10  
  https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0
- Minimal APIs quick reference  
  https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis
- Generate OpenAPI documents  
  https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi
- Handle requests with controllers in ASP.NET Core MVC  
  https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/actions
- ASP.NET Core Middleware  
  https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/
- Handle errors in ASP.NET Core APIs  
  https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api
- Configure JWT bearer authentication in ASP.NET Core  
  https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication
- Enable Cross-Origin Requests (CORS) in ASP.NET Core  
  https://learn.microsoft.com/en-us/aspnet/core/security/cors
- Rate limiting middleware in ASP.NET Core  
  https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit
- Health checks in ASP.NET Core  
  https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks

---

Version: 5.0.0
Last Updated: 2026-03-20
