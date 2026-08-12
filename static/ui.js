const appRoot = document.querySelector(".app");

const menuToggle = document.getElementById("menu-toggle");
const sideDrawer = document.getElementById("side-drawer");
const drawerClose = document.getElementById("drawer-close");
const drawerBackdrop = document.getElementById("drawer-backdrop");

const historySheet = document.getElementById("history-sheet");
const historyToggle = document.getElementById("history-toggle");
const historyClose = document.getElementById("history-close");

const reviewWorkspace = document.getElementById("review-workspace");
const reviewClose = document.getElementById("review-close");
const reviewTitle = document.getElementById("review-title");
const reviewExplanation = document.getElementById("review-explanation");
const reviewDownload = document.getElementById("review-download");

const htmlPreview = document.getElementById("html-preview");
const htmlPreviewEmpty = document.getElementById("html-preview-empty");
const previewNote = document.getElementById("preview-note");

const previewCard = document.querySelector(".preview-card");
const previewFullToggle = document.createElement("button");
previewFullToggle.type = "button";
previewFullToggle.className = "preview-full-toggle";
previewFullToggle.textContent = "⛶ Full";
previewFullToggle.setAttribute("aria-label", "Perbesar preview HTML");
previewCard?.appendChild(previewFullToggle);

function setPreviewFullscreen(open) {
    reviewWorkspace.classList.toggle("preview-fullscreen", open);
    previewFullToggle.textContent = open ? "↙ Kembali" : "⛶ Full";
    previewFullToggle.setAttribute(
        "aria-label",
        open ? "Kembali ke mode review" : "Perbesar preview HTML"
    );
}

previewFullToggle.addEventListener("click", () => {
    setPreviewFullscreen(
        !reviewWorkspace.classList.contains("preview-fullscreen")
    );
});

const sourceTitle = document.getElementById("source-title");
const sourceNote = document.getElementById("source-note");
const sourceViewer = document.getElementById("source-viewer");
const sourceCopy = document.getElementById("source-copy");
const editorFixButton = document.getElementById("editor-fix");
const editorRestoreButton = document.getElementById("editor-restore");
const autoFindings = document.getElementById("auto-findings");

const chatBoxUI = document.getElementById("chat-box");
const chatFormUI = document.getElementById("chat-form");
const messageInputUI = document.getElementById("message-input");

const fileInput = document.getElementById("file-input");
const filePickerButton = document.getElementById("file-picker-button");
const attachmentChip = document.getElementById("attachment-chip");
const attachmentName = document.getElementById("attachment-name");
const attachmentRemove = document.getElementById("attachment-remove");

const codingToggle = document.getElementById("coding-toggle");
const actionCancel = document.getElementById("action-cancel");
const sendButton = document.querySelector("#chat-form .send-button");

let codingModeForced = false;
let attachedFile = null;
let pendingHiddenPayload = null;
let reviewWaiting = false;
let requestActive = false;
let voiceActive = false;

/* File yang sedang tampil di editor dan cadangan versi sebelum diedit Nana. */
let activeReviewFile = null;
let originalReviewFile = null;
let editorRequestPending = false;

