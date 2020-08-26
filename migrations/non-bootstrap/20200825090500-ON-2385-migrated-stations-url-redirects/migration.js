"use strict";

const 
  usingDb = require("../../legacy/using-db").v1,
  fs = require("fs"),
  util = require("util"),
  readFileAsync = util.promisify(fs.readFile),
  ddlFile = "./update_url.sql";

run();

async function run() {
  try {
    console.log('Updating meta url');
    await updateTable();

    console.log('Table Updated Sucessfully!!!');
  } catch (err) {
    console.error(err.stack);
  } 
}

/**
 * Updates meta url in pages table in Postgres
 *
 * @returns {Promise}
 */
async function updateTable() {
  const ddlApSubscription = await readFileAsync(ddlFile, "utf8");

  await usingDb((db) => db.query(ddlApSubscription));
  console.log("successfully updated the Postgres pages table");
}
