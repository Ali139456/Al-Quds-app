/** Pakistani mobile: 03XX XXXXXXX (11 digits, starts with 03) */
const PAK_MOBILE_REGEX = /^03[0-9]{9}$/;

export function normalizePakPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let normalized = digits;

  if (normalized.startsWith('92') && normalized.length === 12) {
    normalized = '0' + normalized.slice(2);
  } else if (normalized.startsWith('3') && normalized.length === 10) {
    normalized = '0' + normalized;
  }

  return PAK_MOBILE_REGEX.test(normalized) ? normalized : null;
}

export function isValidPakPhone(input: string): boolean {
  return normalizePakPhone(input) !== null;
}

export function formatPakPhoneDisplay(normalized: string): string {
  if (normalized.length !== 11) return normalized;
  return `${normalized.slice(0, 4)} ${normalized.slice(4)}`;
}

export function getPakPhoneError(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Mobile number is required';
  if (!isValidPakPhone(trimmed)) {
    return 'Enter a valid Pakistani number (e.g. 0300 1234567 or +92 300 1234567)';
  }
  return null;
}
