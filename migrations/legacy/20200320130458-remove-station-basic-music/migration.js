'use strict';

const { axios, parseHost } = require('../../utils/migration-utils').v1;
const formatAxiosError = require('../../utils/format-axios-error').v1;

run()

async function run() {
  try {
    const host = process.argv[2] || 'clay.radio.com',
      envInfo = parseHost(host),
      newPagesUrl =`${envInfo.url}/_lists/new-pages`,
      { data: oldPages } = await axios.get(newPagesUrl),
      newPages = oldPages.filter(page => page.id !== 'stations');

    await axios.put(newPagesUrl, newPages, {
      headers: { Authorization: 'token accesskey' }
    });

    console.log(
      'successfully removed the station-basic-music _lists/new-pages entry'
    );
  } catch (err) {
    console.error(formatAxiosError(err));
  }
}
