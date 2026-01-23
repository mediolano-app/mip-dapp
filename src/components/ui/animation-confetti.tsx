"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
}

const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

export const Confetti = ({ duration = 3000, particleCount = 50 }: ConfettiProps) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate particles only on client-side to avoid hydration mismatch
    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // random start position %
      y: -10 - Math.random() * 20, // start above the screen
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random(),
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            top: `${particle.y}%`,
            left: `${particle.x}%`,
            rotate: particle.rotation,
            scale: particle.scale,
            opacity: 1,
          }}
          animate={{
            top: "110%",
            rotate: particle.rotation + 360 + Math.random() * 360,
            opacity: 0,
          }}
          transition={{
            duration: duration / 1000 + Math.random(),
            ease: "easeOut",
            delay: particle.delay,
          }}
          style={{
            position: "absolute",
            width: "10px",
            height: "10px",
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};
