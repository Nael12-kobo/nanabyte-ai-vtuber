#!/usr/bin/env bash
# ============================================================
#  Nana AI VTuber — launcher otomatis
#
#  Cara pakai:
#    ./run.sh            (pertama kali: buat venv + install deps)
#    bash run.sh         (kalau tidak bisa dijalankan langsung)
#
#  Yang dilakukan:
#    1. Membuat virtual environment (.venv) kalau belum ada
#    2. Install dependensi dari requirements.txt
#       (otomatis di-install ulang kalau requirements.txt berubah)
#    3. Cek Ollama aktif (dibutuhkan untuk chat AI)
#    4. Menjalankan server web di http://localhost:5000
# ============================================================
set -euo pipefail

# Selalu kerja dari folder project, walau dipanggil dari mana saja
cd "$(dirname "$0")"

PYTHON="${PYTHON:-python3}"
VENV=".venv"
PY="$VENV/bin/python"

echo "=================================================="
echo "  Nana AI VTuber — setup & run"
echo "=================================================="

# --- 1) Virtual environment --------------------------------
if [ ! -x "$PY" ]; then
    echo "[1/4] Membuat virtual environment baru..."
    "$PYTHON" -m venv "$VENV"
else
    echo "[1/4] Virtual environment sudah ada."
fi

# --- 2) Dependensi ------------------------------------------
MARKER="$VENV/.deps-installed"
if [ ! -f "$MARKER" ] || [ requirements.txt -nt "$MARKER" ]; then
    echo "[2/4] Menginstall dependensi dari requirements.txt..."
    "$PY" -m pip install --upgrade pip >/dev/null
    "$PY" -m pip install -r requirements.txt
    touch "$MARKER"
else
    echo "[2/4] Dependensi sudah terpasang (requirements.txt tidak berubah)."
fi

# --- 3) Cek Ollama -------------------------------------------
echo "[3/4] Mengecek Ollama..."
if curl -s -m 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "       Ollama aktif  ✓"
else
    echo "       ⚠  Ollama TIDAK terdeteksi!"
    echo "       Nana butuh Ollama untuk chat AI."
    echo "       Buka aplikasi Ollama, atau jalankan:  ollama serve"
    echo "       (server tetap dicoba jalan; chat mungkin error)"
fi

# --- 4) Cek apakah server sudah jalan ------------------------
# Pakai 127.0.0.1, bukan localhost: di beberapa sistem localhost bisa
# resolve ke IPv6 (::1) padahal Flask hanya bind di 127.0.0.1.
if curl -s -m 1 http://127.0.0.1:5000/ >/dev/null 2>&1; then
    echo ""
    echo "       ⚠  Server sudah berjalan di http://localhost:5000"
    echo "       Kalau mau restart: matikan dulu, lalu jalankan ulang."
    echo "=================================================="
    exit 0
fi

# --- 5) Jalankan server --------------------------------------
echo "[4/4] Menjalankan Nana di http://localhost:5000"
echo "       Tekan Ctrl+C untuk berhenti."
echo "=================================================="
exec "$PY" app.py
