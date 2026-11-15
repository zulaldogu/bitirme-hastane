namespace Scheduling.Solver.Tests;

// Doğrulayıcının her sert kısıtı tek başına yakaladığını gösterir. Her testte geçerli bir
// çizelge alınır, tek bir ihlal eklenir ve yalnızca o kuralın ihlali beklenir.
public class ScheduleValidatorTests
{
    private static readonly ScheduleInput Input = ScheduleSolverTests.Sample();
    private static readonly IReadOnlyList<Assignment> Valid = ScheduleSolver.Solve(Input).Assignments;

    private static DateOnly Day(int i) => Input.StartDate.AddDays(i);

    private static IReadOnlyList<string> RulesBroken(IEnumerable<Assignment> assignments) =>
        ScheduleValidator.Validate(Input, assignments.ToList()).Select(v => v.Rule).Distinct().ToList();

    [Fact]
    public void ValidSchedule_HasNoViolations() => Assert.Empty(RulesBroken(Valid));

    [Fact]
    public void TwoShiftsSameDay_IsCaught()
    {
        var a = Valid.First(a => a.Shift == "S");
        var extra = a with { Shift = "G" };

        Assert.Contains(ScheduleValidator.OneShiftPerDay, RulesBroken(Valid.Append(extra)));
    }

    [Fact]
    public void MissingStaff_IsCaught()
    {
        // İlk günün Akşam vardiyasından bir kişi hariç herkes çıkarılır (en az 2 gerekir).
        var evening = Valid.Where(a => a.Date == Day(0) && a.Shift == "A").ToList();
        var remaining = Valid.Except(evening.Skip(1)).ToList();

        Assert.Contains(ScheduleValidator.MinStaff, RulesBroken(remaining));
    }

    [Fact]
    public void NightThenMorning_IsCaught()
    {
        var schedule = new List<Assignment>
        {
            new("n7", Day(0), "G"),
            new("n7", Day(1), "S"),
        };

        Assert.Contains(ScheduleValidator.Rest, RulesBroken(schedule));
    }

    [Fact]
    public void EveningThenEvening_IsAllowed()
    {
        var schedule = new List<Assignment> { new("n7", Day(0), "A"), new("n7", Day(1), "A") };

        Assert.DoesNotContain(ScheduleValidator.Rest, RulesBroken(schedule));
    }

    [Fact]
    public void SixShiftsInAWeek_IsCaught()
    {
        var schedule = Enumerable.Range(0, 6).Select(i => new Assignment("n7", Day(i), "S"));

        Assert.Contains(ScheduleValidator.WeeklyLimit, RulesBroken(schedule));
    }

    [Fact]
    public void FiveShiftsSplitAcrossWeeks_IsAllowed()
    {
        // Pazar (6. gün) ve sonraki Pazartesi (7. gün) farklı haftalardır.
        var schedule = Enumerable.Range(2, 5).Select(i => new Assignment("n7", Day(i), "S"))
            .Concat(Enumerable.Range(7, 5).Select(i => new Assignment("n7", Day(i), "S")));

        Assert.DoesNotContain(ScheduleValidator.WeeklyLimit, RulesBroken(schedule));
    }

    [Fact]
    public void WorkOnLeaveDay_IsCaught()
    {
        // Ayşe Kaya (n1) 7 Kasım'da izinli.
        var schedule = new List<Assignment> { new("n1", new DateOnly(2026, 11, 7), "S") };

        Assert.Contains(ScheduleValidator.Leave, RulesBroken(schedule));
    }

    [Fact]
    public void ShiftWithoutSenior_IsCaught()
    {
        var schedule = Valid
            .Where(a => !(a.Date == Day(3) && a.Shift == "G"))
            .Append(new("n7", Day(3), "G"))
            .Append(new("n8", Day(3), "G"));

        var broken = RulesBroken(schedule);

        Assert.Contains(ScheduleValidator.Senior, broken);
    }

    [Fact]
    public void UnknownNurse_IsCaught()
    {
        Assert.Contains(ScheduleValidator.Unknown, RulesBroken([new("yok", Day(0), "S")]));
    }
}
