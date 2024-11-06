"use client"

import { Icons } from "@/components";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="top-4 right-4 z-50 fixed bg-gray-800 dark:bg-gray-200 p-2 rounded-full"
        >
            {theme === "dark" ? (
                <Icons.sun className="w-6 h-6 text-yellow-500" />
            ) : (
                <Icons.moon className="w-6 h-6 text-gray-900" />
            )}
        </button>
    );
};

export default ThemeToggle; 