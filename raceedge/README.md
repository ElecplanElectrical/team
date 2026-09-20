# RaceEdge V1

Australian horse and greyhound racing form, ratings, tips and results platform.

## Production
- Node/Express API and responsive web/admin shell
- PostgreSQL persistence
- `/health`
- `/api/v1/home`
- `/api/v1/rating`
- `/api/v1/results`
- `/api/v1/live/today`

## Environment
`DATABASE_URL` is supplied by Railway Postgres.
`PUNTERSEDGE_API_KEY` enables the live provider adapter.
`PUNTERSEDGE_BASE_URL` is optional and defaults to `https://api.puntersedge.online`.

Provider secrets stay server-side. Do not embed them in the iOS application.

## Rating V1
Initial transparent weighted score: form 25%, speed 20%, class 15%, pace 15%, conditions 15%, barrier 10%. These weights are placeholders to be back-tested against historical results before marketing predictive performance.

## Production behaviour
- Live racing is served from PuntersEdge through `/api/v1/live/today`.
- Provider diagnostic routes are admin-protected.
- Production never substitutes fabricated demo meetings, tips or race detail.
- If no RaceEdge tips are published, clients receive an empty tips list rather than demo selections.
- Public privacy and support pages are served from the production backend.

## Remaining release work
Apple Developer signing, physical-iPhone QA, final App Store icon/screenshots and App Store Connect submission.
