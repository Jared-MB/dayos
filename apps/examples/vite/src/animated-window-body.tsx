import { useWindowPresence } from "@dayos/core";
import { motion, useReducedMotion } from "motion/react";

/**
 * React's and motion's types disagree on these handlers (motion calls them
 * with its own arguments). DayOS doesn't put any of them on the window body,
 * so dropping them from the type loses nothing.
 */
type BodyProps = Omit<
  React.ComponentProps<"section">,
  "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
>;

/**
 * Passed to `Window`'s `render`. DayOS's props (dialog role, label, layout
 * styles, handlers) come in through `props` and go first; the animation goes
 * after. `useWindowPresence` keeps the window on screen after it closes until
 * `safeToRemove` runs, which is what lets the exit play.
 */
export function AnimatedWindowBody(props: BodyProps) {
  const { isPresent, safeToRemove } = useWindowPresence();
  const reduceMotion = useReducedMotion();

  const variants = {
    open: { opacity: 1, scale: 1, y: 0 },
    closed: {
      opacity: 0,
      scale: reduceMotion ? 1 : 0.94,
      y: reduceMotion ? 0 : 12,
    },
  };

  return (
    <motion.section
      {...props}
      variants={variants}
      initial="closed"
      animate={isPresent ? "open" : "closed"}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (!isPresent) safeToRemove();
      }}
    />
  );
}
