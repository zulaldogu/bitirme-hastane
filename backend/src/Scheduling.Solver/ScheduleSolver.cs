using System.Diagnostics;
using Google.OrTools.Sat;

namespace Scheduling.Solver;

/// <summary>
/// CP-SAT ile vardiya çizelgesi üretir.
///
/// Model kısaca: her (hemşire, gün, vardiya) üçlüsü için bir evet/hayır değişkeni var
/// (1 = o kişi o gün o vardiyada çalışır). Sert kısıtlar (K8) bu değişkenler üzerine
/// toplam ≤ / ≥ koşulları olarak yazılır. Amaç (K10, K27) adaleti en iyiler: önce en çok
/// ve en az gece alan kişi arasındaki fark, sonra toplam vardiya farkı küçültülür.
/// Adalet amacı her zaman açıktır (K20).
/// </summary>
public static class ScheduleSolver
{
    public static readonly TimeSpan DefaultTimeLimit = TimeSpan.FromSeconds(10); // K28

    public static ScheduleResult Solve(ScheduleInput input, TimeSpan? timeLimit = null)
    {
        InputChecks.ThrowIfInvalid(input);

        var stopwatch = Stopwatch.StartNew();
        var days = input.Days();
        var nurses = input.Nurses;
        var shifts = input.ShiftTypes.Select(s => s.Code).ToList();
        var rules = input.Rules;

        var model = new CpModel();

        // x[n, d, s] = 1 ⇔ hemşire n, d. gün, s vardiyasında çalışır.
        var x = new BoolVar[nurses.Count, days.Count, shifts.Count];
        for (var n = 0; n < nurses.Count; n++)
        for (var d = 0; d < days.Count; d++)
        for (var s = 0; s < shifts.Count; s++)
            x[n, d, s] = model.NewBoolVar($"x_{nurses[n].Id}_{days[d]:MMdd}_{shifts[s]}");

        IEnumerable<BoolVar> Day(int n, int d) => Enumerable.Range(0, shifts.Count).Select(s => x[n, d, s]);

        // K8-1: Günde en fazla bir vardiya.
        for (var n = 0; n < nurses.Count; n++)
        for (var d = 0; d < days.Count; d++)
            model.AddAtMostOne(Day(n, d));

        // K8-2: Her gün, her vardiyada N kişi. Kural "en az N" ama çözücü tam N atar (K29):
        // "en az" serbest bırakılırsa çözücü gece farkını kapatmak için gecelere gereksiz
        // fazla kişi yazar. Fazla kişiyi çıkarmak hiçbir kuralı bozmadığından bu, çözülebilirliği
        // değiştirmez.
        // K8-6: Her vardiyada en az bir kıdemli.
        for (var d = 0; d < days.Count; d++)
        for (var s = 0; s < shifts.Count; s++)
        {
            var all = Enumerable.Range(0, nurses.Count).Select(n => x[n, d, s]).ToArray();
            model.Add(LinearExpr.Sum(all) == rules.MinStaff.GetValueOrDefault(shifts[s]));

            var seniors = Enumerable.Range(0, nurses.Count).Where(n => nurses[n].Senior).Select(n => x[n, d, s]).ToArray();
            model.Add(LinearExpr.Sum(seniors) >= rules.MinSeniorPerShift);
        }

        // K8-3: Dinlenme. Yasak çift (a → b): bugün a ve yarın b aynı anda olamaz.
        foreach (var rule in rules.ForbiddenSuccessions)
        {
            var a = shifts.IndexOf(rule.From);
            var b = shifts.IndexOf(rule.To);
            for (var n = 0; n < nurses.Count; n++)
            for (var d = 0; d + 1 < days.Count; d++)
                model.AddBoolOr([x[n, d, a].Not(), x[n, d + 1, b].Not()]);
        }

        // K8-4: Takvim haftası (Pzt–Paz) başına en fazla vardiya.
        var weeks = Enumerable.Range(0, days.Count).GroupBy(d => Weeks.MondayOf(days[d]));
        foreach (var week in weeks)
        for (var n = 0; n < nurses.Count; n++)
            model.Add(LinearExpr.Sum(week.SelectMany(d => Day(n, d))) <= rules.MaxShiftsPerWeek);

        // K8-5: İzin günlerinde atama yok.
        for (var n = 0; n < nurses.Count; n++)
        for (var d = 0; d < days.Count; d++)
            if (nurses[n].LeaveDays.Contains(days[d]))
                foreach (var v in Day(n, d))
                    model.Add(v == 0);

        // Adalet (K10, K27): fark = en çok − en az.
        var night = shifts.IndexOf(rules.NightShift);
        var nights = new IntVar[nurses.Count];
        var totals = new IntVar[nurses.Count];
        for (var n = 0; n < nurses.Count; n++)
        {
            nights[n] = model.NewIntVar(0, days.Count, $"gece_{nurses[n].Id}");
            model.Add(nights[n] == LinearExpr.Sum(Enumerable.Range(0, days.Count).Select(d => x[n, d, night])));
            totals[n] = model.NewIntVar(0, days.Count, $"toplam_{nurses[n].Id}");
            model.Add(totals[n] == LinearExpr.Sum(Enumerable.Range(0, days.Count).SelectMany(d => Day(n, d))));
        }

        var nightGap = Gap(model, nights, days.Count, "gece_farki");
        var totalGap = Gap(model, totals, days.Count, "toplam_farki");

        // Toplam farkı en fazla gün sayısı kadar olabilir. Gece farkını (gün sayısı + 1) ile
        // çarpmak, gece farkındaki 1'lik iyileşmenin toplam farkındaki her şeyden daha değerli
        // olmasını sağlar: önce gece farkı, sonra toplam farkı (sözlük sırası).
        model.Minimize(nightGap * (days.Count + 1) + totalGap);

        var solver = new CpSolver
        {
            StringParameters =
                $"max_time_in_seconds:{(timeLimit ?? DefaultTimeLimit).TotalSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture)} " +
                "num_search_workers:8",
        };
        var status = solver.Solve(model);
        var seconds = stopwatch.Elapsed.TotalSeconds;

        if (status is not (CpSolverStatus.Optimal or CpSolverStatus.Feasible))
        {
            var result = status == CpSolverStatus.Infeasible ? SolveStatus.Infeasible : SolveStatus.Unknown;
            return new ScheduleResult(result, days, [], seconds, null, null);
        }

        var assignments = new List<Assignment>();
        for (var n = 0; n < nurses.Count; n++)
        for (var d = 0; d < days.Count; d++)
        for (var s = 0; s < shifts.Count; s++)
            if (solver.BooleanValue(x[n, d, s]))
                assignments.Add(new Assignment(nurses[n].Id, days[d], shifts[s]));

        return new ScheduleResult(
            status == CpSolverStatus.Optimal ? SolveStatus.Optimal : SolveStatus.Feasible,
            days,
            assignments,
            seconds,
            (int)solver.Value(nightGap),
            (int)solver.Value(totalGap));
    }

    private static IntVar Gap(CpModel model, IntVar[] values, int upper, string name)
    {
        var max = model.NewIntVar(0, upper, name + "_max");
        var min = model.NewIntVar(0, upper, name + "_min");
        model.AddMaxEquality(max, values);
        model.AddMinEquality(min, values);
        var gap = model.NewIntVar(0, upper, name);
        model.Add(gap == max - min);
        return gap;
    }
}
