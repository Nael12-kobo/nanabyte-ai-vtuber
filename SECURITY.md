# 🔐 Security

## Reporting vulnerabilities

If you find a security issue, **don't open a public issue**. Report it via GitHub **Security Advisories** (repo → *Security* → *Report a vulnerability*) or email the repo owner directly.

Please include:
- A short description of the vulnerability
- Steps to reproduce
- The potential impact

## Notes for self-hosting

- `app.py` still uses `app.run(debug=True)`. **Don't expose it to the public internet** without:
  - disabling debug mode, and
  - using a production server (gunicorn/waitress) + HTTPS.
- Ollama runs locally on `127.0.0.1:11434` — make sure it's not open to the external network.
- `memory.json` contains personal data — don't commit or share it.
- Edge TTS uses Microsoft's unofficial service; for large commercial use, use an official TTS.
- The mic feature only works on `localhost`/HTTPS (browsers block mic access on non-local HTTP).
