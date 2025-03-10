"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";

export async function saveStripeKeys(apiKey: string, secretKey: string) {
  try {
    const session = await requireUser();
    const userId = session.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    await prisma.stripeSettings.upsert({
      where: {
        userId,
      },
      update: {
        stripeApiKey: apiKey,
        stripeSecretKey: secretKey,
      },
      create: {
        userId,
        stripeApiKey: apiKey,
        stripeSecretKey: secretKey,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error saving Stripe keys:", error);
    return { success: false, error: "Failed to save Stripe keys" };
  }
}

export async function deleteAccount() {
  try {
    const session = await requireUser();
    const userId = session.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Delete the user and all related data (Prisma will handle cascading deletes)
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}

export async function getStripeSettings() {
  try {
    const session = await requireUser();
    const userId = session.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const settings = await prisma.stripeSettings.findUnique({
      where: {
        userId,
      },
      select: {
        stripeApiKey: true,
        stripeSecretKey: true,
        isConnected: true,
      },
    });

    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching Stripe settings:", error);
    return { success: false, error: "Failed to fetch Stripe settings" };
  }
}