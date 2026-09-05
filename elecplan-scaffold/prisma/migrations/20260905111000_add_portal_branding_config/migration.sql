ALTER TABLE "BusinessPortal" ADD COLUMN IF NOT EXISTS "brandingConfig" JSONB;

UPDATE "BusinessPortal"
SET "brandingConfig" = jsonb_build_object(
  'backgroundColor', CASE WHEN "slug" = 'qls' THEN '#040605' ELSE '#03101f' END,
  'panelColor', CASE WHEN "slug" = 'qls' THEN '#151917' ELSE '#081b30' END,
  'loginArtworkUrl', CASE WHEN "slug" = 'qls' THEN '/qls-tree-portal.webp' ELSE NULL END,
  'loginArtworkX', 58,
  'loginArtworkY', 50,
  'loginArtworkZoom', CASE WHEN "slug" = 'qls' THEN 118 ELSE 100 END,
  'loginArtworkOpacity', CASE WHEN "slug" = 'qls' THEN 80 ELSE 65 END,
  'sidebarArtworkUrl', CASE WHEN "slug" = 'qls' THEN '/qls-tree-portal.webp' ELSE NULL END,
  'sidebarArtworkX', 50,
  'sidebarArtworkY', 34,
  'sidebarArtworkZoom', 100,
  'sidebarArtworkOpacity', CASE WHEN "slug" = 'qls' THEN 6 ELSE 8 END
)
WHERE "brandingConfig" IS NULL;
