DROP TABLE IF EXISTS editorial_group;
CREATE TABLE editorial_group (
	id             SERIAL PRIMARY KEY,
  	data           JSONB NOT NULL
);