import React from 'react';
import { cn } from '@/lib';

interface Props {
    title: string;
    className?: string;
}

const SectionBadge = ({ title, className }: Props) => {
    return (
        <div className={cn(
            "px-3 py-1.5 rounded-full bg-neutral-900/80 border border-white/5 backdrop-blur-xl flex items-center justify-center gap-2.5 group transition-all duration-300 hover:bg-neutral-900/90",
            className
        )}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 flex items-center justify-center relative">
                <div className="w-2 h-2 rounded-full bg-blue-500/60 flex items-center justify-center animate-ping">
                    <div className="w-2 h-2 rounded-full bg-indigo-500/60 flex items-center justify-center animate-ping"></div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                </div>
            </div>
            <span className="text-xs font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-400 group-hover:from-blue-400 group-hover:via-blue-300 group-hover:to-indigo-300 transition-all duration-300">
                {title}
            </span>
        </div>
    )
};

export default SectionBadge;