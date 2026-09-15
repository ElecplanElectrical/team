# RaceEdge V1

Australian horse and greyhound racing form, ratings, tips and results platform.

## Production
- Node/Express API and responsive web/admin shell
- PostgreSQL persistence
- `/health`
- `/api/v1/home`
- `/api/v1/rating`
- `/api/v1/results`
- `/api/v1/provider/next-to-go`

## Environment
`DATABASE_URL` is supplied by Railway Postgres.
`PUNTERSEDGE_API_KEY` enables the live provider adapter.
`PUNTERSEDGE_BASE_URL` is optional and defaults to `https://api.puntersedge.online`.

Provider secrets stay server-side. Do not embed them in the iOS application.

## Rating V1
Initial transparent weighted score: form 25%, speed 20%, class 15%, pace 15%, conditions 15%, barrier 10%. These weights are placeholders to be back-tested against historical results before marketing predictive performance.

## Next
Wire licensed production racing data, normalize meetings/races/runners/scratchings/results, then expose stable endpoints to SwiftUI.
