using Microsoft.EntityFrameworkCore;
using Scheduling.Solver;

namespace Api.Data;

// K13: EF Core + SQLite. Prototipte göç (migration) yok; şema EnsureCreated ile kurulur.
// Şema değişirse hastane.db dosyasını silmek yeterli, örnek veri yeniden yüklenir.

public sealed class NurseRow
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Title { get; set; }
    public bool Senior { get; set; }
    public required string DepartmentId { get; set; }
    public List<DateOnly> LeaveDays { get; set; } = [];
}

public sealed class ShiftTypeRow
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string Start { get; set; }
    public required string End { get; set; }
    public int MinStaff { get; set; }
    public int Order { get; set; }
}

/// <summary>Tek satırlık ayar tablosu: departman ve haftalık kurallar.</summary>
public sealed class SettingsRow
{
    public int Id { get; set; } = 1;
    public required string DepartmentId { get; set; }
    public required string DepartmentName { get; set; }
    public int MaxShiftsPerWeek { get; set; }
    public int MinSeniorPerShift { get; set; }
}

/// <summary>Bir "Oluştur" çalıştırmasının sonucu.</summary>
public sealed class ScheduleRun
{
    public int Id { get; set; }
    public DateOnly StartDate { get; set; }
    public int DayCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public SolveStatus Status { get; set; }
    public double SolveSeconds { get; set; }
    public int? NightGap { get; set; }
    public int? TotalGap { get; set; }
    public List<AssignmentRow> Assignments { get; set; } = [];
}

public sealed class AssignmentRow
{
    public int Id { get; set; }
    public int ScheduleRunId { get; set; }
    public required string NurseId { get; set; }
    public DateOnly Date { get; set; }
    public required string Shift { get; set; }
}

public sealed class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<NurseRow> Nurses => Set<NurseRow>();
    public DbSet<ShiftTypeRow> ShiftTypes => Set<ShiftTypeRow>();
    public DbSet<SettingsRow> Settings => Set<SettingsRow>();
    public DbSet<ScheduleRun> ScheduleRuns => Set<ScheduleRun>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<ShiftTypeRow>().HasKey(s => s.Code);
        b.Entity<ScheduleRun>().Property(r => r.Status).HasConversion<string>();
        b.Entity<ScheduleRun>().HasIndex(r => r.StartDate);
    }
}
