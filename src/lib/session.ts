// Wrapper de compatibilidade — aponta pra src/lib/auth.ts (multi-user com JWT)
export {
  getCurrentSession,
  getCurrentUser,
  issueSession as setSessionCookie,
  clearSession as clearSessionCookie,
} from "./auth";
