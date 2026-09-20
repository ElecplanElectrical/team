# RaceEdge V1 Production Checklist

Last reviewed: 2026-09-20

## Repository and automated QA
- [x] RaceEdge remains isolated on the `raceedge` branch and separate from YourPlan.
- [x] GitHub Actions runs static checks, unit tests, API-contract tests and dependency audit on RaceEdge changes.
- [x] Pace-map UI no longer fabricates runner positions when validated pace-position data is unavailable.
- [x] Top Pick / Danger / Value labels use explicit analysis roles; fallback selections are neutral.
- [ ] Dedicated private `ElecplanElectrical/raceedge` repository exists and integration can access it.
- [ ] Migrate current `raceedge/` folder to the dedicated repository root if/when approved.

## Railway
- [x] Canonical RaceEdge application service is connected and has successfully deployed.
- [x] Existing RaceEdge PostgreSQL service is retained.
- [x] `NODE_ENV=production` configured.
- [x] `DATABASE_URL` configured from Railway PostgreSQL.
- [x] `RACEEDGE_ADMIN_TOKEN` configured server-side.
- [x] Health check path is `/health` with restart-on-failure policy.
- [x] CI-only commits can be skipped by Railway rather than forcing unnecessary production rebuilds.
- [x] Set `PUNTERSEDGE_API_KEY` server-side only.
- [x] Verify `/health` reports provider configured after the real key is added.
- [x] Verify `/api/v1/live/today` against real provider data.
- [ ] Remove/retire duplicate app services only after explicit approval.

## Live racing data
- [x] Provider credentials remain server-side and are never returned by provider status endpoints.
- [x] Provider requests have bounded timeout handling and safe invalid-JSON/HTTP failure handling.
- [x] Normalized meeting, race, runner, change and analysis shapes have automated app-contract coverage.
- [x] Scratchings are applied before live race enrichment/selections.
- [x] Validate PuntersEdge events, acceptances, changes and results using production responses.
- [ ] Confirm horse, greyhound and harness code mapping using production responses.
- [x] Confirm live runners remain matchable for changes using provider ID when present, with number+name fallback when PuntersEdge omits runner_ref.
- [x] Validate production race start timestamps are consistently present and parse as timezone-aware ISO timestamps.
- [x] Confirm current PuntersEdge public rate-limit/credit rules and display-licence requirements.
- [x] Add visible Prices by PuntersEdge attribution wherever provider prices are displayed in iOS.
- [ ] Confirm the production PuntersEdge key is on a plan/licence that permits RaceEdge's public price display before App Store launch.

## Ratings and results
- [x] Ratings/fair prices/value edges remain identified as prototype estimates.
- [x] Incomplete factor coverage suppresses fair price, value and confidence output.
- [x] Scratched runners are excluded from selections.
- [x] Historical performance copy states that past results do not guarantee future outcomes.
- [ ] Ingest sufficient historical races/results for backtesting.
- [ ] Measure strike rate, top-3 hit rate and ROI by racing code, confidence, rating and price/value buckets.
- [ ] Use holdout/out-of-sample validation before describing the model as calibrated.

## iOS
- [x] Unsigned Release archive succeeds for generic iPhone hardware in Xcode CI.
- [x] iOS source secret scan passes with no provider/admin credential references.

- [x] Xcode CI simulator build passes on the `raceedge` branch.
- [x] Xcode project, shared scheme, production API URL and privacy manifest are committed.

- [x] Primary navigation and screens use the locked RaceEdge navy/electric-blue design system.
- [x] Home, Meetings/Races, Tips, Race Detail, Runner Detail, Results and More screens are implemented.
- [x] Swift model assumptions for live meeting code and race start time match the current normalized backend contract.
- [x] Create the final Xcode project and include every Swift source file.
- [x] Set `RACEEDGE_API_BASE_URL` in Info.plist/build configuration to the production HTTPS API URL.
- [x] Build with the current supported iOS SDK and resolve compiler warnings/errors.
- [ ] Test all primary screens on a physical iPhone.
- [ ] Test offline/provider failure/fallback states on-device.
- [x] Confirm no PuntersEdge key or RaceEdge admin token exists in the iOS source/release archive inputs.
- [ ] Add final app icon/screenshots; privacy metadata and App Store copy are committed.

## Production QA
- [x] Backend static/unit checks and dependency audit are automated in CI.
- [x] API contracts consumed by the app have automated tests.
- [x] Smoke-test production API and public release pages after deployment.
- [x] Confirm database migrations initialize on a clean PostgreSQL database in CI.
- [x] Confirm admin endpoints reject unauthenticated requests in production.
- [x] Confirm public endpoints and iOS source do not expose provider/admin credentials.
- [x] Automated race-day lifecycle regression covers late scratchings, re-analysis and result settlement normalization.
- [ ] Complete a physical/live race-day observation pass on iPhone.

## Current hard gates
1. Perform a real Xcode build and physical-iPhone QA pass.
2. Complete App Store/TestFlight signing, final icon/screenshots, App Store Connect privacy details and release configuration.

V1 scope: form, analytics, tips and results. No wagering or bet placement.


## Verified production live payload
- [x] Production smoke test confirms non-empty live racing data.
- [x] Verified 28 live meetings, 196 races and 1,680 runners in production.
- [x] Verified all 1,680 sampled production runners carried prices.
- [x] Verified scratchingsChecked=true in the production live payload.
- [x] Provider diagnostic and admin routes reject anonymous access.
- [x] Privacy and support pages are publicly served from the production backend.

- [x] Production responses do not fall back to fabricated demo tips, meetings or demo race detail.

- [x] iOS decodes and displays live analysis only when the backend marks a race analysis-ready.
- [x] Tips fallback uses only analysis-ready live top picks when no published selections exist.
- [x] Live runner detail exposes rating/fair-price/value metrics only for analysis-ready runners.

- [x] Backend and iOS release versions are aligned at V1.0 / 1.0.0.

- [x] Public provider prices are automatically suppressed when the active PuntersEdge plan does not permit public price display.
- [x] Provider plan/credit diagnostics are key-safe and admin-protected; health exposes only safe plan/display status.

- [x] Provider-credit safeguard: shared live snapshot cache defaults to 60 seconds with a bounded server-side override.

- [x] PuntersEdge runner provider IDs are not universal; production QA reports provider-ID coverage separately from effective change-matching identity coverage.

- [x] Public API abuse protection limits each client to 120 requests/minute and returns Retry-After on 429 responses.
