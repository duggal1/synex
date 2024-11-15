"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";
//checks if user exits in session
export const checkUserExists = async () => {
    try {
        // Initialize Supabase client
        const supabase = createServerComponentClient({ cookies });

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            logger.error("Session error:", sessionError);
            return { exists: false, error: "Authentication error❌" };
        }

        if (!session?.user) {
            logger.warn("No session found");
            return { exists: false, error: "No authenticated user" };
        }

        // Check if user exists in your database table
        const { data: user, error: userError } = await supabase
            .from('users')
            .select(`
                id,
                email,
                name,
                projects (
                    id,
                    name
            `);

        if (userError) {
            logger.error("User error:", userError);
            return { exists: false, error: "User error" };
        }

        return { exists: true, user };
    } catch (error) {
        logger.error("Error checking user:", error);
        return { exists: false, error: "Error checking user" };
    }
}; 