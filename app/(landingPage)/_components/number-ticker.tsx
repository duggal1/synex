"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib";


export default function NumberTicker({
    value,
    direction = "up",
    delay = 0,
    className,
}: {
    value: number;
    direction?: "up" | "down";
    className?: string;
    delay?: number; // delay in s
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(direction === "down" ? value : 0);
    const springValue = useSpring(motionValue, {
        // damping: 50,
        // stiffness: 80,
        bounce: 0.15,
    });
    const isInView = useInView(ref, { once: true, margin: "0px" });

    useEffect(() => {
        isInView &&
            setTimeout(() => {
                motionValue.set(direction === "down" ? 0 : value);
            }, delay * 500);
    }, [motionValue, isInView, delay, value, direction]);

    useEffect(
        () =>
            springValue.on("change", (latest) => {
                if (ref.current) {
                    ref.current.textContent = Intl.NumberFormat("en-US").format(
                        Number(latest.toFixed(0)),
                    );
                }
            }),
        [springValue],
    );

    return (
        <span
            className={cn(
                "inline-block font-default text-inherit tracking-wider",
                className,
            )}
            ref={ref}
        />
    );
};