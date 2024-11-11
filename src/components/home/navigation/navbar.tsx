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
                borderRadius: "16px",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "500",
                padding: "16px 24px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                backdropFilter: "blur(12px)",
            },
            icon: "✨",
            duration: 4000,
        });
    };

    return (
        <>
            <header className={cn(
                "sticky top-0 inset-x-0 h-16 w-full border-b border-transparent z-[99999] select-none transition-all duration-300",
                scroll && "border-background/80 bg-background/60 backdrop-blur-xl"
            )}>
                <AnimationContainer reverse delay={0.1} className="size-full">
                    <MaxWidthWrapper className="flex justify-between items-center h-full">
                        <div className="flex items-center space-x-12">
                            <Link href="/" className="transition-transform duration-300 hover:scale-105">
                                <img src="/images/synex-ai-logo.png" alt="Synex AI Logo" className="w-40 h-40" />
                            </Link>

                            <NavigationMenu className="lg:flex hidden">
                                <NavigationMenuList>
                                    {NAV_LINKS.map((link) => (
                                        <NavigationMenuItem key={link.title}>
                                            {link.menu ? (
                                                <>
                                                    <NavigationMenuTrigger className="hover:text-primary transition-all duration-300">{link.title}</NavigationMenuTrigger>
                                                    <NavigationMenuContent>
                                                        <ul className={cn(
                                                            "grid gap-2 p-6 md:w-[400px] lg:w-[500px] rounded-2xl bg-background/80 backdrop-blur-lg shadow-lg border border-background/20",
                                                            link.title === "Features" ? "lg:grid-cols-[.75fr_1fr]" : "lg:grid-cols-2"
                                                        )}>
                                                            {link.title === "Features" && (
                                                                <li className="relative row-span-4 pr-2 rounded-xl overflow-hidden">
                                                                    <div className="bg-[linear-gradient(to_right,rgb(38,38,38,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgb(38,38,38,0.3)_1px,transparent_1px)] !z-10 absolute inset-0 bg-[size:1rem_1rem] w-[calc(100%-10px)] h-full"></div>
                                                                    <NavigationMenuLink asChild className="relative z-20">
                                                                        <Link
                                                                            href="/"
                                                                            className="flex flex-col justify-end bg-gradient-to-b from-muted/30 hover:from-primary/20 to-muted hover:to-primary/5 focus:shadow-lg p-6 rounded-xl w-full h-full no-underline transition-all duration-300 select-none outline-none"
                                                                        >
                                                                            <h6 className="mt-4 mb-2 font-medium text-lg text-primary">
                                                                                All Features
                                                                            </h6>
                                                                            <p className="text-muted-foreground text-sm leading-relaxed">
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
                                                        "transition-all duration-300 hover:text-primary hover:bg-primary/10"
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
                                        className="relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-600 before:via-blue-600 before:to-purple-600 before:opacity-0 hover:before:opacity-20 hover:shadow-[0_0_40px_rgba(124,58,237,0.5),0_0_80px_rgba(37,99,235,0.4)] rounded-xl transition-all before:transition-opacity duration-500 overflow-hidden group"
                                    >
                                        <ZapIcon className="group-hover:text-yellow-400 group-hover:scale-110 mr-2 text-violet-500 transition-all duration-300 fill-violet-500 size-4" />
                                        <span className="group-hover:text-white relative z-10 transition-colors duration-300">Upgrade</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
                                    </Button>
                                    <Link 
                                        href="/dashboard" 
                                        className={cn(
                                            buttonVariants({ size: "sm" }),
                                            "relative group overflow-hidden rounded-xl hover:shadow-[0_0_40px_rgba(37,99,235,0.5),0_0_80px_rgba(124,58,237,0.4)] transition-all duration-500",
                                            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-600 before:via-violet-600 before:to-purple-600 before:opacity-0 hover:before:opacity-20 before:transition-opacity"
                                        )}
                                    >
                                        <span className="group-hover:text-white relative z-10 transition-colors duration-300">Dashboard</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center gap-x-4">
                                    <Link href="/auth/sign-in" className={cn(
                                        buttonVariants({ size: "sm", variant: "ghost" }),
                                        "hover:bg-primary/10 transition-all duration-300"
                                    )}>
                                        Sign In
                                    </Link>
                                    <Link href="/auth/sign-up" className={cn(
                                        buttonVariants({ size: "sm" }),
                                        "relative group overflow-hidden rounded-xl hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all duration-500"
                                    )}>
                                        <span className="relative z-10">Get Started</span>
                                        <ZapIcon className="group-hover:rotate-12 ml-2 text-amber-400 transition-transform duration-300 fill-amber-400 size-4" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-violet-600/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
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
                            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "500",
                            padding: "16px 24px",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
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
                    className={cn(
                        "block select-none space-y-1.5 rounded-xl p-4 leading-none no-underline outline-none transition-all duration-300 hover:bg-primary/10 hover:scale-[1.02]",
                        className
                    )}
                    {...props}
                >
                    <div className="flex items-center space-x-3 text-primary">
                        <Icon className="group-hover:scale-110 w-5 h-5 transition-transform duration-300" />
                        <h6 className="font-medium text-sm !leading-none">
                            {title}
                        </h6>
                    </div>
                    <p title={children! as string} className="line-clamp-1 text-muted-foreground text-sm leading-relaxed">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"

export default Navbar