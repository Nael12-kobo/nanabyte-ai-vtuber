import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

const container = document.getElementById("vrm-container");

// Kamera dibuat lebih dekat supaya Nana tampil dari kepala sampai sekitar pinggang.
// Framing webcam/VTuber: kepala sampai pinggang. Kaki sengaja tidak masuk frame.
const HALF_BODY_CAMERA = {
    // Framing setengah badan: kepala sampai pinggang/apron terlihat utuh.
    // Kamera ditarik sedikit supaya wajah tidak kepotong dan Nana tepat di tengah.
    fov: 30,
    position: new THREE.Vector3(0, 1.32, 1.95),
    target: new THREE.Vector3(0, 1.18, 0)
};

// =====================
// SCENE SETUP
// =====================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    HALF_BODY_CAMERA.fov,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

function applyHalfBodyCamera() {
    camera.fov = HALF_BODY_CAMERA.fov;
    camera.position.copy(HALF_BODY_CAMERA.position);
    camera.lookAt(HALF_BODY_CAMERA.target);
    camera.updateProjectionMatrix();
}

applyHalfBodyCamera();

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

renderer.domElement.style.pointerEvents = "none";
container.style.pointerEvents = "none";
container.style.userSelect = "none";

const ambientLight = new THREE.AmbientLight(0xffffff, 1.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(1, 3, 3);
scene.add(directionalLight);

let currentVrm = null;
let modelBaseY = 0;
let isSpeaking = false;
let voiceEnabled = true;

let currentExpression = "neutral";
let expressionEndTime = 0;

let currentGesture = "idle";
let gestureEndTime = 0;

let blinkValue = 0;
let nextBlinkTime = 2.5;

const loader = new GLTFLoader();

loader.register((parser) => {
    return new VRMLoaderPlugin(parser);
});

function centerModel(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    object.position.x -= center.x;
    object.position.y -= box.min.y;
    object.position.z -= center.z;

    const maxSize = Math.max(size.x, size.y, size.z);

    if (maxSize > 0) {
        const scale = 1.62 / maxSize;
        object.scale.setScalar(scale);
    }
}

function getBone(vrm, name) {
    if (!vrm || !vrm.humanoid) return null;

    try {
        return vrm.humanoid.getNormalizedBoneNode(name);
    } catch (error) {
        return null;
    }
}

// =====================
// BASE POSE BIAR TIDAK T-POSE
// =====================

function applyBasePose(elapsed) {
    if (!currentVrm) return;

    const head = getBone(currentVrm, "head");
    const chest = getBone(currentVrm, "chest");
    const spine = getBone(currentVrm, "spine");
    const upperChest = getBone(currentVrm, "upperChest");
    const hips = getBone(currentVrm, "hips");

    const leftUpperArm = getBone(currentVrm, "leftUpperArm");
    const rightUpperArm = getBone(currentVrm, "rightUpperArm");
    const leftLowerArm = getBone(currentVrm, "leftLowerArm");
    const rightLowerArm = getBone(currentVrm, "rightLowerArm");
    const leftHand = getBone(currentVrm, "leftHand");
    const rightHand = getBone(currentVrm, "rightHand");

    // Idle kepala dan badan
    if (head) {
        head.rotation.y = Math.sin(elapsed * 0.8) * 0.03;
        head.rotation.x = Math.sin(elapsed * 0.7) * 0.012;
        head.rotation.z = Math.sin(elapsed * 0.6) * 0.008;
    }

    if (chest) {
        chest.rotation.x = Math.sin(elapsed * 1.1) * 0.012;
        chest.rotation.z = Math.sin(elapsed * 0.8) * 0.009;
    }

    // Gerakan napas kecil agar Nana tetap terasa hidup walau sedang diam.
    if (spine) {
        spine.rotation.x = Math.sin(elapsed * 1.1) * 0.009;
        spine.rotation.z = Math.sin(elapsed * 0.75) * 0.007;
    }

    if (upperChest) {
        upperChest.rotation.x = Math.sin(elapsed * 1.1) * 0.012;
        upperChest.rotation.z = Math.sin(elapsed * 0.8) * 0.009;
    }

    if (hips) {
        hips.rotation.z = Math.sin(elapsed * 0.55) * 0.003;
    }

    if (currentVrm.scene) {
        currentVrm.scene.position.y = modelBaseY + Math.sin(elapsed * 1.1) * 0.006;
    }

    // Pose tangan santai, bukan T-pose
    if (leftUpperArm) {
        leftUpperArm.rotation.z = 1.15;
        leftUpperArm.rotation.x = 0.12;
        leftUpperArm.rotation.y = 0.03;
    }

    if (rightUpperArm) {
        rightUpperArm.rotation.z = -1.15;
        rightUpperArm.rotation.x = 0.12;
        rightUpperArm.rotation.y = -0.03;
    }

    if (leftLowerArm) {
        leftLowerArm.rotation.z = 0.25;
        leftLowerArm.rotation.x = 0.05;
    }

    if (rightLowerArm) {
        rightLowerArm.rotation.z = -0.25;
        rightLowerArm.rotation.x = 0.05;
    }

    if (leftHand) {
        leftHand.rotation.z = 0.08;
    }

    if (rightHand) {
        rightHand.rotation.z = -0.08;
    }
}

// =====================
// EXPRESSION SYSTEM
// =====================

/*
  Model nana.vrm ini VRM 0.x dengan nama ekspresi sendiri:
  - mulut: A / I / U / E / O   (bukan aa / ih / ou)
  - emosi: Joy / Sorrow / Fun / Angry / Surprised / Neutral
  - mata:  Blink / Blink_L / Blink_R

  Supaya kode tetap memakai nama umum, kita buat peta alias: nama semantik
  (aa, happy, sad, ...) dicocokkan ke nama asli yang benar-benar ada di model.
  Kalau model VRM 1.0 dipakai nanti, mapping ini otomatis menyesuaikan juga.
*/
const EXPRESSION_ALIASES = {
    aa: ["aa", "a", "A"],
    ih: ["ih", "i", "I"],
    ou: ["ou", "u", "U", "o", "O"],
    happy: ["happy", "joy", "fun"],
    sad: ["sad", "sorrow"],
    angry: ["angry"],
    surprised: ["surprised"],
    relaxed: ["relaxed", "neutral"],
    thinking: ["thinking", "neutral"],
    blink: ["blink"],
    blinkLeft: ["blinkleft", "blink_l"],
    blinkRight: ["blinkright", "blink_r"]
};

// Nama asli ekspresi yang tersedia di model: "nama-lowercase" -> "nama asli".
let expressionNameMap = {};

function buildExpressionMap() {
    if (!currentVrm?.expressionManager?.expressions) return;

    const map = {};
    const expressions = currentVrm.expressionManager.expressions;

    if (Array.isArray(expressions)) {
        // three-vrm v3: expressions adalah ARRAY. setValue memakai expressionName
        // (nama bersih, misal "aa", "happy"), BUKAN name yang berprefiks VRMExpression_.
        for (const expression of expressions) {
            const key = expression?.expressionName;
            if (key) map[String(key).toLowerCase()] = key;
        }
    } else if (expressions instanceof Map) {
        // Cadangan: beberapa versi memakai Map nama -> expression.
        for (const [name, expression] of expressions) {
            const key = expression?.expressionName || name;
            if (key) map[String(key).toLowerCase()] = key;
        }
    }

    expressionNameMap = map;
    console.log("Ekspresi tersedia:", Object.keys(map).join(", "));
}

function resolveExpressionName(semanticName) {
    const aliases = EXPRESSION_ALIASES[semanticName] || [semanticName];

    for (const alias of aliases) {
        const actual = expressionNameMap[alias.toLowerCase()];
        if (actual) return actual;
    }

    return null;
}

function setExpressionValue(semanticName, value) {
    if (!currentVrm || !currentVrm.expressionManager) return;

    // Cari nama asli di model (misal "happy" -> "Joy"). Kalau tidak ada,
    // ekspresi itu dilewati dengan aman.
    const actualName = resolveExpressionName(semanticName);
    if (!actualName) return;

    try {
        currentVrm.expressionManager.setValue(actualName, value);
    } catch (error) {
        // Kalau blendshape model ini tidak punya ekspresi tersebut, abaikan.
    }
}

function resetExpressions() {
    const expressions = [
        "happy",
        "angry",
        "sad",
        "relaxed",
        "surprised",
        "blink",
        "blinkLeft",
        "blinkRight"
    ];

    expressions.forEach((name) => setExpressionValue(name, 0));
}

function applyExpression(name, durationSeconds = 3) {
    currentExpression = name;
    expressionEndTime = performance.now() + durationSeconds * 1000;
}

function updateExpression() {
    if (!currentVrm || !currentVrm.expressionManager) return;

    resetExpressions();

    if (currentExpression === "happy") {
        setExpressionValue("happy", 0.82);
    }

    if (currentExpression === "sad") {
        setExpressionValue("sad", 0.75);
    }

    if (currentExpression === "angry") {
        setExpressionValue("angry", 0.80);
    }

    if (currentExpression === "surprised") {
        setExpressionValue("surprised", 0.82);
    }

    // Tidak semua VRM punya blendshape "fear". Gabungan kaget + sedih
    // tetap terlihat seperti takut tanpa membuat model error.
    if (currentExpression === "fear") {
        setExpressionValue("surprised", 0.58);
        setExpressionValue("sad", 0.25);
    }

    if (currentExpression === "relaxed") {
        setExpressionValue("relaxed", 0.50);
    }

    if (currentExpression === "thinking") {
        setExpressionValue("relaxed", 0.30);
    }

    setExpressionValue("blink", blinkValue);

    if (performance.now() > expressionEndTime && currentExpression !== "neutral") {
        currentExpression = "neutral";
    }
}

// Membaca emosi dari pesan Nael. Fungsi ini juga akan kepakai nanti saat input
// datang dari mic, karena semua pesan tetap masuk lewat sendMessageToNana().
function detectEmotionFromText(text) {
    const lower = (text || "").toLowerCase();

    const hasAny = (words) => words.some((word) => lower.includes(word));

    // Prioritasnya penting: takut/marah/sedih jangan kalah oleh kata "semangat".
    if (hasAny([
        "marah", "kesel", "kesal", "bete", "jengkel", "emosi", "dongkol",
        "sebal", "muak", "benci", "geram", "ngambek", "nyebelin"
    ])) {
        return "angry";
    }

    if (hasAny([
        "takut", "ngeri", "cemas", "khawatir", "panik", "deg-degan", "degdegan",
        "was-was", "trauma", "menakutkan", "merinding"
    ])) {
        return "fear";
    }

    if (hasAny([
        "sedih", "nangis", "kecewa", "capek", "lelah", "putus asa", "hancur",
        "kesepian", "kangen", "down", "gagal", "sakit hati"
    ])) {
        return "sad";
    }

    if (hasAny([
        "kaget", "terkejut", "wah", "wih", "serius", "beneran", "astaga",
        "ya ampun", "gila", "kok bisa"
    ])) {
        return "surprised";
    }

    if (hasAny([
        "senang", "bahagia", "mantap", "semangat", "keren", "berhasil", "lucu",
        "wkwk", "haha", "hehe", "asik", "asyik", "makasih", "terima kasih", "😸", "😊"
    ])) {
        return "happy";
    }

    if (hasAny([
        "hmm", "bingung", "mungkin", "menurut", "coba pikir", "gimana ya", "pikir"
    ])) {
        return "thinking";
    }

    return "neutral";
}

function chooseExpressionFromText(text) {
    return detectEmotionFromText(text);
}

function gestureFromEmotion(emotion, isSpeakingGesture = false) {
    if (emotion === "happy") return "happy";
    if (emotion === "sad") return "soft";
    if (emotion === "angry") return "angry";
    if (emotion === "fear") return "fear";
    if (emotion === "surprised") return "surprised";
    if (emotion === "thinking") return "thinking";
    return isSpeakingGesture ? "talking" : "idle";
}

function chooseGestureFromText(text) {
    return gestureFromEmotion(detectEmotionFromText(text), true);
}

function updateBlink(elapsed) {
    if (elapsed > nextBlinkTime) {
        blinkValue = 1;

        setTimeout(() => {
            blinkValue = 0;
        }, 120);

        nextBlinkTime = elapsed + 2.5 + Math.random() * 3;
    }
}

// =====================
// GESTURE SYSTEM
// =====================

function applyGesture(name, durationSeconds = 3) {
    currentGesture = name;
    gestureEndTime = performance.now() + durationSeconds * 1000;
}

function updateGesture(elapsed) {
    if (!currentVrm) return;

    const head = getBone(currentVrm, "head");
    const chest = getBone(currentVrm, "chest");
    const spine = getBone(currentVrm, "spine");
    const upperChest = getBone(currentVrm, "upperChest");

    const leftUpperArm = getBone(currentVrm, "leftUpperArm");
    const rightUpperArm = getBone(currentVrm, "rightUpperArm");
    const leftLowerArm = getBone(currentVrm, "leftLowerArm");
    const rightLowerArm = getBone(currentVrm, "rightLowerArm");

    if (performance.now() > gestureEndTime && currentGesture !== "idle") {
        currentGesture = "idle";
    }

    // Base pose selalu dipasang dulu supaya tidak balik T-pose
    applyBasePose(elapsed);

    if (currentGesture === "idle") {
        return;
    }

    if (currentGesture === "thinking") {
        if (head) {
            head.rotation.x = 0.08 + Math.sin(elapsed * 1.2) * 0.01;
            head.rotation.y = Math.sin(elapsed * 0.8) * 0.02;
        }

        if (chest) {
            chest.rotation.x = 0.025;
        }

        // Tangan tetap aman di base pose
        return;
    }

    if (currentGesture === "happy") {
        // Happy sekarang AMAN: kepala + badan saja, tangan tidak ikut nepuk paha
        if (head) {
            head.rotation.y = Math.sin(elapsed * 2.0) * 0.06;
            head.rotation.z = Math.sin(elapsed * 2.4) * 0.03;
            head.rotation.x = Math.sin(elapsed * 1.8) * 0.02;
        }

        if (chest) {
            chest.rotation.z = Math.sin(elapsed * 2.0) * 0.02;
            chest.rotation.x = Math.sin(elapsed * 1.6) * 0.014;
        }

        if (spine) {
            spine.rotation.z = Math.sin(elapsed * 2.0) * 0.014;
        }

        if (upperChest) {
            upperChest.rotation.z = Math.sin(elapsed * 2.0) * 0.018;
        }

        // Lambaian kecil di bahu, tetap aman dan tidak mengubah pose tangan drastis.
        if (leftUpperArm) {
            leftUpperArm.rotation.z = 1.15 + Math.sin(elapsed * 3.2) * 0.03;
            leftUpperArm.rotation.x = 0.12;
        }

        if (rightUpperArm) {
            rightUpperArm.rotation.z = -1.15 - Math.sin(elapsed * 3.2) * 0.03;
            rightUpperArm.rotation.x = 0.12;
        }

        if (leftLowerArm) {
            leftLowerArm.rotation.z = 0.25;
            leftLowerArm.rotation.x = 0.05;
        }

        if (rightLowerArm) {
            rightLowerArm.rotation.z = -0.25;
            rightLowerArm.rotation.x = 0.05;
        }

        return;
    }

    if (currentGesture === "soft") {
        if (head) {
            head.rotation.x = 0.06;
            head.rotation.y = Math.sin(elapsed * 0.6) * 0.02;
        }

        if (chest) {
            chest.rotation.x = 0.02;
        }

        return;
    }

    if (currentGesture === "surprised") {
        if (head) {
            head.rotation.x = -0.04;
            head.rotation.y = Math.sin(elapsed * 1.5) * 0.035;
        }

        if (chest) {
            chest.rotation.x = -0.015;
        }

        // Tangan tetap aman di base pose
        return;
    }

    if (currentGesture === "angry") {
        // Marah: postur sedikit maju dan tegas, tapi tangan tetap aman.
        if (head) {
            head.rotation.x = 0.055;
            head.rotation.y = Math.sin(elapsed * 0.9) * 0.018;
            head.rotation.z = -0.012;
        }

        if (chest) {
            chest.rotation.x = 0.028;
            chest.rotation.z = -0.01;
        }

        if (spine) {
            spine.rotation.x = 0.018;
        }

        if (leftUpperArm) {
            leftUpperArm.rotation.z = 1.08;
            leftUpperArm.rotation.x = 0.16;
        }

        if (rightUpperArm) {
            rightUpperArm.rotation.z = -1.08;
            rightUpperArm.rotation.x = 0.16;
        }

        if (leftLowerArm) {
            leftLowerArm.rotation.z = 0.31;
        }

        if (rightLowerArm) {
            rightLowerArm.rotation.z = -0.31;
        }

        return;
    }

    if (currentGesture === "fear") {
        // Takut: badan sedikit mundur, kepala menoleh kecil, lengan merapat.
        if (head) {
            head.rotation.x = -0.035;
            head.rotation.y = Math.sin(elapsed * 1.5) * 0.035;
            head.rotation.z = Math.sin(elapsed * 1.2) * 0.012;
        }

        if (chest) {
            chest.rotation.x = -0.022;
        }

        if (spine) {
            spine.rotation.x = -0.014;
        }

        if (leftUpperArm) {
            leftUpperArm.rotation.z = 1.04;
            leftUpperArm.rotation.x = 0.18;
        }

        if (rightUpperArm) {
            rightUpperArm.rotation.z = -1.04;
            rightUpperArm.rotation.x = 0.18;
        }

        if (leftLowerArm) {
            leftLowerArm.rotation.z = 0.34;
            leftLowerArm.rotation.x = 0.09;
        }

        if (rightLowerArm) {
            rightLowerArm.rotation.z = -0.34;
            rightLowerArm.rotation.x = 0.09;
        }

        return;
    }

    if (currentGesture === "talking") {
        if (head) {
            head.rotation.y = Math.sin(elapsed * 1.4) * 0.045;
            head.rotation.x = Math.sin(elapsed * 1.1) * 0.018;
        }

        if (chest) {
            chest.rotation.z = Math.sin(elapsed * 1.2) * 0.014;
        }

        if (spine) {
            spine.rotation.z = Math.sin(elapsed * 1.2) * 0.01;
        }

        if (upperChest) {
            upperChest.rotation.x = Math.sin(elapsed * 2.2) * 0.012;
        }

        // Gerak bahu kecil saat bicara supaya terasa hidup, tanpa membuat tangan liar.
        if (leftUpperArm) {
            leftUpperArm.rotation.z = 1.15 + Math.sin(elapsed * 2.6) * 0.02;
        }

        if (rightUpperArm) {
            rightUpperArm.rotation.z = -1.15 - Math.sin(elapsed * 2.6) * 0.02;
        }

        return;
    }
}

// =====================
// MOUTH / VOICE
// =====================

function setMouth(value) {
    if (!currentVrm || !currentVrm.expressionManager) return;

    const v = Math.max(0, Math.min(1, value));

    // Nama semantik: otomatis dipetakan ke A/I/U (VRM 0.x) atau aa/ih/ou (VRM 1.0).
    setExpressionValue("aa", v);
    setExpressionValue("ih", v * 0.25);
    setExpressionValue("ou", v * 0.15);
}

let currentVoiceAudio = null;
let currentVoiceAudioUrl = null;
let ttsAbortController = null;

// =====================
// LIP-SYNC (AUDIO LEVEL)
// =====================
// Mulut Nana terbuka mengikuti level audio ASLI dari file TTS yang diputar,
// bukan animasi sinus palsu. Caranya: AnalyserNode membaca RMS waveform audio,
// lalu nilai itu di-mapping ke expression "aa" (mulut terbuka).

let lipSyncContext = null;
let lipSyncAnalyser = null;
let lipSyncSource = null;
let lipSyncData = null;

function getLipSyncContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!lipSyncContext) {
        try {
            lipSyncContext = new AudioContextClass();
        } catch (error) {
            return null;
        }
    }

    if (lipSyncContext.state === "suspended") {
        lipSyncContext.resume().catch(() => {});
    }

    return lipSyncContext;
}

