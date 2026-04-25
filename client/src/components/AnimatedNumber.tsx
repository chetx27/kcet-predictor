import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, duration = 1.2, formatFn, className = '' }: AnimatedNumberProps) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => {
    const n = Math.round(v);
    return formatFn ? formatFn(n) : n.toLocaleString('en-IN');
  });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [value, duration, motionVal]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
