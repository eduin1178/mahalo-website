## ADDED Requirements

### Requirement: File storage backed by Cloudflare R2
The system SHALL persist user-uploaded files (logos, attachments, and any future binary asset) in a Cloudflare R2 bucket using an S3-compatible client. The application SHALL NOT write user uploads to the container filesystem at runtime.

#### Scenario: Server action uploads a provider logo
- **WHEN** an authenticated admin submits a logo via the provider admin UI
- **THEN** the server action SHALL stream the file to the configured R2 bucket using the storage module and SHALL NOT call any `node:fs` write API for that file.

#### Scenario: Container has no writable uploads directory
- **WHEN** the production container is inspected
- **THEN** there SHALL be no `public/uploads` directory pre-created by the Dockerfile, and the runtime SHALL not depend on a mounted volume for user uploads.

### Requirement: Storage module API
The repository SHALL expose a storage module at `lib/storage/` whose default export provides at least three operations: `putObject({ key, body, contentType })`, `getPublicUrl(key)`, and `deleteObject(key)`. All code that handles user uploads SHALL go through this module rather than instantiating an S3 client directly.

#### Scenario: Putting an object returns a stable key
- **WHEN** a caller invokes `putObject({ key: "providers/<id>.png", body, contentType: "image/png" })`
- **THEN** the module SHALL upload the object to R2 under that key and SHALL resolve with `{ key }` on success.

#### Scenario: Public URL resolution
- **WHEN** `getPublicUrl("providers/<id>.png")` is called
- **THEN** the module SHALL return an absolute URL composed from `R2_PUBLIC_BASE_URL` and the object key, suitable to be stored on a database record and rendered by `next/image`.

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

### Requirement: Next.js image optimization allows R2 public host
The `next.config.ts` `images.remotePatterns` configuration SHALL include the host derived from `R2_PUBLIC_BASE_URL` so that `next/image` can optimize images served from R2 without raising the "host not configured" error.

#### Scenario: Rendering an R2 image
- **WHEN** a component renders `<Image src={publicUrlFromR2} ... />`
- **THEN** Next.js SHALL serve the optimized image without throwing a hostname-not-allowed error.

### Requirement: Existing provider logo upload migrates to R2
The current implementation of `uploadProviderLogo` in `lib/providers/actions.ts` SHALL be reworked to use the storage module instead of writing to `public/uploads/providers/`. The stored `logoUrl` value on the `providers` table SHALL be the absolute public R2 URL returned by `getPublicUrl`.

#### Scenario: Replacing an existing logo
- **WHEN** an admin uploads a new logo for a provider that already has one with a different file extension
- **THEN** the action SHALL upload the new object, update `providers.logoUrl` with the new public URL, and SHALL attempt to delete the previous object via `deleteObject` (ignoring not-found errors).

#### Scenario: Validation errors do not touch storage
- **WHEN** the uploaded file fails size or MIME validation
- **THEN** the action SHALL return the validation error and SHALL NOT call `putObject`.
