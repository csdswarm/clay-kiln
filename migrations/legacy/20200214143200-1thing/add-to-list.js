'use strict';

/**
 * README
 *  - This file just adds the '1thing' item to the
 *    'primary-section-fronts' list
 */

const axios = require('../../../app/node_modules/axios'),
  httpOrHttps = process.argv.slice(2)[0],
  host = process.argv.slice(2)[1],
  listUrl = `${httpOrHttps}://${host}/_lists/primary-section-fronts`,
  primarySectionFrontValue = "1thing";

run()

async function run() {
  try {
    const { data } = await axios.get(listUrl)

    if (!data) {
      throw new Error('no data found for primary-section-fronts list')
    }

    if (data.find(item => item.value === primarySectionFrontValue)) {
      console.log('1thing already exists in the primary-section-fronts list');
      return;
    }

    // value needs to match the section front's title.toLowerCase()
    data.push({ name: "1Thing", value: primarySectionFrontValue });
    await axios.put(listUrl, data, { headers: { Authorization: 'token accesskey', 'Content-Type': 'application/json' } });

    console.log('1Thing successfully added to the primary-section-fronts list');
  } catch (e) {
    console.error(`The following error occurred when adding ${primarySectionFrontValue} to the primary-section-fronts list`);
    console.error(e);
    process.exit(1);
  }
}