const MAX_FILE_CHARS = 7500;
const codingPattern = /\b(coding|kode|code|error|bug|debug|python|javascript|typescript|html|css|java|c\+\+|cpp|c#|php|sql|flask|ollama|api|website|web|program|skrip|script|terminal|cmd)\b/i;

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getLineNumber(text, index) {
    return text.slice(0, Math.max(0, index)).split("\n").length;
}

function languageName(fileName = "") {
    const ext = fileName.split(".").pop().toLowerCase();
    const map = {
        html: "HTML",
        htm: "HTML",
        css: "CSS",
        js: "JavaScript",
        ts: "TypeScript",
        py: "Python",
        json: "JSON",
        java: "Java",
        php: "PHP",
        sql: "SQL",
        cs: "C#",
        cpp: "C++",
        c: "C",
        txt: "Teks",
        log: "Log"
    };
    return map[ext] || "Kode";
}

function isHtmlFile(fileName = "") {
    return /\.(html?|xhtml)$/i.test(fileName);
}

function inspectSource(source, fileName) {
    const findings = [];

    if (isHtmlFile(fileName)) {
        const ids = new Map();
        const idRegex = /\bid\s*=\s*["']([^"']+)["']/gi;
        let match;

        while ((match = idRegex.exec(source))) {
            const id = match[1];
            const line = getLineNumber(source, match.index);

            if (ids.has(id)) {
                findings.push({
                    type: "error",
                    line,
                    title: `ID "${id}" dipakai lebih dari sekali`,
                    detail: "ID di HTML harus unik. JavaScript bisa mengambil elemen yang salah."
                });
            } else {
                ids.set(id, line);
            }
        }

        const getIdRegex = /document\.getElementById\(\s*["']([^"']+)["']\s*\)/gi;
        while ((match = getIdRegex.exec(source))) {
            const target = match[1];
            if (!ids.has(target)) {
                findings.push({
                    type: "warn",
                    line: getLineNumber(source, match.index),
                    title: `ID "${target}" dipanggil tetapi tidak ditemukan`,
                    detail: "Pastikan elemen dengan ID ini benar-benar ada di HTML."
                });
            }
        }

        const scriptOpen = (source.match(/<script\b/gi) || []).length;
        const scriptClose = (source.match(/<\/script\s*>/gi) || []).length;
        if (scriptOpen !== scriptClose) {
            findings.push({
                type: "error",
                line: 1,
                title: "Jumlah tag <script> dan </script> tidak cocok",
                detail: "Cek tag script yang belum ditutup."
            });
        }

        const styleOpen = (source.match(/<style\b/gi) || []).length;
        const styleClose = (source.match(/<\/style\s*>/gi) || []).length;
        if (styleOpen !== styleClose) {
            findings.push({
                type: "error",
                line: 1,
                title: "Jumlah tag <style> dan </style> tidak cocok",
                detail: "Cek tag style yang belum ditutup."
            });
        }

        if (/(card\s*number|nomor\s*kartu|cc-number)/i.test(source)) {
            findings.push({
                type: "warn",
                line: getLineNumber(source, source.search(/card\s*number|nomor\s*kartu|cc-number/i)),
                title: "Ada form data kartu/pembayaran",
                detail: "Untuk pembayaran asli, jangan proses nomor kartu di front-end. Pakai payment gateway."
            });
        }

        if (/innerHTML\s*=/i.test(source)) {
            findings.push({
                type: "warn",
                line: getLineNumber(source, source.search(/innerHTML\s*=/i)),
                title: "Ada penggunaan innerHTML",
                detail: "Pastikan isi yang dimasukkan aman, terutama kalau berasal dari input user."
            });
        }
    } else {
        if (/console\.log\(/i.test(source)) {
            findings.push({
                type: "warn",
                line: getLineNumber(source, source.search(/console\.log\(/i)),
                title: "Ada console.log",
                detail: "Tidak selalu salah, tapi hapus kalau sudah masuk versi final."
            });
        }
    }

    if (!findings.length) {
        findings.push({
            type: "neutral",
            line: null,
            title: "Belum ada masalah otomatis yang pasti",
            detail: "Ini bukan berarti file pasti aman. Lihat penjelasan Nana dan coba jalankan file untuk cek Console."
        });
    }

    return findings.slice(0, 5);
}

function renderSource(source, findings) {
    const lines = source.split("\n");
    const byLine = new Map();

    for (const finding of findings) {
        if (!finding.line) continue;

        const current = byLine.get(finding.line);
        if (!current || finding.type === "error") {
            byLine.set(finding.line, finding);
        }
    }

    sourceViewer.innerHTML = lines.map((line, index) => {
        const lineNumber = index + 1;
        const finding = byLine.get(lineNumber);
        const levelClass = finding ? `line-${finding.type}` : "";

        return `
            <div id="source-line-${lineNumber}" class="code-line ${levelClass}">
                <span class="line-no">${lineNumber}</span>
                <span class="line-text">${escapeHtml(line) || " "}</span>
            </div>
        `;
    }).join("");
}

function renderFindings(findings) {
    autoFindings.innerHTML = "";

    findings.forEach((finding) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = `finding ${finding.type}${finding.line ? " jumpable" : ""}`;
        element.innerHTML = `
            <b>${escapeHtml(finding.title)}</b>
            <br><span>${escapeHtml(finding.detail)}</span>
            ${finding.line ? `<br><small>Baris ${finding.line}</small>` : ""}
        `;

        if (finding.line) {
            element.addEventListener("click", () => {
                document.getElementById(`source-line-${finding.line}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });
        }

        autoFindings.appendChild(element);
    });
}

let previewBlobUrl = null;

function clearPreviewUrl() {
    if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        previewBlobUrl = null;
    }
}

function setPreview(file) {
    clearPreviewUrl();

    if (!file || !isHtmlFile(file.name)) {
        htmlPreview.removeAttribute("src");
        htmlPreview.removeAttribute("srcdoc");
        htmlPreview.classList.add("hidden");
        htmlPreviewEmpty.classList.remove("hidden");
        htmlPreviewEmpty.textContent = file
            ? "Preview hanya tersedia untuk file HTML. Kode dan penjelasan tetap bisa dilihat di kanan."
            : "Import file HTML untuk melihat tampilan.";
        previewNote.textContent = file
            ? "Preview tidak tersedia untuk tipe file ini."
            : "Import file HTML untuk melihat tampilan.";
        return;
    }

    /*
      FIX PREVIEW:
      File HTML dijalankan dari Blob URL, bukan srcdoc.
      Cara ini lebih stabil untuk HTML panjang yang punya CSS + JavaScript inline.
      Sandbox tetap aktif: preview tidak bisa mengakses halaman Nana.
    */
    // Preview memakai file PENUH. Yang dipotong hanya salinan untuk AI.
    const htmlBlob = new Blob([file.previewText || file.text], {
        type: "text/html;charset=utf-8"
    });

    previewBlobUrl = URL.createObjectURL(htmlBlob);

    htmlPreview.removeAttribute("srcdoc");
    htmlPreview.setAttribute("sandbox", "allow-scripts");
    htmlPreview.src = previewBlobUrl;

    htmlPreviewEmpty.classList.add("hidden");
    htmlPreview.classList.remove("hidden");
    previewNote.textContent = "Preview file asli. Script inline jalan di kotak sandbox aman.";
}

window.addEventListener("beforeunload", clearPreviewUrl);

function setReviewExplanation(text, checking = false) {
    reviewExplanation.classList.toggle("checking", checking);

    if (checking) {
        reviewExplanation.innerHTML = `
            Nana sedang mengecek
            <span class="review-dots"><i></i><i></i><i></i></span>
        `;
        return;
    }

    reviewExplanation.textContent = text || "Belum ada penjelasan.";
}

function setReviewMode(open) {
    appRoot.classList.toggle("review-mode", open);
    reviewWorkspace.classList.toggle("open", open);
    reviewWorkspace.setAttribute("aria-hidden", String(!open));

    if (!open) {
        reviewWaiting = false;
        reviewWorkspace.classList.remove("preview-fullscreen");
        previewFullToggle.textContent = "⛶ Full";
        previewFullToggle.setAttribute("aria-label", "Perbesar preview HTML");
    }
}

function setDrawer(open) {
    sideDrawer.classList.toggle("open", open);
    drawerBackdrop.classList.toggle("open", open);
    sideDrawer.setAttribute("aria-hidden", String(!open));
    drawerBackdrop.setAttribute("aria-hidden", String(!open));
    menuToggle.setAttribute("aria-expanded", String(open));
}

function setHistory(open) {
    historySheet.classList.toggle("open", open);
    historySheet.setAttribute("aria-hidden", String(!open));
    historyToggle.textContent = open ? "Tutup" : "Riwayat";

    if (open) {
        setTimeout(() => {
            chatBoxUI.scrollTop = chatBoxUI.scrollHeight;
        }, 0);
    }
}

function refreshCodingButton() {
    codingToggle.classList.toggle("active", codingModeForced);
    codingToggle.textContent = codingModeForced ? "Coding ✓" : "Coding";
}

function isCodingRequest(text) {
    return codingModeForced || Boolean(attachedFile) || codingPattern.test(text);
}

function showAttachment(name) {
    attachmentName.textContent = name;
    attachmentChip.classList.remove("hidden");
}

function clearAttachment() {
    attachedFile = null;
    fileInput.value = "";
    attachmentName.textContent = "";
    attachmentChip.classList.add("hidden");
}

function updateCancelButton() {
    const shouldShow = requestActive || voiceActive;
    actionCancel.classList.toggle("hidden", !shouldShow);

    if (!shouldShow) return;
    actionCancel.textContent = requestActive ? "Batal Cek" : "Batal Bicara";
}

function setSendButtonSpeaking(speaking) {
    sendButton.classList.toggle("nana-speaking", speaking);
    sendButton.title = speaking ? "Nana sedang bicara..." : "Kirim pesan";
}

function showDownload(data) {
    if (data?.download_url) {
        reviewDownload.href = data.download_url;
        reviewDownload.download = data.download_name || "nana_file.txt";
        reviewDownload.textContent = `Download ${data.download_name || "File Perbaikan"}`;
        reviewDownload.classList.remove("hidden");
        return;
    }

    reviewDownload.classList.add("hidden");
    reviewDownload.removeAttribute("href");
}

function buildVisibleFileMessage(question, fileName) {
    return `📎 ${fileName} — ${question || "Tolong cek apakah ada error atau bagian yang perlu dibenerin."}`;
}

function buildHiddenFilePayload(question, file, mode = "REVIEW_FILE") {
    /*
      REVIEW memakai versi ringkas supaya ringan.
      EDIT mengirim file penuh agar Nana bisa menghasilkan file perbaikan yang utuh.
    */
    const sourceForNana = mode === "EDIT_FILE"
        ? (file.previewText || file.text)
        : file.text;

    return `MODE: ${mode}
FILE TERLAMPIR: ${file.name}

PERTANYAAN NAEL:
${question || "Tolong cek apakah ada error atau bagian yang perlu dibenerin."}

ISI FILE:
\`\`\`
${sourceForNana}
\`\`\`
${mode === "REVIEW_FILE" && file.wasTrimmed ? "\nCATATAN: FILE DIPOTONG KARENA TERLALU PANJANG." : ""}`;
}

function createFileState(name, fullText) {
    const source = String(fullText || "");
    const wasTrimmed = source.length > MAX_FILE_CHARS;
    const headLength = Math.floor(MAX_FILE_CHARS * 0.72);
    const tailLength = MAX_FILE_CHARS - headLength;

    return {
        name: name || "file_kode.txt",
        previewText: source,
        text: wasTrimmed
            ? `${source.slice(0, headLength)}
/* ... BAGIAN TENGAH FILE DIPOTONG UNTUK ANALISIS AI ... */
${source.slice(-tailLength)}`
            : source,
        wasTrimmed
    };
}

function cloneFileState(file) {
    if (!file) return null;
    return createFileState(file.name, file.previewText || file.text || "");
}

function updateEditorButtons() {
    const hasFile = Boolean(activeReviewFile);
    editorFixButton?.classList.toggle("hidden", !hasFile);

    const hasEditedVersion = Boolean(
        activeReviewFile &&
        originalReviewFile &&
        (activeReviewFile.previewText !== originalReviewFile.previewText ||
            activeReviewFile.name !== originalReviewFile.name)
    );

    editorRestoreButton?.classList.toggle("hidden", !hasEditedVersion);
}

function wantsEditorFix(text) {
    return /\b(perbaiki|perbaikan|benerin|benarkan|fix file|edit file|buatkan file perbaikan|buat file perbaikan)\b/i.test(text || "");
}

function applyEditedCode(data) {
    if (!data?.edited_code) return;

    const newName = data.edited_filename || activeReviewFile?.name || "nana_perbaikan.txt";
    activeReviewFile = createFileState(newName, data.edited_code);

    const source = activeReviewFile.previewText;
    const findings = inspectSource(source, activeReviewFile.name);

    reviewTitle.textContent = "Hasil Perbaikan Nana";
    sourceTitle.textContent = `${languageName(activeReviewFile.name)}: ${activeReviewFile.name}`;
    sourceNote.textContent = "Kode di bawah sudah diganti dengan hasil perbaikan Nana.";
    setPreview(activeReviewFile);
    renderFindings(findings);
    renderSource(source, findings);
    sourceViewer.classList.add("edited-by-nana");
    updateEditorButtons();
    setReviewMode(true);
}

function openReviewFor(file, question) {
    reviewTitle.textContent = file ? `Review ${languageName(file.name)}` : "Penjelasan Coding";
    sourceTitle.textContent = file ? `${languageName(file.name)}: ${file.name}` : "Kode";
    sourceNote.textContent = file
        ? "Tekan temuan otomatis untuk lompat ke baris yang dicurigai."
        : "Kirim kode atau import file untuk melihat source.";

    showDownload(null);
    setReviewExplanation("", true);
    setPreview(file);
    setReviewMode(true);

    if (file) {
        activeReviewFile = cloneFileState(file);

        // Panel preview + source memakai file penuh agar HTML tidak terpotong.
        const fullSource = activeReviewFile.previewText;
        const findings = inspectSource(fullSource, activeReviewFile.name);
        renderFindings(findings);
        renderSource(fullSource, findings);
        sourceViewer.classList.remove("edited-by-nana");
        updateEditorButtons();
    } else {
        autoFindings.innerHTML = `<div class="finding neutral">Belum ada file. Nana akan menjelaskan jawaban coding di sini.</div>`;
        sourceViewer.innerHTML = `<div class="source-empty">Import file atau kirim kode untuk ditampilkan.</div>`;
    }
}

async function readSelectedFile(file) {
    if (!file) return;

    const maxSize = 350 * 1024;
    if (file.size > maxSize) {
        alert("File terlalu besar. Pilih file kode atau log di bawah 350 KB.");
        fileInput.value = "";
        return;
    }

    try {
        attachmentName.textContent = "Membaca file...";
        attachmentChip.classList.remove("hidden");

        const fullText = await file.text();
        const wasTrimmed = fullText.length > MAX_FILE_CHARS;

        /*
          Penting:
          - previewText = file asli penuh untuk iframe dan panel source
          - text = versi ringkas untuk Ollama supaya model lokal tidak berat
          Sebelumnya preview ikut memakai `text`, jadi HTML panjang terpotong
          di tengah CSS dan hasilnya cuma kotak putih.
        */
        const headLength = Math.floor(MAX_FILE_CHARS * 0.72);
        const tailLength = MAX_FILE_CHARS - headLength;

        const text = wasTrimmed
            ? `${fullText.slice(0, headLength)}
/* ... BAGIAN TENGAH FILE DIPOTONG UNTUK ANALISIS AI ... */
${fullText.slice(-tailLength)}`
            : fullText;

        attachedFile = {
            name: file.name,
            text,
            previewText: fullText,
            wasTrimmed
        };

        activeReviewFile = cloneFileState(attachedFile);
        originalReviewFile = cloneFileState(attachedFile);
        updateEditorButtons();

        showAttachment(file.name);
        messageInputUI.focus();
    } catch (error) {
        clearAttachment();
        alert("File tidak bisa dibaca. Pakai file teks, kode, atau log.");
        console.error(error);
    }
}

/*
  Isi file tidak ditampilkan sebagai bubble chat.
  app.js hanya melihat pesan pendek, sedangkan backend menerima payload lengkap.
*/
const originalFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const isReviewRequest = url.includes("/chat") && Boolean(pendingHiddenPayload);

    if (isReviewRequest && init.body) {
        try {
            const requestData = JSON.parse(init.body);
            requestData.message = pendingHiddenPayload;
            pendingHiddenPayload = null;
            init = { ...init, body: JSON.stringify(requestData) };
        } catch (error) {
            console.error("Gagal menyiapkan file untuk Nana:", error);
        }
    }

    const response = await originalFetch(input, init);

    if (url.includes("/chat")) {
        response.clone().json()
            .then((data) => {
                if (isReviewRequest || reviewWaiting) {
                    reviewWaiting = false;
                    setReviewExplanation(data.reply || "Nana belum memberi jawaban.");

                    if (data.edited_code) {
                        applyEditedCode(data);
                    }

                    showDownload(data);
                    setReviewMode(true);
                }
            })
            .catch(() => {});
    }

    return response;
};

// Drawer / history
menuToggle.addEventListener("click", () => setDrawer(!sideDrawer.classList.contains("open")));
drawerClose.addEventListener("click", () => setDrawer(false));
drawerBackdrop.addEventListener("click", () => setDrawer(false));

historyToggle.addEventListener("click", () => setHistory(!historySheet.classList.contains("open")));
historyClose.addEventListener("click", () => setHistory(false));

reviewClose.addEventListener("click", () => {
    setPreviewFullscreen(false);
    setReviewMode(false);
});

codingToggle.addEventListener("click", () => {
    codingModeForced = !codingModeForced;
    refreshCodingButton();

    if (codingModeForced) {
        openReviewFor(null, "");
    }
});

editorFixButton?.addEventListener("click", () => {
    if (!activeReviewFile) {
        alert("Import file dulu sebelum Nana bisa memperbaikinya.");
        return;
    }

    editorRequestPending = true;
    messageInputUI.value = "Perbaiki file ini. Terapkan perbaikan yang aman, tampilkan kode hasilnya di editor, dan buatkan file download.";
    chatFormUI.requestSubmit();
});

editorRestoreButton?.addEventListener("click", () => {
    if (!originalReviewFile) return;

    activeReviewFile = cloneFileState(originalReviewFile);
    const source = activeReviewFile.previewText;
    const findings = inspectSource(source, activeReviewFile.name);

    reviewTitle.textContent = `Review ${languageName(activeReviewFile.name)}`;
    sourceTitle.textContent = `${languageName(activeReviewFile.name)}: ${activeReviewFile.name}`;
    sourceNote.textContent = "Versi asli dipulihkan.";
    setReviewExplanation("Versi asli sudah dikembalikan.");
    setPreview(activeReviewFile);
    renderFindings(findings);
    renderSource(source, findings);
    showDownload(null);
    updateEditorButtons();
});

sourceCopy.addEventListener("click", async () => {
    const text = activeReviewFile?.previewText || attachedFile?.previewText || attachedFile?.text || "";
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        sourceCopy.textContent = "Tersalin";
        setTimeout(() => { sourceCopy.textContent = "Salin kode"; }, 1100);
    } catch {
        alert("Belum bisa menyalin otomatis. Salin manual dari panel kode.");
    }
});

filePickerButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => readSelectedFile(fileInput.files[0]));
attachmentRemove.addEventListener("click", clearAttachment);

chatFormUI.addEventListener("submit", () => {
    const question = messageInputUI.value.trim();
    if (!question && !attachedFile) return;

    const editMode = editorRequestPending || wantsEditorFix(question);
    const file = attachedFile || (editMode ? activeReviewFile : null);
    const isCoding = isCodingRequest(question);

    if (file || isCoding) {
        openReviewFor(file, question);
        reviewWaiting = true;
    }

    if (file) {
        const requestMode = editMode ? "EDIT_FILE" : "REVIEW_FILE";
        pendingHiddenPayload = buildHiddenFilePayload(question, file, requestMode);

        messageInputUI.value = editMode
            ? `🛠 ${file.name} — Nana memperbaiki file ini`
            : buildVisibleFileMessage(question, file.name);

        if (attachedFile) {
            setTimeout(clearAttachment, 0);
        }
    }

    editorRequestPending = false;
}, true);

// Cancel saat Nana cek atau bicara.
actionCancel.addEventListener("click", () => {
    if (typeof window.cancelNanaAction === "function") {
        window.cancelNanaAction();
    } else if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    requestActive = false;
    voiceActive = false;
    reviewWaiting = false;
    setSendButtonSpeaking(false);
    updateCancelButton();

    if (reviewWorkspace.classList.contains("open")) {
        setReviewExplanation("Pengecekan dibatalkan.");
    }
});

window.addEventListener("nana-request-start", () => {
    requestActive = true;
    updateCancelButton();
});

window.addEventListener("nana-request-end", () => {
    requestActive = false;
    updateCancelButton();
});

window.addEventListener("nana-voice-start", () => {
    voiceActive = true;
    setSendButtonSpeaking(true);
    updateCancelButton();
});

window.addEventListener("nana-voice-end", () => {
    voiceActive = false;
    setSendButtonSpeaking(false);
    updateCancelButton();
});

window.addEventListener("nana-action-cancelled", () => {
    requestActive = false;
    voiceActive = false;
    reviewWaiting = false;
    setSendButtonSpeaking(false);
    updateCancelButton();

    if (reviewWorkspace.classList.contains("open")) {
        setReviewExplanation("Pengecekan dibatalkan.");
    }
});

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (reviewWorkspace.classList.contains("preview-fullscreen")) {
            setPreviewFullscreen(false);
            return;
        }

        setDrawer(false);
        setHistory(false);
        setReviewMode(false);
    }
});

refreshCodingButton();
updateCancelButton();
