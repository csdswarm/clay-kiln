'use strict';

const axios = require('../../../app/node_modules/axios'),
  host = process.argv.slice(2)[0] || 'clay.radio.com',
  protocol = host === 'clay.radio.com' ? 'http' : 'https';

console.log('\n NATIONAL CONTEST PAGE \n');

createNationalContestPage();

async function createNationalContestPage () {

  const data = {
    "head": [
      `${host}/_components/meta-title/instances/general`,
      `${host}/_components/meta-description/instances/general`,
      `${host}/_components/meta-image/instances/general`,
      `${host}/_components/meta-url/instances/general`,
      `${host}/_components/meta-tags/instances/general`,
      `${host}/_components/branch-io-head/instances/default`
    ],
    "main": [
      `${host}/_components/contest/instances/new`
    ],
    "layout": `${host}/_layouts/two-column-layout/instances/contest`,
    "tertiary": [
      `${host}/_components/google-ad-manager/instances/mediumRectangleTop`,
      `${host}/_components/latest-recirculation/instances/national-contest`,
      `${host}/_components/google-ad-manager/instances/halfPageBottom`
    ],
    "pageHeader": [
      `${host}/_components/google-ad-manager/instances/billboardTop`
    ]
  };

  console.log('Creating National Contest Page');

  await axios.put(`${protocol}://${host}/_pages/national-contest`, data, { headers: { Authorization: 'token accesskey', 'Content-Type': 'application/json' } })
    .then((response) => {
      console.log('Successfully created National Contest Page. \n', response.data);
    })
    .catch((error) => {
      console.log('An error occured creating the National Contest page. \n ERROR: ', error);
    });

};
