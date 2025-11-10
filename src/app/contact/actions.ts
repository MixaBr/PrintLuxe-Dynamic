
'use server';

import { z } from 'zod';
import { sendMail } from '@/lib/mail';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'Имя должно содержать не менее 2 символов.' }),
  email: z.string().email({ message: 'Неверный формат email.' }),
  message: z.string().min(10, { message: 'Сообщение должно содержать не менее 10 символов.' }),
});

export type ContactFormState = {
  message: string;
  status: 'success' | 'error' | 'idle';
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const validatedFields = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Пожалуйста, исправьте ошибки в форме.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, message } = validatedFields.data;
  
  const from = process.env.SMTP_FROM || 'default-from@example.com';
  const to = process.env.SMTP_TO || 'default-to@example.com';

  const subject = `Новое сообщение с сайта от ${name}`;
  const textBody = `
    Имя: ${name}
    Email: ${email}
    Сообщение:
    ${message}
  `;
  const htmlBody = `
    <h3>Новое сообщение с контактной формы</h3>
    <p><strong>Имя:</strong> ${name}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <hr>
    <p><strong>Сообщение:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  const result = await sendMail({
    from: `"PrintLux Contact Form" <${from}>`,
    to: to,
    subject: subject,
    text: textBody,
    html: htmlBody,
  });

  if (result.success) {
    return {
      status: 'success',
      message: 'Ваше сообщение успешно отправлено! Мы скоро с вами свяжемся.',
    };
  } else {
    return {
      status: 'error',
      message: `Произошла ошибка при отправке: ${result.error}`,
    };
  }
}
