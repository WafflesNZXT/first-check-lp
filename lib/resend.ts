import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const AUDO_EMAIL_CONFIG = {
  from: 'audo <roast@useaudo.com>', // Or hello@useaudo.com
  replyTo: 'your-email@example.com',
};