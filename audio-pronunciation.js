/* Pronunciation audio for English-OVA.
   Try a real audio stream first; fall back to the browser's English voice. */
(function () {
  "use strict";
  let currentAudio = null;

  function speakWithBrowser(text) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      alert("Audio could not load. Check your internet connection and try Chrome.");
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text || ""));
    utterance.lang = "en-US";
    utterance.rate = 0.78;
    utterance.pitch = 1;
    const chooseVoice = () => {
      const voices = synth.getVoices();
      const voice = voices.find(v => /^en-US/i.test(v.lang)) ||
                    voices.find(v => /^en-GB/i.test(v.lang)) ||
                    voices.find(v => /^en/i.test(v.lang));
      if (voice) utterance.voice = voice;
      synth.resume();
      synth.speak(utterance);
    };
    if (synth.getVoices().length) chooseVoice();
    else {
      let started = false;
      const onVoices = () => {
        if (started) return;
        started = true;
        synth.removeEventListener?.("voiceschanged", onVoices);
        chooseVoice();
      };
      synth.addEventListener?.("voiceschanged", onVoices);
      setTimeout(() => {
        if (!started) {
          started = true;
          chooseVoice();
        }
      }, 700);
    }
  }

  window.playOVAAudio = function (text) {
    const word = String(text || "").trim();
    if (!word) return;

    // Audio playback is initiated directly by the user's Listen button.
    // This stream does not require CORS permission because it is played, not fetched.
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=" +
                  encodeURIComponent(word);
      const audio = new Audio(url);
      currentAudio = audio;
      audio.preload = "auto";
      audio.onended = () => { if (currentAudio === audio) currentAudio = null; };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        speakWithBrowser(word);
      };
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (currentAudio === audio) currentAudio = null;
          speakWithBrowser(word);
        });
      }
    } catch (_) {
      speakWithBrowser(word);
    }
  };
})();