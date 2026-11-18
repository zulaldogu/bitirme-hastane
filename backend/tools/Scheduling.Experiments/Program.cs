using System.Globalization;
using System.Text;
using Scheduling.Solver;

// Vize raporunun test bölümü için sentetik deneyler (K34). Gerçek veri kullanılmaz.
//
//   dotnet run --project backend/tools/Scheduling.Experiments -c Release [çıktı.md]
//
// 1) Ölçek: farklı kadro büyüklüğü ve dönem uzunluğunda çözüm süresi ve adalet.
// 2) Kapasite: örnek servisten personel eksiltildikçe çözücünün çözümsüzlüğü kanıtlaması.
// Her çözüm, çözücüden bağımsız doğrulayıcıyla (ScheduleValidator) ayrıca denetlenir.

var output = args.FirstOrDefault() ?? "deney-sonuclari.md";
var inv = CultureInfo.InvariantCulture;
var md = new StringBuilder();
md.AppendLine("# Deney sonuçları (sentetik veri)");
md.AppendLine();
md.AppendLine($"Tarih: {DateTime.Now:yyyy-MM-dd HH:mm} · Makine: {Environment.ProcessorCount} mantıksal çekirdek · " +
              $"Süre sınırı: {ScheduleSolver.DefaultTimeLimit.TotalSeconds} sn · 8 arama iş parçacığı");
md.AppendLine();

// ---- 1) Ölçek deneyi ----
md.AppendLine("## 1. Ölçek deneyi");
md.AppendLine();
md.AppendLine("| Hemşire | Kıdemli | Gün | İhtiyaç S/A/G | Gerekli vardiya | Kapasite | Tohum | Durum | Süre (sn) | Gece farkı | Toplam farkı | İhlal |");
md.AppendLine("|---|---|---|---|---|---|---|---|---|---|---|---|");

int[] sizes = [12, 20, 30, 50];
int[] lengths = [14, 28];
int[] seeds = [1, 2, 3];
foreach (var n in sizes)
foreach (var days in lengths)
foreach (var seed in seeds)
{
    var input = Synthetic(n, days, seed);
    var r = ScheduleSolver.Solve(input);
    var violations = r.Assignments.Count > 0 ? ScheduleValidator.Validate(input, r.Assignments).Count : 0;
    var need = input.Rules.MinStaff.Values.Sum() * days;
    var capacity = Capacity(input);
    var m = input.Rules.MinStaff;
    var line = $"| {n} | {input.Nurses.Count(x => x.Senior)} | {days} | {m["S"]}/{m["A"]}/{m["G"]} | {need} | {capacity} | {seed} | " +
               $"{Name(r.Status)} | {r.SolveSeconds.ToString("0.00", inv)} | {r.NightGap?.ToString() ?? "—"} | " +
               $"{r.TotalGap?.ToString() ?? "—"} | {violations} |";
    md.AppendLine(line);
    Console.WriteLine(line);
}
md.AppendLine();

// ---- 2) Kapasite deneyi ----
md.AppendLine("## 2. Kapasite deneyi (örnek servis, 14 gün)");
md.AppendLine();
md.AppendLine("| Senaryo | Hemşire | Kıdemli | Gerekli vardiya | Kapasite | Kıdemli gereken | Kıdemli kapasite | Durum | Süre (sn) | Gece farkı |");
md.AppendLine("|---|---|---|---|---|---|---|---|---|---|");

var sample = SchedulingJson.ReadInput(Path.Combine(AppContext.BaseDirectory, "data", "ornek-12-hemsire.json"));
var scenarios = new List<(string Name, ScheduleInput Input)> { ("Örnek veri", sample) };
foreach (var drop in new[] { 1, 2, 3 })
    scenarios.Add(($"{drop} hemşire eksik", sample with { Nurses = sample.Nurses.Where(x => x.Senior).Concat(sample.Nurses.Where(x => !x.Senior).SkipLast(drop)).ToList() }));
foreach (var drop in new[] { 1, 2 })
    scenarios.Add(($"{drop} kıdemli eksik", sample with { Nurses = sample.Nurses.Where(x => x.Senior).SkipLast(drop).Concat(sample.Nurses.Where(x => !x.Senior)).ToList() }));
