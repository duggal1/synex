import React from 'react';
import { cn } from '@/lib/utils';

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
            <div className="relative flex justify-center items-center bg-blue-500/40 rounded-full w-1.5 h-1.5">
                <div className="flex justify-center items-center bg-blue-500/60 rounded-full w-2 h-2 animate-ping">
                    <div className="flex justify-center items-center bg-indigo-500/60 rounded-full w-2 h-2 animate-ping"></div>
                </div>
                <div className="top-1/2 left-1/2 absolute flex justify-center items-center bg-blue-500 rounded-full w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2">
                </div>
            </div>
            <span className="group-hover:from-blue-400 group-hover:via-blue-300 group-hover:to-indigo-300 bg-clip-text bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-400 font-black text-transparent text-xs tracking-wide transition-all duration-300">
                {title}
            </span>
        </div>
    )
};

export default SectionBadge;