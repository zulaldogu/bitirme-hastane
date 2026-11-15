namespace Scheduling.Solver;

public sealed record Violation(string Rule, string Message);

/// <summary>
/// Bir çizelgenin sert kısıtları (K8) sağlayıp sağlamadığını çözücüden bağımsız olarak denetler.
/// Çözücü modeli yanlış kurulsa bile bu sınıf hatayı yakalar; testlerin temeli budur.
/// </summary>
public static class ScheduleValidator
{
    public const string OneShiftPerDay = "gunde-tek-vardiya";
    public const string MinStaff = "asgari-personel";
    public const string Rest = "dinlenme";
    public const string WeeklyLimit = "haftalik-sinir";
    public const string Leave = "izin";
    public const string Senior = "kidemli";
    public const string Unknown = "gecersiz-atama";

    public static IReadOnlyList<Violation> Validate(ScheduleInput input, IReadOnlyList<Assignment> assignments)
    {
        var v = new List<Violation>();
        var days = input.Days();
        var codes = input.ShiftTypes.Select(s => s.Code).ToHashSet();
        var nurses = input.Nurses.ToDictionary(n => n.Id);
        var rules = input.Rules;

        foreach (var a in assignments.Where(a => !nurses.ContainsKey(a.NurseId) || !codes.Contains(a.Shift) || !days.Contains(a.Date)))
            v.Add(new(Unknown, $"Tanınmayan atama: {a.NurseId}, {a.Date}, {a.Shift}."));

        var valid = assignments.Where(a => nurses.ContainsKey(a.NurseId) && codes.Contains(a.Shift) && days.Contains(a.Date)).ToList();
        var byNurseDay = valid.ToLookup(a => (a.NurseId, a.Date));

        foreach (var nurse in input.Nurses)
        {
            foreach (var day in days)
            {
                var today = byNurseDay[(nurse.Id, day)].ToList();

                // K8-1
                if (today.Count > 1)
                    v.Add(new(OneShiftPerDay, $"{nurse.Name}, {day}: {today.Count} vardiya."));

                // K8-5
                if (today.Count > 0 && nurse.LeaveDays.Contains(day))
                    v.Add(new(Leave, $"{nurse.Name}, {day}: izinli günde atama."));

                // K8-3
                foreach (var prev in byNurseDay[(nurse.Id, day.AddDays(-1))])
                foreach (var next in today)
                    if (rules.ForbiddenSuccessions.Contains(new ShiftSuccession(prev.Shift, next.Shift)))
                        v.Add(new(Rest, $"{nurse.Name}, {day}: {prev.Shift} vardiyasından sonra {next.Shift}."));
            }

            // K8-4
            foreach (var week in days.GroupBy(Weeks.MondayOf))
            {
                var count = week.Sum(d => byNurseDay[(nurse.Id, d)].Count());
                if (count > rules.MaxShiftsPerWeek)
                    v.Add(new(WeeklyLimit, $"{nurse.Name}, {week.Key} haftası: {count} vardiya (en fazla {rules.MaxShiftsPerWeek})."));
            }
        }

        var byDayShift = valid.ToLookup(a => (a.Date, a.Shift));
        foreach (var day in days)
        foreach (var shift in input.ShiftTypes.Select(s => s.Code))
        {
            var here = byDayShift[(day, shift)].ToList();

            // K8-2
            var need = rules.MinStaff.GetValueOrDefault(shift);
            if (here.Count < need)
                v.Add(new(MinStaff, $"{day} {shift}: {here.Count} kişi (en az {need})."));

            // K8-6
            var seniors = here.Count(a => nurses[a.NurseId].Senior);
            if (seniors < rules.MinSeniorPerShift)
                v.Add(new(Senior, $"{day} {shift}: {seniors} kıdemli (en az {rules.MinSeniorPerShift})."));
        }

        return v;
    }
}