// PENTING: begitu createMediaElementSource dipakai, suara elemen audio itu
// hanya mengalir lewat Web Audio graph. Jadi Analyser WAJIB disambung ke
// destination, kalau tidak suaranya malah hilang/senyap.
function connectLipSync(audio) {
    const context = getLipSyncContext();
    if (!context || !audio) return;

    try {
        disconnectLipSync();

        lipSyncSource = context.createMediaElementSource(audio);
        lipSyncAnalyser = context.createAnalyser();
        lipSyncAnalyser.fftSize = 256;
        lipSyncAnalyser.smoothingTimeConstant = 0.6;

        lipSyncSource.connect(lipSyncAnalyser);
        lipSyncAnalyser.connect(context.destination);

        lipSyncData = new Uint8Array(lipSyncAnalyser.fftSize);
    } catch (error) {
        console.warn("Lip-sync tidak bisa aktif:", error);
        disconnectLipSync();
    }
}

function disconnectLipSync() {
    if (lipSyncSource) {
        try {
            lipSyncSource.disconnect();
        } catch (error) {
            // Aman diabaikan.
        }
        lipSyncSource = null;
    }

    lipSyncAnalyser = null;
    lipSyncData = null;
}

// Level suara 0..1 dihitung dari RMS waveform audio yang sedang diputar.
function getAudioLevel() {
    if (!lipSyncAnalyser || !lipSyncData) return 0;

    lipSyncAnalyser.getByteTimeDomainData(lipSyncData);

    let sum = 0;

    for (let i = 0; i < lipSyncData.length; i++) {
        const value = (lipSyncData[i] - 128) / 128;
        sum += value * value;
    }

    const rms = Math.sqrt(sum / lipSyncData.length);
    return Math.min(1, rms * 3);
}

