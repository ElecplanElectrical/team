# RACEEDGE V1.0.0 Release Notes

## Release
RACEEDGE V1.0.0 is the first production release candidate for the iOS app and RaceEdge backend.

## Included
- Australian thoroughbred and greyhound live racing coverage
- Live meetings, races and runners
- Scratchings/change processing before analysis
- RaceEdge ratings and analysis-ready selections
- Runner fair-price/value metrics when permitted and analysis-ready
- Results/performance infrastructure
- Production fallback to stored racing snapshots during provider outages
- V1 iOS app, Xcode project, simulator build and unsigned Release archive
- Production privacy/support pages
- App Store metadata and TestFlight workflow handoff

## Production safeguards
- No demo/fabricated tips or meetings in production
- PuntersEdge credentials remain server-side
- Provider/admin diagnostics are authenticated
- Public prices are entitlement-gated and currently suppressed on the Free provider plan
- Public API rate limiting is enabled
- Security headers are enabled
- Clean PostgreSQL initialization is tested
- Late scratching -> re-analysis -> result lifecycle is regression-tested

## External release gates
- Apple Developer/App Store Connect signing credentials
- Physical iPhone QA
- Final App Store icon/screenshots
- Confirm/upgrade PuntersEdge public price-display entitlement if market prices are to be shown
