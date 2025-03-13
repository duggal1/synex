import { NextResponse } from 'next/server';
import prisma from '@/app/utils/db';
import { requireUser } from '@/app/utils/hooks';

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const { template } = await request.json();

    await prisma.$transaction(async (tx) => {
      // First check if user exists
      const user = await tx.user.findUnique({
        where: { id: session.user?.id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update user with new template
      await tx.user.update({
        where: { id: user.id },
        data: {
          customInvoiceTemplate: template,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save template:', error);
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    );
  }
}
