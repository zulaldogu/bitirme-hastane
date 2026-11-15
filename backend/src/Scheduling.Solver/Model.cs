namespace Scheduling.Solver;

// Çözücünün girdi ve çıktı tipleri. Alan adları arayüzdeki TypeScript tipleriyle
// aynıdır (frontend/src/api/types.ts, K24); JSON camelCase olarak yazılır.

/// <summary>Vardiya türü. K7: S = Sabah 08–16, A = Akşam 16–24, G = Gece 00–08.</summary>
public sealed record ShiftType(string Code, string Name, string Start, string End);

public sealed record Department(string Id, string Name);

public sealed record Nurse(
    string Id,
    string Name,
    string Title,
    bool Senior,
    string DepartmentId,
    IReadOnlyList<DateOnly> LeaveDays);

/// <summary>Arka arkaya iki günde yasak olan vardiya çifti: <c>From</c> gününden sonraki gün <c>To</c> olmaz.</summary>
public sealed record ShiftSuccession(string From, string To);

public sealed record Rules
{
    /// <summary>Her gün, her vardiyada bulunması gereken en az kişi (vardiya koduna göre).</summary>
    public required IReadOnlyDictionary<string, int> MinStaff { get; init; }

    /// <summary>Takvim haftası (Pazartesi–Pazar) başına kişi başı en fazla vardiya.</summary>
    public int MaxShiftsPerWeek { get; init; } = 5;

    /// <summary>Her vardiyada en az bu kadar kıdemli hemşire bulunur.</summary>
    public int MinSeniorPerShift { get; init; } = 1;

    /// <summary>
    /// Dinlenme kuralı (K8-3). Varsayılan: Geceden sonra Sabah veya Akşam yok, Akşamdan sonra
    /// Sabah yok. Böylece iki vardiya arasında en az 11 saat kalır.
    /// </summary>
    public IReadOnlyList<ShiftSuccession> ForbiddenSuccessions { get; init; } =
        [new("G", "S"), new("G", "A"), new("A", "S")];

    /// <summary>Adalet amacında sayılan gece vardiyasının kodu (K10).</summary>
    public string NightShift { get; init; } = "G";
}

/// <summary>Bir çizelgeleme probleminin tamamı. <c>data/</c> altındaki örnek dosyalar bu biçimdedir.</summary>
public sealed record ScheduleInput
{
    public Department? Department { get; init; }
    public required IReadOnlyList<ShiftType> ShiftTypes { get; init; }
    public required Rules Rules { get; init; }
    public required IReadOnlyList<Nurse> Nurses { get; init; }

    /// <summary>Dönemin ilk günü. K25: bir Pazartesi.</summary>
    public required DateOnly StartDate { get; init; }

    /// <summary>Dönemin gün sayısı. K25: 14.</summary>
    public int DayCount { get; init; } = 14;

    public IReadOnlyList<DateOnly> Days() =>
        Enumerable.Range(0, DayCount).Select(StartDate.AddDays).ToList();
}

public sealed record Assignment(string NurseId, DateOnly Date, string Shift);

public enum SolveStatus
{
    /// <summary>Kanıtlanmış en iyi (en adil) çözüm.</summary>
    Optimal,

    /// <summary>Tüm sert kısıtlar sağlanıyor ama süre doldu; en iyi olduğu kanıtlanmadı.</summary>
    Feasible,

    /// <summary>Kurallar bu kadroyla karşılanamaz.</summary>
    Infeasible,

    /// <summary>Süre içinde hiçbir çözüm bulunamadı (çözümsüz olduğu da kanıtlanamadı).</summary>
    Unknown,
}

public sealed record ScheduleResult(
    SolveStatus Status,
    IReadOnlyList<DateOnly> Days,
    IReadOnlyList<Assignment> Assignments,
    double SolveSeconds,
    /// <summary>En çok ve en az gece vardiyası alan kişi arasındaki fark (K10).</summary>
    int? NightGap,
    /// <summary>En çok ve en az toplam vardiya alan kişi arasındaki fark (K27).</summary>
    int? TotalGap);
