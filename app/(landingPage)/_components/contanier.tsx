"use client";


import { cn } from "@/lib";
import { motion } from "framer-motion";


interface Props {
    className?: string;
    children: React.ReactNode;
    delay?: number;
    reverse?: boolean;
    simple?: boolean;
}

const Container = ({ children, className, delay = 0.2, reverse, simple }: Props) => {
    return (
        <motion.div
            className={cn("w-full h-full", className)}
            initial={{ opacity: 0, y: reverse ? -10 : 10 }} // Reduced movement distance
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                delay: delay,
                duration: simple ? 0.3 : 0.5,
                type: "tween", // Changed to tween for smoother motion
                ease: "easeOut", // Added easing
                opacity: { duration: 0.4 }, // Separate duration for opacity
            }}
        >
            {children}
        </motion.div>
    )
};

export default Container