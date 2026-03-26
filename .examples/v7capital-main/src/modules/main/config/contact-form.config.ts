import { formOptions } from '@tanstack/react-form/nextjs';

// Form options to share between client and server
export const contactFormOpts = formOptions({
  defaultValues: {
    user_name: '',
    user_email: '',
    message: '',
  },
});
