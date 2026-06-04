// The two independent provider image types. Each maps to its own DB column and
// its own R2 key suffix under the per-provider folder `providers/{id}/`.
//
// This lives in a plain module (not the "use server" actions file) because a
// "use server" file may only export async functions — exporting this const
// array from there throws "A use server file can only export async functions,
// found object" at module evaluation in production builds.
export const providerImageTypes = ["landing", "logo"] as const;
export type ProviderImageType = (typeof providerImageTypes)[number];
