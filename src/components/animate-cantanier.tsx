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
                y: reverse ? -5 : 5, // Minimal vertical movement for ultra-smoothness
                scale: 0.9, // Subtle scale effect for a gentle intro
                rotate: reverse ? -1 : 1, // Slight rotation to give a smooth and dynamic feel
            }}
            whileInView={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: 0, // Return to normal rotation for that ultra-clean finish
                transition: {
                    duration: 2.5, // Extended duration for the smoothest possible animation
                    delay: delay,
                    ease: [0.25, 0.46, 0.45, 0.94], // Very smooth easing curve (cubic-bezier)
                    type: 'spring',
                    stiffness: 100, // Low stiffness for gentle, soft movement
                    damping: 35, // Reduced damping for a smoother, fluid motion
                    mass: 0.8, // Light mass for more responsive, graceful movements
                }
            }}
            viewport={{ once: false }} // Keeps the animation active when in view
        >
            {children}
        </motion.div>
    );
};

export default AnimationContainer;