export async function ensureLiveSchema(pool) {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS raceedge_live_snapshots(
    id BIGSERIAL PRIMARY KEY,
    feed TEXT NOT NULL,
    payload JSONB NOT NULL,
    provider TEXT NOT NULL DEFAULT 'PuntersEdge',
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS raceedge_live_snapshots_feed_time_idx ON raceedge_live_snapshots(feed,captured_at DESC)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS raceedge_sync_status(
    feed TEXT PRIMARY KEY,
    last_success_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    last_error TEXT,
    records_count INT DEFAULT 0
  )`);
}

export async function saveSnapshot(pool, feed, payload, recordsCount = 0) {
  if (!pool) return null;
  const { rows } = await pool.query('INSERT INTO raceedge_live_snapshots(feed,payload) VALUES($1,$2::jsonb) RETURNING id,captured_at',[feed,JSON.stringify(payload)]);
  await pool.query(`INSERT INTO raceedge_sync_status(feed,last_success_at,last_error_at,last_error,records_count)
    VALUES($1,NOW(),NULL,NULL,$2)
    ON CONFLICT(feed) DO UPDATE SET last_success_at=NOW(),last_error_at=NULL,last_error=NULL,records_count=$2`,[feed,recordsCount]);
  return rows[0];
}

export async function markSyncError(pool, feed, error) {
  if (!pool) return;
  await pool.query(`INSERT INTO raceedge_sync_status(feed,last_error_at,last_error)
    VALUES($1,NOW(),$2)
    ON CONFLICT(feed) DO UPDATE SET last_error_at=NOW(),last_error=$2`,[feed,String(error?.message ?? error).slice(0,500)]);
}

export async function latestSnapshot(pool, feed) {
  if (!pool) return null;
  const { rows } = await pool.query('SELECT payload,captured_at FROM raceedge_live_snapshots WHERE feed=$1 ORDER BY captured_at DESC LIMIT 1',[feed]);
  return rows[0] ?? null;
}

export async function syncStatus(pool) {
  if (!pool) return [];
  const { rows } = await pool.query('SELECT * FROM raceedge_sync_status ORDER BY feed');
  return rows;
}
