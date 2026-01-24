-- 1. Создание таблицы `documents`
-- Эта таблица будет хранить полные тексты документов, таких как "Договор оферты", "Условия гарантии" и т.д.
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    content text,
    category text,
    published_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    excerpt text,

    -- Ограничение, чтобы `slug` был всегда в правильном формате для URL
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- 2. Добавление комментариев для ясности
-- Это поможет в будущем понимать назначение каждого поля.
COMMENT ON TABLE public.documents IS 'Хранит полные текстовые документы, такие как условия обслуживания, политика конфиденциальности и т.д.';
COMMENT ON COLUMN public.documents.id IS 'Уникальный идентификатор документа.';
COMMENT ON COLUMN public.documents.slug IS 'URL-дружелюбный идентификатор для документа (например, "oferta" или "privacy-policy").';
COMMENT ON COLUMN public.documents.title IS 'Официальное название документа, которое будет отображаться на странице.';
COMMENT ON COLUMN public.documents.content IS 'Полное содержимое документа, предназначенное для хранения в формате Markdown.';
COMMENT ON COLUMN public.documents.category IS 'Категория для группировки документов (например, "legal", "guides").';
COMMENT ON COLUMN public.documents.published_at IS 'Дата, когда документ становится общедоступным. Если NULL, документ считается черновиком.';
COMMENT ON COLUMN public.documents.created_at IS 'Отметка времени создания документа.';
COMMENT ON COLUMN public.documents.updated_at IS 'Отметка времени последнего обновления документа.';
COMMENT ON COLUMN public.documents.excerpt IS 'Краткое описание или выдержка из документа для превью.';

-- 3. Создание триггера для автоматического обновления `updated_at`
-- Эта функция будет автоматически обновлять поле `updated_at` при каждом изменении документа.
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Прикрепляем триггер к таблице `documents`
CREATE TRIGGER handle_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 4. Включение Row Level Security (RLS) для защиты данных
-- Это базовый уровень безопасности, который нужно включать для всех таблиц, доступных извне.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 5. Создание политик доступа
-- Определяем, кто и какие данные может читать или изменять.

-- Политика 1: Разрешить публичное чтение опубликованных документов.
-- Любой пользователь (даже неавторизованный) сможет читать документы, у которых указана дата публикации и она не в будущем.
CREATE POLICY "Allow public read access for published documents"
ON public.documents
FOR SELECT
USING (published_at IS NOT NULL AND published_at <= now());

-- Политика 2: Разрешить все действия для административных ролей (service_role).
-- Это позволяет вашему бэкенду (Server Actions, API routes) иметь полный доступ к таблице для управления документами.
CREATE POLICY "Allow all access for service_role"
ON public.documents
FOR ALL
USING (auth.role() = 'service_role');

-- Информация: После выполнения этого скрипта, ваша база данных будет готова к работе с документами.
-- Следующим шагом будет создание страниц для их отображения.
