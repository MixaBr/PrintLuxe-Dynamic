import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Если запрос идет на вебхук Telegram, пропускаем его без проверки сессии.
  if (request.nextUrl.pathname.startsWith('/api/telegram')) {
    return NextResponse.next();
  }

  // Создаем ответ, который будет передан дальше.
  // Это позволяет Supabase клиенту читать и ЗАПИСЫВАТЬ куки.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Создаем серверный клиент Supabase, передавая ему обработчики куки.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Мидлвар обновляет куки в объекте ответа.
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Мидлвар удаляет куки из объекта ответа.
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // ВАЖНО: `getUser` обновляет сессию, если токен истек.
  // Это ключевой шаг для поддержания сессии в активном состоянии.
  const { data: { user } } = await supabase.auth.getUser();

  // Логирование для диагностики
  if (user) {
    console.log(`[Middleware] User session found for path: ${request.nextUrl.pathname}`);
  } else {
    console.log(`[Middleware] No user session found for path: ${request.nextUrl.pathname}`);
  }

  // Возвращаем обновленный ответ с новыми куки (если они были обновлены).
  return response
}

export const config = {
  matcher: [
    /*
     * Пропускать все пути, которые не требуют аутентификации:
     * - _next/static (статические файлы)
     * - _next/image (файлы оптимизации изображений)
     * - favicon.ico (фавикон)
     * - файлы с расширениями (svg, png, jpg, и т.д.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
