const { clayImport, clayExport } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';

const articleNewInstance = `${hostUrl}/_components/article/instances/new`;


const getArticleInstance = async () => {
  const { data } = await clayExport({ componentUrl: articleNewInstance });

  return data;
};

const removeContentPageSponsorLogo = async ({ contentPageSponsorLogo, ...data }) => {
  return clayImport({ hostUrl, payload: data, publish: true })
}

console.log('Removing content-page-logo-sponsorship ad slot on article default template...\n');

getArticleInstance()
  .then(removeContentPageSponsorLogo)
  .then(() => console.log('\nSuccessfully removed contentPageSponsorLogo from article new instance.'))
  .catch(console.error);
