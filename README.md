# Ordal.ai.id

> 3 resep sukses berbisnis di Indonesia: **Doa, Modal, Orang Dalam.**

Website hiburan/satir interaktif. Pengunjung "konsultasi" gratis dengan salah satu
dari 6 persona chatbot bergaya khas Indonesia, masing-masing dengan **suara sendiri**
(text-to-speech per persona — lihat bagian Suara di bawah), dan bisa share hasil
konsultasinya sebagai kartu gambar.

Brief lengkap (konsep, scope, logic chat, guardrail keamanan, spek desain) ada di
BRD yang menyertai proyek ini.

## Jalanin lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Tanpa API key apa pun, semuanya tetap jalan penuh:

- Chat pakai respons **scripted** dari `public/data/ordal-personas-scenarios.json`
  (8 skenario x 6 persona), di-match lewat `src/lib/matching.ts`.
- Suara tiap persona pakai **Web Speech API bawaan browser** — gratis, tanpa setup,
  dengan pitch/rate beda-beda per persona (lihat `src/data/personaStyles.ts`).

Untuk ikut menjalankan 2 serverless function (`/api/chat`, `/api/tts`) secara lokal,
pakai Netlify CLI: `netlify dev` (atau jalankan `npm run dev` dan terima kalau kedua
endpoint itu 404 — frontend otomatis fallback, lihat bagian "AI fallback" & "Suara").

## Struktur

```
src/
  pages/        Landing, PilihPersona, ChatRoom, HasilShare — 4 halaman di BRD
  components/   PersonaCarousel, ChatBubble, MicButton, ShareCardView, dll
  lib/
    matching.ts   matcher scripted-response (keyword + token-similarity)
    chat.ts        orkestrasi: scripted dulu, baru fallback ke /api/chat
    voice.ts        "Jarvis" layer — TTS per persona + voice input (STT)
  data/
    personaStyles.ts   warna + identitas suara tiap persona (tint, pitch/rate, voice Google)
    useOrdalData.ts     loader untuk ordal-personas-scenarios.json
public/
  data/ordal-personas-scenarios.json   6 persona (system prompt, opener) + 8 skenario
  assets/card/, assets/avatar/          potret persona (jpg+webp, siap pakai)
netlify/functions/
  chat.mjs   AI fallback (Google Gemini) — hanya kepanggil kalau scripted matcher nyerah
  tts.mjs    suara premium per persona (Google Cloud TTS) — opsional
netlify.toml
  build config + redirect /api/chat, /api/tts ke kedua function di atas
```

## Suara — kenapa tiap persona kedengeran beda

Dua lapis, mengikuti pola yang sama dengan `dannykosasih/deka-agent-web`
(`api/danny/tts.mjs` di repo itu):

1. **Browser voice (default, gratis, tanpa API key).** `src/lib/voice.ts` pakai
   `speechSynthesis` bawaan browser, dengan `pitch`/`rate` unik per persona
   (Pak Bohir pelan & berat, Mas Kenalan cepat & ceria, dst — lihat
   `PERSONA_STYLES` di `src/data/personaStyles.ts`), dan kalau perangkat punya
   lebih dari satu suara Indonesia terpasang, tiap persona otomatis dapet suara
   sistem yang beda juga.
2. **Google Cloud TTS (opsional, upgrade kualitas).** Set `GOOGLE_TTS_API_KEY` di
   environment server → `api/tts.mjs` otomatis dipakai duluan, dengan nama suara
   Google yang benar-benar berbeda per persona (3 suara pria, 3 suara wanita,
   campuran Wavenet/Standard). Tanpa key, endpoint ini balas 503 dan frontend
   diam-diam balik ke suara browser — tidak ada yang error di mata user.

Voice input (tombol mic di Chat Room) pakai `SpeechRecognition` /
`webkitSpeechRecognition` bawaan browser (Chrome desktop/Android paling stabil).
Tidak butuh API key, tidak butuh server.

## AI fallback

Scenario matcher (`src/lib/matching.ts`) jalan duluan untuk setiap pesan user —
instan dan gratis karena datanya statis. Hanya kalau tidak ada skenario yang cocok
(di bawah threshold di BRD: minimal 2 keyword match ATAU similarity > 0.6), frontend
manggil `/api/chat` (lewat redirect `netlify.toml` ke `netlify/functions/chat.mjs`),
yang menyuntikkan `system_prompt` persona yang aktif dan memanggil **Google Gemini**
(model default `gemini-2.5-flash`, lihat `.env.example` — API key gratis di
[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)). Tanpa
`GEMINI_API_KEY`, endpoint ini balas 503 dan user dapat satu baris fallback yang
masih in-character (`OFFLINE_FALLBACK` di `src/lib/chat.ts`), bukan error teknis —
**ini juga yang kejadian kalau functionnya sendiri belum ke-deploy/ke-redirect
dengan benar**, jadi kalau jawaban kerasa generik terus, cek dulu log function di
Netilfy dashboard sebelum curiga ke model AI-nya.

Mau ganti provider AI lain (OpenAI, Claude, dll)? Tinggal edit
`netlify/functions/chat.mjs` — bentuk request/response ke frontend (`{ text }` atau
`{ error }`) sudah provider-agnostic.

## Deploy

Dibuat buat Netlify (lihat `netlify.toml`) — cocok sama domain `ordal.ai.id` yang
sudah dimiliki:

```bash
netlify deploy          # preview
netlify deploy --prod   # production
```

Atau connect repo GitHub-nya langsung dari dashboard Netlify (Netlify otomatis baca
`netlify.toml` untuk build command, publish dir, dan function dir).

Set environment variables di **Site configuration → Environment variables** di
dashboard Netlify (semuanya opsional, lihat `.env.example`): `GEMINI_API_KEY`,
`GEMINI_MODEL`, `GOOGLE_TTS_API_KEY`. Setelah nambah/ubah env var, trigger deploy
ulang (env var baru gak kepakai ke deploy yang udah jalan).

## Guardrail yang wajib dijaga

Setiap `system_prompt` persona di `ordal-personas-scenarios.json` sudah membawa
aturan wajib (bahasa santai maks 3-4 kalimat, larangan keluar karakter, larangan
instruksi teknis suap/ilegal, redirect kalau user curhat masalah serius di luar
konteks bisnis). **Jangan disederhanakan** saat prompt ini disuntik ke
`netlify/functions/chat.mjs` — lihat `safety_notes` di file JSON-nya untuk detail
lengkap.
