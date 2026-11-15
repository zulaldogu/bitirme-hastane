using Microsoft.EntityFrameworkCore;
using Scheduling.Solver;

namespace Api.Data;

/// <summary>Veri tabanı satırlarını çözücünün girdi tiplerine çevirir ve örnek veriyi yükler.</summary>
public static class Store
{
    public static async Task<Department> DepartmentAsync(AppDb db)
    {
        var s = await db.Settings.SingleAsync();
        return new Department(s.DepartmentId, s.DepartmentName);
    }

    public static async Task<List<ShiftType>> ShiftTypesAsync(AppDb db) =>
        (await db.ShiftTypes.OrderBy(s => s.Order).ToListAsync())
        .Select(s => new ShiftType(s.Code, s.Name, s.Start, s.End))
        .ToList();

    public static async Task<List<Nurse>> NursesAsync(AppDb db) =>
        (await db.Nurses.ToListAsync())
        .OrderBy(n => n.Id.Length).ThenBy(n => n.Id) // n1, n2, …, n10
        .Select(ToNurse)
        .ToList();

    public static Nurse ToNurse(NurseRow n) =>
        new(n.Id, n.Name, n.Title, n.Senior, n.DepartmentId, n.LeaveDays.Order().ToList());

    public static async Task<Rules> RulesAsync(AppDb db)
    {
        var s = await db.Settings.SingleAsync();
        var minStaff = await db.ShiftTypes.OrderBy(t => t.Order).ToDictionaryAsync(t => t.Code, t => t.MinStaff);
        return new Rules
        {
            MinStaff = minStaff,
            MaxShiftsPerWeek = s.MaxShiftsPerWeek,
            MinSeniorPerShift = s.MinSeniorPerShift,
        };
    }

    public static async Task<ScheduleInput> InputAsync(AppDb db, DateOnly start, int dayCount = 14) => new()
    {
        Department = await DepartmentAsync(db),
        ShiftTypes = await ShiftTypesAsync(db),
        Rules = await RulesAsync(db),
        Nurses = await NursesAsync(db),
        StartDate = start,
        DayCount = dayCount,
    };

    /// <summary>Veri tabanı boşsa örnek dosyayı (K12) yükler ve dönemi bir kez çözer.</summary>
    public static async Task SeedAsync(AppDb db, string samplePath)
    {
        await db.Database.EnsureCreatedAsync();
        if (await db.Settings.AnyAsync()) return;

        var input = SchedulingJson.ReadInput(samplePath);
        var department = input.Department ?? new Department("dahiliye", "Dahiliye Servisi");

        db.Settings.Add(new SettingsRow
        {
            DepartmentId = department.Id,
            DepartmentName = department.Name,
            MaxShiftsPerWeek = input.Rules.MaxShiftsPerWeek,
            MinSeniorPerShift = input.Rules.MinSeniorPerShift,
        });
        db.ShiftTypes.AddRange(input.ShiftTypes.Select((s, i) => new ShiftTypeRow
        {
            Code = s.Code, Name = s.Name, Start = s.Start, End = s.End,
            MinStaff = input.Rules.MinStaff.GetValueOrDefault(s.Code), Order = i,
        }));
        db.Nurses.AddRange(input.Nurses.Select(n => new NurseRow
        {
            Id = n.Id, Name = n.Name, Title = n.Title, Senior = n.Senior,
            DepartmentId = n.DepartmentId, LeaveDays = n.LeaveDays.ToList(),
        }));
        await db.SaveChangesAsync();

        var result = ScheduleSolver.Solve(input);
        if (result.Assignments.Count > 0) await SaveRunAsync(db, input, result);
    }

    public static async Task<ScheduleRun> SaveRunAsync(AppDb db, ScheduleInput input, ScheduleResult result)
    {
        var run = new ScheduleRun
        {
            StartDate = input.StartDate,
            DayCount = input.DayCount,
            CreatedAt = DateTime.UtcNow,
            Status = result.Status,
            SolveSeconds = result.SolveSeconds,
            NightGap = result.NightGap,
            TotalGap = result.TotalGap,
            Assignments = result.Assignments
                .Select(a => new AssignmentRow { NurseId = a.NurseId, Date = a.Date, Shift = a.Shift })
                .ToList(),
        };
        db.ScheduleRuns.Add(run);
        await db.SaveChangesAsync();
        return run;
    }
}
