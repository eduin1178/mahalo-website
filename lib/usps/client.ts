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
const DEFAULT_BASE = "https://apis.usps.com";
const TOKEN_REFRESH_MARGIN_MS = 60_000;

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

function getBaseUrl(): string {
  return (process.env.USPS_API_BASE || DEFAULT_BASE).replace(/\/$/, "");
}

function hasRealCredentials(): boolean {
  return Boolean(
    process.env.USPS_CONSUMER_KEY && process.env.USPS_CONSUMER_SECRET,
  );
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
        : await verifyAddressReal(classified);
  } else {
    result =
      classified.kind === "zip"
        ? mockLookupZip(classified.zip)
        : mockVerifyAddress(classified.streetAddress, classified.zip);
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

type CachedToken = { token: string; expiresAt: number };
let tokenCache: CachedToken | null = null;
let tokenInflight: Promise<string | ValidateAddressError> | null = null;

async function getAccessToken(): Promise<string | ValidateAddressError> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - TOKEN_REFRESH_MARGIN_MS > now) {
    return tokenCache.token;
  }
  if (tokenInflight) return tokenInflight;

  tokenInflight = (async (): Promise<string | ValidateAddressError> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.USPS_CONSUMER_KEY!,
        client_secret: process.env.USPS_CONSUMER_SECRET!,
      });
      const res = await fetch(`${getBaseUrl()}/oauth2/v3/token`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          accept: "application/json",
        },
        body,
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          ok: false,
          error: {
            code: res.status === 429 ? "rate_limited" : "upstream",
            message: `USPS auth failed (HTTP ${res.status}).`,
          },
        };
      }
      const json = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
      };
      if (!json.access_token) {
        return {
          ok: false,
          error: { code: "upstream", message: "USPS auth returned no token." },
        };
      }
      const ttlMs = (json.expires_in ?? 28800) * 1000;
      tokenCache = { token: json.access_token, expiresAt: Date.now() + ttlMs };
      return json.access_token;
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        error: {
          code: "upstream",
          message: aborted ? "USPS auth timed out." : "USPS auth request failed.",
        },
      };
    } finally {
      clearTimeout(timer);
      tokenInflight = null;
    }
  })();

  return tokenInflight;
}

async function authedFetchJson(
  url: string,
  attempt = 0,
): Promise<{ ok: true; body: unknown } | ValidateAddressError> {
  const tokenOrError = await getAccessToken();
  if (typeof tokenOrError !== "string") return tokenOrError;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${tokenOrError}`,
        accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status === 401 && attempt === 0) {
      tokenCache = null;
      return authedFetchJson(url, attempt + 1);
    }
    if (res.status === 404) {
      return {
        ok: false,
        error: { code: "not_found", message: "Address not found." },
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: res.status === 429 ? "rate_limited" : "upstream",
          message: `USPS returned HTTP ${res.status}.`,
        },
      };
    }
    return { ok: true, body: await res.json() };
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

async function lookupZipReal(zip: string): Promise<ValidateAddressResult> {
  const url = `${getBaseUrl()}/addresses/v3/city-state?ZIPCode=${encodeURIComponent(zip)}`;
  const result = await authedFetchJson(url);
  if (!result.ok) return result;

  const body = result.body as { city?: string; state?: string; ZIPCode?: string };
  const city = body.city?.trim();
  const state = body.state?.trim();
  if (!city || !state) {
    return {
      ok: false,
      error: { code: "not_found", message: "ZIP code not found." },
    };
  }
  return {
    ok: true,
    zip,
    normalized: { city, state, zip },
    source: "usps",
  };
}

async function verifyAddressReal(classified: {
  streetAddress: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}): Promise<ValidateAddressResult> {
  if (!classified.state && !classified.zip) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message:
          "Include a state or 5-digit ZIP so we can verify the address.",
      },
    };
  }
  const params = new URLSearchParams({ streetAddress: classified.streetAddress });
  if (classified.city) params.set("city", classified.city);
  if (classified.state) params.set("state", classified.state);
  if (classified.zip) params.set("ZIPCode", classified.zip);
  const url = `${getBaseUrl()}/addresses/v3/address?${params.toString()}`;
  const result = await authedFetchJson(url);
  if (!result.ok) return result;

  const body = result.body as {
    address?: {
      streetAddress?: string;
      city?: string;
      state?: string;
      ZIPCode?: string;
    };
  };
  const addr = body.address;
  const zip5 = addr?.ZIPCode?.trim();
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
      street: addr?.streetAddress?.trim() || classified.streetAddress,
      city: addr?.city?.trim() || undefined,
      state: addr?.state?.trim() || undefined,
      zip: zip5,
    },
    source: "usps",
  };
}

export const __testing = {
  cache,
  resetTokenCache: () => {
    tokenCache = null;
    tokenInflight = null;
  },
};
