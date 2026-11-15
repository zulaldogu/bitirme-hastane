namespace Scheduling.Solver;

internal static class Weeks
{
    /// <summary>Günün ait olduğu takvim haftasının Pazartesi'si (K8-4: haftalar Pazartesi–Pazar).</summary>
    public static DateOnly MondayOf(DateOnly date) =>
        date.AddDays(-(((int)date.DayOfWeek + 6) % 7));
}
