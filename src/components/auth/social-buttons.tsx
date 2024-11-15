"use client";
//we dont need this file but as it is never been used though we can keep it for future reference
import { Button } from "@/components/ui/button";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Icons } from "@/components";
import { LoaderIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SocialButtonsProps {
    mode: "sign-in" | "sign-up";
}

const SocialButtons = ({ mode }: SocialButtonsProps) => {
    const [isLoading, setIsLoading] = useState<{
        google: boolean;
        github: boolean;
    }>({
        google: false,
        github: false,
    });

    const { signIn } = useSignIn();
    const { signUp } = useSignUp();

    const oauthSignIn = async (provider: "oauth_google" | "oauth_github") => {
        try {
            setIsLoading(prev => ({
                ...prev,
                [provider === "oauth_google" ? "google" : "github"]: true
            }));

            const signInMethod = mode === "sign-in" ? signIn : signUp;
            
            await signInMethod?.authenticateWithRedirect({
                strategy: provider,
                redirectUrl: "/auth/auth-callback",
                redirectUrlComplete: "/auth/auth-callback",
            });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error("Something went wrong, please try again.");
        } finally {
            setIsLoading(prev => ({
                ...prev,
                [provider === "oauth_google" ? "google" : "github"]: false
            }));
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4 w-full">
            <Button
                variant="outline"
                onClick={() => oauthSignIn("oauth_google")}
                disabled={isLoading.google}
                className="w-full"
            >
                {isLoading.google ? (
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <Icons.google className="w-5 h-5 mr-2" />
                        Google
                    </>
                )}
            </Button>
            <Button
                variant="outline"
                onClick={() => oauthSignIn("oauth_github")}
                disabled={isLoading.github}
                className="w-full"
            >
                {isLoading.github ? (
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <Icons.gitHub className="w-5 h-5 mr-2" />
                        GitHub
                    </>
                )}
            </Button>
        </div>
    );
};

export default SocialButtons; 