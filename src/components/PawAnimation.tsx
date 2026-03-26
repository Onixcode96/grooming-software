import { motion } from "framer-motion";

const PawAnimation = () => {
  return (
    <motion.div
      className="inline-flex items-center justify-center"
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2,
      }}
    >
      <motion.span
        className="text-5xl"
        animate={{
          rotate: [0, -10, 10, -5, 0],
          scale: [1, 1.1, 1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        🐾
      </motion.span>
    </motion.div>
  );
};

export default PawAnimation;
