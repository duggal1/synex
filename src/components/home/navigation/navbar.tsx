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
        toast.success("Your payment is successful! 🎉 Enjoy our new Pro Plan✨", {
            style: {
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4a90e2, #9013fe)",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "500",
                padding: "12px 20px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                transition: "transform 0.2s ease-in-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backdropFilter: "blur(10px)",
            },
            icon: "🚀",
            duration: 4000,
        });
    };

    return (
        <>
            <header className={cn(
                "sticky top-0 inset-x-0 h-14 w-full border-b border-transparent z-[99999] select-none",
                scroll && "border-background/80 bg-background/40 backdrop-blur-md"
            )}>
                <AnimationContainer reverse delay={0.1} className="size-full">
                    <MaxWidthWrapper className="flex justify-between items-center">
                        <div className="flex items-center space-x-12">
                            <Link href="/">
                                <img src="/images/synex-ai-logo.png" alt="Synex AI Logo" className="w-40 h-40" />
                            </Link>

                            <NavigationMenu className="lg:flex hidden">
                                <NavigationMenuList>
                                    {NAV_LINKS.map((link) => (
                                        <NavigationMenuItem key={link.title}>
                                            {link.menu ? (
                                                <>
                                                    <NavigationMenuTrigger>{link.title}</NavigationMenuTrigger>
                                                    <NavigationMenuContent>
                                                        <ul className={cn(
                                                            "grid gap-1 p-4 md:w-[400px] lg:w-[500px] rounded-xl",
                                                            link.title === "Features" ? "lg:grid-cols-[.75fr_1fr]" : "lg:grid-cols-2"
                                                        )}>
                                                            {link.title === "Features" && (
                                                                <li className="relative row-span-4 pr-2 rounded-lg overflow-hidden">
                                                                    <div className="bg-[linear-gradient(to_right,rgb(38,38,38,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgb(38,38,38,0.5)_1px,transparent_1px)] !z-10 absolute inset-0 bg-[size:1rem_1rem] w-[calc(100%-10px)] h-full"></div>
                                                                    <NavigationMenuLink asChild className="relative z-20">
                                                                        <Link
                                                                            href="/"
                                                                            className="flex flex-col justify-end bg-gradient-to-b from-muted/50 to-muted focus:shadow-md p-4 rounded-lg w-full h-full no-underline select-none outline-none"
                                                                        >
                                                                            <h6 className="mt-4 mb-2 font-medium text-lg">
                                                                                All Features
                                                                            </h6>
                                                                            <p className="text-muted-foreground text-sm leading-tight">
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
                                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
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
                                        className="relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-600 before:via-fuchsia-500 before:to-rose-500 before:opacity-0 hover:before:opacity-10 hover:shadow-[0_0_30px_rgba(168,85,247,0.6),0_0_60px_rgba(236,72,153,0.4),0_0_90px_rgba(59,130,246,0.3)] border border-transparent hover:border-transparent transition-all before:transition-opacity duration-300 overflow-hidden group"
                                    >
                                        <ZapIcon className="group-hover:text-amber-400 mr-1.5 text-orange-500 transition-colors fill-orange-500 size-4" />
                                        <span className="group-hover:text-white relative z-10 transition-colors">Upgrade</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 via-fuchsia-500/30 to-rose-500/30 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300" />
                                    </Button>
                                    <Link 
                                        href="/dashboard" 
                                        className={cn(
                                            buttonVariants({ size: "sm" }),
                                            "relative group overflow-hidden hover:shadow-[0_0_30px_rgba(59,130,246,0.5),0_0_60px_rgba(236,72,153,0.3),0_0_90px_rgba(234,179,8,0.2)] transition-all duration-300",
                                            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-600 before:via-purple-600 before:to-yellow-500 before:opacity-0 hover:before:opacity-10 before:transition-opacity"
                                        )}
                                    >
                                        <span className="group-hover:text-white relative z-10 transition-colors">Dashboard</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-yellow-500/30 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center gap-x-4">
                                    <Link href="/auth/sign-in" className={buttonVariants({ size: "sm", variant: "ghost" })}>
                                        Sign In
                                    </Link>
                                    <Link href="/auth/sign-up" className={buttonVariants({ size: "sm", })}>
                                        Get Started
                                        <ZapIcon className="ml-1.5 text-orange-500 fill-orange-500 size-3.5" />
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
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #4a90e2, #9013fe)",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "500",
                            padding: "12px 20px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            transition: "transform 0.2s ease-in-out",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backdropFilter: "blur(10px)",
                        },
                        icon: "🚀",
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
                    className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-100 ease-out hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="flex items-center space-x-2 text-neutral-300">
                        <Icon className="w-4 h-4" />
                        <h6 className="font-medium text-sm !leading-none">
                            {title}
                        </h6>
                    </div>
                    <p title={children! as string} className="line-clamp-1 text-muted-foreground text-sm leading-snug">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"

export default Navbar