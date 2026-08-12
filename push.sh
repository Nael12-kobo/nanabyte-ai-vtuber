#!/usr/bin/env bash
# ============================================================
#  Nana AI VTuber — easy GitHub push helper (beginner friendly)
#
#  Usage:
#    ./push.sh                      (will ask for your GitHub username)
#    ./push.sh nael123              (use your username directly)
#
#  IMPORTANT BEFORE RUNNING:
#  1. Have a GitHub account (github.com)
#  2. Have created an EMPTY repository named "nanabyte-ai-vtuber"
#     on github.com (click + → New repository → name it →
#     DO NOT check "Add a README file" → Create repository)
#
#  What this script does:
#    1. Make sure this is a git repo on the main branch
#    2. Connect to your GitHub repo (creates the link automatically)
#    3. Commit changes (if any)
#    4. Upload everything to GitHub
# ============================================================
set -euo pipefail

# Always work from the project folder
cd "$(dirname "$0")"

GITHUB_USER="${1:-}"
REPO_NAME="nanabyte-ai-vtuber"

echo "=================================================="
echo "  🚀 Push Nana AI VTuber to GitHub"
echo "=================================================="

# --- 1) Make sure it's a git repo ------------------------
if [ ! -d .git ]; then
    echo "[1/4] Initializing git..."
    git init -b main
else
    echo "[1/4] Git repo already exists."
fi

# --- 2) Make sure we're on the main branch ---------------
if [ "$(git branch --show-current)" != "main" ]; then
    git branch -m main 2>/dev/null || true
fi

# --- 3) Connect to GitHub --------------------------------
if git remote | grep -q origin; then
    echo "[2/4] Remote already connected: $(git remote get-url origin)"
else
    echo ""
    echo "  ➜ Make sure you have ALREADY created an empty repository named"
    echo "    \"${REPO_NAME}\" on github.com (New repository)."
    echo ""
    while [ -z "$GITHUB_USER" ]; do
        echo "  ➜ Enter your GitHub username (e.g. nael123):"
        echo "    If you log in with Google: check the top-right corner of"
        echo "    github.com → 'Signed in as @yourname' → type yourname."
        read -r GITHUB_USER
        GITHUB_USER="${GITHUB_USER//[[:space:]]/}"
        if [ -z "$GITHUB_USER" ]; then
            echo "  ⚠ Username cannot be empty. Try again:"
        fi
    done
    REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
    echo "[2/4] Connecting to: ${REMOTE_URL}"
    git remote add origin "$REMOTE_URL"
fi

# --- 4) Commit changes (if any) --------------------------
git add -A
if git diff --cached --quiet; then
    echo "[3/4] No new changes — everything is already committed ✓"
else
    # Git needs your identity to commit — check first to avoid a cryptic error
    if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
        echo ""
        echo "  ⚠ Git doesn't know your identity yet. Run this once:"
        echo "      git config --global user.name  \"Your Name\""
        echo "      git config --global user.email \"your-email@example.com\""
        echo "  Then run ./push.sh again."
        echo ""
        exit 1
    fi
    echo "[3/4] Creating commit..."
    git commit -m "✨ Update Nana AI VTuber"
fi

echo ""
echo "  ⚠️ IF ASKED TO LOG IN:"
echo "     Username : your GitHub username"
echo "     Password : NOT your GitHub password! Use a Personal Access Token"
echo "                (full steps are in this chat, see below)."
echo ""

# --- 5) Upload to GitHub ---------------------------------
echo "[4/4] Uploading files to GitHub..."
git push -u origin main
echo ""
echo "  ✅ DONE! 🎉"
echo "     Your repo is now at:"
echo "     https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo "=================================================="
