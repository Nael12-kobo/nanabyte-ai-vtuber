<p align="center">
  <b>💙 3D Virtual AI Companion</b> — chat, speak with a natural voice, express emotions,
  and always <i>remember</i> you. Runs <b>100% locally</b> on your computer, powered by Ollama.
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-Check%20here-4fc3f7?style=for-the-badge" alt="Features"/></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick%20Start-2%20minutes-7c4dff?style=for-the-badge" alt="Quick Start"/></a>
  <a href="#-license"><img src="https://img.shields.io/badge/License-MIT-e4572e?style=for-the-badge" alt="License"/></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.10%2B-3776ab?style=for-the-badge&logo=python&logoColor=white" alt="Python"/></a>
  <a href="https://flask.palletsprojects.com/"><img src="https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask"/></a>
  <a href="https://ollama.com/"><img src="https://img.shields.io/badge/Ollama-Local%20AI-7c4dff?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama"/></a>
  <a href="https://github.com/pixiv/three-vrm"><img src="https://img.shields.io/badge/Three.js-VRM%203D-3b82f6?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js"/></a>
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎀 **3D Avatar (VRM)** | Nana appears as a 3D character in the browser using Three.js |
| 💬 **Natural chat** | Local AI via Ollama — no paid API, no internet required |
| 🎭 **Expressions & emotions** | Nana reacts happy/sad/angry based on your message |
| 🗣️ **Lip-sync** | Mouth moves with the voice (VRM 0.x A/I/U/E/O) |
| 🔊 **Natural voice** | Edge TTS neural Indonesian voice (`id-ID-GadisNeural`) |
| 🎤 **Mic mode** | Talk using your voice (browser SpeechRecognition) |
| 🧠 **Memory** | Say *"Nana, remember I like the color blue"* — saved in `memory.json` |
| 📝 **Code review** | Import a file → Nana reviews it, finds bugs, and suggests fixes |
| 🛠️ **Auto code edit** | Nana creates small patches; the fixed file is ready to download |
| 📦 **100% local & free** | Everything runs on your computer, privacy preserved |

---

## 🚀 Quick Start

```bash
git clone https://github.com/Nael12-kobo/nanabyte-ai-vtuber.git
cd nanabyte-ai-vtuber

# 1. Make sure Ollama is installed & running: https://ollama.com
ollama pull llama3.2:3b

# 2. Run (automatically creates venv + installs deps + starts server)
./run.sh
```

Open **http://localhost:5000** — and Nana is ready to keep you company! 🎉

> `run.sh` handles everything automatically: virtual environment, dependencies, Ollama check, then starts the server.

---

## 🧠 How It Works

```
                    ┌─────────────────────────────────────────────┐
                    │              Browser (User)                  │
                    │   Three.js + VRM (3D avatar & lip-sync)      │
                    └───────────────┬─────────────────────────────┘
                                    │  chat / mic / upload file
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │             Flask (app.py)                   │
                    │   ┌───────────┐  ┌───────────┐  ┌────────┐  │
                    │   │  Ollama   │  │ Edge TTS  │  │ Memory │  │
                    │   │ llama3.2  │  │ Nana voice│  │  .json │  │
                    │   └───────────┘  └───────────┘  └────────┘  │
                    └─────────────────────────────────────────────┘
```

1. You send a message (text / voice / code file).
2. `app.py` forwards it to **Ollama** (`llama3.2:3b`) with a system prompt + Nana's memories.
3. The reply is processed → **Edge TTS** produces a natural voice → the avatar **lip-syncs** & expresses emotions.
4. Memories you ask for are saved in `memory.json`.

---

## 📁 Project Structure

```
nanabyte-ai-vtuber/
├── app.py                   # Flask web server + Ollama + Edge TTS
├── main.py                  # Terminal version (chat + pyttsx3 voice)
├── run.sh                   # Automatic launcher (venv + deps + server)
├── requirements.txt         # Python dependencies
├── memory.json              # Nana's memories (auto-generated, don't commit)
├── templates/
│   └── index.html           # Web UI page
├── static/
│   ├── app.js               # 3D logic, expressions, lip-sync, chat
│   ├── mic.js               # Mic / voice chat feature
│   ├── ui.js                # Editor UI & code preview
│   ├── style.css            # Styling
│   └── models/
│       └── nana.vrm         # Nana's 3D model (VRM 0.x, ~15 MB)
├── .github/workflows/
│   └── python-ci.yml        # Automatic CI (syntax + smoke test)
├── LICENSE                  # MIT License
├── CONTRIBUTING.md          # Contribution guidelines
├── SECURITY.md              # Security policy
└── .gitignore               # Runtime files not committed
```

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Backend** | Python · Flask |
| **AI** | Ollama — `llama3.2:3b` (web) · `gemma3:1b` (terminal) |
| **3D / Avatar** | Three.js · @pixiv/three-vrm |
| **Voice** | edge-tts (natural) · pyttsx3 (terminal fallback) |
| **Frontend** | HTML · CSS · JavaScript (ES Modules) |

---

## 🗺️ Roadmap

- [x] Local AI chat with Ollama
- [x] VRM 3D avatar + lip-sync + expressions
- [x] Natural Edge TTS voice
- [x] Mic mode (voice chat)
- [x] Long-term memory (`memory.json`)
- [x] Automatic code review & edit
- [ ] Streaming mode (word-by-word replies)
- [ ] Choose AI model from the UI
- [ ] Wake word (*"Nana, listen..."*)
- [ ] Save chat history across sessions

---

## 📚 Documentation

- **Manual installation** → [Requirements](#-quick-start) & `run.sh`
- **Terminal version** → `./.venv/bin/python main.py` (local pyttsx3 voice, no browser)
- **Full troubleshooting** → see the section below

<details>
<summary><b>🔧 Troubleshooting (click to expand)</b></summary>

### 3D model doesn't appear
- Hard refresh the browser: `Ctrl + F5`
- Check Console (F12): there should be a `VRM loaded: ...` log

### No voice / robotic voice
- Natural voice needs **internet** (Edge TTS). Without internet, Nana falls back to the browser voice.
- Check menu → **Voice: On**

### "Ollama not connected"
- Run the Ollama app or `ollama serve`
- Check models: `ollama list` (must have `llama3.2:3b`)

### Mic doesn't work
- Microphone permission: click the 🔒 icon in the address bar
- Mic feature needs **Chrome/Edge** & a **localhost/HTTPS** connection

### Port 5000 already in use
```bash
fuser -k 5000/tcp   # Linux
```

### `.vrm` file too large for GitHub?
`nana.vrm` (~15 MB) is best uploaded with **Git LFS**:
```bash
git lfs track "static/models/nana.vrm"
git add .gitattributes
```
</details>

---

## 🤝 Contributing

This is **Nael**'s personal project, but all contributions are welcome! 💙
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, and [SECURITY.md](SECURITY.md) for the security policy.

---

## ⚠️ Important Notes

1. `app.py` still uses `app.run(debug=True)` — **do not expose it to the public internet** without disabling debug mode & using a production server (gunicorn/waitress) + HTTPS.
2. **Ollama must run on the same machine** (URL `127.0.0.1:11434`).
3. **Edge TTS** is an unofficial free service (Microsoft API) — for large-scale commercial use, use an official TTS.
4. **Mic** only works on localhost/HTTPS.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<p align="center">
  Made with 💙 — Nana, Nael's AI companion.
</p>
