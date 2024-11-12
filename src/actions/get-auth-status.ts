/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { Framework, ProjectStatus, UserStatus } from "@prisma/client";

export const getAuthStatus = async () => {
    try {
        const clerkUser = await currentUser();
        logger.info("Clerk User Data:", clerkUser);

        if (!clerkUser?.id) {
            logger.error("No Clerk user found");
            return { success: false, error: "No authenticated user" };
        }

        const emailAddress = clerkUser.primaryEmailAddress?.emailAddress || 
                           clerkUser.emailAddresses[0]?.emailAddress;

        if (!emailAddress) {
            logger.error("No email found for user");
            return { success: false, error: "Email required" };
        }

        try {
            let user = await prisma.user.findUnique({
                where: { clerkId: clerkUser.id },
                include: { 
                    projects: true 
                }
            });

            if (!user) {
                // Create new user with default project
                user = await prisma.user.create({
                    data: {
                        clerkId: clerkUser.id,
                        email: emailAddress,
                        name: clerkUser.firstName || "", // Use empty string as fallback
                        image: clerkUser.imageUrl || "", // Use empty string as fallback
                        lastLoginAt: new Date(),
                        status: UserStatus.ACTIVE,
                        projects: {
                            create: [{
                                name: "My First Project",
                                framework: Framework.NEXTJS,
                                buildCommand: "npm run build",
                                startCommand: "npm start",
                                nodeVersion: "18.x",
                                status: ProjectStatus.ACTIVE,
                                rootDirectory: "./",
                                buildCache: true,
                                automaticDeploys: true,
                                cdn: true
                            }]
                        }
                    },
                    include: {
                        projects: true
                    }
                });

                logger.info("Created new user:", { 
                    userId: user.id, 
                    clerkId: user.clerkId 
                });
            } else {
                // Update existing user
                user = await prisma.user.update({
                    where: { 
                        id: user.id 
                    },
                    data: {
                        lastLoginAt: new Date(),
                        name: clerkUser.firstName || user.name || "", // Keep existing name as fallback
                        image: clerkUser.imageUrl || user.image || "" // Keep existing image as fallback
                    },
                    include: {
                        projects: true
                    }
                });

                logger.info("Updated existing user:", { 
                    userId: user.id 
                });
            }

            return { 
                success: true, 
                user 
            };

        } catch (dbError) {
            logger.error("Database error:", dbError);
            // Only retry if this was the initial user creation attempt
            if (dbError instanceof Error && dbError.message.includes("create")) {
                logger.info("Retrying user creation...");
                const retryUser = await prisma.user.create({
                    data: {
                        clerkId: clerkUser.id,
                        email: emailAddress,
                        name: clerkUser.firstName || "",
                        image: clerkUser.imageUrl || "",
                        lastLoginAt: new Date(),
                        status: UserStatus.ACTIVE
                    },
                    include: {
                        projects: true
                    }
                });
                return { success: true, user: retryUser };
            }
            throw dbError;
        }
    } catch (error) {
        logger.error("Auth error:", error);
        return { 
            success: false, 
            error: "Auth failed: " + (error as Error).message 
        };
    }
};