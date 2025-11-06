'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addToCart(productId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Для добавления товаров в корзину необходимо войти в систему.' };
  }

  // 1. Проверяем, есть ли уже такой товар в корзине пользователя
  const { data: existingCartItem, error: findError } = await supabase
    .from('carts')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  if (findError && findError.code !== 'PGRST116') { // PGRST116: 'Row not found' - это не ошибка
    console.error('Error finding cart item:', findError);
    return { error: 'Не удалось проверить корзину.' };
  }

  if (existingCartItem) {
    // 2. Если товар есть - увеличиваем количество
    const { error: updateError } = await supabase
      .from('carts')
      .update({ quantity: existingCartItem.quantity + 1 })
      .eq('id', existingCartItem.id);

    if (updateError) {
      console.error('Error updating cart item:', updateError);
      return { error: 'Не удалось обновить товар в корзине.' };
    }
  } else {
    // 3. Если товара нет - добавляем новую запись
    const { error: insertError } = await supabase
      .from('carts')
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity: 1,
      });

    if (insertError) {
      console.error('Error inserting cart item:', insertError);
      return { error: 'Не удалось добавить товар в корзину.' };
    }
  }

  // 4. Пересчитываем данные, которые могут зависеть от корзины (например, иконка в шапке)
  revalidatePath('/'); // Revalidate layout to potentially update cart icon count
  revalidatePath('/catalog');
  
  return { success: 'Товар успешно добавлен в корзину!' };
}
