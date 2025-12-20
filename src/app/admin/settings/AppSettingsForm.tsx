'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateSettings } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';

interface AppSettingsFormProps {
    settings: { key: string; value: string | null, description: string | null }[];
}

const initialState = {
    message: '',
    status: 'idle' as const,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить изменения
        </Button>
    );
}

export function AppSettingsForm({ settings }: AppSettingsFormProps) {
    const { toast } = useToast();
    const [state, formAction] = useFormState(updateSettings, initialState);

    useEffect(() => {
        if (state.status === 'success') {
            toast({ title: 'Успех!', description: state.message });
        } else if (state.status === 'error') {
            toast({ variant: 'destructive', title: 'Ошибка', description: state.message });
        }
    }, [state, toast]);

    const renderInput = (setting: AppSettingsFormProps['settings'][0]) => {
        // Если ключ содержит 'prompt', используем Textarea
        if (setting.key.includes('prompt')) {
            return <Textarea name={setting.key} id={setting.key} defaultValue={setting.value || ''} rows={6} />;
        }
        // Для остальных используем Input
        return <Input name={setting.key} id={setting.key} defaultValue={setting.value || ''} />;
    };

    return (
        <form action={formAction} className="space-y-6">
            <div className="space-y-4">
                {settings.map((setting) => (
                    <div key={setting.key} className="space-y-2">
                        <Label htmlFor={setting.key} className="font-semibold">{setting.key}</Label>
                        {setting.description && (
                             <p className="text-sm text-muted-foreground">{setting.description}</p>
                        )}
                        {renderInput(setting)}
                    </div>
                ))}
            </div>
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    );
}
