"use client"

import { ClerkProvider as ClientClerkProvider } from "@clerk/nextjs";
import React from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <ClientClerkProvider>{children}</ClientClerkProvider>;
} 