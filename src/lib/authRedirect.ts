/** Production site URL for Supabase email confirmation redirects */
const PRODUCTION_SITE_URL = "https://pocket-finance-ten.vercel.app";

/** Base URL used for auth email redirects */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return PRODUCTION_SITE_URL;
}

/** Where Supabase sends users after they confirm their email */
export function getEmailConfirmRedirectUrl(): string {
  return `${getSiteUrl()}/app?email_confirmed=1`;
}
