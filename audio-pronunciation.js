/* Original pronunciation module for English-OVA.
   Uses the device's English speech voice to pronounce the OVA vocabulary.
   No external audio service or third-party audio URL is required. */
(function () {
  "use strict";
  window.playOVAAudio = function (text) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      alert("Audio pronunciation is not supported by this browser. Try Chrome.");
      return;
    }
    const speech = window.speechSynthesis;
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text || ""));
    utterance.lang = "en-US";
    utterance.rate = 0.78;
    utterance.pitch = 1.02;
    const voices = speech.getVoices();
    const voice = voices.find(v => /^en-US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
    if (voice) utterance.voice = voice;
    speech.resume();
    speech.speak(utterance);
  };
})();