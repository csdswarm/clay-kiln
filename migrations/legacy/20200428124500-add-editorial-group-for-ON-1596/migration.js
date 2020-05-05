"use strict";

const usingDb = require("../using-db").v1;
const fs = require("fs");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);
const appendFileAsync = util.promisify(fs.appendFile);
const writeFileAsync = util.promisify(fs.writeFile);
const csv = require("../../../app/node_modules/csvtojson");
const _ = require("../../../app/node_modules/lodash");
const csvFile =
  "./create-editorial-group/Editorial Group - Editorial Group.csv";
const dmlFile = "./create-editorial-group/dml_editorial_group.sql";
const ddlFile = "./create-editorial-group/editorial_group.sql";
const stations = require("../../utils/get-all-stations").v1;

let allTheStations;

const pgHost = process.env.PGHOST;

// using-db.js defaults to 'localhost' for this environment variable
const isLocal = !pgHost || pgHost === "localhost";

run();

async function run() {
  try {
    console.log(
      "Editorial Group - Create File with rows and then creating table and inserting records"
    );
    await createTable();

    await generateInserts();

    await insertData();

    console.log("Sucessfully !!!");
  } catch (err) {
    console.error(err.stack);
  } finally {
    await truncateDMLFile();
  }
}

/**
 * Get all the Station from RDC API and extract only id, callsign, site_slug, website amd market
 * this props will filtered with the CSV editorial groups data
 *
 * @returns {Promise}
 */
async function filterStations() {
  const allStations = await stations();
  const filteredStations = _.map(allStations.data, (station) => {
    return {
      callsign: station.attributes.callsign,
      siteSlug: station.attributes.site_slug,
    };
  });

  return filteredStations;
}

/**
 * Delete the DML records from the /create-editorial-group/dml_editorial_group.sql file
 *
 * @returns {Promise}
 */
function truncateDMLFile() {
  writeFileAsync(
    `${__dirname}/create-editorial-group/dml_editorial_group.sql`,
    ""
  );
}

/**
 * Create editorial_group table in Postgres
 *
 * @returns {Promise}
 */
async function createTable() {
  const ddlEditorialGroup = await readFileAsync(ddlFile, "utf8");
  await usingDb((db) => db.query(ddlEditorialGroup));

  console.log("successfully created the Postgres editorial_group table");
}

/**
 * Make a bulk insert into the editorial_group table
 *
 * @returns {Promise}
 */
async function insertData() {
  const dmlEditorialGroup = await readFileAsync(dmlFile, "utf8");
  await usingDb((db) => db.query(dmlEditorialGroup));

  console.log("successfully inserted rows in editorial_group table");
}

/**
 * Create records to be inserted in editorial_group table in Postgres
 *
 * @returns {Promise}
 */
async function generateInserts() {
  allTheStations = await filterStations();
  // Loads the CSV file and transform it into a JSON array
  const jsonArray = await csv().fromFile(csvFile);

  await createDMLFile(jsonArray);
  console.log("successfully generated DML file");
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
   * @param {String} callLetters
   * @returns {String}
   */
  const sanitizeCallLetters = (callLetters) =>
    callLetters.replace(/[^a-zA-Z]/g, "");

  /**
   * Find by property in all RDC API Stations
   *
   * @param {string} findProperty
   * @param {string} value
   * @returns {String}
   */
  const findInStations = (findProperty, value) => {
    return _.find(allTheStations, (station) => {
      if (station[findProperty] === value) {
        return station.siteSlug;
      }
    });
  };

  /**
   * Extract the site slug property
   *
   * @param {Object} record - from csv
   * @returns {String}
   */
  const getSiteSlug = async (record) => {
    // Extract the Call Letters property
    let callLetters = record["Call Letters"];
    // Removes special characters to match with RDC API
    callLetters = sanitizeCallLetters(callLetters);
    const station = findInStations("callsign", callLetters);
    let siteSlug = "";

    if (station) {
      siteSlug = station.siteSlug;
    } else if (!isLocal) {
      console.error(
        `CSV record haven't been found in RDC API with this Call Letter/callsign ${record["Call Letters"]} \ 
          Please update this record`
      );
    }

    return siteSlug;
  };

  /**
   * Builds an object which declares which editorial feeds the station subscribes to
   *
   * @param {Object} record - from csv
   * @returns {String}
   */
  const buildFeeds = (record) => {
    let feeds = {};
    for (const [key, value] of Object.entries(record)) {
      if (value === "x") {
        feeds[key] = true;
      }
    }

    return feeds;
  };

  /**
   * Generate a DML file with the records to be inserted in editorial_group table
   *
   * @param {String} sql - insert statement INSERT INTO ...
   * @returns {void}
   */
  const generateFile = (sql) =>
    appendFileAsync(
      `${__dirname}/create-editorial-group/dml_editorial_group.sql`,
      sql,
      "utf8"
    );

  for (const record of data) {
    // Extracts SIte Slug property
    const siteSlug = await getSiteSlug(record);
    if (!siteSlug) {
      continue;
    }
    // Get the feeds with the "x" value
    const feeds = await buildFeeds(record);
    // // Generates the insert statememt
    const sql = `INSERT INTO editorial_group(data)
    VALUES (
      '{
        "market": "${record.Market}",
        "siteSlug": "${siteSlug}",
        "feeds": ${JSON.stringify(feeds)}

      }'
      );
    \ `;

    // Send the insert DML to a file
    await generateFile(sql);
  }
}
