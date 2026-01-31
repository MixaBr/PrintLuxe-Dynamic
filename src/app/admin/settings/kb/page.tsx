
import { createAdminClient } from "@/lib/supabase/service";
import { AppSettingsForm } from "./AppSettingsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 0;

export default async function KnowledgeBaseSettingsPage() {
    const supabase = createAdminClient();

    // Fetch only the settings related to the Knowledge Base (KB).
    // The AppSettingsForm component expects an array of objects, so we fetch all relevant fields.
    const { data: settings, error } = await supabase
        .from('app_config')
        .select('key, value, description') // Also select 'description' as the form might need it.
        .like('key', 'bot_kb_%'); // Filter for KB-specific keys.

    if (error) {
        console.error("Failed to load KB settings:", error);
        const errorMessage = typeof error.message === 'string' 
            ? error.message 
            : JSON.stringify(error, null, 2);

        return (
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-destructive">Ошибка загрузки настроек базы знаний</h1>
                <p className="text-sm text-muted-foreground">Подробности ошибки:</p>
                <pre className="mt-2 rounded-md bg-muted p-4 text-sm text-destructive-foreground">
                    {errorMessage}
                </pre>
            </div>
        );
    }

    // The 'reduce' method was incorrectly transforming the settings array into an object.
    // We remove it and pass the array directly to the component, which is the expected format.

    return (
        <Card>
            <CardHeader>
                <CardTitle>Настройки базы знаний</CardTitle>
                <CardDescription>
                    Здесь вы можете настроить параметры поиска по базе знаний, чтобы 
                    регулировать релевантность и количество возвращаемых результатов.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Pass the array of settings objects, providing an empty array as a fallback. */}
                <AppSettingsForm settings={settings || []} />
            </CardContent>
        </Card>
    );
}
