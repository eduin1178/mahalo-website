## MODIFIED Requirements

### Requirement: Existing provider logo upload migrates to R2

The provider image upload action(s) in `lib/providers/actions.ts` SHALL use the storage module instead of writing to the container filesystem, and SHALL manage **two independent provider image types**:

- **landing image** — the promotional artwork rendered in the landing carousel, persisted on `providers.landingImageUrl`;
- **card logo** — the contained brand mark rendered in checkout plan cards, persisted on `providers.logoUrl` (optional).

Each image type SHALL be stored under a per-provider folder key of the form `providers/{id}/landing.{ext}` and `providers/{id}/logo.{ext}` respectively, so the two assets never collide. The stored database value for each field SHALL be the absolute public R2 URL returned by `getPublicUrl`. Uploading, replacing, and deleting one image type SHALL NOT affect the other.

#### Scenario: Uploading a landing image

- **WHEN** an authenticated admin submits a landing image for a provider
- **THEN** the action SHALL stream the file to R2 under `providers/{id}/landing.{ext}` via the storage module, update `providers.landingImageUrl` with the public URL, and SHALL NOT modify `providers.logoUrl`.

#### Scenario: Uploading a card logo

- **WHEN** an authenticated admin submits a card logo for a provider
- **THEN** the action SHALL stream the file to R2 under `providers/{id}/logo.{ext}` via the storage module, update `providers.logoUrl` with the public URL, and SHALL NOT modify `providers.landingImageUrl`.

#### Scenario: Replacing an existing image with a different extension

- **WHEN** an admin uploads a new image of one type for a provider that already has that image type stored with a different file extension
- **THEN** the action SHALL upload the new object, update the corresponding field with the new public URL, and SHALL attempt to delete the previous object of that same type via `deleteObject` (ignoring not-found errors), leaving the other image type untouched.

#### Scenario: Validation errors do not touch storage

- **WHEN** an uploaded file fails size or MIME validation
- **THEN** the action SHALL return the validation error and SHALL NOT call `putObject`.
