/* Individual word pronunciation for English-OVA.
   Prefer the device's English speech engine; use online TTS as a fallback. */
(function () {
  "use strict";
  let currentAudio = null;
  let requestId = 0;

  function playOnlineTTS(text, id) {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
      const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=" +
        encodeURIComponent(text);
      const audio = new Audio(url);
      currentAudio = audio;
      audio.preload = "auto";
      audio.onended = () => { if (currentAudio === audio) currentAudio = null; };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        if (id === requestId) {
          alert("The audio could not play. Try the video below or check that your device has an English text-to-speech voice installed. / No se pudo reproducir el audio. Intenta con el video de abajo.");
        }
      };
      const result = audio.play();
      if (result && typeof result.catch === "function") result.catch(() => {
        if (currentAudio === audio) currentAudio = null;
        if (id === requestId) {
          alert("The audio could not play. Try the video below or check your connection. / No se pudo reproducir el audio. Intenta con el video de abajo.");
        }
      });
    } catch (_) {
      if (id === requestId) alert("Audio is unavailable on this device. / El audio no está disponible en este dispositivo.");
    }
  }

  function speakWithBrowser(text, id) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      playOnlineTTS(text, id);
      return;
    }
    const synth = window.speechSynthesis;
    try {
      synth.cancel();
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.78;
      utterance.pitch = 1;
      const chooseVoice = () => {
        if (id !== requestId) return;
        const voices = synth.getVoices();
        const voice = voices.find(v => /^en-US/i.test(v.lang)) ||
                      voices.find(v => /^en-GB/i.test(v.lang)) ||
                      voices.find(v => /^en/i.test(v.lang));
        if (voice) utterance.voice = voice;
        utterance.onerror = () => playOnlineTTS(text, id);
        synth.speak(utterance);
      };
      if (synth.getVoices().length) {
        chooseVoice();
      } else {
        let started = false;
        const onVoices = () => {
          if (started) return;
          started = true;
          synth.removeEventListener("voiceschanged", onVoices);
          chooseVoice();
        };
        synth.addEventListener("voiceschanged", onVoices);
        window.setTimeout(() => {
          if (!started) {
            started = true;
            synth.removeEventListener("voiceschanged", onVoices);
            chooseVoice();
          }
        }, 900);
      }
    } catch (_) {
      playOnlineTTS(text, id);
    }
  }

  window.playOVAAudio = function (text) {
    const word = String(text || "").trim();
    if (!word) return;
    requestId += 1;
    speakWithBrowser(word, requestId);
  };
})();