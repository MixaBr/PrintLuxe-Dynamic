
import { z } from 'zod';

// Обновленные ENUM значения в соответствии с базой данных
export const paymentMethods = [
  'Наличный при получении',
  'Картой при получении',
  'Оплата через ЕРИП'
] as const;

export const deliveryMethods = [
  'Самовывоз',
  'Курьером по городу',
  'СДЭК',
  'Почта'
] as const;

export const checkoutFormSchema = z.object({
  first_name: z.string().min(2, 'Имя обязательно'),
  last_name: z.string().min(2, 'Фамилия обязательна'),
  email: z.string().email('Неверный формат email'),
  phone: z.string().min(9, 'Телефон обязателен').transform((val) => val.replace(/[^\d]/g, '')), 
  delivery_method: z.string({ required_error: 'Выберите способ доставки.' }).refine(val => deliveryMethods.includes(val as any), { message: "Выберите допустимый способ доставки." }),
  payment_method: z.string({ required_error: 'Выберите способ оплаты.' }).refine(val => paymentMethods.includes(val as any), { message: "Выберите допустимый способ оплаты." }),
  order_comment: z.string().optional(),

  country: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  building: z.string().optional(),
  housing: z.string().optional(),
  apartment: z.string().optional(),
  postal_code: z.string().optional(),
  address_comment: z.string().optional(),
});

// Уточненная схема, использующая корректное значение для проверки
export const refinedCheckoutFormSchema = checkoutFormSchema.superRefine((data, ctx) => {
  const deliveryRequiresAddress = ['Курьером по городу', 'СДЭК', 'Почта'].includes(data.delivery_method);

  if (deliveryRequiresAddress && (!data.street || !data.building || !data.city)) {
    if (!data.street) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Улица обязательна для доставки',
            path: ['street'],
        });
    }
    if (!data.building) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Номер дома обязателен для доставки',
            path: ['building'],
        });
    }
     if (!data.city) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Город обязателен для доставки',
            path: ['city'],
        });
    }
  }
});

export type CheckoutFormValues = z.infer<typeof refinedCheckoutFormSchema>;
