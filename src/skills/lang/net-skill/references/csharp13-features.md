# C# 13 Language Features

Comprehensive guide to C# 13 features for .NET 9+ development.

---

## `params` Collections

The `params` modifier now works with more than arrays. In C# 13, you can use spans, common collection interfaces, and compatible collection types with `Add` support.

### Basic Usage

```csharp
public static class AuditLogger
{
    public static void LogMessages(params ReadOnlySpan<string> messages)
    {
        foreach (var message in messages)
        {
            Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] {message}");
        }
    }
}

AuditLogger.LogMessages("Application started", "Cache warmed", "Ready");
AuditLogger.LogMessages(["Request received", "Request completed"]);
```

### With Collection Interfaces

```csharp
public static class RoleSeeder
{
    public static void SeedRoles(params IReadOnlyList<string> roles)
    {
        foreach (var role in roles)
        {
            Console.WriteLine($"Seeding role: {role}");
        }
    }
}

RoleSeeder.SeedRoles("Admin", "Editor", "Viewer");
```

### Performance-Friendly Span Parameters

```csharp
public static class MathOperations
{
    public static decimal Sum(params ReadOnlySpan<decimal> values)
    {
        decimal total = 0;
        foreach (var value in values)
        {
            total += value;
        }

        return total;
    }
}

var total = MathOperations.Sum(12.5m, 7.25m, 99.99m);
Console.WriteLine(total); // 119.74
```

---

## New Lock Object

The .NET 9 runtime introduces `System.Threading.Lock`. The `lock` statement recognizes this type and uses the new synchronization API automatically.

### Basic Usage

```csharp
using System.Threading;

public sealed class InventoryService
{
    private readonly Lock _gate = new();
    private int _stock = 100;

    public bool TryReserve(int quantity)
    {
        lock (_gate)
        {
            if (_stock < quantity)
            {
                return false;
            }

            _stock -= quantity;
            return true;
        }
    }
}
```

### Explicit Scope Management

```csharp
using System.Threading;

public sealed class SequenceGenerator
{
    private readonly Lock _gate = new();
    private int _current;

    public int Next()
    {
        using var scope = _gate.EnterScope();
        return ++_current;
    }
}
```

### Practical Service Example

```csharp
using System.Threading;

public sealed class MemoryCacheStats
{
    private readonly Lock _gate = new();
    private int _hits;
    private int _misses;

    public void RegisterHit()
    {
        lock (_gate)
        {
            _hits++;
        }
    }

    public void RegisterMiss()
    {
        lock (_gate)
        {
            _misses++;
        }
    }

    public (int Hits, int Misses) Snapshot()
    {
        lock (_gate)
        {
            return (_hits, _misses);
        }
    }
}
```

---

## New Escape Sequence `\e`

C# 13 adds `\e` as an escape sequence for the `ESCAPE` character (`U+001B`). This is clearer and safer than `\u001b` or `\x1b`.

### Basic Usage

```csharp
char escape = '\e';
Console.WriteLine((int)escape); // 27
```

### ANSI Terminal Output

```csharp
const string Green = "\e[32m";
const string Yellow = "\e[33m";
const string Reset = "\e[0m";

Console.WriteLine($"{Green}Build succeeded{Reset}");
Console.WriteLine($"{Yellow}Warnings detected{Reset}");
```

### Why It Matters

```csharp
// Clear and unambiguous
var clearScreen = "\e[2J";

// Older alternatives were more verbose or easier to misread
var oldUnicode = "\u001b[2J";
var oldHex = "\x1b[2J";
```

---

## Method Group Natural Type Improvements

C# 13 improves how the compiler determines the natural type of a method group by pruning inapplicable candidates earlier during overload resolution.

### Improved Delegate Inference

```csharp
public static class Mapper
{
    public static string Normalize(string value) => value.Trim().ToUpperInvariant();

    public static TDestination Normalize<TSource, TDestination>(TSource value)
        where TDestination : new()
        => new();
}

var normalize = Mapper.Normalize;
Console.WriteLine(normalize("  opencode  ")); // OPENCODE
```

### Local Scope Preferred Over Inapplicable Candidates

```csharp
using static GlobalParsers;

string Parse(string value) => value.Trim();

var parse = Parse;
Console.WriteLine(parse("  hello  ")); // hello

public static class GlobalParsers
{
    public static T Parse<T>(string value) where T : IParsable<T>
        => T.Parse(value, provider: null);
}
```

### Practical Benefit

```csharp
public static class Formatter
{
    public static string Format(DateOnly value) => value.ToString("yyyy-MM-dd");
    public static TResult Format<TValue, TResult>(TValue value) where TResult : new() => new();
}

var dateFormatter = Formatter.Format;
Console.WriteLine(dateFormatter(new DateOnly(2026, 3, 20)));
```

---

## Implicit Index Access in Object Initializers

You can now use the `^` operator inside object initializers for single-dimensional collections.

### Array Initialization from the End

```csharp
public sealed class ScoreBoard
{
    public int[] RecentScores { get; } = new int[5];
}

var board = new ScoreBoard
{
    RecentScores =
    {
        [^1] = 100,
        [^2] = 95,
        [^3] = 90,
        [^4] = 88,
        [^5] = 80
    }
};
```

