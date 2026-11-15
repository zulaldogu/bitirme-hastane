using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Api.Data;
using Microsoft.EntityFrameworkCore;
using Scheduling.Solver;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDb>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=hastane.db"));
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));

var app = builder.Build();

if (app.Environment.IsDevelopment()) app.MapOpenApi();

using (var scope = app.Services.CreateScope())
{
    var samplePath = Path.Combine(AppContext.BaseDirectory, "data", "ornek-12-hemsire.json");
    await Store.SeedAsync(scope.ServiceProvider.GetRequiredService<AppDb>(), samplePath);
}

// Arayüz (Vite) /api isteklerini bu sunucuya yönlendirir; CORS gerekmez.
var api = app.MapGroup("/api");

api.MapGet("/department", (AppDb db) => Store.DepartmentAsync(db));
api.MapGet("/shift-types", (AppDb db) => Store.ShiftTypesAsync(db));

// ---- Personel (K16-1) ----

api.MapGet("/nurses", (AppDb db) => Store.NursesAsync(db));

api.MapPost("/nurses", async (NurseBody body, AppDb db) =>
{
    if (body.Error() is { } error) return Results.BadRequest(new { error });
    var row = new NurseRow
    {
        Id = "n" + Guid.NewGuid().ToString("N")[..8],
        Name = body.Name.Trim(),
        Title = NurseBody.TitleFor(body.Senior),
        Senior = body.Senior,
        DepartmentId = (await Store.DepartmentAsync(db)).Id,
        LeaveDays = body.LeaveDays.Distinct().ToList(),
    };
    db.Nurses.Add(row);
    await db.SaveChangesAsync();
    return Results.Ok(Store.ToNurse(row));
});

api.MapPut("/nurses/{id}", async (string id, NurseBody body, AppDb db) =>
{
    if (body.Error() is { } error) return Results.BadRequest(new { error });
    var row = await db.Nurses.FindAsync(id);
    if (row is null) return Results.NotFound();
    row.Name = body.Name.Trim();
    row.Senior = body.Senior;
    row.Title = NurseBody.TitleFor(body.Senior);
    row.LeaveDays = body.LeaveDays.Distinct().ToList();
    await db.SaveChangesAsync();
    return Results.Ok(Store.ToNurse(row));
});

