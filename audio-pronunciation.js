/* English word pronunciation for the OVA.
   Start device speech directly from the user's tap; use Google TTS as backup. */
(function () {
  "use strict";
  let currentAudio = null;
  let requestId = 0;
  let fallbackTimer = null;

  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.removeAttribute("src");
      currentAudio.load();
      currentAudio = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function googleBackup(text, id, attempt) {
    if (id !== requestId) return;
    const client = attempt === 0 ? "tw-ob" : "gtx";
    const lang = attempt === 0 ? "en-US" : "en";
    const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=" +
      client + "&tl=" + lang + "&q=" + encodeURIComponent(text);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.preload = "auto";
    audio.playsInline = true;
    let advanced = false;
    const fallback = () => {
      if (advanced || id !== requestId) return;
      advanced = true;
      audio.onerror = null;
      audio.onended = null;
      audio.pause();
      if (currentAudio === audio) currentAudio = null;
      if (attempt === 0) googleBackup(text, id, 1);
      else alert("Audio could not be played. Check your device volume and try again. / No se pudo reproducir el audio. Revisa el volumen e inténtalo de nuevo.");
    };
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
    audio.onerror = fallback;
    const p = audio.play();
    if (p && p.catch) p.catch(fallback);
    fallbackTimer = setTimeout(fallback, 5000);
  }

  window.playOVAAudio = function (text) {
    const word = String(text || "").trim();
    if (!word) return;
    requestId += 1;
    const id = requestId;
    stopCurrent();

    if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
      try {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "en-US";
        utterance.rate = 0.78;
        utterance.pitch = 1;
        const voices = synth.getVoices();
        const voice = voices.find(v => /^en-US/i.test(v.lang)) ||
                      voices.find(v => /^en-GB/i.test(v.lang)) ||
                      voices.find(v => /^en/i.test(v.lang));
        if (voice) utterance.voice = voice;
        let finished = false;
        utterance.onstart = () => { finished = true; };
        utterance.onend = () => { if (fallbackTimer) clearTimeout(fallbackTimer); };
        utterance.onerror = () => {
          if (!finished && id === requestId) googleBackup(word, id, 0);
        };
        synth.speak(utterance);
        fallbackTimer = setTimeout(() => {
          if (!finished && id === requestId) {
            synth.cancel();
            googleBackup(word, id, 0);
          }
        }, 1800);
        return;
      } catch (_) {}
    }
    googleBackup(word, id, 0);
  };
})();