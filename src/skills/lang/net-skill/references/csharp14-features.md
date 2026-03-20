# C# 14 Language Features

Comprehensive guide to C# 14 features for .NET 10+ development.

---

## Extension Members

C# 14 introduces `extension` blocks, a new syntax for declaring extension members. In addition to extension methods, you can now create extension properties and static extension members.

### Basic Extension Block

```csharp
public static class StringExtensions
{
    extension(string value)
    {
        public bool IsBlank => string.IsNullOrWhiteSpace(value);

        public string ReverseText()
        {
            var chars = value.ToCharArray();
            Array.Reverse(chars);
            return new string(chars);
        }
    }
}

Console.WriteLine("  ".IsBlank);           // True
Console.WriteLine("OpenCode".ReverseText()); // edoCnepO
```

### Static Extension Members

```csharp
public static class SequenceExtensions
{
    extension<T>(IEnumerable<T>)
    {
        public static IEnumerable<T> Empty => [];

        public static IEnumerable<T> Combine(IEnumerable<T> first, IEnumerable<T> second)
            => first.Concat(second);
    }
}

var values = IEnumerable<int>.Combine([1, 2], [3, 4]);
Console.WriteLine(string.Join(", ", values));
```

### Extension Operator Example

```csharp
public static class SequenceMath
{
    extension(IEnumerable<int>)
    {
        public static IEnumerable<int> operator +(IEnumerable<int> left, IEnumerable<int> right)
            => left.Concat(right);
    }
}

var merged = new[] { 1, 2, 3 } + new[] { 4, 5, 6 };
Console.WriteLine(string.Join(", ", merged));
```

---

## Null-Conditional Assignment

The null-conditional operators `?.` and `?[]` can now be used on the left side of assignments and compound assignments.

### Basic Property Assignment

```csharp
public sealed class Customer
{
    public Order? CurrentOrder { get; set; }
}

public sealed record Order(Guid Id, decimal Total);

Customer? customer = GetCustomer();
customer?.CurrentOrder = new Order(Guid.NewGuid(), 149.99m);
```

### Indexed Assignment

```csharp
string[]? messages = GetMessages();
messages?[0] = "Application started";
messages?[^1] = "Application finished";
```

### Compound Assignment

```csharp
public sealed class Metrics
{
    public int RequestCount { get; set; }
}

Metrics? metrics = GetMetrics();
metrics?.RequestCount += 1;
```

### Right Side Is Evaluated Conditionally

```csharp
UserProfile? profile = FindProfile();
profile?.LastLoginAt = GetCurrentTimestamp();

static DateTime GetCurrentTimestamp()
{
    Console.WriteLine("Timestamp generated");
    return DateTime.UtcNow;
}
```

---

## `nameof` Supports Unbound Generic Types

Beginning with C# 14, `nameof` can reference unbound generic types such as `List<>`.

### Basic Usage

```csharp
Console.WriteLine(nameof(List<>));         // List
Console.WriteLine(nameof(Dictionary<,>));  // Dictionary
```

### Diagnostic Messages

```csharp
throw new InvalidOperationException(
    $"Type {nameof(Dictionary<,>)} requires both key and value type arguments.");
```

### Generic Helper Scenarios

```csharp
public static class TypeNames
{
    public static string GetCollectionName() => nameof(List<>);
    public static string GetMapName() => nameof(Dictionary<,>);
}
```

---

## More Implicit Conversions for `Span<T>` and `ReadOnlySpan<T>`

C# 14 expands the language support for span types. The compiler now understands more implicit span conversions and allows them in more natural scenarios, including extension member receivers and generic inference.

### Array to Span

```csharp
int[] numbers = [1, 2, 3, 4, 5];

Span<int> writable = numbers;
ReadOnlySpan<int> readonlyValues = numbers;
```

### String to `ReadOnlySpan<char>`

```csharp
ReadOnlySpan<char> command = "build --watch";
Console.WriteLine(command[..5].ToString()); // build
```

### Span to ReadOnlySpan

