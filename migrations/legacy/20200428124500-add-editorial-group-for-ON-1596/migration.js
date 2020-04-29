"use strict";

const usingDb = require("../using-db").v1;
const fs = require("fs");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);
const appendFileAsync = util.promisify(fs.appendFile);
const axios = require("../../../app/node_modules/axios");
const csv = require("../../../app/node_modules/csvtojson");
const _ = require("../../../app/node_modules/lodash");
const url = "https://api.radio.com/v1/stations?filter[callsign]=";
const csvFile =
  "./create-editorial-group/Editorial Group - Editorial Group.csv";
const dmlFile = "./create-editorial-group/dml_editorial_group.sql";
const ddlFile = "./create-editorial-group/editorial_group.sql";

run();

async function run() {
  try {
    console.log(
      "Editorial Group - Create File with rows and then creating table and inserting records"
    );

    await createTable();
    console.log("After createTable");

    await generateInserts();
    console.log("After generateInserts");

    setTimeout(insertData, 10000);
    console.log("After insertData");

    console.log("Sucessfully !!!");
  } catch (err) {
    console.error(err.stack);
  }
}

/**
 * Create editorial_group table in Postgres
 *
 * @returns {Promise}
 */
async function createTable() {
  try {
    const ddlEditorialGroup = await readFileAsync(ddlFile, "utf8");
    await usingDb((db) => db.query(ddlEditorialGroup));

    console.log("successfully created the Postgres editorial_group table");
  } catch (err) {
    console.error(err);
  }
}

/**
 * Make a bulk insert into the editorial_group table
 *
 * @returns {Promise}
 */
async function insertData() {
  try {
    const dmlEditorialGroup = await readFileAsync(dmlFile, "utf8");
    await usingDb((db) => db.query(dmlEditorialGroup));

    console.log("successfully inserted rows in editorial_group table");
  } catch (err) {
    console.error(err);
  }
}

/**
 * Create records to be inserted in editorial_group table in Postgres
 *
 * @returns {Promise}
 */
async function generateInserts() {
  try {
    // Loads the CSV file and transform it into a JSON array
    const jsonArray = await csv().fromFile(csvFile);
    await createDMLFile(jsonArray);
    console.log("successfully generated DML file");
  } catch (err) {
    console.error(err);
  }
}

/**
 * Create a file with the Insert statements for editorial_group table
 *
 * @param {Array} data
 * @returns {Promise}
 */
async function createDMLFile(data) {
  /**
   * Remove special characters from Call Letters property to match with RDC API
   *
   * @param {Array} data
   * @returns {String}
   */
  const sanitizeCallLetters = (callLetters) =>
    callLetters.replace(/[^a-zA-Z]/g, "");

  /**
   * Extract the site slug property
   *
   * @param {Array} record
   * @returns {String}
   */
  const getSiteSlug = (record) =>
    !_.isEmpty(record) ? record[0].attributes.site_slug : null;

  /**
   * Determine if a property should return true/false
   *
   * @param {Object} record
   * @returns {String}
   */
  const checkProperty = (record) => {
    let feeds = {};
    // Get properties with the "x"
    let filteredByFeed = _.keys(_.pickBy(record, (value, key) => value));
    // Delete unneeded props
    filteredByFeed.splice(0, 3);
    // Asigns true value to the feeds
    filteredByFeed.forEach((feed) => {
      return (feeds[feed] = true);
    });
    return feeds;
  };

  /**
   * Generate a DML file with the records to be inserted in editorial_group table
   *
   * @param {String} sql
   * @returns {Promise}
   */
  const generateFile = async (sql) => {
    await appendFileAsync(
      `${__dirname}/create-editorial-group/dml_editorial_group.sql`,
      sql,
      "utf8",
      (err) => {
        if (err) throw err;
      }
    );
  };

  await data.forEach(async (record) => {
    // Extract the Call Letters property
    let callLetters = record["Call Letters"];
    // Removes special characters to match with RDC API
    callLetters = sanitizeCallLetters(callLetters);
    // Get the Site Slug from RDC API
    const station = await axios(url + callLetters);
    // GEt the data from the RDC API
    const { data } = station.data;
    // Extracts SIte Slug property
    const siteSlug = getSiteSlug(data);
    // Get the feeds with the "x" value
    const feeds = checkProperty(record);
    // Generates the insert statememt
    const sql = `INSERT INTO editorial_group(data)
    VALUES (
      '{
        "Market": "${record.Market}",
        "site-slug": "${siteSlug}",
        "feeds": ${JSON.stringify(feeds)}
        
      }'
      );
    \ `;
    // Send the insert DML to a file
    await generateFile(sql);
  });
}
