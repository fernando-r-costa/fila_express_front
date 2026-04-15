export function buildStaticCheckinUrl(salonId: number) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/fila/checkin?salonId=${salonId}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_CHECKIN_BASE_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (!baseUrl || !salonId) return `/fila/checkin?salonId=${salonId}`;

  const trimmed = baseUrl.replace(/\/+$/, '');
  return `${trimmed}/fila/checkin?salonId=${salonId}`;
}
