"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.32),rgba(99,102,241,0))] blur-2xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.24),rgba(16,185,129,0))] blur-2xl"
        animate={{ x: [0, -35, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.24),rgba(59,130,246,0))] blur-2xl"
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
