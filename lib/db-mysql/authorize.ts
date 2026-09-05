const ALLOWED_EMAILS = (process.env.AUTH_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter((email) => email.length > 0)

export function isPriceAlertAuthorized(email: string | null | undefined): boolean {
  if (ALLOWED_EMAILS.length === 0) return true
  return Boolean(email && ALLOWED_EMAILS.includes(email.toLowerCase()))
}