### Countdown Buffer Example

```csharp
public sealed class TimerState
{
    public int[] Buffer { get; } = new int[10];
}

var countdown = new TimerState
{
    Buffer =
    {
        [^1] = 0,
        [^2] = 1,
        [^3] = 2,
        [^4] = 3,
        [^5] = 4,
        [^6] = 5,
        [^7] = 6,
        [^8] = 7,
        [^9] = 8,
        [^10] = 9
    }
};
```

---

## `ref` and `unsafe` in `async` Methods and Iterators

C# 13 relaxes earlier restrictions so `ref` locals, `ref struct` locals, and `unsafe` blocks can be used in more `async` methods and iterators, as long as safety rules are preserved.

### `ref struct` Locals in `async` Methods

```csharp
public static async Task<int> ReadHeaderAsync(Memory<byte> payload, CancellationToken ct)
{
    ReadOnlySpan<byte> header = payload.Span[..4];
    var version = header[0];
    var flags = header[1];

    await Task.Delay(10, ct);

    return version + flags;
}
```

### `unsafe` Blocks in Iterators

```csharp
public static IEnumerable<int> ReadValues(nint address, int length)
{
    for (var i = 0; i < length; i++)
    {
        int value;

        unsafe
        {
            value = ((int*)address)[i];
        }

        yield return value;
    }
}
```

### Important Restriction

```csharp
public static async Task<int> CountAsync(Memory<byte> buffer)
{
    ReadOnlySpan<byte> span = buffer.Span;
    var count = span.Length;

    // Use span before await.
    Console.WriteLine(span[0]);

    await Task.Delay(10);

    // Not allowed: using span after await would cross the await boundary.
    return count;
}
```

---

## `allows ref struct`

Generic type parameters can now opt in to accepting `ref struct` arguments using the `allows ref struct` anti-constraint.

### Generic API That Accepts `ref struct`

```csharp
public interface ISpanHandler<T> where T : allows ref struct
{
    void Handle(scoped T value);
}

public static class Pipeline
{
    public static void Execute<T, THandler>(scoped T value, THandler handler)
        where T : allows ref struct
        where THandler : ISpanHandler<T>
    {
        handler.Handle(value);
    }
}
```

### Using a `ref struct` Type Argument

```csharp
public ref struct CsvRow(ReadOnlySpan<char> value)
{
    public ReadOnlySpan<char> Value => value;
}

public readonly struct CsvRowHandler : ISpanHandler<CsvRow>
{
    public void Handle(scoped CsvRow row)
    {
        Console.WriteLine(row.Value.ToString());
    }
}

var row = new CsvRow("1,OpenCode,Ready".AsSpan());
Pipeline.Execute(row, new CsvRowHandler());
```

### Why It Matters

```csharp
public sealed class BufferProcessor<T> where T : allows ref struct
{
    public void Process(scoped T buffer)
    {
        Console.WriteLine(typeof(T).Name);
    }
}

var processor = new BufferProcessor<ReadOnlySpan<char>>();
processor.Process("hello".AsSpan());
```

---

## `ref struct` Types Can Implement Interfaces

Before C# 13, `ref struct` types could not implement interfaces. Now they can, while still preserving ref safety.

### Basic Interface Implementation

```csharp
public interface IChecksum
{
    int Compute();
}

public ref struct PacketChecksum(ReadOnlySpan<byte> packet) : IChecksum
{
    public int Compute()
    {
        var sum = 0;
        foreach (var value in packet)
        {
            sum += value;
        }

        return sum;
    }
}
```

### Access Through Generics

```csharp
public static int RunChecksum<T>(scoped T algorithm)
    where T : allows ref struct, IChecksum
{
    return algorithm.Compute();
}

var data = stackalloc byte[] { 1, 2, 3, 4 };
var checksum = new PacketChecksum(data);
Console.WriteLine(RunChecksum(checksum));
```

### Important Restriction

```csharp
public interface IParser
{
    int Parse();
}

public ref struct Utf8Parser(ReadOnlySpan<byte> utf8) : IParser
{
    public int Parse() => utf8.Length;
}

// Not allowed:
// IParser parser = new Utf8Parser(stackalloc byte[] { 1, 2, 3 });

// Use generics with `allows ref struct` instead.
```

---

## Partial Properties and Indexers

C# 13 expands partial members to support properties and indexers in partial types.

### Partial Property

```csharp
public partial class UserProfile
{
    public partial string DisplayName { get; set; }
}

public partial class UserProfile
{
    private string _displayName = string.Empty;

    public partial string DisplayName
    {
        get => _displayName;
        set => _displayName = value.Trim();
    }
}
```

### Partial Indexer

```csharp
public partial class TranslationTable
{
    public partial string this[string key] { get; set; }
}

public partial class TranslationTable
{
    private readonly Dictionary<string, string> _values = new();

    public partial string this[string key]
    {
        get => _values.TryGetValue(key, out var value) ? value : string.Empty;
        set => _values[key] = value;
    }
}
```

