# 🔐 Keamanan

## Melaporkan kerentanan

Kalau kamu menemukan masalah keamanan, **jangan buat issue publik**. Laporkan lewat GitHub **Security Advisories** (repo → *Security* → *Report a vulnerability*) atau email langsung ke pemilik repo.

Mohon sertakan:
- Deskripsi singkat kerentanan
- Langkah reproduce
- Dampak yang mungkin terjadi

## Catatan untuk yang menjalankan sendiri

- `app.py` masih memakai `app.run(debug=True)`. **Jangan expose ke internet publik** tanpa:
  - mematikan debug mode, dan
  - memakai production server (gunicorn/waitress) + HTTPS.
- Ollama berjalan lokal di `127.0.0.1:11434` — pastikan tidak terbuka ke jaringan luar.
- `memory.json` berisi data pribadi — jangan commit atau bagikan.
- Edge TTS memakai layanan tak resmi Microsoft; untuk penggunaan komersial besar gunakan TTS resmi.
- Fitur mic hanya aktif di `localhost`/HTTPS (browser menolak akses mic di HTTP non-local).
