"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignIn } from '@clerk/nextjs';
import { OAuthStrategy } from "@clerk/types";
import { Eye, EyeOff, Github, LoaderIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { Label } from "../ui/label";
import { Icons } from "../icons";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from "next/image";

const SignInForm = () => {
    const router = useRouter();
    const { signIn, isLoaded, setActive } = useSignIn();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [oauthLoading, setOAuthLoading] = useState<OAuthStrategy | null>(null);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoaded) return;

        if (!email || !password) {
            setIsLoading(false);
            toast.error("Email and password are required!");
            return;
        }

        setIsLoading(true);

        try {
            const signInAttempt = await signIn.create({
                identifier: email,
                password,
                redirectUrl: "/auth/auth-callback",
            });

            if (signInAttempt.status === "complete") {
                await setActive({
                    session: signInAttempt.createdSessionId,
                });
                router.push("/auth/auth-callback");
            } else {
                console.log(JSON.stringify(signInAttempt, null, 2));
                toast.error("Invalid email or password");
                setIsLoading(false);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            switch (error.errors[0]?.code) {
                case "form_identifier_not_found":
                    toast.error("This email is not registered. Please sign up first.");
                    break;
                case "form_password_incorrect":
                    toast.error("Incorrect password. Please try again.");
                    break;
                case "too_many_attempts":
                    toast.error("Too many attempts. Please try again later.");
                    break;
                default:
                    toast.error("An error occurred. Please try again");
                    break;
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignIn = async (strategy: OAuthStrategy) => {
        if (!isLoaded) return;
        
        try {
            setOAuthLoading(strategy);
            await signIn?.authenticateWithRedirect({
                strategy,
                redirectUrl: "/auth/auth-callback",
                redirectUrlComplete: "/auth/auth-callback",
            });
        } catch (error) {
            console.error("OAuth error:", error);
            toast.error("Authentication failed. Please try again.");
        } finally {
            setOAuthLoading(null);
        }
    };

    return (
        <div className="flex flex-col items-start gap-y-4 -mt-36 px-0.5 py-8 w-full">
            

            <div className="gap-4 grid w-full">
                <div className="gap-4 grid grid-cols-2">
                    <Button
                        variant="outline"
                        disabled={!isLoaded || oauthLoading === "oauth_google"}
                        onClick={() => handleOAuthSignIn("oauth_google")}
                        className="w-full bg-gradient-to-r from-[#4285F4] via-[#db0ea8] to-[#6e13c8] hover:from-[#ff51ee] hover:via-[#aa00ff]  hover:to-[#2c44ff] text-white transition-all duration-200"
                    >
                        {oauthLoading === "oauth_google" ? (
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Icons.google className="mr-2 w-4 h-4" />
                                Google
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        disabled={!isLoaded || oauthLoading === "oauth_github"}
                        onClick={() => handleOAuthSignIn("oauth_github")}
                          className="w-full bg-gradient-to-r from-[#0e142a] via-[#2a0120] to-[#1a0331] hover:from-[#22256a] hover:via-[#4f014a]  hover:to-[#0f1754] text-white transition-all duration-200"
                    >
                        {oauthLoading === "oauth_github" ? (
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Github className="mr-2 w-4 h-4" />
                                GitHub
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <span className="border-t w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                    </span>
                </div>
            </div>

            <form onSubmit={handleSignIn} className="w-full">
                <div className="space-y-2 w-full">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled={!isLoaded || isLoading}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="focus-visible:border-foreground w-full"
                    />
                </div>
                <div className="space-y-2 mt-4">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative w-full">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            disabled={!isLoaded || isLoading}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="focus-visible:border-foreground w-full"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={!isLoaded || isLoading}
                            className="top-1 right-1 absolute"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
                <Button
                    type="submit"
                    disabled={!isLoaded || isLoading}
                    className="mt-4 w-full"
                >
                    {isLoading ? (
                        <LoaderIcon className="w-5 h-5 animate-spin" />
                    ) : (
                        "Sign in with email"
                    )}
                </Button>
            </form>
        </div>
    );
};

export default SignInForm;