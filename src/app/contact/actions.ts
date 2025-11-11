'use server';

import { z } from 'zod';
// import { Resend } from 'resend'; // Заглушка: временно отключаем Resend

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

export async function submitContactForm(prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const toEmail = process.env.CONTACT_FORM_TO_EMAIL;
  // const fromEmail = process.env.CONTACT_FORM_FROM_EMAIL;

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

  // --- ЗАГЛУШКА --- 
  // Временно отключаем отправку email и возвращаем успех
  console.log("--- FORM SUBMISSION (STUB) ---");
  console.log("Name:", validatedFields.data.name);
  console.log("Email:", validatedFields.data.email);
  console.log("Message:", validatedFields.data.message);
  
  return {
      message: 'Ваше сообщение успешно отправлено! (Заглушка)',
      status: 'success',
  };
  // --- КОНЕЦ ЗАГЛУШКИ ---

  /*
  // Оригинальный код отправки
  try {
    if (!toEmail || !fromEmail) {
        throw new Error("Email environment variables are not set.")
    }

    const { name, email, message } = validatedFields.data;

    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Новое сообщение с сайта от ${name}`,
      reply_to: email,
      html: `<p>Имя: ${name}</p><p>Email: ${email}</p><p>Сообщение: ${message}</p>`,
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
  */
}
