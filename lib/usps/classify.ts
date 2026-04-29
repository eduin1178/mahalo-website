export type ClassifiedInput =
  | { kind: "empty" }
  | { kind: "zip"; zip: string }
  | { kind: "address"; address: string; extractedZip: string | null }
  | { kind: "invalid"; reason: string };

const ZIP_ANY = /\b(\d{5})(?:-\d{4})?\b/;

export function classifyInput(raw: string): ClassifiedInput {
  const value = raw.trim();
  if (!value) return { kind: "empty" };

  if (/^\d+$/.test(value)) {
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

  const match = value.match(ZIP_ANY);
  return {
    kind: "address",
    address: value,
    extractedZip: match ? match[1] : null,
  };
}
