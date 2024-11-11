"use client";

import { useAuth } from "@clerk/nextjs";
import { getAuthStatus } from "@/actions";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";
import { toast } from "sonner";

export default function AuthCallbackPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();

    const { data, isError, error } = useQuery({
        queryKey: ["auth-status"],
        queryFn: getAuthStatus,
        enabled: isLoaded && isSignedIn,
        retry: 1
    });

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/auth/sign-in");
            return;
        }

        if (data) {
            console.log("Auth response:", data); // Debug log
            if (data.success && data.user) {
                toast.success("Successfully signed in!");
                router.push("/dashboard");
            } else {
                toast.error(data.error || "Failed to create user account");
                router.push("/auth/sign-in");
            }
        }

        if (isError) {
            console.error("Auth error:", error);
            toast.error("Authentication failed");
            router.push("/auth/sign-in");
        }
    }, [isLoaded, isSignedIn, data, isError, error, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="ml-3">Setting up your account...</p>
        </div>
    );
}