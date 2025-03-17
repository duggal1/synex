import { NextResponse } from "next/server";
import prisma from "@/app/utils/db";
import { auth } from "@/app/utils/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        invoiceCount: true,
        subscription: {
          select: {
            status: true
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure we return fresh data
    return new NextResponse(
      JSON.stringify({
        invoiceCount: user.invoiceCount || 0,
        isSubscribed: user.subscription?.status === "ACTIVE"
      }),
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
