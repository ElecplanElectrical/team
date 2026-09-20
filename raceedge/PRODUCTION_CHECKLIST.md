# RaceEdge V1 Production Checklist

Last reviewed: 2026-09-18

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
- [ ] Verify `/api/v1/live/today` against real provider data.
- [ ] Remove/retire duplicate app services only after explicit approval.

## Live racing data
- [x] Provider credentials remain server-side and are never returned by provider status endpoints.
- [x] Provider requests have bounded timeout handling and safe invalid-JSON/HTTP failure handling.
- [x] Normalized meeting, race, runner, change and analysis shapes have automated app-contract coverage.
- [x] Scratchings are applied before live race enrichment/selections.
- [x] Validate PuntersEdge events, acceptances, changes and results using production responses.
- [ ] Confirm horse, greyhound and harness code mapping using production responses.
- [ ] Confirm runner/provider IDs remain stable enough for live change matching.
- [ ] Validate Australian meeting dates/time zones from production data.
- [ ] Confirm provider licensing, production plan and rate limits.

## Ratings and results
- [x] Ratings/fair prices/value edges remain identified as prototype estimates.
- [x] Incomplete factor coverage suppresses fair price, value and confidence output.
- [x] Scratched runners are excluded from selections.
- [x] Historical performance copy states that past results do not guarantee future outcomes.
- [ ] Ingest sufficient historical races/results for backtesting.
- [ ] Measure strike rate, top-3 hit rate and ROI by racing code, confidence, rating and price/value buckets.
- [ ] Use holdout/out-of-sample validation before describing the model as calibrated.

## iOS
- [x] Primary navigation and screens use the locked RaceEdge navy/electric-blue design system.
- [x] Home, Meetings/Races, Tips, Race Detail, Runner Detail, Results and More screens are implemented.
- [x] Swift model assumptions for live meeting code and race start time match the current normalized backend contract.
- [x] Create the final Xcode project and include every Swift source file.
- [x] Set `RACEEDGE_API_BASE_URL` in Info.plist/build configuration to the production HTTPS API URL.
- [ ] Build with the current supported iOS SDK and resolve compiler warnings/errors.
- [ ] Test all primary screens on a physical iPhone.
- [ ] Test offline/provider failure/fallback states on-device.
- [ ] Confirm no PuntersEdge key or RaceEdge admin token exists in the built app bundle.
- [ ] Add final icons, launch assets, privacy metadata and App Store copy.

## Production QA
- [x] Backend static/unit checks and dependency audit are automated in CI.
- [x] API contracts consumed by the app have automated tests.
- [ ] Smoke-test API and web shell after the next production backend deployment.
- [ ] Confirm database migrations initialize on a clean database.
- [ ] Confirm admin endpoints reject unauthenticated requests in production.
- [ ] Confirm public endpoints do not leak environment variables, provider keys or admin credentials.
- [ ] Run a full race-day test including late scratchings and result settlement.

## Current hard gates
1. Perform a real Xcode build and physical-iPhone QA pass.
2. Complete App Store/TestFlight signing, final icon/screenshots, App Store Connect privacy details and release configuration.

V1 scope: form, analytics, tips and results. No wagering or bet placement.
