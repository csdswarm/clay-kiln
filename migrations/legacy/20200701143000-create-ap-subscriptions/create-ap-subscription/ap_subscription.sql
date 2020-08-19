DROP TABLE IF EXISTS ap_subscriptions;
CREATE TABLE ap_subscriptions (
    id      TEXT PRIMARY KEY,
    data    JSONB NOT NULL  
);