### Source Generator Friendly Pattern

```csharp
public partial class SettingsViewModel
{
    public partial bool IsBusy { get; set; }
}

public partial class SettingsViewModel
{
    private bool _isBusy;

    public partial bool IsBusy
    {
        get => _isBusy;
        set
        {
            if (_isBusy == value)
            {
                return;
            }

            _isBusy = value;
            OnStateChanged();
        }
    }

    private void OnStateChanged() => Console.WriteLine("State changed");
}
```

---

## Overload Resolution Priority

Library authors can use `OverloadResolutionPriorityAttribute` to tell the compiler which overload should be preferred when more than one overload is applicable.

### Basic Usage

```csharp
using System.Runtime.CompilerServices;

public static class ConsoleLogger
{
    public static void Log(string message)
        => Console.WriteLine(message);

    [OverloadResolutionPriority(1)]
    public static void Log(ReadOnlySpan<char> message)
        => Console.WriteLine(message.ToString());
}

ConsoleLogger.Log("Hello from C# 13");
```

### Guiding Consumers to Better Overloads

```csharp
using System.Runtime.CompilerServices;

public static class JsonHelpers
{
    public static string Serialize(object value)
        => System.Text.Json.JsonSerializer.Serialize(value);

    [OverloadResolutionPriority(1)]
    public static string Serialize<T>(T value)
        => System.Text.Json.JsonSerializer.Serialize(value);
}
```

### Use Carefully

```csharp
// Prefer using priority only when you need to guide callers toward a clearly
// better overload without introducing ambiguity or breaking existing code.
```

---

## The `field` Keyword (Preview)

Beginning with Visual Studio 17.12, C# 13 includes the `field` contextual keyword as a preview feature. It gives property accessors access to the compiler-generated backing field.

### Basic Usage

```csharp
public class AccountSettings
{
    public string Email
    {
        get;
        set
        {
            field = value.Contains('@')
                ? value
                : throw new ArgumentException("Invalid email address", nameof(value));
        }
    } = string.Empty;
}
```

### Normalization Without Explicit Backing Field

```csharp
public class UserInput
{
    public string Name
    {
        get;
        set
        {
            field = value.Trim();
        }
    } = string.Empty;
}
```

### Name Collision Warning

```csharp
public class Sample
{
    private string field = "stored";

    public string Value
    {
        get => @field;
        set => field = value;
    }
}
```

---

## Best Practices

### When to Use `params` Collections

Good Use Cases:
- APIs that benefit from span-based inputs
- Methods that naturally accept a variable number of values
- Reducing temporary array allocations in hot paths

Avoid When:
- The API needs mutation semantics on the incoming collection
- A single collection argument is clearer than many values
- The call site would become ambiguous with existing overloads

### When to Use `System.Threading.Lock`

Good Use Cases:
- New .NET 9 codebases
- High-contention synchronization paths
- Replacing private `object` lock fields in application services

Avoid When:
- You need cross-process synchronization
- Async coordination is required instead of thread blocking
- Existing concurrency primitives already model the problem better

### `ref struct` Feature Guidelines

Good Use Cases:
- Span-based parsing and formatting APIs
- High-performance pipelines working with stack-only data
- Generic algorithms that should accept `Span<T>` or similar types

Avoid When:
- Boxing or interface storage is required
- Values must outlive the current stack frame
- Simpler heap-allocated types are already sufficient

### Preview Feature Guidance for `field`

Good Use Cases:
- Small validation or normalization logic inside accessors
- Reducing boilerplate in DTO-style or view-model types

Avoid When:
- The team avoids preview language features in production
- A property needs complex state transitions or side effects
- The type already has a field named `field` and clarity matters

---

## Migration Guide

### From `params` Arrays to `params` Spans

```csharp
// Before
public static int Sum(params int[] values)
{
    var total = 0;
    foreach (var value in values)
    {
        total += value;
    }

    return total;
}

// After
public static int Sum(params ReadOnlySpan<int> values)
{
    var total = 0;
    foreach (var value in values)
    {
        total += value;
    }

    return total;
}
```

### From `object` Locks to `System.Threading.Lock`

```csharp
// Before
private readonly object _gate = new();

public void Increment()
{
    lock (_gate)
    {
        _count++;
    }
}

// After
private readonly System.Threading.Lock _gate = new();

public void Increment()
{
    lock (_gate)
    {
        _count++;
    }
}
```

### From Front-Indexed Initializers to `^` Access

```csharp
// Before
var state = new TimerState
{
    Buffer =
    {
        [0] = 9,
        [1] = 8,
        [2] = 7,
        [3] = 6,
        [4] = 5,
        [5] = 4,
        [6] = 3,
        [7] = 2,
        [8] = 1,
        [9] = 0
    }
};

// After
var state = new TimerState
{
    Buffer =
    {
        [^10] = 9,
        [^9] = 8,
        [^8] = 7,
        [^7] = 6,
        [^6] = 5,
        [^5] = 4,
        [^4] = 3,
        [^3] = 2,
        [^2] = 1,
        [^1] = 0
    }
};
```

---

Version: 1.0.0
Last Updated: 2026-03-20
