import "server-only";

import { classifyInput } from "./classify";

export type AddressNormalized = {
  street?: string;
  city?: string;
  state?: string;
  zip: string;
};

export type ValidateAddressOk = {
  ok: true;
  zip: string;
  normalized: AddressNormalized;
  source: "usps" | "mock";
};

export type ValidateAddressErrorCode =
  | "empty"
  | "invalid_format"
  | "not_found"
  | "upstream"
  | "rate_limited";

export type ValidateAddressError = {
  ok: false;
  error: { code: ValidateAddressErrorCode; message: string };
};

export type ValidateAddressResult = ValidateAddressOk | ValidateAddressError;

const TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 5_000;

type CacheEntry = { value: ValidateAddressResult; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): ValidateAddressResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key: string, value: ValidateAddressResult): void {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

function hasRealCredentials(): boolean {
  return Boolean(process.env.USPS_USER_ID && process.env.USPS_API_BASE);
}

export async function validateAddress(
  input: string,
): Promise<ValidateAddressResult> {
  const key = input.trim().toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;

  const classified = classifyInput(input);

  let result: ValidateAddressResult;

  if (classified.kind === "empty") {
    result = {
      ok: false,
      error: { code: "empty", message: "Enter a ZIP code or address." },
    };
  } else if (classified.kind === "invalid") {
    result = {
      ok: false,
      error: { code: "invalid_format", message: classified.reason },
    };
  } else if (hasRealCredentials()) {
    result =
      classified.kind === "zip"
        ? await lookupZipReal(classified.zip)
        : await verifyAddressReal(classified.address, classified.extractedZip);
  } else {
    result =
      classified.kind === "zip"
        ? mockLookupZip(classified.zip)
        : mockVerifyAddress(classified.address, classified.extractedZip);
  }

  cacheSet(key, result);
  return result;
}

function mockLookupZip(zip: string): ValidateAddressResult {
  return {
    ok: true,
    zip,
    normalized: { zip },
    source: "mock",
  };
}

function mockVerifyAddress(
  address: string,
  extractedZip: string | null,
): ValidateAddressResult {
  if (!extractedZip) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message:
          "We could not detect a ZIP code in that address. Please include the 5-digit ZIP.",
      },
    };
  }
  return {
    ok: true,
    zip: extractedZip,
    normalized: { street: address, zip: extractedZip },
    source: "mock",
  };
}

async function lookupZipReal(zip: string): Promise<ValidateAddressResult> {
  const userId = process.env.USPS_USER_ID!;
  const base = process.env.USPS_API_BASE!.replace(/\/$/, "");
  const xml = `<CityStateLookupRequest USERID="${escapeXml(userId)}"><ZipCode ID="0"><Zip5>${zip}</Zip5></ZipCode></CityStateLookupRequest>`;
  const url = `${base}?API=CityStateLookup&XML=${encodeURIComponent(xml)}`;

  const upstream = await fetchXml(url);
  if (!upstream.ok) return upstream;

  const body = upstream.body;
  if (/<Error>/i.test(body)) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: extractTag(body, "Description") ?? "ZIP code not found.",
      },
    };
  }

  const city = extractTag(body, "City");
  const state = extractTag(body, "State");
  if (!city || !state) {
    return {
      ok: false,
      error: { code: "upstream", message: "Unexpected USPS response." },
    };
  }

  return {
    ok: true,
    zip,
    normalized: { city, state, zip },
    source: "usps",
  };
}

async function verifyAddressReal(
  address: string,
  extractedZip: string | null,
): Promise<ValidateAddressResult> {
  const userId = process.env.USPS_USER_ID!;
  const base = process.env.USPS_API_BASE!.replace(/\/$/, "");
  const xml = `<AddressValidateRequest USERID="${escapeXml(userId)}"><Revision>1</Revision><Address ID="0"><Address1></Address1><Address2>${escapeXml(address)}</Address2><City></City><State></State><Zip5>${extractedZip ?? ""}</Zip5><Zip4></Zip4></Address></AddressValidateRequest>`;
  const url = `${base}?API=Verify&XML=${encodeURIComponent(xml)}`;

  const upstream = await fetchXml(url);
  if (!upstream.ok) return upstream;

  const body = upstream.body;
  if (/<Error>/i.test(body)) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: extractTag(body, "Description") ?? "Address not found.",
      },
    };
  }

  const street = extractTag(body, "Address2") ?? address;
  const city = extractTag(body, "City");
  const state = extractTag(body, "State");
  const zip5 = extractTag(body, "Zip5");
  if (!zip5) {
    return {
      ok: false,
      error: { code: "upstream", message: "USPS did not return a ZIP." },
    };
  }

  return {
    ok: true,
    zip: zip5,
    normalized: {
      street,
      city: city ?? undefined,
      state: state ?? undefined,
      zip: zip5,
    },
    source: "usps",
  };
}

type FetchXmlResult =
  | { ok: true; body: string }
  | ValidateAddressError;

async function fetchXml(url: string): Promise<FetchXmlResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: res.status === 429 ? "rate_limited" : "upstream",
          message: `USPS returned HTTP ${res.status}.`,
        },
      };
    }
    return { ok: true, body: await res.text() };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      error: {
        code: "upstream",
        message: aborted ? "USPS request timed out." : "USPS request failed.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() || null : null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export const __testing = { cache };
