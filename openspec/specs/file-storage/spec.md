# file-storage

## Purpose

Define how the application persists user-uploaded binary assets (provider logos and any future uploads). Storage is backed by **Cloudflare R2** through an S3-compatible client exposed by a single storage module, so the runtime never writes uploads to the container filesystem and stays portable across serverless deploys.
## Requirements
### Requirement: File storage backed by Cloudflare R2
The system SHALL persist user-uploaded files (logos, attachments, and any future binary asset) in a Cloudflare R2 bucket using an S3-compatible client. The application SHALL NOT write user uploads to the container filesystem at runtime.

#### Scenario: Server action uploads a provider logo
- **WHEN** an authenticated admin submits a logo via the provider admin UI
- **THEN** the server action SHALL stream the file to the configured R2 bucket using the storage module and SHALL NOT call any `node:fs` write API for that file.

#### Scenario: Runtime has no writable uploads directory
- **WHEN** the production runtime is inspected
- **THEN** the application SHALL NOT create or depend on a `public/uploads` directory or any mounted volume for user uploads; all uploads SHALL live in R2.

### Requirement: Storage module API
The repository SHALL expose a storage module at `lib/storage/` whose default export provides at least three operations: `putObject({ key, body, contentType })`, `getPublicUrl(key)`, and `deleteObject(key)`. All code that handles user uploads SHALL go through this module rather than instantiating an S3 client directly.

#### Scenario: Putting an object returns a stable key
- **WHEN** a caller invokes `putObject({ key: "providers/<id>.png", body, contentType: "image/png" })`
- **THEN** the module SHALL upload the object to R2 under that key and SHALL resolve with `{ key }` on success.

#### Scenario: Public URL resolution
- **WHEN** `getPublicUrl("providers/<id>.png")` is called
- **THEN** the module SHALL return an absolute URL composed from `R2_PUBLIC_BASE_URL` and the object key, suitable to be stored on a database record and rendered in the UI.

#### Scenario: Deleting a missing object is non-fatal
- **WHEN** `deleteObject(key)` is called for a key that does not exist
- **THEN** the module SHALL resolve successfully (not throw), to keep cleanup logic idempotent.

### Requirement: Required environment variables for storage
The storage module SHALL read its configuration exclusively from the following environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. Missing or empty values for any of these SHALL cause the first call to the module to throw an explicit error naming the missing variable.

#### Scenario: All variables present
- **WHEN** the application starts with every R2 variable set
- **THEN** the first `putObject` call SHALL succeed (assuming valid credentials and bucket) without additional configuration.

#### Scenario: Missing variable is reported clearly
- **WHEN** `R2_BUCKET` is undefined and a caller invokes `putObject`
- **THEN** the call SHALL throw an Error whose message includes the literal string `R2_BUCKET`.

### Requirement: Next.js image configuration allows the R2 public host
The `next.config.ts` `images.remotePatterns` configuration SHALL include the host derived from `R2_PUBLIC_BASE_URL` (parsed at build time) so that any component rendering an R2 asset through `next/image` is not rejected with a "host not configured" error. Provider logos MAY additionally be rendered with a plain `<img>` element to avoid depending on build-time host configuration.

#### Scenario: R2 host is authorized for image optimization
- **WHEN** `R2_PUBLIC_BASE_URL` is set and the application builds
- **THEN** `images.remotePatterns` SHALL contain an entry matching that host, so an R2 asset can be served without a hostname-not-allowed error.

#### Scenario: Invalid public base URL does not break the build
- **WHEN** `R2_PUBLIC_BASE_URL` is unset or not a valid URL at build time
- **THEN** the build SHALL succeed with no R2 remote pattern added, and any misconfiguration SHALL surface at the storage module's first use instead.

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

