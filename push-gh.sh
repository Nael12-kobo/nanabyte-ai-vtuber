#!/usr/bin/env bash
# ============================================================
#  Nana AI VTuber — push ke GitHub TANPA TOKEN (paling gampang!)
#
#  Pakai GitHub CLI (gh) — login lewat browser, bisa pakai
#  akun Google. Tidak perlu bikin token / password. 😊
#
#  Cara pakai:
#    1. Install sekali saja (ketik di Terminal):
#         sudo pacman -S github-cli
#    2. Jalankan skrip ini:
#         ./push-gh.sh
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"

REPO_NAME="nanabyte-ai-vtuber"

echo "=================================================="
echo "  🚀 Push Nana AI VTuber — cara TANPA TOKEN"
echo "=================================================="

# --- 0) Cek gh terpasang ----------------------------------
if ! command -v gh >/dev/null 2>&1; then
    echo "  ❌ gh belum terpasang."
    echo "     Install dulu (sekali saja), ketik:"
    echo "         sudo pacman -S github-cli"
    echo "     Lalu jalankan lagi: ./push-gh.sh"
    exit 1
fi
echo "[1/5] gh terpasang ✓"

# --- 1) Pastikan repo git + branch main --------------------
if [ ! -d .git ]; then
    echo "[2/5] Menginisialisasi git..."
    git init -b main
fi
if [ "$(git branch --show-current)" != "main" ]; then
    git branch -m main 2>/dev/null || true
fi

# --- 2) Login lewat browser (kalau belum) -----------------
if ! gh auth status >/dev/null 2>&1; then
    echo "[3/5] Membuka halaman login di browser..."
    echo "        Pilih: GitHub.com → HTTPS → Login with a web browser"
    echo "        Ikuti kode sekali pakai di browser."
    echo "        Login pakai Google JUGA BISA — tidak perlu token! 😊"
    gh auth login -h github.com -p https -w
fi
USERNAME="$(gh api user -q .login)"
echo "[3/5] Login sebagai: @${USERNAME} ✓"

# --- 3) Commit perubahan (kalau ada) ----------------------
git add -A
if git diff --cached --quiet; then
    echo "[4/5] Tidak ada perubahan baru — semua sudah ter-commit ✓"
else
    if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
        echo ""
        echo "  ⚠ Git belum tahu identitas kamu. Jalankan dulu (sekali saja):"
        echo "      git config --global user.name  \"Nama Kamu\""
        echo "      git config --global user.email \"email-kamu@contoh.com\""
        echo "  Lalu jalankan lagi: ./push-gh.sh"
        echo ""
        exit 1
    fi
    echo "[4/5] Membuat commit..."
    git commit -m "✨ Update Nana AI VTuber"
fi

# --- 4) Buat repo (kalau belum) + push ---------------------
# Tanya dulu: Public (bisa dilihat semua orang) atau Private?
REPO_VISIBILITY=""
while [ -z "$REPO_VISIBILITY" ]; do
    echo "  ➜ Repo mau Public (bisa dilihat semua) atau Private (khusus kamu)?"
    echo "    Ketik: public  atau  private"
    read -r REPO_VISIBILITY
    REPO_VISIBILITY="$(echo "$REPO_VISIBILITY" | tr '[:upper:]' '[:lower:]')"
    case "$REPO_VISIBILITY" in
        public|private) ;;
        *) REPO_VISIBILITY="" ;;
    esac
done

if gh repo view "${REPO_NAME}" >/dev/null 2>&1; then
    echo "[5/5] Repo sudah ada, tinggal upload..."
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/${USERNAME}/${REPO_NAME}.git"
else
    echo "[5/5] Membuat repo baru (${REPO_VISIBILITY}) + upload..."
    gh repo create "${REPO_NAME}" "--${REPO_VISIBILITY}" --source . --remote origin \
        --description "💙 Nana AI VTuber — AI companion virtual 3D berbasis Ollama"
fi

if ! git push -u origin main; then
    echo ""
    echo "  ⚠ Push gagal. Kalau errornya 'non-fast-forward',"
    echo "    kemungkinan repo di GitHub sudah berisi file (mis. README)."
    echo "    Perbaiki dengan:  git pull origin main --rebase"
    echo "    lalu ulangi:      ./push-gh.sh"
    exit 1
fi

echo ""
echo "  ✅ BERHASIL! 🎉"
echo "     Repo kamu sekarang ada di:"
echo "     https://github.com/${USERNAME}/${REPO_NAME}"
echo "=================================================="