function stopSpeaking() {
    const wasSpeaking =
        isSpeaking ||
        (currentVoiceAudio && !currentVoiceAudio.paused) ||
        ("speechSynthesis" in window && window.speechSynthesis.speaking);

    // Batalkan fetch /tts yang masih diproses server supaya tidak ada
    // permintaan lama yang tetap jalan setelah user menekan Stop.
    if (ttsAbortController) {
        ttsAbortController.abort();
        ttsAbortController = null;
    }

    // Hentikan audio MP3 dari server kalau sedang diputar.
    if (currentVoiceAudio) {
        currentVoiceAudio.pause();
        currentVoiceAudio = null;
    }

    if (currentVoiceAudioUrl) {
        URL.revokeObjectURL(currentVoiceAudioUrl);
        currentVoiceAudioUrl = null;
    }

    // Matikan lip-sync supaya tidak menahan node Web Audio yang tidak terpakai.
    disconnectLipSync();

    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    isSpeaking = false;
    setMouth(0);
    applyGesture("idle", 1);

    // Saat suara dihentikan manual, mic dan UI juga tahu Nana sudah selesai bicara.
    if (wasSpeaking) {
        window.dispatchEvent(new CustomEvent("nana-voice-end"));
    }
}

// =====================
// SPEECH SYNTHESIS HELPERS
// =====================

