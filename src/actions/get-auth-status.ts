"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

const getAuthStatus = async () => {
    try {
        const user = await currentUser();

        if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
            return { success: false, error: "User not found" };
        }

        const clerkId = user.id;

        const existingUser = await db.user.findFirst({
            where: {
                clerkId,
            },
        });

        if (!existingUser) {
            await db.user.create({
                data: {
                    clerkId,
                    email: user.primaryEmailAddress.emailAddress,
                    name: user.fullName || user.firstName,
                    image: user.imageUrl,
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error in getAuthStatus:", error);
        return { success: false, error: "Failed to verify auth status" };
    }
};

export default getAuthStatus;
