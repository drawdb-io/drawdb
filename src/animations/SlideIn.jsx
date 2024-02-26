import { useRef, useEffect } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

export default function SlideIn({ children, duration, delay, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const mainControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        variants={{
          hidden: { opacity: 0, x: -60 },
          visible: { opacity: 1, x: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration, delay }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}