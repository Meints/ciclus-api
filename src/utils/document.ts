export function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits.charAt(i), 10) * (10 - i);
  let mod = (sum * 10) % 11;
  if (mod === 10) mod = 0;
  if (mod !== parseInt(digits.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits.charAt(i), 10) * (11 - i);
  mod = (sum * 10) % 11;
  if (mod === 10) mod = 0;
  if (mod !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

export function validateCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits.charAt(i), 10) * weights1[i]!;
  let mod = sum % 11;
  const firstDigit = mod < 2 ? 0 : 11 - mod;
  if (firstDigit !== parseInt(digits.charAt(12), 10)) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits.charAt(i), 10) * weights2[i]!;
  mod = sum % 11;
  const secondDigit = mod < 2 ? 0 : 11 - mod;
  if (secondDigit !== parseInt(digits.charAt(13), 10)) return false;

  return true;
}

export function validateDocument(document: string, type: "CPF" | "CNPJ"): boolean {
  if (type === "CPF") return validateCpf(document);
  return validateCnpj(document);
}

export function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
