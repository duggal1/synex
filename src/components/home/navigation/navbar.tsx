"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import { LucideIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from "react-hot-toast";

import MobileNavbar from "./mobile-navbar";
import AnimationContainer from "@/components/animate-cantanier";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { NAV_LINKS } from "./constants";

const Navbar = () => {
    const { user } = useClerk();
    const [scroll, setScroll] = useState(false);

    const handleScroll = () => {
        if (window.scrollY > 8) {
            setScroll(true);
        } else {
            setScroll(false);
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleUpgradeClick = () => {
        toast.success("Your payment is successful!  Enjoy our new Pro Plan✨", {
            style: {
                borderRadius: "16px",
                background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "500",
                padding: "16px 24px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(12px)",
            },
            icon: "✨",
            duration: 4000,
        });
    };

    return (
        <>
            <header className={cn(
                "sticky top-0 inset-x-0 h-16 w-full border-b border-transparent z-[99999] select-none transition-all duration-500",
                scroll && "border-slate-900/10 bg-gradient-to-r from-blue-800 via-purple-700 to-black/40 backdrop-blur-xl"
            )}>
                <AnimationContainer reverse delay={0.1} className="size-full">
                    <MaxWidthWrapper className="flex justify-between items-center h-full">
                        <div className="flex items-center space-x-12">
                            <Link href="/" className="transition-transform duration-500 hover:scale-105">
                                <img src="/images/synex-ai-logo.png" alt="Synex AI Logo" className="w-40 h-40" />
                            </Link>

                            <NavigationMenu className="lg:flex hidden">
                                <NavigationMenuList>
                                    {NAV_LINKS.map((link) => (
                                        <NavigationMenuItem key={link.title}>
                                            {link.menu ? (
                                                <>
                                                    <NavigationMenuTrigger className="hover:text-blue-400 transition-all duration-500">{link.title}</NavigationMenuTrigger>
                                                    <NavigationMenuContent>
                                                        <ul className={cn(
                                                            "grid gap-2 p-6 md:w-[400px] lg:w-[500px] rounded-2xl bg-black backdrop-blur-2xl shadow-2xl border border-slate-800/50",
                                                            link.title === "Features" ? "lg:grid-cols-[.75fr_1fr]" : "lg:grid-cols-2"
                                                        )}>
                                                            {link.title === "Features" && (
                                                                <li className="relative row-span-4 pr-2 rounded-xl overflow-hidden">
                                                                    <div className="bg-[linear-gradient(to_right,rgb(30,58,138,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgb(30,58,138,0.3)_1px,transparent_1px)] !z-10 absolute inset-0 bg-[size:1rem_1rem] w-[calc(100%-10px)] h-full"></div>
                                                                    <NavigationMenuLink asChild className="relative z-20">
                                                                        <Link
                                                                            href="/"
                                                                            className="flex flex-col justify-end bg-gradient-to-b from-slate-900/50 hover:from-blue-900/30 to-slate-800/30 hover:to-blue-800/20 focus:shadow-2xl p-6 rounded-xl w-full h-full no-underline transition-all duration-500 select-none outline-none hover:scale-[1.02]"
                                                                        >
                                                                            <h6 className="mt-4 mb-2 font-medium text-blue-400 text-lg">
                                                                                All Features
                                                                            </h6>
                                                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                                                Manage links, track performance, and more.
                                                                            </p>
                                                                        </Link>
                                                                    </NavigationMenuLink>
                                                                </li>
                                                            )}
                                                            {link.menu.map((menuItem) => (
                                                                <ListItem
                                                                    key={menuItem.title}
                                                                    title={menuItem.title}
                                                                    href={menuItem.href}
                                                                    icon={menuItem.icon}
                                                                >
                                                                    {menuItem.tagline}
                                                                </ListItem>
                                                            ))}
                                                        </ul>
                                                    </NavigationMenuContent>
                                                </>
                                            ) : (
                                                <Link href={link.href} legacyBehavior passHref>
                                                    <NavigationMenuLink className={cn(
                                                        navigationMenuTriggerStyle(),
                                                        "transition-all duration-500 hover:text-blue-400 hover:bg-blue-900/20"
                                                    )}>
                                                        {link.title}
                                                    </NavigationMenuLink>
                                                </Link>
                                            )}
                                        </NavigationMenuItem>
                                    ))}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>

                        <div className="lg:flex items-center hidden">
                            {user ? (
                                <div className="flex items-center gap-x-4">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleUpgradeClick}
                                        disabled={!user}
                                        className="relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-900 before:via-slate-900 before:to-blue-900 before:opacity-0 hover:before:opacity-100 hover:shadow-[0_0_50px_rgba(30,58,138,0.6)] rounded-xl transition-all before:transition-all duration-500 overflow-hidden group"
                                    >
                                        <ZapIcon className="group-hover:text-blue-400 group-hover:scale-110 mr-2 text-blue-500 transition-all duration-500 size-4" />
                                        <span className="group-hover:text-blue-400 relative z-10 transition-colors duration-500">Upgrade</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-slate-900/20 to-blue-900/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500" />
                                    </Button>
                                    <Link 
                                        href="/dashboard" 
                                        className={cn(
                                            buttonVariants({ size: "sm" }),
                                            "relative group overflow-hidden rounded-xl hover:shadow-[0_0_50px_rgba(30,58,138,0.6)] transition-all duration-500",
                                            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-900 before:via-slate-900 before:to-blue-900 before:opacity-0 hover:before:opacity-100 before:transition-all"
                                        )}
                                    >
                                        <span className="group-hover:text-blue-400 relative z-10 transition-colors duration-500">Dashboard</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-slate-900/20 to-blue-900/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center gap-x-4">
                                    <Link href="/auth/sign-in" className={cn(
                                        buttonVariants({ size: "sm", variant: "ghost" }),
                                        "hover:bg-blue-900/20 hover:text-blue-400 transition-all duration-500"
                                    )}>
                                        Sign In
                                    </Link>
                                    <Link href="/auth/sign-up" className={cn(
                                        buttonVariants({ size: "sm" }),
                                        "relative group overflow-hidden rounded-xl hover:shadow-[0_0_50px_rgba(30,58,138,0.6)] transition-all duration-500"
                                    )}>
                                        <span className="group-hover:text-blue-400 relative z-10 transition-colors duration-500">Get Started</span>
                                        <ZapIcon className="group-hover:rotate-12 group-hover:text-blue-400 ml-2 transition-all duration-500 size-4" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-slate-900/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500" />
                                    </Link>
                                </div>
                            )}
                        </div>

                        <MobileNavbar />

                    </MaxWidthWrapper>
                </AnimationContainer>
            </header>
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    success: {
                        style: {
                            borderRadius: "16px",
                            background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "500",
                            padding: "16px 24px",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                            backdropFilter: "blur(12px)",
                        },
                        icon: "✨",
                        duration: 4000,
                    },
                }}
            />
        </>
    )
};

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { title: string; icon: LucideIcon }
>(({ className, title, href, icon: Icon, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    href={href!}
                    ref={ref}
                    {...props}
                    className={cn(
                        "group relative flex items-center gap-3 rounded-xl p-4 transition-all duration-500 hover:bg-gradient-to-r from-slate-800/40 to-blue-900/30 hover:shadow-[0_0_20px rgba(255, 255, 255, 0.8), 0_0_40px rgba(255, 255, 255, 0.6), 0_0_60px rgba(255, 255, 255, 0.4)] backdrop-blur-xl border border-slate-800/20 hover:border-blue-500/20",
                        className
                    )}
                >
                    <div className="relative flex items-center gap-3">
                        <div className="relative">
                            <Icon className="group-hover:text-blue-400 group-hover:scale-110 w-5 h-5 text-slate-400 transition-all duration-500" />
                            <div className="absolute inset-0 bg-blue-400/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
                        </div>
                        <span className="group-hover:text-white font-medium text-slate-300 text-sm transition-all group-hover:translate-x-0.5 duration-500">
                            {title}
                        </span>
                    </div>
                    <p title={children! as string} className="group-hover:text-slate-200 line-clamp-1 text-slate-400 text-sm transition-all group-hover:translate-x-0.5 duration-500">
                        {children}
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
                </Link>
            </NavigationMenuLink>
            </li>
    )
})
ListItem.displayName = "ListItem"

export default Navbar