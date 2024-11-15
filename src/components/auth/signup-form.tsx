"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignUp } from '@clerk/nextjs';
import { OAuthStrategy } from "@clerk/types";
import { Eye, EyeOff, Github, LoaderIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Label } from "../ui/label";
import { Icons } from "../icons";

const SignUpForm = () => {
    const router = useRouter();
    const { signUp, isLoaded, setActive } = useSignUp();
    const [oauthLoading, setOAuthLoading] = useState<OAuthStrategy | null>(null);

    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoaded) return;

        if (!name || !email || !password) {
            toast.error("Name, email and password are required??!");
            return;
        }

        setIsUpdating(true);

        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName: name.split(" ")[0],
                lastName: name.split(" ")[1],
            });

            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });

            toast.success("Verification code sent to your email.");

            setIsVerifying(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.log(JSON.stringify(error, null, 2));

            switch (error.errors[0]?.code) {
                case "form_identifier_exists":
                    toast.error("This email is already registered. Please sign in.");
                    break;
                case "form_password_pwned":
                    toast.error("The password is too common. Please choose a stronger password.");
                    break;
                case "form_param_format_invalid":
                    toast.error("Invalid email address. Please enter a valid email address.");
                    break;
                case "form_password_length_too_short":
                    toast.error("Password is too short. Please choose a longer password.");
                    break;
                default:
                    toast.error("An error occurred. Please try again");
                    break;
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoaded) return;

        if (!code) {
            toast.error("Verification code is required!");
            return;
        }

        setIsLoading(true);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === "complete") {
                await setActive({
                    session: completeSignUp.createdSessionId,
                });
                router.push("/auth/auth-callback");
            } else {
                console.log(JSON.stringify(completeSignUp, null, 2));
                toast.error("Invalid verification code");
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error:', JSON.stringify(error, null, 2));
            toast.error("Something went wrong. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignUp = async (strategy: OAuthStrategy) => {
        if (!isLoaded) return;
        
        try {
            setOAuthLoading(strategy);
            await signUp?.authenticateWithRedirect({
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

    return isVerifying ? (
        <div className="flex flex-col items-start gap-y-6 px-0.5 py-8 w-full text-start">
            <h2 className="font-semibold text-2xl">
                Verify your account
            </h2>
            <p className="text-muted-foreground text-sm">
                To continue, please enter the 6-digit verification code we just sent to {email}.
            </p>
            <form onSubmit={handleVerifyEmail} className="w-full">
                <div className="space-y-2 pl-0.5 w-full">
                    <Label htmlFor="code">
                        Verification code
                    </Label>
                    <InputOTP
                        id="code"
                        name="code"
                        maxLength={6}
                        value={code}
                        disabled={!isLoaded || isLoading}
                        onChange={(e) => setCode(e)}
                        className="pt-2"
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                <div className="mt-4 w-full">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : "Verify code"}
                    </Button>
                </div>
                <p className="mt-4 text-muted-foreground text-sm">
                    Didn&apos;t receive the code?{" "}
                    <Link
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            signUp?.prepareEmailAddressVerification({
                                strategy: "email_code",
                            });
                            toast.success("Verification code resent to your email.");
                        }}
                        className="text-primary"
                    >
                        Resend code
                    </Link>
                </p>
            </form>
        </div>
    ) : (
        <div className="flex flex-col items-start gap-y-6 -mt-36 px-0.5 py-8 w-full">
            <h2 className="font-semibold text-2xl">
                Create an account
            </h2>

            <div className="gap-4 grid w-full">
                <div className="gap-4 grid grid-cols-2">
                    <Button
                        variant="outline"
                        disabled={!isLoaded || oauthLoading === "oauth_google"}
                        onClick={() => handleOAuthSignUp("oauth_google")}
                        className="w-full"
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
                        onClick={() => handleOAuthSignUp("oauth_github")}
                        className="w-full"
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

            <form onSubmit={handleSignUp} className="w-full">
                <div className="space-y-2 w-full">
                    <Label htmlFor="name">
                        Name
                    </Label>
                    <Input
                        id="name"
                        type="name"
                        value={name}
                        disabled={!isLoaded || isUpdating}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="focus-visible:border-foreground w-full"
                    />
                </div>
                <div className="space-y-2 mt-4 w-full">
                    <Label htmlFor="email">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled={!isLoaded || isUpdating}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="focus-visible:border-foreground w-full"
                    />
                </div>
                <div className="space-y-2 mt-4">
                    <Label htmlFor="password">
                        Password
                    </Label>
                    <div className="relative w-full">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            disabled={!isLoaded || isUpdating}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="focus-visible:border-foreground w-full"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="top-1 right-1 absolute"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ?
                                <EyeOff className="w-4 h-4" /> :
                                <Eye className="w-4 h-4" />
                            }
                        </Button>
                    </div>
                </div>
                <div className="mt-4 w-full">
                    <Button
                        type="submit"
                        disabled={!isLoaded || isUpdating}
                        className="w-full"
                    >
                        {isUpdating ? (
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : "Continue"}
                    </Button>
                </div>
            </form>
        </div>
    )
};

export default SignUpForm