// Beberapa browser (terutama Chrome) menahan speechSynthesis sampai halaman
// menerima interaksi user pertama. Event di bawah membuka kunci suara lebih awal
// sehingga Nana bisa langsung bicara tanpa bunyi klik aneh di awal.
function unlockSpeechSynthesis() {
    if ("speechSynthesis" in window) {
        // Speak utterance kosong sekalipun sedang ada suara lain itu aman.
        const silent = new SpeechSynthesisUtterance("");
        silent.volume = 0;
        window.speechSynthesis.speak(silent);
    }

    // Buat/resume AudioContext di dalam interaksi user pertama.
    // Tanpa ini browser menahan AudioContext di status "suspended"
    // (autoplay policy) dan lip-sync tidak bisa membaca level suara.
    getLipSyncContext();
}

["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    window.addEventListener(eventName, unlockSpeechSynthesis, { once: true });
});

let speechVoices = [];

function refreshSpeechVoices() {
    if (!("speechSynthesis" in window)) return;

    const voices = window.speechSynthesis.getVoices() || [];

    if (voices.length) {
        speechVoices = voices;
    }
}

refreshSpeechVoices();

if ("speechSynthesis" in window) {
    // getVoices() sering kosong di awal; event ini memastikan daftar voice terisi.
    window.speechSynthesis.onvoiceschanged = refreshSpeechVoices;
}

