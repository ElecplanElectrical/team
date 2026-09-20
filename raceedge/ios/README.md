# RaceEdge iOS Release

Open `RaceEdge.xcodeproj` in Xcode.

## Production configuration
- Bundle identifier: `au.com.raceedge.app`
- Minimum iOS: 17.0
- API: `https://raceedge-v1-production.up.railway.app`
- API keys and admin tokens remain server-side only.
- Code signing uses Automatic signing. Select the RaceEdge Apple Developer team in Signing & Capabilities before device/archive builds.

## Release checklist
1. Select the Apple Developer team for the RaceEdge target.
2. Add the final 1024x1024 App Store icon to `RaceEdge/Assets.xcassets/AppIcon.appiconset`.
3. Build the RaceEdge scheme for an iPhone simulator and resolve any Xcode compiler warnings/errors.
4. Run on a physical iPhone and test Home, Races, Tips, Results, race details, pull-to-refresh, offline/failure states and live scratchings.
5. Confirm the built app contains no PuntersEdge API key or RaceEdge admin token.
6. Archive the Release configuration and upload to TestFlight.
7. Complete App Store Connect screenshots, description, support/privacy URLs and privacy questionnaire before submission.

Do not add provider credentials to Info.plist, xcconfig files or Swift source.