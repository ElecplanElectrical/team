# Elecplan private file storage

Elecplan supports private S3-compatible object storage for Documents and Past Projects without adding an SDK dependency. The app generates AWS Signature Version 4 presigned URLs using Node's built-in crypto APIs.

## Security model

- The bucket must remain private; do not enable public object access.
- Application credentials are server-only environment variables.
- Upload URLs expire after 5 minutes.
- Download URLs expire after 2 minutes.
- New database records store random Elecplan object keys, not public object URLs.
- A signed commit token binds the object key, file name, MIME type, size and expiry to the upload request.
- New Documents and Project Photos cannot be created from arbitrary HTTPS URLs.
- Legacy HTTPS records remain readable for migration compatibility.
- Downloads first pass through an authenticated Elecplan API route, which checks the current user and role before redirecting to a short-lived storage URL.
- Document uploads allow PDF, JPEG, PNG, WebP and plain text up to 15 MB.
- Project photos allow JPEG, PNG and WebP up to 10 MB.

## Required environment variables

- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `S3_ENDPOINT` — HTTPS S3-compatible endpoint
- `S3_REGION` — `auto` for Cloudflare R2; actual region for AWS S3
- `AUTH_SECRET` — already required by Elecplan and also used to sign upload commit tokens

## Bucket CORS

Because the browser uploads directly to a short-lived presigned URL, the bucket must allow CORS from the exact production portal origin. Allow only what Elecplan needs:

- origin: the production Elecplan portal origin only
- method: `PUT`
- request header: `Content-Type`
- no wildcard production origins

Local development can use a separate development bucket/CORS origin. Do not broaden production CORS to `*` just to support local testing.

## Credential permissions

The storage credential should be restricted to the single Elecplan bucket and only the object operations required for presigned PUT/GET access. Do not grant account-wide administration permissions.

## Operational notes

Object deletion and malware scanning are not automated in this foundation. Before high-volume production use, add deletion lifecycle handling and evaluate malware scanning for document types that warrant it. Orphaned objects can occur if a browser uploads successfully but fails before committing the database record; a later lifecycle cleanup can remove old unreferenced objects.

## Xero boundary

Private storage is independent of Xero. No Xero OAuth, token storage, tenant binding or financial sync is enabled by this work.
