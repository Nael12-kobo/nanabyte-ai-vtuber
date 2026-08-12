# 🤝 Kontribusi

Makasih udah mau bantu Nana jadi lebih baik! 💙

## Cara mulai

1. **Fork** repo ini.
2. **Clone** fork kamu:
   ```bash
   git clone https://github.com/<username>/nanabyte-ai-vtuber.git
   cd nanabyte-ai-vtuber
   ```
3. Buat branch baru:
   ```bash
   git checkout -b fitur/deskripsi-fitur
   ```
4. Jalankan & tes:
   ```bash
   ./run.sh        # pastikan aplikasi tetap jalan normal
   ```
5. Commit, push, lalu buat **Pull Request**.

## Aturan kecil

- **Bahasa Indonesia** untuk kode, komentar, dan pesan commit.
- Ikuti gaya kode yang sudah ada (indentasi 4 spasi, fungsi berkomentar singkat).
- **Jangan commit** file berikut:
  - `.venv/`, `venv/`, `__pycache__/`
  - `memory.json` (data pribadi user)
  - `generated_files/`
- Kalau ubah `requirements.txt`, update juga `run.sh` jika perlu.
- Pastikan syntax valid sebelum PR:
  ```bash
  python -m py_compile app.py main.py
  ```

## Melaporkan bug

Buka **GitHub Issues** dengan format:

```
**Deskripsi**: apa yang terjadi?
**Langkah reproduce**: 1. ... 2. ...
**Harapan**: seharusnya ...
**Log/error**: tempel output terminal atau Console (F12)
```

Makasih udah berkontribusi! 😸