function pickSpeechVoice() {
    if (!speechVoices.length) {
        refreshSpeechVoices();
    }

    // Prioritas: voice Bahasa Indonesia dulu, lalu voice apa pun yang tersedia.
    return (
        speechVoices.find((voice) => /^id/i.test(voice.lang || "")) ||
        speechVoices.find((voice) => /indonesia/i.test(voice.name || "")) ||
        speechVoices[0] ||
        null
    );
}

let warnedNoVoice = false;

function warnNoVoiceAvailable() {
    if (warnedNoVoice) return;
    warnedNoVoice = true;

    addBubble(
        "Browser-ku belum menemukan voice TTS. Cek pengaturan suara sistem / browser " +
        "(install voice Bahasa Indonesia), lalu muat ulang halaman ya.",
        "nana"
    );
}

function speakWithBrowser(text, emotion = "neutral") {
    if (!voiceEnabled) return;

    if (!("speechSynthesis" in window)) {
        console.log("Browser tidak support speech synthesis.");
        return;
    }

    stopSpeaking();

    const voice = pickSpeechVoice();
    const utterance = new SpeechSynthesisUtterance(text);

    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || "id-ID";
    } else {
        // Chrome/Edge memuat daftar voice secara async. Kalau voice belum siap,
        // tetap bicara dengan voice default, lalu cek lagi sebentar kemudian —
        // baru beri peringatan kalau setelah itu memang tidak ada voice sama sekali.
        utterance.lang = "id-ID";

        setTimeout(() => {
            if (!pickSpeechVoice()) {
                warnNoVoiceAvailable();
            }
        }, 1500);
    }

    utterance.rate = 1.05;
    utterance.pitch = 1.15;
    utterance.volume = 1.0;

    utterance.onstart = () => {
        isSpeaking = true;
        applyGesture(gestureFromEmotion(emotion, true), 8);

        // Memberi tahu mic: Nana sedang bicara, jangan dengarkan suara Nana sendiri.
        window.dispatchEvent(new CustomEvent("nana-voice-start"));
    };

    utterance.onend = () => {
        isSpeaking = false;
        setMouth(0);
        applyGesture("idle", 1);

        // Memberi tahu mic: Nana selesai bicara, boleh dengarkan Nael lagi.
        window.dispatchEvent(new CustomEvent("nana-voice-end"));
    };

    utterance.onerror = () => {
        isSpeaking = false;
        setMouth(0);
        applyGesture("idle", 1);

        window.dispatchEvent(new CustomEvent("nana-voice-end"));
    };

    window.speechSynthesis.speak(utterance);
}

