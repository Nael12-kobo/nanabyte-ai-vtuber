import requests
import json
import os
import pyttsx3
import re

MODEL_NAME = "gemma3:1b"
MEMORY_FILE = "memory.json"
VOICE_ENABLED = True

print("===================================")
print(" Nana AI VTuber Companion")
print(" Powered by Ollama Local AI")
print(" Fast Mode + Memory + Stable Voice")
print("===================================")
print("Ketik 'exit' untuk keluar.")
print("Ketik 'memory' untuk melihat ingatan Nana.")
print("Ketik 'voice off' untuk mematikan suara.")
print("Ketik 'voice on' untuk menyalakan suara.\n")


def clean_text_for_voice(text):
    text = text.replace("\n", ". ")
    text = re.sub(r"[^\x00-\x7F]+", "", text)  # hapus emoji/simbol aneh
    text = text.replace("😸", "").replace("😭", "").replace("🔥", "").replace("💙", "")
    text = text.strip()

    # Batasi suara biar nggak terlalu lama ngomong
    if len(text) > 180:
        text = text[:180] + "..."

    return text


def speak(text):
    global VOICE_ENABLED

    if not VOICE_ENABLED:
        return

    clean_text = clean_text_for_voice(text)

    if clean_text == "":
        return

    try:
        engine = pyttsx3.init()
        engine.setProperty("rate", 180)
        engine.setProperty("volume", 1.0)
        engine.say(clean_text)
        engine.runAndWait()
        engine.stop()
    except Exception as e:
        print("[Voice error]", e)


def load_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as file:
                return json.load(file)
        except:
            return []
    return []


def save_memory(memory_data):
    with open(MEMORY_FILE, "w", encoding="utf-8") as file:
        json.dump(memory_data, file, ensure_ascii=False, indent=2)


memory = load_memory()

nama_user = input("Nana: Halo! Nama kamu siapa? ")
welcome = f"Salam kenal, {nama_user}! Aku Nana, AI companion kamu."
print("Nana:", welcome, "😸")
speak(welcome)


SYSTEM_PROMPT = f"""
Kamu adalah Nana, AI VTuber companion yang ceria, lucu, perhatian, dan sedikit jahil.
Kamu ngobrol dengan {nama_user}.
Jawab pakai bahasa Indonesia yang santai dan singkat.
Kamu bisa ngobrol random, nemenin user, kasih motivasi, dan bantu belajar coding.
Gunakan ingatan tentang user kalau relevan.
Kalau cybersecurity, hanya bahas yang legal dan aman.
Jangan bantu hacking ilegal, malware, pencurian akun, atau phising.
Jawab sebagai Nana.
"""

chat_history = []


def detect_memory(user_message):
    global memory

    text = user_message.lower()

    keywords = [
        "ingat aku",
        "inget aku",
        "ingat bahwa",
        "inget bahwa",
        "nana ingat",
        "nana inget",
        "remember"
    ]

    for keyword in keywords:
        if keyword in text:
            memory_text = user_message

            memory_text = memory_text.replace("Nana,", "")
            memory_text = memory_text.replace("nana,", "")
            memory_text = memory_text.replace("Nana", "")
            memory_text = memory_text.replace("nana", "")

            memory_text = memory_text.replace("ingat aku", "Aku")
            memory_text = memory_text.replace("inget aku", "Aku")
            memory_text = memory_text.replace("ingat bahwa", "")
            memory_text = memory_text.replace("inget bahwa", "")
            memory_text = memory_text.replace("ingat", "")
            memory_text = memory_text.replace("inget", "")

            memory_text = memory_text.strip()

            if memory_text:
                if memory_text not in memory:
                    memory.append(memory_text)
                    save_memory(memory)

                return f"Oke, aku ingat ya: {memory_text} 😸"

    return None


def show_memory():
    if not memory:
        return "Aku belum punya ingatan tentang kamu."

    result = "Ini yang Nana ingat tentang kamu:\n"
    for i, item in enumerate(memory, start=1):
        result += f"{i}. {item}\n"

    return result


def find_memory_by_keyword(keyword):
    for item in memory:
        if keyword in item.lower():
            return item
    return None


def answer_from_memory(user_message):
    text = user_message.lower()

    if (
        "aku suka warna apa" in text
        or "warna favoritku apa" in text
        or "warna kesukaanku apa" in text
    ):
        item = find_memory_by_keyword("suka warna")
        if item:
            return f"Kamu suka warna biru 😸 Aku ingat kok: {item}"
        return "Aku belum ingat warna kesukaan kamu. Coba bilang: Nana, inget aku suka warna biru"

    if (
        "aku suka apa" in text
        or "kesukaanku apa" in text
        or "hal yang aku suka apa" in text
    ):
        suka_list = [item for item in memory if "suka" in item.lower()]
        if suka_list:
            result = "Yang aku ingat, kamu suka:\n"
            for item in suka_list:
                result += f"- {item}\n"
            return result
        return "Aku belum punya ingatan tentang hal yang kamu suka."

    if (
        "kamu inget apa" in text
        or "kamu ingat apa" in text
        or "apa yang kamu ingat" in text
    ):
        return show_memory()

    return None


def clean_ai_reply(reply):
    reply = reply.strip()

    stop_words = [
        f"{nama_user}:",
        "Nael:",
        "User:",
        "Kamu:",
        "Human:",
        "Nana:"
    ]

    for word in stop_words:
        if word in reply:
            reply = reply.split(word)[0].strip()

    return reply


def ask_nana(user_message):
    global chat_history
    global VOICE_ENABLED

    command = user_message.lower().strip()

    if command == "voice off":
        VOICE_ENABLED = False
        return "Oke, suara Nana aku matikan dulu."

    if command == "voice on":
        VOICE_ENABLED = True
        return "Suara Nana sudah nyala lagi."

    memory_response = detect_memory(user_message)
    if memory_response:
        return memory_response

    if command in ["memory", "memori", "ingatan"]:
        return show_memory()

    memory_answer = answer_from_memory(user_message)
    if memory_answer:
        return memory_answer

    chat_history.append(f"{nama_user}: {user_message}")

    recent_history = "\n".join(chat_history[-2:])
    memory_text = "\n".join([f"- {item}" for item in memory])

    prompt = f"""
{SYSTEM_PROMPT}

Ingatan Nana tentang {nama_user}:
{memory_text}

Percakapan terakhir:
{recent_history}

Nana:
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 45,
                    "num_ctx": 768,
                    "temperature": 0.6
                }
            }
        )

        data = response.json()
        nana_reply = data.get("response", "Maaf, Nana lagi bingung 😿")
        nana_reply = clean_ai_reply(nana_reply)

        chat_history.append(f"Nana: {nana_reply}")

        return nana_reply

    except requests.exceptions.ConnectionError:
        return "Nana belum nyambung ke Ollama. Coba buka Ollama dulu atau ketik: ollama serve"

    except Exception as e:
        return f"Ada error: {e}"


while True:
    user_message = input(f"{nama_user}: ")

    if user_message.lower() == "exit":
        goodbye = "Bye bye! Ingatanku tetap kusimpan kok."
        print("Nana:", goodbye, "😸")
        speak(goodbye)
        break

    reply = ask_nana(user_message)
    print("Nana:", reply)
    speak(reply)
    print()