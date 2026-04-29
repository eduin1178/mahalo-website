export type ClassifiedInput =
  | { kind: "empty" }
  | { kind: "zip"; zip: string }
  | {
      kind: "address";
      streetAddress: string;
      city: string | null;
      state: string | null;
      zip: string | null;
    }
  | { kind: "invalid"; reason: string };

const TRAILING_STATE_ZIP =
  /^(.*?)(?:,?\s*\b([A-Za-z]{2})\b(?:\s+(\d{5})(?:-\d{4})?)?)\s*$/u;

const STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC", "PR", "VI", "GU", "AS", "MP",
]);

export function classifyInput(raw: string): ClassifiedInput {
  const value = raw.trim().replace(/\s+/gu, " ");
  if (!value) return { kind: "empty" };

  if (/^\d+$/u.test(value)) {
    if (value.length === 5) return { kind: "zip", zip: value };
    return {
      kind: "invalid",
      reason: "ZIP code must be exactly 5 digits.",
    };
  }

  if (value.length < 4) {
    return {
      kind: "invalid",
      reason: "Enter a 5-digit ZIP code or a full address.",
    };
  }

  let state: string | null = null;
  let zip: string | null = null;
  let head = value;

  const trailing = value.match(TRAILING_STATE_ZIP);
  if (trailing) {
    const candidate = trailing[2].toUpperCase();
    if (STATE_CODES.has(candidate)) {
      state = candidate;
      zip = trailing[3] ?? null;
      head = trailing[1].trim().replace(/,$/u, "").trim();
    }
  }

  if (!zip) {
    const tailZip = value.match(/(\d{5})(?:-\d{4})?\s*$/u);
    if (tailZip) zip = tailZip[1];
  }

  let city: string | null = null;
  let streetAddress = head;
  const lastComma = head.lastIndexOf(",");
  if (lastComma >= 0) {
    const after = head.slice(lastComma + 1).trim();
    const before = head.slice(0, lastComma).trim();
    if (after.length > 0 && before.length > 0) {
      city = after;
      streetAddress = before;
    }
  }

  if (!streetAddress) streetAddress = value;

  if (!state && !zip) {
    return {
      kind: "invalid",
      reason:
        "Include a state (e.g. 'AZ') or a 5-digit ZIP so we can verify the address.",
    };
  }

  return { kind: "address", streetAddress, city, state, zip };
}
