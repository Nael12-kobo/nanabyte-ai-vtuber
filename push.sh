#!/usr/bin/env bash
# ============================================================
#  Nana AI VTuber — bantu push ke GitHub (ramah pemula)
#
#  Cara pakai:
#    ./push.sh                      (nanti ditanya username GitHub)
#    ./push.sh nael123              (langsung pakai username kamu)
#
#  PENTING SEBELUMNYA:
#  1. Sudah punya akun GitHub (github.com)
#  2. Sudah membuat repo KOSONG bernama "nanabyte-ai-vtuber"
#     di github.com (klik + → New repository → beri nama →
#     JANGAN centang "Add a README file" → Create repository)
#
#  Yang dilakukan script ini:
#    1. Pastikan repo git + branch main
#    2. Sambungkan ke repo GitHub kamu (otomatis bikin link)
#    3. Commit pertama (kalau belum ada)
#    4. Upload semua file ke GitHub
# ============================================================
set -euo pipefail

# Selalu kerja dari folder project
cd "$(dirname "$0")"

GITHUB_USER="${1:-}"
REPO_NAME="nanabyte-ai-vtuber"

echo "=================================================="
echo "  🚀 Push Nana AI VTuber ke GitHub"
echo "=================================================="

# --- 1) Pastikan git repo ---------------------------------
if [ ! -d .git ]; then
    echo "[1/4] Menginisialisasi git..."
    git init -b main
else
    echo "[1/4] Repo git sudah ada."
fi

# --- 2) Pastikan branch main ------------------------------
if [ "$(git branch --show-current)" != "main" ]; then
    git branch -m main 2>/dev/null || true
fi

# --- 3) Sambungkan ke GitHub ------------------------------
if git remote | grep -q origin; then
    echo "[2/4] Remote sudah tersambung: $(git remote get-url origin)"
else
    echo ""
    echo "  ➜ Pastikan kamu SUDAH membuat repo kosong bernama"
    echo "    \"${REPO_NAME}\" di github.com (New repository)."
    echo ""
    while [ -z "$GITHUB_USER" ]; do
        echo "  ➜ Username GitHub kamu (contoh: nael123):"
        echo "    Kalau login pakai Google: lihat pojok kanan atas"
        echo "    github.com → 'Signed in as @namakamu' → ketik namakamu."
        read -r GITHUB_USER
        GITHUB_USER="${GITHUB_USER//[[:space:]]/}"
        if [ -z "$GITHUB_USER" ]; then
            echo "  ⚠ Username tidak boleh kosong. Coba lagi:"
        fi
    done
    REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
    echo "[2/4] Menyambungkan ke: ${REMOTE_URL}"
    git remote add origin "$REMOTE_URL"
fi

# --- 4) Commit perubahan (kalau ada) ----------------------
git add -A
if git diff --cached --quiet; then
    echo "[3/4] Tidak ada perubahan baru — semua sudah ter-commit ✓"
else
    # Git butuh identitas untuk commit — cek dulu biar tidak error misterius
    if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
        echo ""
        echo "  ⚠ Git belum tahu identitas kamu. Jalankan dulu (sekali saja):"
        echo "      git config --global user.name  \"Nama Kamu\""
        echo "      git config --global user.email \"email-kamu@contoh.com\""
        echo "  Lalu jalankan lagi: ./push.sh"
        echo ""
        exit 1
    fi
    echo "[3/4] Membuat commit..."
    git commit -m "✨ Update Nana AI VTuber"
fi

echo "  ⚠️ KALAU DIMINTA LOGIN:"
echo "     Username : username GitHub kamu"
echo "     Password : BUKAN password GitHub! Gunakan Personal Access Token"
echo "                (langkah lengkapnya dijelaskan di chat ini, lihat bawah)."
echo ""

# --- 5) Upload ke GitHub -----------------------------------
echo "[4/4] Mengupload file ke GitHub..."
git push -u origin main
echo ""
echo "  ✅ BERHASIL! 🎉"
echo "     Repo kamu sekarang ada di:"
echo "     https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo "=================================================="
