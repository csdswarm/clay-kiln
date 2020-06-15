'use strict';

const axios = require('../../../app/node_modules/axios'),
  host = process.argv.slice(2)[0];

console.log('\n NATIONAL CONTEST PAGE \n');

createLatestRecircInstance();
createNationalContestPage();

async function createLatestRecircInstance () {
  const data = {
      "tag": "",
      "items": [],
      "populateBy": "all-content",
      "contentType": {
        "article": true,
        "gallery": true,
      },
  };

  console.log('Creating National Latest Recirculation instance.');

  await axios.put(`http://${host}/_components/latest-recirculation/instances/national-contest`, data, { headers: { Authorization: 'token accesskey', 'Content-Type': 'application/json' } })
    .then((response) => {
      console.log('Successfully created National Latest Recirculation instance. \n', response.data);
    })
    .catch((error) => {
      console.log('An error occured creating the National Latest Reciculation instance. \n ERROR: ', error);
    });
};

async function createNationalContestPage () {
  const data = {
    "head": [
      "clay.radio.com/_components/meta-title/instances/general",
      "clay.radio.com/_components/meta-description/instances/general",
      "clay.radio.com/_components/meta-image/instances/general",
      "clay.radio.com/_components/meta-url/instances/general",
      "clay.radio.com/_components/meta-tags/instances/general",
      "clay.radio.com/_components/branch-io-head/instances/default"
    ],
    "main": [
      "clay.radio.com/_components/contest/instances/new"
    ],
    "layout": "clay.radio.com/_layouts/two-column-layout/instances/contest",
    "tertiary": [
      "clay.radio.com/_components/google-ad-manager/instances/mediumRectangleTop",
      "clay.radio.com/_components/latest-recirculation/instances/national-contest",
      "clay.radio.com/_components/google-ad-manager/instances/halfPageBottom"
    ],
    "pageHeader": [
      "clay.radio.com/_components/google-ad-manager/instances/billboardTop"
    ]
  };

  console.log('Creating National Contest Page');

  await axios.put(`http://${host}/_pages/national-contest`, data, { headers: { Authorization: 'token accesskey', 'Content-Type': 'application/json' } })
    .then((response) => {
      console.log('Successfully created National Contest Page. \n', response.data);
    })
    .catch((error) => {
      console.log('An error occured creating the National Contest page. \n ERROR: ', error);
    });

};
