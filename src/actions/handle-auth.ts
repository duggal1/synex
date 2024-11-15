"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const handleAuth = async () => {
    try {
        const supabase = createServerComponentClient({ cookies });
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            logger.error("Session error:", sessionError);
            return { success: false, error: "Authentication error" };
        }

        if (!session?.user) {
            logger.warn("No session found");
            return { success: false, error: "No authenticated user" };
        }

        const { user: supabaseUser } = session;

        // Check if user exists in our database
        const existingUser = await prisma.user.findFirst({
            where: {
                email: supabaseUser.email
            }
        });

        if (!existingUser) {
            // Create new user with default project
            const newUser = await prisma.$transaction(async (tx) => {
                // Create user
                const createdUser = await tx.user.create({
                    data: {
                        clerkId:supabaseUser.email!,
                        email: supabaseUser.email!,
                        name: supabaseUser.user_metadata.full_name || supabaseUser.email!.split('@')[0],
                        image: supabaseUser.user_metadata.avatar_url,
                        subscriptionStatus: 'FREE',
                        usageLimit: 10,
                        lastLoginAt: new Date()
                    },
                });

                // Create default project
                const defaultProject = await tx.project.create({
                    data: {
                        name: 'My First Project',
                        userId: createdUser.id,
                        framework: 'NEXTJS',
                        buildCommand: 'npm run build',
                        startCommand: 'npm start',
                        nodeVersion: '18.x',
                        status: 'ACTIVE'
                    }
                });

                // Create default environment
                await tx.environment.create({
                    data: {
                        name: 'production',
                        projectId: defaultProject.id,
                        variables: {
                            create: [
                                {
                                    key: 'NODE_ENV',
                                    value: 'production'
                                }
                            ]
                        }
                    }
                });

                return createdUser;
            });

            logger.info(`New user created: ${newUser.id}`);
            return { 
                success: true, 
                user: newUser,
                isNewUser: true 
            };
        }

        // Update existing user's last login
        const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                lastLoginAt: new Date()
            },
            include: {
                projects: true
            }
        });

        return { 
            success: true, 
            user: updatedUser,
            isNewUser: false 
        };

    } catch (error) {
        logger.error("Error in handleAuth:", error);
        return { 
            success: false, 
            error: "Failed to handle authentication" 
        };
    }
}; 