api.MapDelete("/nurses/{id}", async (string id, AppDb db) =>
{
    var row = await db.Nurses.FindAsync(id);
    if (row is null) return Results.NotFound();
    db.Nurses.Remove(row);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---- Kurallar (K16-2) ----

api.MapGet("/rules", (AppDb db) => Store.RulesAsync(db));

api.MapPut("/rules", async (RulesBody body, AppDb db) =>
{
    var types = await db.ShiftTypes.ToListAsync();
    if (body.MinStaff.Keys.Any(k => types.All(t => t.Code != k)))
        return Results.BadRequest(new { error = "Bilinmeyen vardiya kodu." });
    if (body.MinStaff.Values.Any(v => v is < 0 or > 50) || body.MaxShiftsPerWeek is < 0 or > 7)
        return Results.BadRequest(new { error = "Değerler geçerli aralıkta değil." });

    foreach (var t in types)
        if (body.MinStaff.TryGetValue(t.Code, out var n)) t.MinStaff = n;
    (await db.Settings.SingleAsync()).MaxShiftsPerWeek = body.MaxShiftsPerWeek;
    await db.SaveChangesAsync();
    return Results.Ok(await Store.RulesAsync(db));
});

// ---- Çizelge (K16-3, K17) ----

// Dönemin son oluşturulan çizelgesi. start verilmezse en son oluşturulan çizelge.
api.MapGet("/schedule", async (DateOnly? start, AppDb db) =>
{
    var query = db.ScheduleRuns.Include(r => r.Assignments).AsQueryable();
    if (start is { } s) query = query.Where(r => r.StartDate == s);
    var run = await query.OrderByDescending(r => r.Id).FirstOrDefaultAsync();
    return run is null ? Results.NoContent() : Results.Ok(await ScheduleDto.FromAsync(run, db));
});

// Çözücüyü çalıştırır ve sonucu kaydeder. Senkron: istek çözüm bitene kadar bekler (≤ 10 sn).
api.MapPost("/schedule", async (GenerateBody body, AppDb db) =>
{
    if (body.StartDate.DayOfWeek != DayOfWeek.Monday)
        return Results.BadRequest(new { error = "Dönem Pazartesi başlamalı (K25)." });

    var input = await Store.InputAsync(db, body.StartDate);
    var result = ScheduleSolver.Solve(input);
    if (result.Assignments.Count == 0)
        return Results.Ok(ScheduleDto.Unsolved(input, result));

    var run = await Store.SaveRunAsync(db, input, result);
    return Results.Ok(await ScheduleDto.FromAsync(run, db));
});

// ---- Son olaylar (Genel Bakış) ----

// start verilirse o dönemin son çizelgesi, verilmezse en son oluşturulan çizelge.
api.MapGet("/activity", async (DateOnly? start, AppDb db) =>
{
    var tr = CultureInfo.GetCultureInfo("tr-TR");
    var events = new List<ActivityEvent>();
    var runs = db.ScheduleRuns.Include(r => r.Assignments).AsQueryable();
    if (start is { } s) runs = runs.Where(r => r.StartDate == s);
    var run = await runs.OrderByDescending(r => r.Id).FirstOrDefaultAsync();
    if (run is null) return events;

    var dto = await ScheduleDto.FromAsync(run, db);
    events.Add(dto.Violations.Count == 0
        ? new("ok", "success", "Tüm sert kısıtlar sağlandı", "6 kural · 0 ihlal")
        : new("ok", "warning", $"{dto.Violations.Count} kural ihlali", "Veri değişti, çizelgeyi yeniden oluşturun"));
    var local = run.CreatedAt.ToLocalTime();
    events.Add(new("run", "info", "Çizelge oluşturuldu",
        $"{local.ToString("d MMMM, HH:mm", tr)} · {run.SolveSeconds.ToString("0.0", tr)} sn"));

    var first = run.StartDate;
    var last = run.StartDate.AddDays(run.DayCount - 1);
    foreach (var n in await Store.NursesAsync(db))
    {
        var leave = n.LeaveDays.Where(d => d >= first && d <= last).Order().ToList();
        if (leave.Count == 0) continue;
        var range = leave.Count == 1
            ? leave[0].ToString("d MMMM", tr)
            : $"{leave[0].Day}–{leave[^1].ToString("d MMMM", tr)}";
        events.Add(new($"leave-{n.Id}", "leave", $"{n.Name} izinli", range));
    }
    return events;
});

app.Run();

record NurseBody(string Name, bool Senior, List<DateOnly> LeaveDays)
{
    public string? Error() => string.IsNullOrWhiteSpace(Name) ? "Ad boş olamaz." : null;
    public static string TitleFor(bool senior) => senior ? "Kıdemli Hemşire" : "Hemşire";
}

record RulesBody(Dictionary<string, int> MinStaff, int MaxShiftsPerWeek);

record GenerateBody(DateOnly StartDate);

record ActivityEvent(string Id, string Kind, string Title, string Subtitle);

/// <summary>Arayüze giden çizelge. <c>Violations</c>, kayıtlı çizelgeyi güncel veriyle denetler.</summary>
record ScheduleDto(
    SolveStatus Status,
    DateOnly StartDate,
    IReadOnlyList<DateOnly> Days,
    IReadOnlyList<Assignment> Assignments,
    double SolveSeconds,
    int? NightGap,
    int? TotalGap,
    DateTime? CreatedAt,
    IReadOnlyList<Violation> Violations)
{
    public static async Task<ScheduleDto> FromAsync(ScheduleRun run, AppDb db)
    {
        var input = await Store.InputAsync(db, run.StartDate, run.DayCount);
        var assignments = run.Assignments.Select(a => new Assignment(a.NurseId, a.Date, a.Shift)).ToList();
        return new(run.Status, run.StartDate, input.Days(), assignments, run.SolveSeconds,
            run.NightGap, run.TotalGap, DateTime.SpecifyKind(run.CreatedAt, DateTimeKind.Utc),
            ScheduleValidator.Validate(input, assignments));
    }

    public static ScheduleDto Unsolved(ScheduleInput input, ScheduleResult r) =>
        new(r.Status, input.StartDate, input.Days(), [], r.SolveSeconds, null, null, null, []);
}
