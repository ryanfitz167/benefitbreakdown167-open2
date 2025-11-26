export function sanitize<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [k, v] of Object.entries(obj || {})) {
    clean[k] = typeof v === "string" ? v.trim() : v;
  }
  if (clean.email) clean.email = String(clean.email).toLowerCase();
  return clean;
}

export function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

export function validateBroker(body: any) {
  const errors: string[] = [];
  if (!validateEmail(body?.email)) errors.push("Invalid email");
  if (body?.employees != null && (!Number.isFinite(Number(body.employees)) || Number(body.employees) < 0)) errors.push("Invalid employees");
  if (!body?.type) errors.push("Missing type");
  return errors;
}

export function validateNewsletter(body: any) {
  const errors: string[] = [];
  if (!validateEmail(body?.email)) errors.push("Invalid email");
  if (!body?.type) errors.push("Missing type");
  return errors;
}

