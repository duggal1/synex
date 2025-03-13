"use client"
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface NumberFlowProps {
    value: number;
    duration?: number;
}

export const NumberFlow = ({ value, duration = 2000 }: NumberFlowProps) => {
    const [currentValue, setCurrentValue] = useState(0);
    const [ref, inView] = useInView({ threshold: 0, triggerOnce: true });
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (!inView) return;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = timestamp - startTimeRef.current;
            const percentage = Math.min(progress / duration, 1);
            
            setCurrentValue(Math.floor(value * percentage));

            if (percentage < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);

        return () => {
            startTimeRef.current = null;
        };
    }, [inView, value, duration]);

    return <span ref={ref}>{currentValue.toLocaleString()}</span>;
};