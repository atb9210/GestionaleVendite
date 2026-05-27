// Normalizza qualsiasi formato di numero telefono a +XXXXXXXXXXX (digits con + prefix)
// Esempi: "393519615376" → "+393519615376"
//         "+39 333 123 4567" → "+393331234567"
//         "+393664111785" → "+393664111785"
export function normalizePhone(phone: string): string {
  if (!phone) return phone;
  return '+' + phone.replace(/\D/g, '');
}
