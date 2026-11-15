# Arayüz (React + TypeScript + Vite + Mantine)

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

Geliştirme sunucusu `/api` isteklerini ASP.NET Core API'ye (http://localhost:5249)
yönlendirir; önce API'yi çalıştırın (kök dizindeki README). API olmadan denemek için
`VITE_USE_MOCK=true npm run dev`: veriler bellekte tutulur, çizelge basit bir sahte
üreticiden gelir.

- `src/api/` — tipler (C# modeliyle aynı alan adları), gerçek ve sahte API, özet hesapları
- `src/components/` — üst menü, vardiya hapı, ortak kart başlığı
- `src/pages/overview/` — Genel Bakış kartları
- `src/pages/schedule/` — Çizelge (personel × gün tablosu)
- `src/pages/staff/` — Personel listesi ve düzenleme paneli
- `src/pages/rules/` — Kurallar ve kapasite kontrolü
- `src/pages/me/` — Personel görünümü (`#me`)
- `src/theme.ts` — Mantine teması ve vardiya renkleri
