"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { LogOut, MenuIcon, User, XIcon } from "lucide-react";
import Link from "next/link";
import { RefObject, useEffect, useRef, useState } from "react";
import AnimationContainer from "./global/animation-container";
import Icons from "./global/icons";
import Wrapper from "./global/wrapper";
import { useClickOutside } from "../hooks/use-click-outside";
import { NAV_LINKS } from "../constants";
import { useSession, signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";
    const isLoading = status === "loading";

    const ref = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState<boolean>(false);

    const mobileMenuRef = useClickOutside(() => {
        if (open) setOpen(false);
    });

    const { scrollY } = useScroll({
        target: ref as RefObject<HTMLDivElement>,
        offset: ["start start", "end start"],
    });

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 100) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    });

    const handleSignOut = () => {
        signOut({ callbackUrl: "/" });
    };

    return (
        <header className="top-0 z-50 fixed inset-x-0 w-full">
            {/* Desktop */}
            <motion.div
                animate={{
                    width: visible ? "50%" : "100%",
                    y: visible ? 20 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 40,
                }}
                style={{
                    minWidth: "800px",
                }}
                className={cn(
                    "hidden lg:flex bg-transparent self-start items-center justify-between py-4 rounded-full relative z-[50] mx-auto w-full backdrop-blur-md",
                    visible && "bg-background/80 py-2 border border-foreground/10 shadow-lg w-full"
                )}
            >
                <Wrapper className="flex justify-between items-center lg:px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <div className="pl-16 font-black text-neutral-200 text-3xl"> Synex 
                            <span className="text-[#3d28c8]">AI</span>
                            </div>
                        </Link>
                    </motion.div>

                    <div className="hidden absolute inset-0 lg:flex flex-row flex-1 justify-center items-center gap-x-2 mx-auto w-max font-medium text-muted-foreground text-sm">
                        <AnimatePresence>
                            {NAV_LINKS.map((link, index) => (
                                <AnimationContainer
                                    key={index}
                                    animation="fadeDown"
                                    delay={0.1 * index}
                                >
                                    <div className="relative">
                                        <Link href={link.link} className="hover:bg-accent/80 px-4 py-2 rounded-md hover:text-foreground transition-all duration-300">
                                            {link.name}
                                        </Link>
                                    </div>
                                </AnimationContainer>
                            ))}
                        </AnimatePresence>
                    </div>

                    <AnimationContainer animation="fadeLeft" delay={0.1}>
                        <div className="flex items-center gap-x-4">
                            {isLoading ? (
                                <div className="bg-accent/30 rounded-full w-24 h-9 animate-pulse"></div>
                            ) : isAuthenticated ? (
                                <>
                                    <Link href="/dashboard">
                                        <Button variant="default" className="bg-gradient-to-r from-indigo-600 hover:from-indigo-700 to-indigo-800 hover:to-indigo-900 rounded-full transition-all duration-300">
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Avatar className="border-2 border-indigo-600 hover:border-indigo-800 w-9 h-9 transition-all duration-300 cursor-pointer">
                                                <AvatarImage src={session?.user?.image || ""} />
                                                <AvatarFallback className="bg-indigo-600 text-white">
                                                    {session?.user?.name?.charAt(0) || <User className="w-4 h-4" />}
                                                </AvatarFallback>
                                            </Avatar>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="font-medium text-sm">{session?.user?.name}</p>
                                                    <p className="text-muted-foreground text-xs truncate">{session?.user?.email}</p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href="/dashboard" className="cursor-pointer">
                                                    Dashboard
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/profile" className="cursor-pointer">
                                                    Profile
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                                                <LogOut className="mr-2 w-4 h-4" />
                                                Sign out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" className="hover:bg-accent/50 rounded-full">
                                            Sign in
                                        </Button>
                                    </Link>
                                    <Link href="/signup">
                                        <Button size="sm" className="bg-gradient-to-r from-indigo-600 hover:from-indigo-700 to-indigo-800 hover:to-indigo-900 rounded-full transition-all duration-300">
                                            Get started
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </AnimationContainer>
                </Wrapper>
            </motion.div>

            {/* Mobile */}
            <motion.div
                animate={{
                    y: visible ? 20 : 0,
                    borderTopLeftRadius: open ? "0.75rem" : "2rem",
                    borderTopRightRadius: open ? "0.75rem" : "2rem",
                    borderBottomLeftRadius: open ? "0" : "2rem",
                    borderBottomRightRadius: open ? "0" : "2rem",
                }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 50,
                }}
                className={cn(
                    "flex relative flex-col lg:hidden w-11/12 justify-between items-center mx-auto py-4 z-50 backdrop-blur-md",
                    visible && "bg-background/80 border border-foreground/10 shadow-lg",
                    open && "border-transparent"
                )}
            >
                <Wrapper className="flex justify-between items-center lg:px-4">
                    <div className="flex justify-between items-center gap-x-4 w-full">
                        <AnimationContainer animation="fadeRight" delay={0.1}>
                            <Link href="/">
                                <Icons.icon className="w-max h-6" />
                            </Link>
                        </AnimationContainer>

                        <AnimationContainer animation="fadeLeft" delay={0.1}>
                            <div className="flex justify-center items-center gap-x-4">
                                {isLoading ? (
                                    <div className="bg-accent/30 rounded-full w-20 h-8 animate-pulse"></div>
                                ) : isAuthenticated ? (
                                    <Avatar className="border-2 border-indigo-600 w-8 h-8 cursor-pointer">
                                        <AvatarImage src={session?.user?.image || ""} />
                                        <AvatarFallback className="bg-indigo-600 text-white">
                                            {session?.user?.name?.charAt(0) || <User className="w-3 h-3" />}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-full">
                                        <Link href="/login" className="flex items-center">
                                            Get started
                                        </Link>
                                    </Button>
                                )}
                                {open ? (
                                    <XIcon
                                        className="text-foreground"
                                        onClick={() => setOpen(!open)}
                                    />
                                ) : (
                                    <MenuIcon
                                        className="text-foreground"
                                        onClick={() => setOpen(!open)}
                                    />
                                )}
                            </div>
                        </AnimationContainer>
                    </div>
                </Wrapper>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={mobileMenuRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="top-16 z-50 absolute inset-x-0 flex flex-col justify-start items-start gap-2 bg-background/95 shadow-lg backdrop-blur-lg px-4 py-8 rounded-b-xl w-full"
                        >
                           
                            {NAV_LINKS.map((navItem: any, idx: number) => (
                                <AnimationContainer
                                    key={`link=${idx}`}
                                    animation="fadeRight"
                                    delay={0.1 * (idx + 1)}
                                    className="w-full"
                                >
                                    <Link
                                        href={navItem.link}
                                        onClick={() => setOpen(false)}
                                        className="relative flex hover:bg-accent/80 px-4 py-2 rounded-lg w-full text-foreground/80 hover:text-foreground transition-all duration-300"
                                    >
                                        <motion.span>{navItem.name}</motion.span>
                                    </Link>
                                </AnimationContainer>
                            ))}
                            <AnimationContainer animation="fadeUp" delay={0.5} className="space-y-2 mt-2 w-full">
                                {isAuthenticated ? (
                                    <>
                                        <Link href="/dashboard" className="w-full">
                                            <Button
                                                onClick={() => setOpen(false)}
                                                variant="default"
                                                className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-full w-full"
                                            >
                                                Dashboard
                                            </Button>
                                        </Link>
                                        <Link href="/profile" className="w-full">
                                            <Button
                                                onClick={() => setOpen(false)}
                                                variant="outline"
                                                className="rounded-full w-full"
                                            >
                                                Profile
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={() => {
                                                setOpen(false);
                                                handleSignOut();
                                            }}
                                            variant="destructive"
                                            className="rounded-full w-full"
                                        >
                                            Sign out
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="w-full">
                                            <Button
                                                onClick={() => setOpen(false)}
                                                variant="outline"
                                                className="rounded-full w-full"
                                            >
                                                Sign in
                                            </Button>
                                        </Link>
                                        <Link href="/login" className="w-full">
                                            <Button
                                                onClick={() => setOpen(false)}
                                                variant="default"
                                                className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-full w-full"
                                            >
                                                Start for free
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </AnimationContainer>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </header>
    );
};

export default Navbar;
