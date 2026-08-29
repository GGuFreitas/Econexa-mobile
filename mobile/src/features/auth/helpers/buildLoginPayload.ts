export function buildLoginPayload(email: string, password: string) {
  return {
    email: email.trim().toLowerCase(),
    password,
  };
}