scenarios.Add(("Haftalık sınır 4", sample with { Rules = sample.Rules with { MaxShiftsPerWeek = 4 } }));
scenarios.Add(("Gece ihtiyacı 3", sample with { Rules = sample.Rules with { MinStaff = new Dictionary<string, int> { ["S"] = 3, ["A"] = 2, ["G"] = 3 } } }));

foreach (var (name, input) in scenarios)
{
    var r = ScheduleSolver.Solve(input);
    var days = input.DayCount;
    var need = input.Rules.MinStaff.Values.Sum() * days;
    var seniorNeed = input.Rules.MinSeniorPerShift * input.Rules.MinStaff.Count * days;
    var seniorCap = Capacity(input with { Nurses = input.Nurses.Where(x => x.Senior).ToList() });
    var line = $"| {name} | {input.Nurses.Count} | {input.Nurses.Count(x => x.Senior)} | {need} | {Capacity(input)} | {seniorNeed} | {seniorCap} | " +
               $"{Name(r.Status)} | {r.SolveSeconds.ToString("0.00", inv)} | {r.NightGap?.ToString() ?? "—"} |";
    md.AppendLine(line);
    Console.WriteLine(line);
}
md.AppendLine();
md.AppendLine("Kapasite: kişi başına haftalık sınır × hafta sayısı, eksi izin günleri (dinlenme kuralı hesaba katılmaz, " +
              "bu yüzden kapasite ihtiyacı aşsa bile çözüm olmayabilir).");

File.WriteAllText(output, md.ToString());
Console.WriteLine($"Yazıldı: {Path.GetFullPath(output)}");

// ---- Yardımcılar ----

static string Name(SolveStatus s) => s switch
{
    SolveStatus.Optimal => "En iyi (kanıtlı)",
    SolveStatus.Feasible => "Uygun (süre doldu)",
    SolveStatus.Infeasible => "Çözümsüz (kanıtlı)",
    _ => "Bilinmiyor",
};

// Kişi başı kapasite: her takvim haftasında min(haftalık sınır, o haftadaki izinsiz gün).
static int Capacity(ScheduleInput input) =>
    input.Nurses.Sum(n => input.Days()
        .GroupBy(d => d.AddDays(-(((int)d.DayOfWeek + 6) % 7)))
        .Sum(w => Math.Min(input.Rules.MaxShiftsPerWeek, w.Count(d => !n.LeaveDays.Contains(d)))));

// Örnek servisle aynı oranlar: 12 kişide S3/A2/G2 ve 5 kıdemli; kişilerin ~%30'una 1–2 gün izin.
static ScheduleInput Synthetic(int nurses, int days, int seed)
{
    var rng = new Random(seed * 1000 + nurses * 10 + days);
    var start = new DateOnly(2026, 11, 2);
    var seniors = (int)Math.Round(nurses * 5 / 12.0);
    var list = new List<Nurse>();
    for (var i = 0; i < nurses; i++)
    {
        var leave = new List<DateOnly>();
        if (rng.NextDouble() < 0.3)
        {
            var first = rng.Next(days - 1);
            leave.Add(start.AddDays(first));
            if (rng.NextDouble() < 0.5) leave.Add(start.AddDays(first + 1));
        }
        var senior = i < seniors;
        list.Add(new Nurse($"n{i + 1}", $"Hemşire {i + 1}", senior ? "Kıdemli Hemşire" : "Hemşire", senior, "servis", leave));
    }
    return new ScheduleInput
    {
        Department = new Department("servis", "Sentetik Servis"),
        ShiftTypes =
        [
            new("S", "Sabah", "08:00", "16:00"),
            new("A", "Akşam", "16:00", "24:00"),
            new("G", "Gece", "00:00", "08:00"),
        ],
        Rules = new Rules
        {
            MinStaff = new Dictionary<string, int>
            {
                ["S"] = (int)Math.Round(nurses * 3 / 12.0),
                ["A"] = (int)Math.Round(nurses * 2 / 12.0),
                ["G"] = (int)Math.Round(nurses * 2 / 12.0),
            },
        },
        Nurses = list,
        StartDate = start,
        DayCount = days,
    };
}
