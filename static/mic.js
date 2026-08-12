const micButton = document.getElementById("mic-btn");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;
let autoConversationMode = false;
let waitingForNana = false;
let nanaIsSpeaking = false;
let sentTranscript = false;
let restartTimer = null;

function clearRestartTimer() {
    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
    }
}

function setMicUI(mode = "idle") {
    if (!micButton) return;

    micButton.disabled = false;
    micButton.style.background = "";
    micButton.style.borderColor = "";

    if (mode === "listening") {
        micButton.textContent = "🎙️ Mendengar... klik untuk berhenti";
        micButton.style.background = "rgba(104, 255, 180, 0.22)";
        micButton.style.borderColor = "rgba(104, 255, 180, 0.55)";
        return;
    }

    if (mode === "waiting") {
        micButton.textContent = "⏳ Nana sedang mikir... klik untuk matikan mic";
        return;
    }

    if (mode === "speaking") {
        micButton.textContent = "🔊 Nana bicara... mic akan buka lagi";
        micButton.style.background = "rgba(112, 148, 255, 0.22)";
        micButton.style.borderColor = "rgba(112, 148, 255, 0.55)";
        return;
    }

    if (mode === "unsupported") {
        micButton.textContent = "Mic tidak didukung";
        micButton.disabled = true;
        return;
    }

    micButton.textContent = "🎤 Mic";
}

function updateInputHint(text = "Ketik pesan ke Nana...") {
    if (messageInput) {
        messageInput.placeholder = text;
    }
}

function stopRecognition() {
    if (!recognition) return;

    try {
        recognition.abort();
    } catch (error) {
        // Browser bisa menolak kalau recognition sudah berhenti, aman diabaikan.
    }

    recognition = null;
    isListening = false;
}

function stopAutoConversation() {
    autoConversationMode = false;
    waitingForNana = false;
    clearRestartTimer();
    stopRecognition();
    setMicUI("idle");
    updateInputHint();
}

function scheduleListenAgain(delay = 650) {
    clearRestartTimer();

    if (!autoConversationMode || nanaIsSpeaking || waitingForNana) {
        return;
    }

    restartTimer = setTimeout(() => {
        startListening(true);
    }, delay);
}

function makeRecognition() {
    const instance = new SpeechRecognition();

    instance.lang = "id-ID";
    instance.interimResults = true;
    instance.continuous = false;
    instance.maxAlternatives = 1;

    instance.onresult = (event) => {
        let finalText = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalText += text;
            } else {
                interimText += text;
            }
        }

        if (interimText) {
            updateInputHint(`🎙️ ${interimText}`);
        }

        finalText = finalText.trim();

        if (finalText && !sentTranscript) {
            sentTranscript = true;
            waitingForNana = true;

            if (messageInput) {
                messageInput.value = finalText;
            }

            setMicUI("waiting");
            updateInputHint("Nana sedang menyiapkan jawaban...");

            try {
                instance.stop();
            } catch (error) {
                // Aman diabaikan.
            }

            setTimeout(() => {
                chatForm.requestSubmit();
            }, 80);
        }
    };

    instance.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            autoConversationMode = false;
            alert("Nana belum dapat izin mikrofon. Klik ikon gembok di kiri alamat 127.0.0.1:5000, lalu izinkan Microphone.");
            return;
        }

        // Kalau hening, mic akan buka lagi otomatis selama mode percakapan masih aktif.
        if (event.error !== "aborted" && event.error !== "no-speech") {
            console.warn("Mic Nana:", event.error);
        }
    };

    instance.onend = () => {
        isListening = false;
        recognition = null;
        sentTranscript = false;

        if (!autoConversationMode) {
            setMicUI("idle");
            updateInputHint();
            return;
        }

        if (waitingForNana || nanaIsSpeaking) {
            return;
        }

        // Tidak ada suara yang tertangkap: dengarkan lagi pelan-pelan.
        scheduleListenAgain(700);
    };

    return instance;
}

async function startListening(fromAutoRestart = false) {
    if (!SpeechRecognition) {
        setMicUI("unsupported");
        alert("Browser ini belum mendukung fitur mic. Coba pakai Google Chrome.");
        return;
    }

    if (!fromAutoRestart && autoConversationMode) {
        // Klik lagi saat mode aktif = mematikan mode percakapan.
        stopAutoConversation();
        return;
    }

    if (isListening || nanaIsSpeaking || waitingForNana) {
        return;
    }

    try {
        clearRestartTimer();

        // Sekali klik menyalakan mode ngobrol terus.
        autoConversationMode = true;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
        }

        recognition = makeRecognition();
        isListening = true;
        sentTranscript = false;

        setMicUI("listening");
        updateInputHint("Nana mendengarkan... bicara sekarang");

        recognition.start();
    } catch (error) {
        autoConversationMode = false;
        isListening = false;
        recognition = null;
        setMicUI("idle");
        updateInputHint();

        if (error && error.name === "NotAllowedError") {
            alert("Izin mikrofon ditolak. Klik ikon gembok di kiri alamat 127.0.0.1:5000, lalu izinkan Microphone.");
        } else {
            alert("Mic belum bisa dimulai. Pastikan mic tidak dipakai aplikasi lain, lalu coba lagi.");
            console.error(error);
        }
    }
}

// Event dari app.js: saat Nana mulai bicara, mic berhenti agar tidak menangkap suara Nana.
window.addEventListener("nana-voice-start", () => {
    nanaIsSpeaking = true;
    waitingForNana = false;
    clearRestartTimer();

    if (recognition) {
        stopRecognition();
    }

    if (autoConversationMode) {
        setMicUI("speaking");
        updateInputHint("Nana sedang bicara...");
    }
});

// Event dari app.js: saat Nana selesai bicara, mic otomatis dengar lagi.
window.addEventListener("nana-voice-end", () => {
    nanaIsSpeaking = false;
    waitingForNana = false;

    if (autoConversationMode) {
        updateInputHint("Nana selesai. Kamu bisa bicara lagi...");
        scheduleListenAgain(650);
    } else {
        setMicUI("idle");
        updateInputHint();
    }
});

if (micButton) {
    if (!SpeechRecognition) {
        setMicUI("unsupported");
    }

    micButton.addEventListener("click", () => {
        startListening(false);
    });
}
