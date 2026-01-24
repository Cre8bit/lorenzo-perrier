import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
}

// Smooth sweep/wipe transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    filter: "blur(8px)",
    x: "3%",
  },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      opacity: { duration: 0.4 },
      filter: { duration: 0.5 },
      x: { duration: 0.5 },
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(6px)",
    x: "-3%",
    transition: {
      duration: 0.4,
      ease: [0.55, 0.06, 0.68, 0.19],
      opacity: { duration: 0.35 },
      filter: { duration: 0.4 },
      x: { duration: 0.4 },
    },
  },
};

// Page wrapper with animation - wrap individual pages with this
export const PageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};
