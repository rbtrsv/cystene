'use server';

import {
  createServerValidate,
  ServerValidateError,
} from '@tanstack/react-form/nextjs';
import nodemailer from 'nodemailer';
import { contactFormSchema } from '../schemas/contact.schema';
import { contactFormOpts } from '../config/contact-form.config';

// HTML escape function to prevent injection attacks
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Server-side validation
const serverValidate = createServerValidate({
  ...contactFormOpts,
  onServerValidate: ({ value }) => {
    // Additional server-side validation using Zod
    const result = contactFormSchema.safeParse(value);
    if (!result.success) {
      return result.error.errors[0].message;
    }
  },
});

// Server action to handle form submission
export async function submitContactForm(_prev: unknown, formData: FormData) {
  try {
    // Validate form data
    const validatedData = await serverValidate(formData);

    // Escape HTML in all fields
    const sanitizedName = escapeHtml(validatedData.user_name);
    const sanitizedEmail = escapeHtml(validatedData.user_email);
    const sanitizedMessage = escapeHtml(validatedData.message);

    // Create transporter with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Email options with sanitized content
    const mailOptions = {
      from: `"${sanitizedName}" <${process.env.GMAIL_USER}>`,
      to: 'grow@v7capital.ro',
      replyTo: validatedData.user_email, // Original email for reply
      subject: `New Contact Form Message from ${sanitizedName}`,
      text: validatedData.message, // Plain text version
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-top: 20px;">
            <p><strong>Name:</strong> ${sanitizedName}</p>
            <p><strong>Email:</strong> <a href="mailto:${sanitizedEmail}">${sanitizedEmail}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This email was sent from the contact form at V7 Capital
          </p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success state
    return {
      values: contactFormOpts.defaultValues,
      isSubmitted: true,
      errors: [],
      errorMap: {},
      canSubmit: true,
      isSubmitting: false,
      submissionAttempts: 0,
      isFieldsValid: true,
      isFieldsValidating: false,
      isFormValid: true,
      isFormValidating: false,
      isPristine: true,
      isDirty: false,
      isTouched: false,
      isBlurred: false,
      isValid: true,
      isValidating: false,
      fieldMeta: {},
      submittedAt: new Date().toISOString(),
    };
  } catch (e) {
    if (e instanceof ServerValidateError) {
      // Return validation errors
      return e.formState;
    }

    // Log email sending error
    console.error('Email send error:', e);

    // Return error state
    return {
      values: contactFormOpts.defaultValues,
      isSubmitted: false,
      errors: ['Failed to send message. Please try again later.'],
      errorMap: {},
      canSubmit: true,
      isSubmitting: false,
      submissionAttempts: 0,
      isFieldsValid: false,
      isFieldsValidating: false,
      isFormValid: false,
      isFormValidating: false,
      isPristine: false,
      isDirty: true,
      isTouched: true,
      isBlurred: false,
      isValid: false,
      isValidating: false,
      fieldMeta: {},
      submittedAt: undefined,
    };
  }
}
