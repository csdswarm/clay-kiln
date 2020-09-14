CREATE INDEX IF NOT EXISTS idx_pages_main ON pages ((data->'main'->>0));
CREATE INDEX IF NOT EXISTS idx_uris_data ON uris (data);
CREATE INDEX IF NOT EXISTS idx_station_front_slug ON components."station-front" ((data->>'stationSlug'));
