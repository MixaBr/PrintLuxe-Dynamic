'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  message: string | null;
  status: 'idle' | 'success' | 'error';
};

export async function updateProduct(prevState: FormState, formData: FormData): Promise<FormState> {
    const supabase = createAdminClient();
    const id = formData.get('id');

    if (!id) {
        return { status: 'error', message: 'ID товара отсутствует.' };
    }

    const dataToUpdate: Record<string, any> = {};

    const processField = (key: string, value: FormDataEntryValue | null) => {
        if (value !== null && value !== '') {
            const numericFields = ['price1', 'price2', 'price3', 'price4', 'accumulation', 'weight', 'sizeW', 'sizeL', 'sizeH', 'stock_quantity'];
            if (numericFields.includes(key)) {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    dataToUpdate[key] = numValue;
                }
            } else if (key === 'is_featured') {
                dataToUpdate[key] = value === 'true';
            } else if (key === 'image_urls' && typeof value === 'string') {
                 dataToUpdate[key] = value.split(',').map(url => url.trim()).filter(Boolean);
            } else {
                dataToUpdate[key] = value;
            }
        }
    };
    
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('new_')) {
            const productField = key.substring(4);
            processField(productField, value);
        }
    }

    if (Object.keys(dataToUpdate).length === 0) {
        // Even if no fields are changed, we can return a success message
        // and avoid a DB call and redirection.
        return { status: 'success', message: 'Нет новых значений для сохранения.' };
    }

    dataToUpdate.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('products')
        .update(dataToUpdate)
        .eq('id', id);

    if (error) {
        console.error('Product update error:', error);
        return { status: 'error', message: `Не удалось обновить товар: ${error.message}` };
    }

    revalidatePath('/manager/products');
    revalidatePath(`/manager/products/${id}/edit`);
    
    redirect('/manager/products');
}
