import confetti from "canvas-confetti";

export function fireConfetti() {
  // First burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6"],
  });

  // Second burst after a short delay
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#22c55e", "#10b981", "#14b8a6"],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#06b6d4", "#3b82f6", "#6366f1"],
    });
  }, 150);
}

export function fireSmallConfetti() {
  confetti({
    particleCount: 30,
    spread: 40,
    origin: { y: 0.7 },
    colors: ["#22c55e", "#10b981"],
    scalar: 0.8,
  });
}
