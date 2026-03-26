import { z } from 'zod';

// Contact form validation schema
export const contactFormSchema = z.object({
  user_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  user_email: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .trim(),
});

// Type inference from schema
export type ContactFormData = z.infer<typeof contactFormSchema>;
