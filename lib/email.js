// Brevo Email Service for Next.js
// Uses Brevo's REST API for sending transactional emails

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendBrevoEmail({ to, subject, htmlContent, textContent, cc = [] }) {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.error('BREVO_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    console.log('Sending email to:', to);
    if (cc.length > 0) console.log('CC:', cc);
    console.log('Subject:', subject);
    
    const emailPayload = {
      sender: {
        email: 'alisafyan1122@gmail.com',
        name: 'Creative Coloring Pages'
      },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      replyTo: { email: 'sufyan.afzalk@gmail.com', name: 'Support' },
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
    console.log('Brevo response:', data);

    if (!response.ok) {
      console.error('Brevo API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log('Email sent successfully!');
    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendContactEmail({ name, email, message }) {
  // Send to both email addresses
  const primaryEmail = 'sufyan.afzalk@gmail.com';
  const secondaryEmail = 'admin@creativecoloringpages.online';
  
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
        This email was sent from the contact form on Creative Coloring Pages.
      </p>
    </div>
  `;

  const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Message:
${message}

This email was sent from the contact form on Creative Coloring Pages.
  `;

  // Send to both addresses - primary as TO, secondary as CC
  return sendBrevoEmail({
    to: primaryEmail,
    cc: [secondaryEmail],
    subject: `New Contact Form Submission from ${name}`,
    htmlContent,
    textContent
  });
}

export async function sendPasswordResetEmail({ email, resetToken, resetUrl }) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested to reset your password. Click the button below to proceed:</p>
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

You requested to reset your password. Visit the link below to proceed:
${resetUrl}

If you didn't request this, please ignore this email.
This link will expire in 1 hour.
  `;

  return sendBrevoEmail({
    to: email,
    subject: 'Password Reset Request',
    htmlContent,
    textContent
  });
}

export async function sendOrderConfirmationEmail({ email, orderNumber, items, total }) {
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
      <p>Your order <strong>#${orderNumber}</strong> has been confirmed.</p>
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
      <p>Your downloads are now available in your account.</p>
    </div>
  `;

  const textContent = `
Thank You for Your Order!

Your order #${orderNumber} has been confirmed.

Items:
${itemsText}

Total: $${total.toFixed(2)}

Your downloads are now available in your account.
  `;

  return sendBrevoEmail({
    to: email,
    subject: `Order Confirmation #${orderNumber}`,
    htmlContent,
    textContent
  });
}
