# Arayüz (React + TypeScript + Vite + Mantine)

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

Şimdilik sahte veriyle çalışır (`src/api/`). Gerçek API hazır olunca
`VITE_USE_MOCK=false` ile ona geçilir; ekranlar değişmez.

- `src/api/` — tipler, sahte veri (K12), sahte çizelge üreticisi, özet hesapları
- `src/components/` — üst menü, "Yakında" kartı, ortak kart başlığı
- `src/pages/overview/` — Genel Bakış kartları (her biri bağımsız)
- `src/theme.ts` — Mantine teması ve vardiya renkleri
