<p align="center">
  <b>💙 AI Companion Virtual 3D</b> — ngobrol, bicara dengan suara natural, berekspresi,
  dan selalu <i>ingat</i> kamu. Berjalan <b>100% lokal</b> di komputermu, ditenagai Ollama.
</p>

<p align="center">
  <a href="#-fitur"><img src="https://img.shields.io/badge/Fitur-Cek%20di%20sini-4fc3f7?style=for-the-badge" alt="Fitur"/></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick%20Start-2%20menit-7c4dff?style=for-the-badge" alt="Quick Start"/></a>
  <a href="#-lisensi"><img src="https://img.shields.io/badge/Lisensi-MIT-e4572e?style=for-the-badge" alt="Lisensi"/></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.10%2B-3776ab?style=for-the-badge&logo=python&logoColor=white" alt="Python"/></a>
  <a href="https://flask.palletsprojects.com/"><img src="https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask"/></a>
  <a href="https://ollama.com/"><img src="https://img.shields.io/badge/Ollama-Local%20AI-7c4dff?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama"/></a>
  <a href="https://github.com/pixiv/three-vrm"><img src="https://img.shields.io/badge/Three.js-VRM%203D-3b82f6?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js"/></a>
</p>

---

## ✨ Fitur

| Fitur | Deskripsi |
|---|---|
| 🎀 **Avatar 3D (VRM)** | Nana tampil sebagai karakter 3D di browser memakai Three.js |
| 💬 **Ngobrol natural** | AI lokal via Ollama — tanpa API berbayar, tanpa internet wajib |
| 🎭 **Ekspresi & emosi** | Nana bereaksi senang/sedih/marah sesuai isi pesan |
| 🗣️ **Lip-sync** | Mulut bergerak mengikuti suara (VRM 0.x A/I/U/E/O) |
| 🔊 **Suara natural** | Edge TTS neural Bahasa Indonesia (`id-ID-GadisNeural`) |
| 🎤 **Mode mic** | Ngobrol pakai suara langsung (browser SpeechRecognition) |
| 🧠 **Memory** | Bilang *"Nana, ingat aku suka warna biru"* — disimpan di `memory.json` |
| 📝 **Review kode** | Import file → Nana meninjau, menemukan bug, dan menawarkan perbaikan |
| 🛠️ **Edit kode otomatis** | Nana membuat patch kecil, file hasil perbaikan siap di-download |
| 📦 **100% lokal & gratis** | Semua jalan di komputermu, privasi terjaga |

---

## 🚀 Quick Start

```bash
git clone https://github.com/Nael12-kobo/nanabyte-ai-vtuber.git
cd nanabyte-ai-vtuber

# 1. Pastikan Ollama terinstall & berjalan: https://ollama.com
ollama pull llama3.2:3b

# 2. Jalankan (otomatis buat venv + install dependensi + start server)
./run.sh
```

Buka **http://localhost:5000** — dan Nana siap menemanimu! 🎉

> `run.sh` mengurus semuanya otomatis: virtual environment, dependensi, cek Ollama, lalu menjalankan server.

---

## 🧠 Cara Kerja

```
                    ┌─────────────────────────────────────────────┐
                    │              Browser (User)                  │
                    │   Three.js + VRM (avatar 3D & lip-sync)      │
                    └───────────────┬─────────────────────────────┘
                                    │  chat / mic / upload file
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │             Flask (app.py)                   │
                    │   ┌───────────┐  ┌───────────┐  ┌────────┐  │
                    │   │  Ollama   │  │ Edge TTS  │  │ Memory │  │
                    │   │ llama3.2  │  │ suara Nana│  │  .json │  │
                    │   └───────────┘  └───────────┘  └────────┘  │
                    └─────────────────────────────────────────────┘
```

1. Kamu kirim pesan (teks / suara / file kode).
2. `app.py` meneruskan ke **Ollama** (`llama3.2:3b`) dengan sistem prompt + ingatan Nana.
3. Jawaban diproses → **Edge TTS** menghasilkan suara natural → avatar **lip-sync** & berekspresi.
4. Ingatan yang kamu minta disimpan di `memory.json`.

---

## 📁 Struktur Project

