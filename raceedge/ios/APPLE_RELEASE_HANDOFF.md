# RACEEDGE Apple Release Handoff

Repository-side release work is automated. The TestFlight workflow remains manual-only and will not run until Apple credentials are deliberately configured in GitHub Actions.

## Required Apple setup
Create the RACEEDGE app in App Store Connect using bundle identifier:

`au.com.raceedge.app`

Create an App Store Connect API key with the permissions required to manage/upload builds, then add these GitHub Actions secrets:

- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_PRIVATE_KEY` — complete contents of the .p8 key
- `APPLE_TEAM_ID`

Do not commit any of these values to the repository.

## Before the first TestFlight upload
- Confirm the bundle identifier is registered in the Apple Developer account.
- Select/confirm the correct Apple team.
- Add the final AppIcon artwork.
- Confirm the privacy policy and support URLs.
- Complete the App Store Connect app-privacy questionnaire against the final production configuration.
- Prepare screenshots for the required iPhone display sizes.

## Upload
After the four GitHub secrets exist, manually run the **RaceEdge TestFlight Upload** GitHub Actions workflow.

The workflow:
1. verifies the Apple credentials exist,
2. creates the temporary App Store Connect API-key file on the runner,
3. creates a signed Release archive,
4. exports an App Store IPA,
5. uploads the IPA to App Store Connect/TestFlight.

## Physical-device QA before public submission
Test:
- launch and first load,
- Home/live meetings,
- Races filters for Horses and Greyhounds,
- race and runner details,
- scratchings,
- prices,
- Tips empty/published state,
- Results/performance,
- pull-to-refresh,
- network loss and recovery,
- provider failure/stale-data behaviour,
- privacy and support links.

Do not submit to App Review until the physical-device pass is complete.