```csharp
Span<byte> buffer = stackalloc byte[] { 1, 2, 3, 4 };
ReadOnlySpan<byte> readonlyBuffer = buffer;
Console.WriteLine(readonlyBuffer[0]);
```

### Extension Receiver Example

```csharp
public static class SpanExtensions
{
    extension(ReadOnlySpan<char> value)
    {
        public bool HasPrefix(string prefix) => value.StartsWith(prefix, StringComparison.Ordinal);
    }
}

Console.WriteLine("opencode".HasPrefix("open"));
```

---

## Modifiers on Simple Lambda Parameters

You can now use parameter modifiers such as `ref`, `out`, `in`, `scoped`, and `ref readonly` on simple lambda parameters without explicitly writing parameter types.

### `out` Parameter Without Explicit Types

```csharp
delegate bool TryConvert<T>(string text, out T result);

TryConvert<int> parseInt = (text, out result) => int.TryParse(text, out result);

if (parseInt("42", out var number))
{
    Console.WriteLine(number);
}
```

### `ref` Parameter Example

```csharp
delegate void Adjust(ref int value);

Adjust increment = (ref value) => value += 10;

var score = 5;
increment(ref score);
Console.WriteLine(score); // 15
```

### `scoped` Parameter Example

```csharp
delegate int CountCharacters(scoped ReadOnlySpan<char> value);

CountCharacters count = (scoped value) => value.Length;
Console.WriteLine(count("OpenCode".AsSpan()));
```

---

## `field` Backed Properties

The `field` keyword is now a standard C# 14 feature, allowing property accessors to use the compiler-generated backing field without declaring one manually.

### Basic Validation

```csharp
public class ApiOptions
{
    public string BaseUrl
    {
        get;
        set => field = Uri.IsWellFormedUriString(value, UriKind.Absolute)
            ? value
            : throw new ArgumentException("BaseUrl must be an absolute URI.", nameof(value));
    } = "https://localhost";
}
```

### Normalization Logic

```csharp
public class UserSettings
{
    public string DisplayName
    {
        get;
        set => field = value.Trim();
    } = string.Empty;
}
```

### Name Collision Example

```csharp
public class Sample
{
    private string field = "legacy field";

    public string Value
    {
        get => @field;
        set => field = value;
    }
}
```

---

## Partial Events and Constructors

C# 14 expands partial members to include instance constructors and events.

### Partial Constructor

```csharp
public partial class ConnectionSettings
{
    public partial ConnectionSettings(string connectionString);
}

public partial class ConnectionSettings
{
    public string ConnectionString { get; }

    public partial ConnectionSettings(string connectionString)
    {
        ConnectionString = connectionString;
    }
}
```

### Partial Constructor with Initializer on Implementation

```csharp
public partial class AuditEntry
{
    public partial AuditEntry(string action);
}

public partial class AuditEntry : BaseEntry
{
    public string Action { get; }

    public partial AuditEntry(string action) : base(DateTime.UtcNow)
    {
        Action = action;
    }
}

public abstract class BaseEntry(DateTime createdAt)
{
    public DateTime CreatedAt { get; } = createdAt;
}
```

### Partial Event

```csharp
public partial class FileWatcher
{
    public partial event EventHandler<FileChangedEventArgs>? FileChanged;
}

public partial class FileWatcher
{
    private EventHandler<FileChangedEventArgs>? _fileChanged;

    public partial event EventHandler<FileChangedEventArgs>? FileChanged
    {
        add => _fileChanged += value;
        remove => _fileChanged -= value;
    }

    public void Raise(string path) => _fileChanged?.Invoke(this, new FileChangedEventArgs(path));
}

public sealed class FileChangedEventArgs(string path) : EventArgs
{
    public string Path { get; } = path;
}
```

---

## User-Defined Compound Assignment Operators

C# 14 allows user-defined types to implement compound assignment operators such as `+=`, `-=`, `*=`, and related operators directly.

### Basic `+=` Operator

```csharp
public sealed class Counter
{
    public int Value { get; private set; }

    public void operator +=(int amount)
    {
        Value += amount;
    }
}

var counter = new Counter();
counter += 5;
```

### In-Place Mutation for Performance

