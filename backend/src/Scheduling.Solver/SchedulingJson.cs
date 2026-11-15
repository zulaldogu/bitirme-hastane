using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scheduling.Solver;

/// <summary>Örnek dosyalar ve API için ortak JSON ayarı: camelCase, tarih "YYYY-MM-DD" (K24).</summary>
public static class SchedulingJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    public static ScheduleInput ReadInput(string path) =>
        JsonSerializer.Deserialize<ScheduleInput>(File.ReadAllText(path), Options)
        ?? throw new InvalidDataException($"Boş dosya: {path}");
}
