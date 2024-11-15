"use client";

import { motion } from 'framer-motion';

interface AnimationContainerProps {
    children: React.ReactNode;
    delay?: number;
    reverse?: boolean;
    className?: string;
};

const AnimationContainer = ({ children, className, reverse, delay = 0.2 }: AnimationContainerProps) => {
    return (
        <motion.div
            className={className}
            initial={{
                opacity: 0,
                y: reverse ? -10 : 10, // Reduced vertical movement for ultra-smoothness
                scale: 0.98 // Slight scale effect for added smoothness
            }}
            whileInView={{
                opacity: 1,
                y: 0,
                scale: 1, // Returning to original scale
                transition: {
                    duration: 1.5, // Slower transition for ultra-smoothness
                    delay: delay,
                    ease: [0.25, 0.75, 0.5, 1], // Custom ease for a super-smooth animation curve
                    type: 'spring',
                    stiffness: 120, // Low stiffness for softer, fluid movements
                    damping: 40 // Reduced damping for smoother stopping
                }
            }}
            viewport={{ once: false }} // Keeps the animation active when in view
        >
            {children}
        </motion.div>
    );
};

export default AnimationContainer;