"use strict";

const 
  usingDb = require("../using-db").v1,
  fs = require("fs"),
  util = require("util"),
  readFileAsync = util.promisify(fs.readFile),
  ddlFile = "./create-ap-subscription/ap_subscription.sql";

run();

async function run() {
  try {
    console.log('Creating table ap_subscriptions');
    await createTable();

    console.log('Table Created Sucessfully !!!');
  } catch (err) {
    console.error(err.stack);
  } 
}

/**
 * Create ap_subscriptions table in Postgres
 *
 * @returns {Promise}
 */
async function createTable() {
  const ddlApSubscription = await readFileAsync(ddlFile, "utf8");

  await usingDb((db) => db.query(ddlApSubscription));
  console.log("successfully created the Postgres ap_subscriptions table");
}

