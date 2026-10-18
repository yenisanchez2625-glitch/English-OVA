/* Reliable word audio for English-OVA.
   Try Google's English text-to-speech audio first; use the device voice as fallback. */
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

  function speakOnDevice(text, id) {
    if (id !== requestId) return;
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      alert("Audio could not be played. Check your internet connection and try again. / No se pudo reproducir el audio. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    try {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.78;
      utterance.pitch = 1;
      const voices = synth.getVoices();
      const voice = voices.find(v => /^en-US/i.test(v.lang)) ||
                    voices.find(v => /^en-GB/i.test(v.lang)) ||
                    voices.find(v => /^en/i.test(v.lang));
      if (voice) utterance.voice = voice;
      utterance.onerror = () => {
        if (id === requestId) alert("Audio is unavailable. Please check your device volume and internet connection. / El audio no está disponible. Revisa el volumen y la conexión.");
      };
      synth.speak(utterance);
    } catch (_) {
      alert("Audio is unavailable on this device. / El audio no está disponible en este dispositivo.");
    }
  }

  function tryGoogleAudio(text, id, attempt) {
    if (id !== requestId) return;
    const client = attempt === 0 ? "tw-ob" : "gtx";
    const lang = attempt === 0 ? "en-US" : "en";
    const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=" +
      client + "&tl=" + lang + "&q=" + encodeURIComponent(text);
    const audio = new Audio();
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
      if (attempt === 0) tryGoogleAudio(text, id, 1);
      else speakOnDevice(text, id);
    };
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
    audio.onerror = fallback;
    audio.src = url;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(fallback);
    }
    fallbackTimer = setTimeout(fallback, 5000);
  }

  window.playOVAAudio = function (text) {
    const word = String(text || "").trim();
    if (!word) return;
    requestId += 1;
    stopCurrent();
    tryGoogleAudio(word, requestId, 0);
  };
})();