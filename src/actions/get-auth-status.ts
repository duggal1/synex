"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

export const getAuthStatus = async () => {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser?.id) {
            logger.warn("No user found in Clerk session");
            return { success: false, error: "User not found" };
        }

        const emailAddress = clerkUser.primaryEmailAddress?.emailAddress || 
                           clerkUser.emailAddresses[0]?.emailAddress;

        if (!emailAddress) {
            logger.warn(`No email found for user ${clerkUser.id}`);
            return { success: false, error: "No email address found" };
        }

        // First check if user exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email: emailAddress,
            }
        });

        if (existingUser && existingUser.clerkId !== clerkUser.id) {
            logger.warn(`User tried to sign up with existing email: ${emailAddress}`);
            return { 
                success: false, 
                error: "An account with this email already exists. Please sign in instead." 
            };
        }

        // Try to find or create user in database using upsert
        const user = await prisma.user.upsert({
            where: {
                email: emailAddress,
            },
            update: {
                clerkId: clerkUser.id,
                name: clerkUser.fullName || clerkUser.firstName || null,
                image: clerkUser.imageUrl,
                lastLoginAt: new Date(),
            },
            create: {
                clerkId: clerkUser.id,
                email: emailAddress,
                name: clerkUser.fullName || clerkUser.firstName || null,
                image: clerkUser.imageUrl,
                lastLoginAt: new Date(),
                subscriptionStatus: 'FREE',
                usageLimit: 10,
                projects: {
                    create: {
                        name: 'My First Project',
                        framework: 'NEXTJS',
                        buildCommand: 'npm run build',
                        startCommand: 'npm start',
                        nodeVersion: '18.x',
                        status: 'ACTIVE',
                        environments: {
                            create: {
                                name: 'production',
                                variables: {
                                    create: [
                                        {
                                            key: 'NODE_ENV',
                                            value: 'production'
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            include: {
                projects: {
                    include: {
                        environments: true
                    }
                }
            }
        });

        logger.info(`User authenticated: ${user.id}`);
        logger.info(`Projects count: ${user.projects.length}`);
        logger.info(`First project: ${user.projects[0]?.name}`);
        
        return {
            success: true,
            user
        };

    } catch (error) {
        logger.error("Error in getAuthStatus:", error);
        
        // Check if it's a unique constraint violation
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return { 
                success: false, 
                error: "An account with this email already exists. Please sign in instead." 
            };
        }

        return { 
            success: false, 
            error: "Failed to verify auth status" 
        };
    }
};