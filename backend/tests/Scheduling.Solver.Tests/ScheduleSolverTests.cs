namespace Scheduling.Solver.Tests;

public class ScheduleSolverTests
{
    internal static ScheduleInput Sample() =>
        SchedulingJson.ReadInput(Path.Combine(AppContext.BaseDirectory, "data", "ornek-12-hemsire.json"));

    [Fact]
    public void Sample_IsParsedAsExpected()
    {
        var input = Sample();

        Assert.Equal(12, input.Nurses.Count);
        Assert.Equal(5, input.Nurses.Count(n => n.Senior));
        Assert.Equal(new DateOnly(2026, 11, 2), input.StartDate);
        Assert.Equal(DayOfWeek.Monday, input.StartDate.DayOfWeek);
        Assert.Equal(3, input.Rules.MinStaff["S"]);
        Assert.Equal(3, input.Rules.ForbiddenSuccessions.Count);
    }

    [Fact]
    public void Sample_IsSolvedOptimally_WithoutViolations()
    {
        var input = Sample();

        var result = ScheduleSolver.Solve(input);

        Assert.Equal(SolveStatus.Optimal, result.Status);
        Assert.Empty(ScheduleValidator.Validate(input, result.Assignments));
        // 14 gün × (3 + 2 + 2) = 98 gereken vardiya; fazlası atanmaz (K29).
        Assert.Equal(98, result.Assignments.Count);
    }

    [Fact]
    public void Sample_NightsAreSpreadFairly()
    {
        var input = Sample();

        var result = ScheduleSolver.Solve(input);

        // 28 gece / 12 kişi = 2,33: herkes 2 veya 3 gece alır, fark 1'dir. 0 olamaz.
        Assert.Equal(1, result.NightGap);
        var nights = input.Nurses
            .Select(n => result.Assignments.Count(a => a.NurseId == n.Id && a.Shift == "G"))
            .ToList();
        Assert.Equal(1, nights.Max() - nights.Min());
        Assert.Equal(result.TotalGap, TotalsOf(input, result).Max() - TotalsOf(input, result).Min());
    }

    [Fact]
    public void TooFewSeniors_IsInfeasible()
    {
        // K12'deki hesap: 3 vardiya × 14 gün = 42 kıdemli vardiyası gerekir. 2 kıdemli en
        // fazla 2 × 10 = 20 vardiya alabilir.
        var input = Sample();
        var nurses = input.Nurses.Select((n, i) => i < 2 ? n : n with { Senior = false }).ToList();

        var result = ScheduleSolver.Solve(input with { Nurses = nurses });

        Assert.Equal(SolveStatus.Infeasible, result.Status);
        Assert.Empty(result.Assignments);
    }

    [Fact]
    public void LeaveDays_AreRespected()
    {
        var input = Sample();
        var everyoneOffOnFirstDay = input.Nurses.Take(2)
            .Select(n => n with { LeaveDays = [.. n.LeaveDays, input.StartDate] })
            .Concat(input.Nurses.Skip(2))
            .ToList();
        input = input with { Nurses = everyoneOffOnFirstDay };

        var result = ScheduleSolver.Solve(input);

        Assert.Equal(SolveStatus.Optimal, result.Status);
        Assert.DoesNotContain(result.Assignments, a => a.Date == input.StartDate && (a.NurseId == "n1" || a.NurseId == "n2"));
    }

    [Fact]
    public void InvalidInput_Throws()
    {
        var input = Sample();
        var bad = input with { Rules = input.Rules with { MinStaff = new Dictionary<string, int> { ["X"] = 1 } } };

        Assert.Throws<ArgumentException>(() => ScheduleSolver.Solve(bad));
    }

    private static List<int> TotalsOf(ScheduleInput input, ScheduleResult result) =>
        input.Nurses.Select(n => result.Assignments.Count(a => a.NurseId == n.Id)).ToList();
}