// Suara utama Nana: audio MP3 natural dari server (Edge TTS).
// Kalau server gagal (misal tidak ada internet), otomatis pakai suara browser.
async function speakWithServerTTS(text, emotion = "neutral") {
    if (!voiceEnabled) return;

    stopSpeaking();

    // AbortController agar fetch TTS bisa dibatalkan (tombol Stop / pesan baru).
    ttsAbortController = new AbortController();

    try {
        const response = await fetch("/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: ttsAbortController.signal,
            body: JSON.stringify({ text })
        });

        if (ttsAbortController.signal.aborted) {
            return "aborted";
        }

        if (!response.ok) {
            console.warn("TTS server gagal:", response.status);
            return false;
        }

        const blob = await response.blob();

        if (ttsAbortController.signal.aborted) {
            return "aborted";
        }

        if (!voiceEnabled) {
            return false;
        }

        // Buang URL lama kalau masih ada sebelum membuat yang baru.
        if (currentVoiceAudioUrl) {
            URL.revokeObjectURL(currentVoiceAudioUrl);
        }

        currentVoiceAudioUrl = URL.createObjectURL(blob);

        const audio = new Audio(currentVoiceAudioUrl);
        currentVoiceAudio = audio;

        // Sambungkan ke AnalyserNode supaya mulut Nana mengikuti level suara.
        connectLipSync(audio);

        audio.onplay = () => {
            isSpeaking = true;
            applyGesture(gestureFromEmotion(emotion, true), 8);

            window.dispatchEvent(new CustomEvent("nana-voice-start"));
        };

        audio.onended = () => {
            // Bersihkan URL juga saat audio selesai natural, bukan hanya saat stop.
            if (currentVoiceAudioUrl) {
                URL.revokeObjectURL(currentVoiceAudioUrl);
                currentVoiceAudioUrl = null;
            }

            currentVoiceAudio = null;
            disconnectLipSync();

            isSpeaking = false;
            setMouth(0);
            applyGesture("idle", 1);

            window.dispatchEvent(new CustomEvent("nana-voice-end"));
        };

        audio.onerror = () => {
            console.warn("Audio TTS gagal diputar.");

            if (currentVoiceAudioUrl) {
                URL.revokeObjectURL(currentVoiceAudioUrl);
                currentVoiceAudioUrl = null;
            }

            currentVoiceAudio = null;
            disconnectLipSync();

            isSpeaking = false;
            setMouth(0);
            applyGesture("idle", 1);

            window.dispatchEvent(new CustomEvent("nana-voice-end"));
        };

        await audio.play();
        console.log("Suara: Edge TTS server (neural).");
        return true;

    } catch (error) {
        if (error?.name === "AbortError" || ttsAbortController?.signal.aborted) {
            // Pembatalan disengaja (Stop / pesan baru) bukan error.
            return "aborted";
        }

        console.warn("TTS server tidak bisa dipakai, pakai suara browser:", error);

        // Bersihkan node lip-sync juga kalau audio gagal diputar (misal autoplay
        // diblokir), supaya tidak menahan Web Audio graph yang tidak terpakai.
        disconnectLipSync();
        return false;

    } finally {
        ttsAbortController = null;
    }
}

