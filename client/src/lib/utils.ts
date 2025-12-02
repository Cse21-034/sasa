import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency as Botswana Pula (BWP)
 * @param amount - The amount to format
 * @returns Formatted string like "P 1,234.50"
 */
export function formatPula(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return 'P 0.00';
  
  return new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency: 'BWP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount).replace('BWP', 'P');
}

/**
 * Format currency input placeholder
 * @returns "P 0.00"
 */
export function getPulaPlaceholder(): string {
  return 'P 0.00';
}
