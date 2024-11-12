import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const users = await prisma.user.findMany({
        include: { projects: true }
    });
    
    return NextResponse.json({
        userCount: users.length,
        users: users.map(user => ({
            id: user.id,
            clerkId: user.clerkId,
            email: user.email,
            projectCount: user.projects.length
        }))
    });
} 