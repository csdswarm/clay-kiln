const usingDb = require('../using-db').v1;

run()

async function run() {
  try {
    await usingDb(db => db.query(`
      CREATE TABLE IF NOT EXISTS sitemap_with_index
      (
          type varchar NOT NULL,
          num integer NOT NULL,
          content text NOT NULL,
          lastmod varchar NOT NULL,
          PRIMARY KEY (type, num)
      )
    `));

    console.log("successfully created the postgres table 'sitemap_with_index'");
  } catch (err) {
    console.error(err);
  }
}
