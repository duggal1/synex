"use client";

import { getAuthStatus } from "@/actions";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from "react";
import { toast } from "sonner";

type AuthResponse = {
    success: boolean;
    error?: string;
    user?: {
        id: string;
        email: string;
        name: string;
        image?: string;
    };
};

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    useEffect(() => {
        if (error) {
            toast.error(error);
            router.push("/auth/sign-in");
        }
    }, [error, router]);

    const { isError, isSuccess, data } = useQuery<AuthResponse>({
        queryKey: ["auth-status"],
        queryFn: async () => {
            const response = await getAuthStatus();
            return response as AuthResponse;
        },
        retry: 3,
        retryDelay: 1000,
        refetchInterval: 1000, // Poll every second until success
    });

    useEffect(() => {
        if (isError) {
            toast.error("Failed to verify your account");
            router.push("/auth/sign-in");
        }

        if (isSuccess && data) {
            if (data.success) {
                router.push("/dashboard");
            } else {
                toast.error(data.error || "Authentication failed");
                router.push("/auth/sign-in");
            }
        }
    }, [isError, isSuccess, data, router]);

    return (
        <div className="relative flex flex-col justify-center items-center h-screen">
            <div className="border-[3px] border-neutral-800 border-b-neutral-200 rounded-full w-8 h-8 animate-loading"></div>
            <p className="mt-3 font-medium text-center text-lg">
                {isError ? "Verification failed..." : "Verifying your account..."}
            </p>
        </div>
    );
}