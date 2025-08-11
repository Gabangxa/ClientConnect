/**
 * PageTransition.tsx
 * - Wraps children with framer-motion animation for entrance/exit.
 * - Keeps animations small (opacity + translateY) to use GPU-accelerated transforms.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const variants = {
  initial: { opacity: 0, y: 8 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: "easeIn" } },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    // AnimatePresence + motion.div so route changes animate nicely
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}