# Hastane Vardiya Planlayıcı

Hemşire vardiya çizelgesini Google OR-Tools CP-SAT ile üreten karar destek sistemi.
Çözücü sert kuralları (günde tek vardiya, dinlenme, haftalık sınır, izin, her vardiyada
kıdemli) her zaman sağlar ve gece vardiyalarını olabildiğince adil dağıtır. Tüm veriler
sentetiktir.

## Çalıştırma

Gerekenler: .NET SDK 10, Node 24. Komutlar proje klasörünün içinden, iki ayrı terminalde
çalıştırılır. Windows PowerShell "running scripts is disabled" hatası verirse `npm` yerine
`npm.cmd` yazın.

```bash
dotnet run --project backend/src/Api --launch-profile http   # http://localhost:5249
```

```bash
npm --prefix frontend install
npm --prefix frontend run dev                                 # http://localhost:5173
```

API ilk açılışta `backend/src/Api/hastane.db` dosyasını oluşturur ve
`data/ornek-12-hemsire.json` örneğini (12 hemşire, 14 gün) yükleyip çözer. Baştan
başlamak için bu dosyayı silmek yeterli.

## Testler

```bash
dotnet test backend
```

## Klasörler

| Klasör | İçerik |
|---|---|
| `backend/src/Scheduling.Solver` | CP-SAT modeli, çözümden bağımsız doğrulayıcı, girdi denetimi |
| `backend/src/Api` | ASP.NET Core minimal API, EF Core + SQLite |
| `backend/tests` | xUnit testleri |
| `frontend/` | React + TypeScript + Mantine arayüzü |
| `data/` | Örnek girdi dosyaları |

## Bilinen sınırlamalar

- Önceki dönem dikkate alınmaz: önceki dönemin son günü gece çalışan biri yeni dönemin
  ilk günü sabaha yazılabilir.
- Giriş ekranı yok; yönetici ve personel görünümü üstteki seçiciyle değişir.
- Dönem her zaman 14 gün ve Pazartesi başlar.
