/** Reject cross-origin writes. APP_ORIGIN pins the public origin behind a proxy. */
export function sameOrigin(request: Request): boolean {
  const supplied = request.headers.get('origin');
  if (!supplied) return false;
  try {
    const origin = new URL(supplied);
    if (process.env.APP_ORIGIN) return origin.origin === new URL(process.env.APP_ORIGIN).origin;
    if (process.env.EDUKIDS_DATA_MODE === 'supabase') return false;
    return ['http:', 'https:'].includes(origin.protocol) && origin.host === request.headers.get('host');
  } catch { return false; }
}
