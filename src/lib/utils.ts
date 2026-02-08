import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const stripToDigits = (value: string) => value.replace(/\D/g, '');

const normalizeBrazilDigits = (value: string) => {
  let digits = stripToDigits(value);
  if (digits.length === 13 && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  return digits;
};

export function formatBrazilPhone(value: string) {
  const digits = normalizeBrazilDigits(value);
  if (digits.length !== 11) return value;
  const ddd = digits.slice(0, 2);
  const first = digits.slice(2, 7);
  const last = digits.slice(7, 11);
  return `(${ddd}) ${first}-${last}`;
}

export function formatBrazilPhoneInput(value: string) {
  const digits = normalizeBrazilDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 5) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}
