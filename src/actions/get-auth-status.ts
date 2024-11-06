"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

const getAuthStatus = async () => {
    try {
        const user = await currentUser();

        if (!user?.id) {
            return { success: false, error: "User not found" };
        }

        // Get the email address (handle both primary and OAuth cases)
        const emailAddress = user.primaryEmailAddress?.emailAddress || 
                           user.emailAddresses[0]?.emailAddress;

        if (!emailAddress) {
            return { success: false, error: "No email address found" };
        }

        const clerkId = user.id;

        // Try to find existing user
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { clerkId },
                    { email: emailAddress }
                ]
            },
        });

        if (!existingUser) {
            // Create new user
            const newUser = await prisma.user.create({
                data: {
                    clerkId,
                    email: emailAddress,
                    name: user.fullName || 
                          user.firstName || 
                          user.username || 
                          emailAddress.split('@')[0],
                    image: user.imageUrl,
                },
            });

            return { 
                success: true,
                user: newUser
            };
        }

        // Update existing user if needed
        const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                clerkId,
                email: emailAddress,
                name: user.fullName || 
                      user.firstName || 
                      user.username || 
                      existingUser.name,
                image: user.imageUrl || existingUser.image,
            },
        });

        return {
            success: true,
            user: updatedUser
        };

    } catch (error) {
        console.error("Error in getAuthStatus:", error);
        return { 
            success: false, 
            error: "Failed to verify auth status" 
        };
    }
};

export default getAuthStatus;
