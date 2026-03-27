import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Sanitize user input to prevent HTML injection in email content
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Gmail transport — requires App Password (not regular password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { user_name, user_email, message } = await request.json();

    // Basic validation
    if (!user_name || !user_email || !message) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    const sanitizedName = escapeHtml(user_name);
    const sanitizedEmail = escapeHtml(user_email);
    const sanitizedMessage = escapeHtml(message);

    const mailOptions = {
      from: `"${sanitizedName}" <${process.env.GMAIL_USER}>`,
      to: 'robert.radoslav@protonmail.ch',
      replyTo: user_email,
      subject: `Cystene Contact — ${sanitizedName}`,
      text: `Name: ${user_name}\nEmail: ${user_email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Message — Cystene</h3>
        <p><strong>Name:</strong> ${sanitizedName}</p>
        <p><strong>Email:</strong> ${sanitizedEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email.' },
      { status: 500 }
    );
  }
}
