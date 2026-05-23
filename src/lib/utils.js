// src/lib/utils.js

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ✅ Función base de shadcn (NO LA BORRES)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ✅ AGREGA ESTO AL FINAL PARA ARREGLAR EL ERROR:
export const formatDate = (date, format = 'short') => {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const formats = {
    short: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    long: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
    datetime: d.toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
  };

  return formats[format] || formats.short;
};