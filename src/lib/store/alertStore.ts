import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AlertState {
  soundOn: boolean;
  setSoundOn: (enabled: boolean) => void;
  playAlertSound: () => void;
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set) => ({
      soundOn: true,
      setSoundOn: (soundOn) => set({ soundOn }),
      playAlertSound: () => {
        if (typeof window === "undefined") return;
        try {
          const audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        } catch {
          // Fallback or ignore if blocked by autoplay policies
        }
      },
    }),
    {
      name: "aop_order_alert_settings",
    }
  )
);
