// Multi-tenant Email Service for Next.js
// Uses Brevo's REST API with brand-specific configuration

import { getBrandByDomain, getSiteUrl } from '@/config/brands';
import { getBrandEnv } from '@/lib/brandEnv';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send email using Brevo API with brand-specific configuration
 */
async function sendBrevoEmail({ to, subject, htmlContent, textContent, cc = [], brandDomain = null }) {
  // Get brand configuration
  const brand = getBrandByDomain(brandDomain);
  const emailConfig = brand.emailService;
  
  // Get brand-specific API key from environment
  const apiKey = getBrandEnv(brand, 'brevoApiKey', 'BREVO_API_KEY');
  
  if (!apiKey) {
    console.error(`BREVO API KEY not configured for brand: ${brand.id}`);
    console.error(`Expected env var: ${brand.envKeys?.brevoApiKey} or fallback: BREVO_API_KEY`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    console.log(`[${brand.id}] Sending email to:`, to);
    if (cc.length > 0) console.log(`[${brand.id}] CC:`, cc);
    console.log(`[${brand.id}] Subject:`, subject);
    
    const emailPayload = {
      sender: {
        email: emailConfig.senderEmail,
        name: emailConfig.senderName
      },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      replyTo: { email: emailConfig.replyToEmail, name: emailConfig.replyToName },
      subject,
      htmlContent,
      textContent
    };
    
    // Add CC recipients if provided
    if (cc.length > 0) {
      emailPayload.cc = cc.map(email => ({ email }));
    }
    
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await response.json();
    console.log(`[${brand.id}] Brevo response:`, data);

    if (!response.ok) {
      console.error(`[${brand.id}] Brevo API error:`, data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log(`[${brand.id}] Email sent successfully!`);
    return { success: true, data };
  } catch (error) {
    console.error(`[${brand.id}] Email send error:`, error);
    return { success: false, error: error.message };
  }
}

export async function sendContactEmail({ name, email, message, brandDomain = null }) {
  // Get brand-specific config
  const brand = getBrandByDomain(brandDomain);
  const emailConfig = brand.emailService;
  
  // Get recipients from brand config
  const recipients = emailConfig.contactRecipients || ['support@example.com'];
  const primaryEmail = recipients[0];
  const ccEmails = recipients.slice(1);
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Contact Form Submission</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        This email was sent from the contact form on ${brand.name}.
      </p>
    </div>
  `;

  const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Message:
${message}

This email was sent from the contact form on ${brand.name}.
  `;

  // Send to all recipients
  return sendBrevoEmail({
    to: primaryEmail,
    cc: ccEmails,
    subject: `New Contact Form Submission from ${name}`,
    htmlContent,
    textContent,
    brandDomain
  });
}

export async function sendPasswordResetEmail({ email, resetToken, resetUrl, brandDomain = null }) {
  const brand = getBrandByDomain(brandDomain);
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested to reset your password for ${brand.name}. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
    </div>
  `;

  const textContent = `
Password Reset Request

You requested to reset your password for ${brand.name}. Visit the link below to proceed:
${resetUrl}

If you didn't request this, please ignore this email.
This link will expire in 1 hour.
  `;

  return sendBrevoEmail({
    to: email,
    subject: `Password Reset Request - ${brand.name}`,
    htmlContent,
    textContent,
    brandDomain
  });
}

export async function sendOrderConfirmationEmail({ email, orderNumber, items, total, brandDomain = null }) {
  const brand = getBrandByDomain(brandDomain);
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const itemsText = items.map(item => `- ${item.title}: $${item.price.toFixed(2)}`).join('\n');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your Order!</h2>
      <p>Your order <strong>#${orderNumber}</strong> from ${brand.name} has been confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Total</td>
            <td style="padding: 10px; font-weight: bold; text-align: right;">$${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <p>You can download your files at any time from <a href="${getSiteUrl(brand)}/my-downloads">${getSiteUrl(brand)}/my-downloads</a> using your order number (<strong>${orderNumber}</strong>) and this email address.</p>
    </div>
  `;

  const textContent = `
Thank You for Your Order!

Your order #${orderNumber} from ${brand.name} has been confirmed.

Items:
${itemsText}

Total: $${total.toFixed(2)}

You can download your files at any time from ${getSiteUrl(brand)}/my-downloads using your order number (${orderNumber}) and this email address.
  `;

  return sendBrevoEmail({
    to: email,
    subject: `Order Confirmation #${orderNumber} - ${brand.name}`,
    htmlContent,
    textContent,
    brandDomain
  });
}

export async function sendSubscriptionWelcomeEmail({ name, email, brandDomain = null }) {
  const brand = getBrandByDomain(brandDomain);
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8b5cf6;">🎨 Welcome to ${brand.name}!</h1>
      </div>
      <p>Hi ${name},</p>
      <p>Thank you for subscribing to our newsletter! You'll be the first to know about:</p>
      <ul>
        <li>New coloring pages and printables</li>
        <li>Special offers and free downloads</li>
        <li>Creative tips and coloring techniques</li>
      </ul>
      <p>Happy coloring! 🌈</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        If you didn't subscribe, you can ignore this email.
      </p>
    </div>
  `;

  const textContent = `
Welcome to ${brand.name}!

Hi ${name},

Thank you for subscribing to our newsletter! You'll be the first to know about:
- New coloring pages and printables
- Special offers and free downloads
- Creative tips and coloring techniques

Happy coloring!

If you didn't subscribe, you can ignore this email.
  `;

  return sendBrevoEmail({
    to: email,
    subject: `Welcome to ${brand.name}! 🎨`,
    htmlContent,
    textContent,
    brandDomain
  });
}

export default sendBrevoEmail;