```csharp
public sealed class VectorBuffer
{
    private readonly float[] _values;

    public VectorBuffer(params float[] values) => _values = values;

    public void operator +=(VectorBuffer other)
    {
        for (var i = 0; i < _values.Length; i++)
        {
            _values[i] += other._values[i];
        }
    }
}
```

### Relationship to Regular Operators

```csharp
public struct Points
{
    public int Value { get; private set; }

    public static Points operator +(Points left, int right)
        => new() { Value = left.Value + right };

    public void operator +=(int right)
    {
        Value += right;
    }
}
```

---

## File-Based App Preprocessor Directives

C# 14 adds support for new preprocessor directives used by file-based apps. These directives are interpreted by the build system rather than the C# compiler.

### Shebang for Direct Execution

```csharp
#!/usr/bin/env dotnet run
Console.WriteLine("Hello from a file-based app");
```

### Package and Property Directives

```csharp
#:package Humanizer@2.14.1
#:property TargetFramework=net10.0
#:property PublishAot=false

using Humanizer;

Console.WriteLine("open code plugin".Titleize());
```

### SDK and Project References

```csharp
#:sdk Microsoft.NET.Sdk.Web
#:project ../Shared/Shared.csproj

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello from file-based ASP.NET Core");
app.Run();
```

---

## Best Practices

### When to Use Extension Members

Good Use Cases:
- Grouping related extension methods and properties for a type
- Adding discoverable APIs to third-party or BCL types
- Exposing static helper members that conceptually belong to the extended type

Avoid When:
- The API would be clearer as a normal static utility class
- Extensions would hide important side effects or expensive work
- Multiple competing extensions create discoverability conflicts

### When to Use Null-Conditional Assignment

Good Use Cases:
- Optional object graphs in application and UI code
- Simplifying repetitive null checks around simple assignments
- Assignments where the right side should only execute if the receiver exists

Avoid When:
- The null case should be logged, handled, or treated as an error
- The assignment logic is complex enough to deserve an explicit `if`
- The shorter syntax would obscure important control flow

### `field` Keyword Guidance

Good Use Cases:
- Lightweight validation or normalization in property setters
- Replacing trivial backing fields with direct accessor logic
- DTOs, settings objects, and view models with simple property rules

Avoid When:
- Accessors contain complex business logic
- The type already has a member named `field` and clarity suffers
- An explicit backing field communicates intent better

### Partial Member Guidelines

Good Use Cases:
- Source-generator friendly APIs
- Splitting generated declarations from hand-written implementations
- Large partial types where event or constructor responsibilities are separated

Avoid When:
- The type is small and a normal member is simpler
- The split would make the control flow harder to follow
- The project does not already rely on partial-type organization

---

## Migration Guide

### From Classic Extension Methods to Extension Blocks

```csharp
// Before
public static class CustomerExtensions
{
    public static string GetDisplayName(this Customer customer)
        => $"{customer.FirstName} {customer.LastName}";
}

// After
public static class CustomerExtensions
{
    extension(Customer customer)
    {
        public string GetDisplayName()
            => $"{customer.FirstName} {customer.LastName}";
    }
}
```

### From Explicit Null Checks to Null-Conditional Assignment

```csharp
// Before
if (session is not null)
{
    session.LastSeenAt = DateTime.UtcNow;
}

// After
session?.LastSeenAt = DateTime.UtcNow;
```

### From Manual Backing Fields to `field`

```csharp
// Before
private string _name = string.Empty;
public string Name
{
    get => _name;
    set => _name = value.Trim();
}

// After
public string Name
{
    get;
    set => field = value.Trim();
} = string.Empty;
```

### From Project Files to File-Based App Directives

```csharp
// Before: package and SDK settings lived in a .csproj file.

// After: keep small apps self-contained in one file.
#:sdk Microsoft.NET.Sdk
#:package Spectre.Console@0.49.1
#:property TargetFramework=net10.0

using Spectre.Console;

AnsiConsole.MarkupLine("[green]Ready[/]");
```

---

Version: 1.0.0
Last Updated: 2026-03-20
