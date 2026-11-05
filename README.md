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

Buka `http://localhost:5173`. Suara tiap persona pakai **Web Speech API bawaan
browser** tanpa setup apa pun (gratis, pitch/rate beda-beda per persona — lihat
`src/data/personaStyles.ts`), tapi chat butuh `GEMINI_API_KEY` (lihat bagian
"AI fallback" di bawah) buat jawab beneran — tanpa itu user cuma dapet satu baris
fallback generik untuk semua pesan.

Untuk ikut menjalankan 2 serverless function (`/api/chat`, `/api/tts`) secara lokal,
pakai Netlify CLI: `netlify dev`.

## Struktur

```
src/
  pages/        Landing, PilihPersona, ChatRoom, HasilShare — 4 halaman di BRD
  components/   PersonaCarousel, ChatBubble, MicButton, ShareCardView, dll
  lib/
    chat.ts        setiap giliran chat manggil /api/chat langsung
    voice.ts        "Jarvis" layer — TTS per persona + voice input (STT)
  data/
    personaStyles.ts   warna + identitas suara tiap persona (tint, pitch/rate, voice Google)
    useOrdalData.ts     loader untuk ordal-personas-scenarios.json
public/
  data/ordal-personas-scenarios.json   6 persona (system prompt, opener) + 8 topik
                                         ide (dipakai sebagai quick-reply chip saja)
  assets/card/, assets/avatar/          potret persona (jpg+webp, siap pakai)
netlify/functions/
  chat.mjs   setiap pesan chat lewat sini → Google Gemini, in-character per persona
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

Setiap pesan user — bebas, apa aja, gak dibatasi topik — langsung dikirim ke
`/api/chat` (lewat redirect `netlify.toml` ke `netlify/functions/chat.mjs`), yang
menyuntikkan `system_prompt` persona yang lagi aktif (karakter + guardrail-nya) dan
memanggil **Google Gemini** (model default `gemini-2.5-flash`, dengan satu kali
retry otomatis ke alias `gemini-flash-latest` kalau model utamanya gagal — lihat
`.env.example` buat ganti modelnya. API key gratis di
[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)). 8 topik
di `ordal-personas-scenarios.json` sekarang cuma dipakai sebagai ide/quick-reply
chip di Chat Room — jawabannya sendiri selalu digenerate AI, bukan dicocokkan ke
skrip.

Tanpa `GEMINI_API_KEY`, atau kalau panggilan ke Gemini gagal, endpoint ini balas
error dan user dapat satu baris fallback yang masih in-character
(`OFFLINE_FALLBACK` di `src/lib/chat.ts`), bukan error teknis — tapi setiap
kegagalan juga di-`console.error` baik di browser (buka DevTools) maupun di log
function Netlify (**Site → Logs → Functions → chat**), jadi kalau jawaban kerasa
generik terus padahal API key udah ke-set, cek dua log itu dulu buat liat pesan
error asli dari Gemini-nya.

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
