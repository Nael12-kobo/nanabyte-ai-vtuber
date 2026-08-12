#!/usr/bin/env bash
# ============================================================
#  Nana AI VTuber — push to GitHub WITHOUT a token (easiest!)
#
#  Uses GitHub CLI (gh) — login through the browser, can use
#  your Google account. No token / password needed. 😊
#
#  Usage:
#    1. Install once (type in Terminal):
#         sudo pacman -S github-cli
#    2. Run this script:
#         ./push-gh.sh
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"

REPO_NAME="nanabyte-ai-vtuber"

echo "=================================================="
echo "  🚀 Push Nana AI VTuber — NO TOKEN needed"
echo "=================================================="

# --- 0) Check gh is installed ---------------------------
if ! command -v gh >/dev/null 2>&1; then
    echo "  ❌ gh is not installed."
    echo "     Install it once, type:"
    echo "         sudo pacman -S github-cli"
    echo "     Then run ./push-gh.sh again."
    exit 1
fi
echo "[1/5] gh installed ✓"

# --- 1) Make sure it's a git repo on main ----------------
if [ ! -d .git ]; then
    echo "[2/5] Initializing git..."
    git init -b main
fi
if [ "$(git branch --show-current)" != "main" ]; then
    git branch -m main 2>/dev/null || true
fi

# --- 2) Log in through the browser (if needed) -----------
if ! gh auth status >/dev/null 2>&1; then
    echo "[3/5] Opening the login page in your browser..."
    echo "        Choose: GitHub.com → HTTPS → Login with a web browser"
    echo "        Follow the one-time code in the browser."
    echo "        Logging in with Google WORKS TOO — no token needed! 😊"
    gh auth login -h github.com -p https -w
fi
USERNAME="$(gh api user -q .login)"
echo "[3/5] Logged in as: @${USERNAME} ✓"

# --- 3) Commit changes (if any) --------------------------
git add -A
if git diff --cached --quiet; then
    echo "[4/5] No new changes — everything is already committed ✓"
else
    if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
        echo ""
        echo "  ⚠ Git doesn't know your identity yet. Run this once:"
        echo "      git config --global user.name  \"Your Name\""
        echo "      git config --global user.email \"your-email@example.com\""
        echo "  Then run ./push-gh.sh again."
        echo ""
        exit 1
    fi
    echo "[4/5] Creating commit..."
    git commit -m "✨ Update Nana AI VTuber"
fi

# --- 4) Create repo (if needed) + push -------------------
# Ask first: Public (visible to everyone) or Private (just you)?
REPO_VISIBILITY=""
while [ -z "$REPO_VISIBILITY" ]; do
    echo "  ➜ Should the repo be Public (visible to everyone) or Private (just you)?"
    echo "    Type: public  or  private"
    read -r REPO_VISIBILITY
    REPO_VISIBILITY="$(echo "$REPO_VISIBILITY" | tr '[:upper:]' '[:lower:]')"
    case "$REPO_VISIBILITY" in
        public|private) ;;
        *) REPO_VISIBILITY="" ;;
    esac
done

if gh repo view "${REPO_NAME}" >/dev/null 2>&1; then
    echo "[5/5] Repo already exists, just uploading..."
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/${USERNAME}/${REPO_NAME}.git"
else
    echo "[5/5] Creating a new repo (${REPO_VISIBILITY}) + uploading..."
    gh repo create "${REPO_NAME}" "--${REPO_VISIBILITY}" --source . --remote origin \
        --description "💙 Nana AI VTuber — 3D virtual AI companion powered by Ollama"
fi

if ! git push -u origin main; then
    echo ""
    echo "  ⚠ Push failed. If the error says 'non-fast-forward',"
    echo "    the repo on GitHub may already contain files (e.g. a README)."
    echo "    Fix it with:  git pull origin main --rebase"
    echo "    then retry:   ./push-gh.sh"
    exit 1
fi

echo ""
echo "  ✅ DONE! 🎉"
echo "     Your repo is now at:"
echo "     https://github.com/${USERNAME}/${REPO_NAME}"
echo "=================================================="
