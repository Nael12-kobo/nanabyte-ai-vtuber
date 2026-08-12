# 🤝 Contributing

Thanks for wanting to make Nana even better! 💙

## Getting started

1. **Fork** this repository.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/Nael12-kobo/nanabyte-ai-vtuber.git
   cd nanabyte-ai-vtuber
   ```
3. Create a new branch:
   ```bash
   git checkout -b feature/description-of-feature
   ```
4. Run and test:
   ```bash
   ./run.sh        # make sure the app still works as expected
   ```
5. Commit, push, then open a **Pull Request**.

## Small rules

- Keep comments in **Indonesian** to match the existing codebase.
- Follow the existing code style (4-space indentation, short descriptive comments).
- **Do not commit** these files:
  - `.venv/`, `venv/`, `__pycache__/`
  - `memory.json` (user's personal data)
  - `generated_files/`
- If you change `requirements.txt`, update `run.sh` too if needed.
- Make sure the syntax is valid before a PR:
  ```bash
  python -m py_compile app.py main.py
  ```

## Reporting bugs

Open a **GitHub Issue** with this format:

```
**Description**: what happened?
**Steps to reproduce**: 1. ... 2. ...
**Expected**: what should have happened
**Logs/errors**: paste the terminal output or Console (F12)
```

Thanks for contributing! 😸
