export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Standalone: no external OAuth portal.
// If you add your own auth, update this function to return your login URL.
export const getLoginUrl = (_returnPath?: string): string => {
  return "/login";
};