let warnedVoiceFallback = false;

function warnVoiceFallback() {
    if (warnedVoiceFallback) return;
    warnedVoiceFallback = true;

    addBubble(
        "Suara neural server tidak bisa dipakai, Nana pakai suara browser dulu " +
        "(terdengar lebih robotik). Cek koneksi internet lalu muat ulang halaman ya.",
        "nana"
    );
}

async function speakWithVoice(text, emotion = "neutral") {
    if (!voiceEnabled) return;

    // Suara utama: neural dari server. Kalau gagal, fallback ke speech browser.
    // Status "aborted" (Stop / pesan baru) TIDAK memicu fallback — pembatalan
    // disengaja tidak boleh membuat Nana malah mulai bicara lagi.
    const result = await speakWithServerTTS(text, emotion);

    if (result === false) {
        console.warn("Suara: fallback ke speech browser (kemungkinan robotik).");
        warnVoiceFallback();
        speakWithBrowser(text, emotion);
    }
}

// =====================
// LOAD VRM
// =====================

let vrmLoadAttempts = 0;

function loadVrm() {
    vrmLoadAttempts += 1;

    loader.load(
        "/static/models/nana.vrm",

        (gltf) => {
            const vrm = gltf.userData.vrm;

            if (!vrm) {
                alert("File terbaca, tapi bukan VRM valid.");
                return;
            }

            VRMUtils.removeUnnecessaryVertices(gltf.scene);
            VRMUtils.removeUnnecessaryJoints(gltf.scene);

            currentVrm = vrm;

            // Deteksi nama ekspresi asli (model ini VRM 0.x: A/I/U/E/O, Joy, Sorrow...).
            // Tanpa ini, mulut dan ekspresi tidak akan pernah bergerak.
            buildExpressionMap();

            scene.add(vrm.scene);
            centerModel(vrm.scene);

            // Simpan posisi dasar agar gerakan idle hanya naik-turun sangat halus.
            modelBaseY = vrm.scene.position.y;

            vrm.scene.rotation.y = Math.PI;

            applyExpression("relaxed", 2);
            applyGesture("idle", 2);

            console.log("VRM loaded:", vrm);
        },

        undefined,

        (error) => {
            console.error("Gagal load VRM (percobaan " + vrmLoadAttempts + "):", error);

            // Server Flask debug kadang restart saat file .py berubah — fetch bisa
            // gagal sesaat. Coba sekali lagi sebelum menyerah.
            if (vrmLoadAttempts < 2) {
                console.warn("Mencoba ulang load VRM...");
                setTimeout(loadVrm, 1500);
                return;
            }

            alert(
                "Gagal load nana.vrm.\n\n" +
                "Coba:\n" +
                "1. Muat ulang halaman (Ctrl+F5)\n" +
                "2. Pastikan server Flask masih berjalan\n" +
                "3. Cek Console (F12) untuk detail error."
            );
        }
    );
}

loadVrm();

// =====================
// ANIMATION LOOP
// =====================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (currentVrm) {
        updateGesture(elapsed);
        updateBlink(elapsed);
        updateExpression();

        if (isSpeaking) {
            // Lip-sync asli: mulut mengikuti level audio kalau analiser aktif
            // (audio TTS server sedang diputar). Saat jeda hening, level ~0
            // sehingga mulut otomatis menutup — bukan bergetar sinus.
            // Kalau memakai speech browser (tidak ada audio yang bisa dianalisis),
            // fallback ke animasi sinus lama supaya mulut tetap bergerak.
            const audioLevel = getAudioLevel();
            const mouthOpen = lipSyncAnalyser
                ? 0.06 + audioLevel * 0.5
                : 0.05 + Math.abs(Math.sin(elapsed * 14)) * 0.45;

            setMouth(mouthOpen);
        } else {
            setMouth(0);
        }

        currentVrm.update(delta);
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);

    applyHalfBodyCamera();
});

// =====================
// CHAT WEB NANA
// =====================

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

const voiceToggleBtn = document.getElementById("voice-toggle");
const stopSpeakingBtn = document.getElementById("stop-speaking");
const clearChatBtn = document.getElementById("clear-chat");
const memoryBtn = document.getElementById("memory-btn");
const voiceBadge = document.getElementById("voice-badge");

// Status request aktif. Dipakai tombol Batal dari ui.js.
let activeRequestController = null;
let activeLoadingBubble = null;

