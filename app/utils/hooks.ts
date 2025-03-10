import { redirect } from "next/navigation";
import { auth } from "./auth";
import { cache } from "react";

// Cache the auth result to avoid repeated database queries
export const getAuthSession = cache(async () => {
  try {
    return await auth();
  } catch (error) {
    console.error("Error in getAuthSession:", error);
    return null;
  }
});

export async function requireUser() {
  try {
    // Use the cached session
    const session = await getAuthSession();

    if (!session?.user) {
      redirect("/login");
    }

    return session;
  } catch (error) {
    console.error("Error in requireUser:", error);
    redirect("/login");
  }
}
