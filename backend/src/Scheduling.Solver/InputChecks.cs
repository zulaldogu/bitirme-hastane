namespace Scheduling.Solver;

/// <summary>Girdinin biçimsel denetimi. Çözümsüzlük değil, hatalı veri yakalar.</summary>
public static class InputChecks
{
    public static IReadOnlyList<string> Errors(ScheduleInput input)
    {
        var errors = new List<string>();
        var codes = input.ShiftTypes.Select(s => s.Code).ToList();

        if (codes.Count == 0) errors.Add("En az bir vardiya türü gerekli.");
        if (codes.Distinct().Count() != codes.Count) errors.Add("Vardiya kodları tekrar ediyor.");
        if (input.DayCount is < 1 or > 62) errors.Add("Gün sayısı 1 ile 62 arasında olmalı.");
        if (input.Nurses.Select(n => n.Id).Distinct().Count() != input.Nurses.Count)
            errors.Add("Personel kimlikleri tekrar ediyor.");

        foreach (var code in input.Rules.MinStaff.Keys.Where(c => !codes.Contains(c)))
            errors.Add($"Asgari personel kuralında bilinmeyen vardiya: {code}.");
        if (input.Rules.MinStaff.Values.Any(v => v < 0)) errors.Add("Asgari personel negatif olamaz.");
        if (input.Rules.MaxShiftsPerWeek < 0) errors.Add("Haftalık sınır negatif olamaz.");
        if (input.Rules.MinSeniorPerShift < 0) errors.Add("Kıdemli sayısı negatif olamaz.");
        if (!codes.Contains(input.Rules.NightShift))
            errors.Add($"Gece vardiyası kodu bilinmiyor: {input.Rules.NightShift}.");
        foreach (var r in input.Rules.ForbiddenSuccessions)
            if (!codes.Contains(r.From) || !codes.Contains(r.To))
                errors.Add($"Dinlenme kuralında bilinmeyen vardiya: {r.From} → {r.To}.");

        return errors;
    }

    public static void ThrowIfInvalid(ScheduleInput input)
    {
        var errors = Errors(input);
        if (errors.Count > 0) throw new ArgumentException(string.Join(" ", errors), nameof(input));
    }
}