```
nanabyte-ai-vtuber/
├── app.py                   # Server web Flask + Ollama + Edge TTS
├── main.py                  # Versi terminal (chat + suara pyttsx3)
├── run.sh                   # Launcher otomatis (venv + deps + server)
├── requirements.txt         # Dependensi Python
├── memory.json              # Ingatan Nana (auto-generated, jangan di-commit)
├── templates/
│   └── index.html           # Halaman web UI
├── static/
│   ├── app.js               # Logika 3D, ekspresi, lip-sync, chat
│   ├── mic.js               # Fitur mic / ngobrol suara
│   ├── ui.js                # UI editor & preview kode
│   ├── style.css            # Tampilan
│   └── models/
│       └── nana.vrm         # Model 3D Nana (VRM 0.x, ~15 MB)
├── .github/workflows/
│   └── python-ci.yml        # CI otomatis (syntax + smoke test)
├── LICENSE                  # MIT License
├── CONTRIBUTING.md          # Panduan kontribusi
├── SECURITY.md              # Kebijakan keamanan
└── .gitignore               # File runtime yang tidak di-commit
```

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| **Backend** | Python · Flask |
| **AI** | Ollama — `llama3.2:3b` (web) · `gemma3:1b` (terminal) |
| **3D / Avatar** | Three.js · @pixiv/three-vrm |
| **Suara** | edge-tts (natural) · pyttsx3 (fallback terminal) |
| **Frontend** | HTML · CSS · JavaScript (ES Modules) |

---

## 🗺️ Roadmap

- [x] Chat AI lokal dengan Ollama
- [x] Avatar 3D VRM + lip-sync + ekspresi
- [x] Suara natural Edge TTS
- [x] Mode mic (voice chat)
- [x] Memory jangka panjang (`memory.json`)
- [x] Review & edit kode otomatis
- [ ] Mode streaming (jawaban muncul kata per kata)
- [ ] Pilih model AI langsung dari UI
- [ ] Wake-word (*"Nana, dengar..."*)
- [ ] Simpan riwayat chat antar sesi

---

## 📚 Dokumentasi

- **Cara install manual** → [Kebutuhan](#-quick-start) & `run.sh`
- **Versi terminal** → `./.venv/bin/python main.py` (suara lokal pyttsx3, tanpa browser)
- **Troubleshooting lengkap** → lihat bagian bawah

<details>
<summary><b>🔧 Troubleshooting (klik untuk buka)</b></summary>

### Model 3D tidak muncul
- Hard refresh browser: `Ctrl + F5`
- Cek Console (F12): harus ada log `VRM loaded: ...`

### Suara tidak keluar / robotik
- Suara natural butuh **internet** (Edge TTS). Tanpa internet, Nana jatuh ke suara browser.
- Cek menu → **Voice: On**

### "Ollama belum tersambung"
- Jalankan aplikasi Ollama atau `ollama serve`
- Cek model: `ollama list` (harus ada `llama3.2:3b`)

### Mic tidak berfungsi
- Izin mikrofon: klik ikon 🔒 di address bar
- Fitur mic butuh **Chrome/Edge** & koneksi **localhost/HTTPS**

### Port 5000 sudah dipakai
```bash
fuser -k 5000/tcp   # Linux
```

### File `.vrm` terlalu besar untuk GitHub?
`nana.vrm` (~15 MB) sebaiknya di-upload memakai **Git LFS**:
```bash
git lfs track "static/models/nana.vrm"
git add .gitattributes
```
</details>

---

## 🤝 Kontribusi

Repo ini proyek pribadi milik **Nael**, tapi semua kontribusi diterima dengan senang hati! 💙
Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduannya, dan [SECURITY.md](SECURITY.md) untuk kebijakan keamanan.

---

## ⚠️ Catatan Penting

1. `app.py` masih memakai `app.run(debug=True)` — **jangan expose ke internet publik** tanpa mematikan debug & memakai production server (gunicorn/waitress) + HTTPS.
2. **Ollama harus berjalan di mesin yang sama** (URL `127.0.0.1:11434`).
3. **Edge TTS** adalah layanan gratis tak resmi (API Microsoft) — untuk komersial skala besar gunakan TTS resmi.
4. **Mic** hanya aktif di localhost/HTTPS.

---

## 📄 Lisensi

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<p align="center">
  Dibuat dengan 💙 — Nana, AI companion milik Nael.
</p>
