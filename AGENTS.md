# Hastane Vardiya Optimizasyonu — Bitirme Projesi

Hastane personeli için CP-SAT (Google OR-Tools) tabanlı vardiya çizelgeleme ve
karar destek sistemi. Kullanıcı Türkçe konuşuyor; Türkçe cevap ver.

- **Her oturumun başında [`docs/durum.md`](docs/durum.md) dosyasını oku.** Kararlar,
  açık sorular ve sıradaki adım orada. Bir karar alındığında veya bir iş
  bittiğinde o dosyayı güncelle.
- Projenin amacı, kapsamı ve öneri takvimi: [`docs/oneri.md`](docs/oneri.md).
  Asıl rapor [`docs/oneri-raporu.pdf`](docs/oneri-raporu.pdf). Öneri bağlayıcı
  değil, çelişki olursa `durum.md` geçerli.
- `docs/` altındaki bu üç dosya `.gitignore` içinde (kişisel bilgi içeriyorlar)
  ve yalnızca kullanıcının makinesinde bulunur. Dosyalar yoksa kullanıcıdan iste.
  Onları git'e ekleme.
- **Kural: Her önemli adımdan sonra commit at, sormadan.** Önemli adım; bir
  yol haritası maddesinin, bir ekranın, bir kısıtın veya bir düzeltmenin
  derlenip test edilmiş hali demektir. Push için kullanıcıya sor.
- Gerçek hasta veya personel verisi kullanılmaz. Yalnızca sentetik veri ve
  kıyaslama setleri (INRC-II, NSPLib) kullanılır.
