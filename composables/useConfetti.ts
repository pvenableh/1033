/**
 * useConfetti - Celebration effects for task completion
 *
 * Uses canvas-confetti (already in project dependencies)
 */

import confetti from 'canvas-confetti';

export function useConfetti() {
  // Project color palette for confetti
  const COLORS = ['#C4A052', '#6B8E7B', '#8B6B99', '#E8E4DC', '#7B8EC4'];

  /**
   * Standard celebration for task completion
   */
  const celebrate = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: COLORS,
    });
  };

  /**
   * Big celebration for milestone completion
   */
  const celebrateMilestone = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: COLORS,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: COLORS,
      });
    }, 150);
  };

  /**
   * Subtle sparkle effect
   */
  const sparkle = () => {
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.6 },
      colors: ['#C4A052'],
      scalar: 0.8,
      gravity: 1.2,
    });
  };

  /**
   * Project completion fireworks
   */
  const projectComplete = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: COLORS,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  /**
   * All tasks complete celebration
   */
  const allTasksComplete = () => {
    // Burst from center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors: COLORS,
    });

    // Side bursts with delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 45,
        origin: { x: 0, y: 0.65 },
        colors: COLORS,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 45,
        origin: { x: 1, y: 0.65 },
        colors: COLORS,
      });
    }, 150);
  };

  /**
   * Confetti at a specific position (for button clicks)
   */
  const celebrateAt = (x: number, y: number) => {
    // Convert pixel coordinates to 0-1 range
    const originX = x / window.innerWidth;
    const originY = y / window.innerHeight;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: originX, y: originY },
      colors: COLORS,
      startVelocity: 30,
    });
  };

  return {
    celebrate,
    celebrateMilestone,
    sparkle,
    projectComplete,
    allTasksComplete,
    celebrateAt,
  };
}
