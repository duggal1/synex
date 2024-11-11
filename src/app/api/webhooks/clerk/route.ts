import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  // Verify webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Verify webhook
  const payload = await req.json();
  const webhook = new Webhook(WEBHOOK_SECRET);

  try {
    const evt = webhook.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;

    // Handle user creation/update
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const { id } = evt.data;
      const email = evt.data.email_addresses?.[0]?.email_address;
      
      if (!email) {
        logger.error('No email found for user:', id);
        return new Response('No email found', { status: 400 });
      }

      // Create or update user in our database
      await prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email: email,
          subscriptionStatus: 'FREE',
          usageLimit: 10,
          status: 'ACTIVE'
        },
        update: {
          email: email,
          lastLoginAt: new Date()
        }
      });

      logger.info('User synced successfully:', id);
      return new Response('User processed', { status: 200 });
    }

    return new Response('Webhook received', { status: 200 });
  } catch (err) {
    logger.error('Webhook error:', err);
    return new Response('Webhook error', { status: 400 });
  }
} 