'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/dashboard');
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="relative flex flex-col justify-center items-center bg-black min-h-screen overflow-hidden">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-30"></div>
      
      {/* Subtle gradient line */}
      <div className="top-0 right-0 left-0 absolute bg-gradient-to-r from-transparent via-white/20 to-transparent h-px"></div>
      
      <div className="z-10 relative px-6 py-12 w-full max-w-4xl">
        <div className="flex flex-col">
          {/* 404 with glitch effect */}
          <div className="relative">
           
            <div className="top-0 left-0 absolute flex items-center w-full h-full">
              <span className="mt-1 ml-1 font-black text-[180px] text-cyan-500/10 md:text-[240px] leading-none tracking-tighter select-none">
                404
              </span>
            </div>
          </div>
          
          <div className="flex md:flex-row flex-col justify-between items-start md:items-end space-y-6 md:space-y-0 mt-2 mb-16">
            <div>
              <p className="mb-2 text-white/50 text-sm uppercase tracking-widest">Error</p>
              <h2 className="font-black text-white text-3xl md:text-3xl uppercase tracking-tight">
                The page you&apos;re looking for doesn&apos;t exist 😢.
              </h2>
           
            </div>
            
            <div className="flex flex-col items-end">
              <p className="mb-2 text-white/50 text-sm uppercase tracking-widest">Redirecting</p>
              <div className="flex items-center">
                <div className="flex justify-center items-center mr-4 border-2 border-white/10 rounded-full w-12 h-12">
                  <span className="font-mono text-white text-xl">{countdown}</span>
                </div>
                <div className="bg-white/10 w-32 h-1">
                  <div 
                    className="bg-white h-full transition-all duration-1000" 
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <Link
            href="/dashboard"
            className="group relative overflow-hidden"
          >
            <div className="group-hover:bg-gray-100 flex justify-center items-center bg-black h-20 transition-colors duration-300">
              <span className="font-black text-white text-2xl uppercase tracking-tight">
                Dashboard
              </span>
            </div>
            <div className="absolute inset-0 border border-white/20 pointer-events-none"></div>
          </Link>
        </div>
      </div>
      
      <div className="right-8 bottom-8 absolute font-mono text-white/30 text-xs tracking-wider">
        SYNEXAI © 2025
      </div>
    </div>
  );
}