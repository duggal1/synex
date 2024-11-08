/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@clerk/nextjs";
import { getAuthStatus } from "@/actions";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from "react";
import { toast } from "sonner";

interface AuthResponse {
    success: boolean;
    error?: string;
    user?: {
        id: string;
        email: string;
        name: string | null;
        image?: string | null;
        projects?: any[];
    };
}

export default function AuthCallbackPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    useEffect(() => {
        if (error) {
            toast.error(error);
            router.push("/auth/sign-in");
        }
    }, [error, router]);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/auth/sign-in");
        }
    }, [isLoaded, isSignedIn, router]);

    const { isError, isSuccess, data } = useQuery<AuthResponse>({
        queryKey: ["auth-status"],
        queryFn: async () => {
            try {
                const response = await getAuthStatus();
                return response as AuthResponse;
            } catch (error) {
                console.error('Auth status error:', error);
                throw error;
            }
        },
        retry: 3,
        retryDelay: 1000,
        refetchInterval: 1000,
        refetchOnWindowFocus: false,
        enabled: isSignedIn, // Only run query when signed in
    });

    useEffect(() => {
        if (isError) {
            toast.error("Failed to verify your account");
            router.push("/auth/sign-in");
        }

        if (isSuccess && data) {
            if (data.success && data.user) {
                toast.success("Successfully signed in!");
                router.push("/dashboard");
            } else {
                toast.error(data.error || "Authentication failed");
                router.push("/auth/sign-in");
            }
        }
    }, [isError, isSuccess, data, router]);

    if (!isLoaded) {
        return (
            <div className="relative flex flex-col justify-center items-center h-screen">
                <div className="border-[3px] border-neutral-800 border-b-neutral-200 rounded-full w-8 h-8 animate-loading"></div>
                <p className="mt-3 font-medium text-center text-lg">
                    Loading...
                </p>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col justify-center items-center h-screen">
            <div className="border-[3px] border-neutral-800 border-b-neutral-200 rounded-full w-8 h-8 animate-loading"></div>
            <p className="mt-3 font-medium text-center text-lg">
                {isError ? "Verification failed..." : "Verifying your account..."}
            </p>
        </div>
    );
}