import { motion } from "framer-motion";

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.4,
        delay: 0.5, // ⏳ PAGE DELAY HERE
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export default PageWrapper;
