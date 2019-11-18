// eslint-disable-next-line strict
module.exports = {
  apps: [
    {
      name: "clay",
      script: "./app.js",
      env: {
        NODE_ENV: "development",
        IP_ADDRESS: "0.0.0.0",
        PORT: 3001,
        NODE_ENV: local,
        CLAY_PROVIDER: google,
        CLAY_ACCESS_KEY: accesskey,
        ENABLE_GZIP: true,
        INLINE_EDIT_STYLES: true,
        INLINE_EDIT_SCRIPTS: true,
        STATIC_ASSET_MAX_AGE: 0,
        LOG: info,
        CLAY_LOG_PRETTY: true,
        CLAY_STORAGE_POSTGRES_HOST: postgres,
        CLAY_BUS_HOST: "redis://redis:6379",
        CLAY_STORAGE_POSTGRES_CACHE_HASH: "mydb:h",
        REDIS_HASH: "mydb:h",
        REDIS_SESSION_HOST: "redis://redis:6379",
        REDIS_HOST: "tcp://redis:6379",
        ELASTIC_HOST: "http://elasticsearch:9200",
        GOOGLE_CONSUMER_KEY:
          "647864524326-oud3hbndoqn3gfni3uajhn78a1q5jnd1.apps.googleusercontent.com",
        GOOGLE_CONSUMER_SECRET: "1IK1v9GgoBGHYSrKQ_GZ8Oph",
        GOOGLE_PROFILE_URL: "https://www.googleapis.com/oauth2/v3/userinfo",
        GOOGLE_AD_REFRESH_INTERVAL: 120000,
        CLAY_SITE_NAME: "Clay Demo",
        CLAY_SITE_HOST: "clay.radio.com",
        CLAY_SITE_SHORTKEY: "cd",
        CLAY_SITE_PROTOCOL: "http",
        CLAY_SITE_PORT: 80,
        YOUTUBE_API_KEY: "AIzaSyBqOBlQC9L0CnzImS1ugaW1I3IPg6QshZI",
        EMBEDLY_ENDPOINT: "NEED_TO_FILL_IN",
        EMBEDLY_KEY: "NEED_TO_FILL_IN",
        WEB_PLAYER_HOST: "https://assets.radio.com/webplayer",
        AWS_ACCESS_KEY_ID: "AKIAIGAQXNCNUIBGXOMQ",
        AWS_SECRET_ACCESS_KEY: "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",
        AWS_S3_BUCKET: "radioimg-stg",
        AWS_S3_CDN_HOST: "stg-images.radio.com",
        SECTION_FRONTS: "music,news,sports",
        JWT_SECRET_KEY:
          "MIIJJwIBAAKCAgEAzpQN4O6Flns+bkAYQEitc5Agx/UwhM38lLHI/7Ve+rf4I3w7",
        DOUBLECLICK_BANNER_TAG: "ENT.TEST",
        IMPORT_CONTENT_URL: "http://host.docker.internal:3000/import-content",
        BRIGHTCOVE_ACCOUNT_ID: "5757251889001",
        BRIGHTCOVE_CLIENT_ID: "",
        BRIGHTCOVE_CLIENT_SECRET: "",
        FACEBOOK_CALLBACK_URL:
          "https://radio.auth.us-east-1.amazoncognito.com/oauth2/token",
        COGNITO_CLIENT_ID: "63kk7rrpgfmrdkcndq5f11190r",
        LYTICS_API_URL: "https://api.lytics.io/api",
        LYTICS_API_KEY: "PLACEHOLDER",
        BRANCH_IO_KEY: "key_test_ddzzCUvmiEt9NNOmLuo2CecpCBcLTjEn"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
