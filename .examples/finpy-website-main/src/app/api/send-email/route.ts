import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { user_name, user_email, message } = await request.json();

    // Validate input
    if (!user_name || !user_email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transporter with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // App-specific password
      },
    });

    // Email options
    const mailOptions = {
      from: `"${user_name}" <${process.env.GMAIL_USER}>`,
      to: 'robert.radoslav@pm.me', // Your receiving email
      replyTo: user_email,
      subject: `New Contact Form Message from ${user_name}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-top: 20px;">
            <p><strong>Name:</strong> ${user_name}</p>
            <p><strong>Email:</strong> <a href="mailto:${user_email}">${user_email}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This email was sent from the contact form at finpy.tech
          </p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}