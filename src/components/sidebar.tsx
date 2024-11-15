"use client";

import { SIDEBAR_LINKS, SIDEBAR_CATEGORIES } from "@/components/constants/links";
import { LogOutIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import Container from "./global/container-motion";
import { useState } from "react";

const DashboardSidebar = () => {
    const { signOut } = useClerk();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");

    // Filter and group links based on search query
    const filteredAndGroupedLinks = SIDEBAR_LINKS.reduce((acc, link) => {
        // Check if the link matches the search query
        const matchesSearch = link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            SIDEBAR_CATEGORIES[link.category as keyof typeof SIDEBAR_CATEGORIES]
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

        if (matchesSearch) {
            if (!acc[link.category]) {
                acc[link.category] = [];
            }
            acc[link.category].push(link);
        }
        return acc;
    }, {} as Record<string, typeof SIDEBAR_LINKS>);

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <div className="top-16 bottom-0 left-0 z-50 fixed lg:flex flex-col hidden bg-background border-r border-border/50 w-72">
            <div className={cn("flex flex-col size-full p-3")}>
                <Container delay={0.1} className="h-max">
                    <div className="relative">
                        <SearchIcon className="top-1/2 left-2 absolute text-muted-foreground -translate-y-1/2 size-4" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "w-full pl-8 text-left justify-between",
                                "focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            )}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="top-1/2 right-2 absolute text-muted-foreground hover:text-foreground -translate-y-1/2"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </Container>

                <div className="space-y-6 custom-scrollbar py-5 w-full overflow-y-auto">
                    {Object.entries(filteredAndGroupedLinks).map(([category, links]) => (
                        <div key={category} className="space-y-2">
                            <h3 className="top-0 sticky bg-background/95 backdrop-blur-sm px-3 py-2 font-semibold text-muted-foreground text-xs uppercase">
                                {SIDEBAR_CATEGORIES[category as keyof typeof SIDEBAR_CATEGORIES]}
                            </h3>
                            <ul className="space-y-1">
                                {links.map((link, index) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <li key={index}>
                                            <Container delay={0.1}>
                                                <Link
                                                href={link.href}
                                                className={buttonVariants({
                                                    variant: "ghost",
                                                    className: cn(
                                                        "w-full !justify-start relative group transition-all duration-300",
                                                        isActive ? "bg-muted text-primary" : "text-foreground/70",
                                                        "hover:bg-gradient-to-r hover:from-primary/30 hover:to-primary/60",
                                                        "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-primary/80 after:to-primary/100",
                                                        "hover:after:w-full after:transition-all after:duration-300",
                                                        "transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg"
                                                    ),
                                                })}
                                            >
                                                    <link.icon strokeWidth={2} className="group-hover:scale-110 mr-1.5 transition-transform duration-300 size-[18px]" />
                                                    <span className="flex-1">{link.label}</span>
                                                    {link.badge && (
                                                        <span className="bg-primary/10 ml-2 px-1.5 py-0.5 rounded-md text-primary text-xs">
                                                            {link.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            </Container>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 mt-auto w-full">
                    <Container delay={0.1}>
                        <Button 
                            variant="outline"
                            onClick={handleLogout}
                            className="flex justify-center items-center bg-transparent hover:bg-blue-500/20 focus:ring-opacity-50 p-3 border border-blue-800 rounded-lg focus:ring-2 focus:ring-rose-500 w-full transition-transform duration-300 hover:scale-105 focus:outline-none"
                        >
                            <LogOutIcon className="group-hover:rotate-45 w-5 h-5 text-red-500 transition-transform duration-300" />
                            <span className="ml-2 font-semibold text-white transition-colors duration-300">
                                Logout
                            </span>
                        </Button>
                    </Container>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar {
                    scrollbar-width: thin;<Link
    href={link.href}
    className={buttonVariants({
        variant: "ghost",
        className: cn(
            "w-full !justify-start relative group transition-all duration-300",
            isActive ? "bg-muted text-primary" : "text-foreground/70",
            "hover:bg-gradient-to-r hover:from-primary/30 hover:to-primary/60",
            "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-primary/80 after:to-primary/100",
            "hover:after:w-full after:transition-all after:duration-300",
            "transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg"
        ),
    })}
><Link
    href={link.href}
    className={buttonVariants({
        variant: "ghost",
        className: cn(
            "w-full !justify-start relative group transition-all duration-300",
            isActive ? "bg-muted text-primary" : "text-foreground/70",
            "hover:bg-gradient-to-r hover:from-primary/30 hover:to-primary/60",
            "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-primary/80 after:to-primary/100",
            "hover:after:w-full after:transition-all after:duration-300",
            "transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg"
        ),
    })}
>
                    scrollbar-color: rgba(var(--primary) / 0.3) transparent;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(var(--primary) / 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(var(--primary) / 0.3);
                }
            `}</style>
        </div>
    );
};

export default DashboardSidebar;
