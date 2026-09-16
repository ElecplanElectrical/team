# RaceEdge V1 Production Checklist

## Repository
- [ ] Dedicated private `ElecplanElectrical/raceedge` repository exists and ChatGPT GitHub integration can access it.
- [ ] Migrate the contents of the current `raceedge/` folder to the dedicated repository root.
- [ ] Keep RaceEdge independent from YourPlan.

## Railway
- [ ] Connect one clean RaceEdge application service to the dedicated repository.
- [ ] Reuse the existing RaceEdge PostgreSQL service.
- [ ] Set `NODE_ENV=production`.
- [ ] Set `DATABASE_URL` from Railway PostgreSQL.
- [ ] Generate and set a strong `RACEEDGE_ADMIN_TOKEN` server-side.
- [ ] Set `PUNTERSEDGE_API_KEY` server-side only.
- [ ] Verify `/health` returns database ok and expected provider/admin configuration states.
- [ ] Verify `/api/v1/live/today` with real provider data.
- [ ] Remove/retire failed duplicate app services only after the production service is verified.

## Live racing data
- [ ] Validate PuntersEdge events, acceptances, changes and results response shapes against normalizers.
- [ ] Confirm horse, greyhound and harness code mapping.
- [ ] Confirm runner/provider IDs remain stable enough for change matching.
- [ ] Verify scratchings are applied before selections are presented.
- [ ] Validate time zones and Australian meeting dates.
- [ ] Confirm provider licensing, production plan and rate limits.

## Ratings and results
- [ ] Keep ratings/fair prices/value edges marked prototype until historical validation is complete.
- [ ] Ingest historical races/results into backtest pipeline.
- [ ] Measure strike rate, top-3 hit rate and ROI by racing code, confidence bucket, rating bucket and price/value bucket.
- [ ] Use holdout/out-of-sample validation before describing the model as calibrated.
- [ ] Do not claim guaranteed winners or proven predictive performance.

## iOS
- [ ] Create/open the final Xcode project and include every Swift source file.
- [ ] Set `RACEEDGE_API_BASE_URL` in Info.plist/build configuration to the production HTTPS API URL.
- [ ] Build with the current supported iOS SDK and resolve compiler warnings/errors.
- [ ] Test Home, Races, Race Detail, Runner Detail, Tips, Results and More on a physical iPhone.
- [ ] Test offline/provider failure/fallback states.
- [ ] Confirm no PuntersEdge key or RaceEdge admin token exists in the app bundle.
- [ ] Add final icons, launch assets, privacy metadata and App Store copy.

## Production QA
- [ ] Smoke-test API and web shell from mobile and desktop.
- [ ] Confirm database migrations initialize on a clean database.
- [ ] Confirm admin endpoints reject unauthenticated requests.
- [ ] Confirm public endpoints do not leak environment variables, provider keys or admin credentials.
- [ ] Confirm historical performance is clearly separated from forward-looking estimates.
- [ ] Run a full race-day test including late scratchings and result settlement.

V1 scope: form, analytics, tips and results. No wagering or bet placement.
