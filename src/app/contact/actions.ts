
'use server';

import { z } from 'zod';
import { sendMail } from '@/lib/mail';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Имя должно содержать не менее 2 символов.' }),
  email: z.string().email({ message: 'Неверный формат email.' }),
  message: z.string().min(10, { message: 'Сообщение должно содержать не менее 10 символов.' }),
});

export interface ContactFormState {
  message: string;
  status: 'idle' | 'success' | 'error';
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];


export async function submitContactForm(prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {

  const rawFormData = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  };

  const validatedFields = contactFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: 'Обнаружены ошибки валидации.',
      status: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const token = formData.get('g-recaptcha-response') as string;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!token) {
      return { 
          message: 'Пожалуйста, пройдите проверку reCAPTCHA.',
          status: 'error'
      };
  }

  try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${secretKey}&response=${token}`,
      });
      const recaptchaData = await response.json();

      if (!recaptchaData.success) {
           return { 
              message: 'Проверка reCAPTCHA не удалась. Попробуйте еще раз.',
              status: 'error'
          };
      }
  } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return { 
          message: 'Ошибка при проверке reCAPTCHA.',
          status: 'error'
      };
  }

  const file = formData.get('file') as File | null;
  let attachments;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) {
      return { message: 'Файл слишком большой. Максимальный размер 10 МБ.', status: 'error' };
    }
    
    // Server-side type check for security
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return { message: 'Недопустимый тип файла.', status: 'error' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    attachments = [{ filename: file.name, content: buffer }];
  }


  try {
    const { name, email, message } = validatedFields.data;

    await sendMail({
      to: process.env.SMTP_TO as string,
      subject: `Новое сообщение с сайта от ${name}`,
      html: `<p>Имя: ${name}</p><p>Email: ${email}</p><p>Сообщение: ${message}</p>`,
      replyTo: email,
      attachments
    });

    return {
      message: 'Ваше сообщение успешно отправлено!',
      status: 'success',
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.',
      status: 'error',
    };
  }
}

    