function dispatchNanaEvent(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
}

// Bisa dipanggil dari ui.js untuk membatalkan Nana saat sedang mengecek atau bicara.
window.cancelNanaAction = function cancelNanaAction() {
    let cancelled = false;

    if (activeRequestController) {
        activeRequestController.abort();
        activeRequestController = null;
        cancelled = true;
    }

    if (activeLoadingBubble && activeLoadingBubble.isConnected) {
        activeLoadingBubble.remove();
        activeLoadingBubble = null;
    }

    const speechIsRunning =
        isSpeaking ||
        ("speechSynthesis" in window && window.speechSynthesis.speaking);

    if (speechIsRunning) {
        stopSpeaking();
        cancelled = true;
    }

    if (cancelled) {
        applyExpression("relaxed", 2);
        applyGesture("idle", 1);
        dispatchNanaEvent("nana-action-cancelled");
    }

    if (messageInput) {
        messageInput.disabled = false;
        messageInput.focus();
    }

    return cancelled;
};

function addBubble(text, sender, extraClass = "") {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender} ${extraClass}`;
    bubble.textContent = text;

    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    return bubble;
}

function updateVoiceUI() {
    if (voiceEnabled) {
        voiceToggleBtn.textContent = "Voice: On";
        voiceBadge.textContent = "Voice On";
        voiceBadge.classList.remove("off");
    } else {
        voiceToggleBtn.textContent = "Voice: Off";
        voiceBadge.textContent = "Voice Off";
        voiceBadge.classList.add("off");
    }
}

async function sendMessageToNana(message) {
    // Hindari dua permintaan berjalan bersamaan.
    if (activeRequestController) {
        window.cancelNanaAction();
    }

    addBubble(message, "user");
    messageInput.value = "";
    messageInput.disabled = true;

    const userEmotion = detectEmotionFromText(message);
    const waitingEmotion = userEmotion !== "neutral" ? userEmotion : "thinking";

    applyExpression(waitingEmotion, 12);
    applyGesture(gestureFromEmotion(waitingEmotion), 12);

    const loadingBubble = addBubble("Nana lagi mikir...", "nana", "loading");
    const controller = new AbortController();

    activeRequestController = controller;
    activeLoadingBubble = loadingBubble;
    dispatchNanaEvent("nana-request-start");

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify({
                message: message
            })
        });

        if (controller.signal.aborted) {
            return;
        }

        const data = await response.json();

        if (controller.signal.aborted) {
            return;
        }

        if (loadingBubble.isConnected) {
            loadingBubble.remove();
        }

        addBubble(data.reply, "nana");

        const replyEmotion = detectEmotionFromText(data.reply);
        const finalEmotion = userEmotion !== "neutral"
            ? userEmotion
            : (replyEmotion !== "neutral" ? replyEmotion : "relaxed");

        applyExpression(finalEmotion, 8);
        applyGesture(gestureFromEmotion(finalEmotion, true), 8);

        // Selesai cek; kalau voice hidup, event nana-voice-start akan aktif sesaat setelah ini.
        dispatchNanaEvent("nana-request-end");

        speakWithVoice(data.reply, finalEmotion);

        if (!voiceEnabled) {
            setTimeout(() => {
                applyGesture("idle", 1);
            }, 2500);
        }

    } catch (error) {
        if (error?.name === "AbortError" || controller.signal.aborted) {
            // Pembatalan sengaja tidak dianggap error.
            return;
        }

        if (loadingBubble.isConnected) {
            loadingBubble.remove();
        }

        addBubble("Aduh, Nana error nyambung ke server 😿", "nana");
        applyExpression("sad", 4);
        applyGesture("soft", 4);
        dispatchNanaEvent("nana-request-end");
        console.error(error);
    } finally {
        if (activeRequestController === controller) {
            activeRequestController = null;
        }

        if (activeLoadingBubble === loadingBubble) {
            activeLoadingBubble = null;
        }

        messageInput.disabled = false;
        messageInput.focus();
    }
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) return;

    await sendMessageToNana(message);
});

voiceToggleBtn.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;

    if (!voiceEnabled) {
        stopSpeaking();
        addBubble("Voice dimatikan. Nana sekarang cuma jawab lewat chat.", "nana");
        applyExpression("relaxed", 3);
        applyGesture("idle", 2);
    } else {
        addBubble("Voice dinyalakan lagi. Nana bisa ngomong lagi.", "nana");
        applyExpression("happy", 3);
        applyGesture("happy", 3);
    }

    updateVoiceUI();
});

stopSpeakingBtn.addEventListener("click", () => {
    stopSpeaking();
    applyExpression("relaxed", 2);
    applyGesture("idle", 2);
});

clearChatBtn.addEventListener("click", () => {
    chatBox.innerHTML = "";
    addBubble("Chat dibersihkan. Aku masih di sini kok 😸", "nana");
    applyExpression("happy", 3);
    applyGesture("happy", 3);
});

memoryBtn.addEventListener("click", async () => {
    await sendMessageToNana("memory");
});

updateVoiceUI();