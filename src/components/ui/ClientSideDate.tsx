'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ClientSideDateProps {
  dateString: string | null | undefined;
  formatString?: string;
  placeholder?: string;
}

export default function ClientSideDate({ dateString, formatString = 'dd.MM.yyyy HH:mm', placeholder = '—' }: ClientSideDateProps) {
  const [formattedDate, setFormattedDate] = useState(placeholder);

  useEffect(() => {
    if (dateString) {
      try {
        // Для 'date' type inputs, которые дают 'YYYY-MM-DD', обрабатываем их как локальное время, чтобы избежать сдвига часовых поясов
        const date = dateString.length === 10 && !dateString.includes('T') ? new Date(`${dateString}T00:00:00`) : new Date(dateString);
        setFormattedDate(format(date, formatString, { locale: ru }));
      } catch (e) {
        console.error('Неверная дата для форматирования:', dateString, e);
        setFormattedDate('Неверная дата');
      }
    }
  }, [dateString, formatString, placeholder]);

  return <>{formattedDate}</>;
}
