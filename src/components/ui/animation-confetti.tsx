"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
}

const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

export const Confetti = ({ duration = 3000, particleCount = 100 }: ConfettiProps) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate particles for a center burst
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const angle = Math.random() * 360; // Random direction
      const distance = 100 + Math.random() * 400; // Random distance from center (min 100px)
      // Convert polar to cartesian coordinates for the explosion
      const tx = Math.cos((angle * Math.PI) / 180) * distance;
      const ty = Math.sin((angle * Math.PI) / 180) * distance;

      return {
        id: i,
        x: 50, // Start at center
        y: 50, // Start at center
        tx: tx, // Target x offset (pixels from center is simpler, but let's use viewport units or pixels? Pixels are safer for consistent burst)
        ty: ty, // Target y offset
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random(),
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.2, // Small delay variance for "burst" feel
      };
    });
    setParticles(newParticles);
  }, [particleCount]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: particle.tx,
            y: particle.ty,
            opacity: 0,
            scale: particle.scale,
            rotate: particle.rotation + 720, // Spin while flying
          }}
          transition={{
            duration: duration / 1000,
            ease: [0.25, 0.1, 0.25, 1], // Cubic bezier for explosive pop
            delay: particle.delay,
          }}
          style={{
            position: "absolute",
            width: "12px",
            height: "12px",
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};
