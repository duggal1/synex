"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

export const getAuthStatus = async () => {
    try {
        const clerkUser = await currentUser();
        logger.info("Clerk user:", clerkUser); // Debug log

        if (!clerkUser?.id) {
            logger.warn("No user found in Clerk session");
            return { success: false, error: "User not found" };
        }

        // Get primary email
        const emailAddress = clerkUser.primaryEmailAddress?.emailAddress || 
                           clerkUser.emailAddresses[0]?.emailAddress;

        if (!emailAddress) {
            logger.warn(`No email found for user ${clerkUser.id}`);
            return { success: false, error: "No email address found" };
        }

        try {
            // First try to find the user
            let user = await prisma.user.findUnique({
                where: { clerkId: clerkUser.id },
                include: { projects: true }
            });

            if (!user) {
                // If user doesn't exist, create new user
                user = await prisma.user.create({
                    data: {
                        clerkId: clerkUser.id,
                        email: emailAddress,
                        name: clerkUser.firstName || null,
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
                                status: 'ACTIVE'
                            }
                        }
                    },
                    include: { projects: true }
                });
                logger.info("Created new user:", user.id);
            } else {
                // Update existing user
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date(),
                        name: clerkUser.firstName || user.name,
                        image: clerkUser.imageUrl || user.image
                    },
                    include: { projects: true }
                });
                logger.info("Updated existing user:", user.id);
            }

            return { success: true, user };
        } catch (dbError) {
            logger.error("Database error:", dbError);
            throw dbError; // Re-throw to be caught by outer catch
        }

    } catch (error) {
        logger.error("Error in getAuthStatus:", error);
        return { 
            success: false, 
            error: "Failed to verify auth status: " + (error as Error).message 
        };
    }
};