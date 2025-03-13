import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireUser } from '@/app/utils/hooks';
import prisma from '@/app/utils/db';

export async function GET() {
  try {
    const session = await requireUser();
    
    let template;
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: { customInvoiceTemplate: true }
    });
    
    if (user?.customInvoiceTemplate) {
      console.log('Using custom template from user');
      template = user.customInvoiceTemplate;
    } else {
      console.log('Loading default template');
      // Try to load from the email-templates directory first
      let templatePath = path.join(process.cwd(), 'app/email-templates/invoice.html');
      
      try {
        console.log('Trying to load from:', templatePath);
        template = await fs.readFile(templatePath, 'utf-8');
        console.log('Successfully loaded table-based template');
      } catch (err) {
        console.log('Table-based template not found, trying div-based template');
        // If not found, try the emails directory
        templatePath = path.join(process.cwd(), 'app/emails/invoice-template.html');
        console.log('Trying to load from:', templatePath);
        template = await fs.readFile(templatePath, 'utf-8');
        console.log('Successfully loaded div-based template');
      }
    }

    // Only remove comments, preserve structure
    const cleanTemplate = template
      .replace(/<!--[\s\S]*?-->/g, '');
    
    return new NextResponse(cleanTemplate, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });
  } catch (error) {
    console.error('Failed to read template:', error);
    
    // Fallback to a simple template if everything else fails
    const fallbackTemplate = `
      <div class="email-container">
        <div class="header-container">
          <h1>Invoice</h1>
        </div>
        <div class="content-container">
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sample Item</td>
                <td>$100.00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="footer">
          <p>Thank you for your business</p>
        </div>
      </div>
    `;
    
    return new NextResponse(fallbackTemplate, { 
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });
  }
}