'use strict'

const { 
  bluebird,
  axios
} = require('../../utils/base'),
{
  formatAxiosError,
  parseHost,
  usingDb
} = require('../../legacy/migration-utils').v1;

const host = process.argv[2] || 'clay.radio.com',
  { http } = parseHost(host);

console.log('Removing google ad instances from content data...');
removeAdsFromExistingArticles()
  .catch(err => console.error(formatAxiosError(err, { includeStack: true })));

async function removeAdsFromExistingArticles() {
  await usingDb(db => getArticlesData(db).then(updateArticleInstances));
}

async function updateArticleInstances(articles) {
  const headers = { 
    Authorization: 'token accesskey',
    'Content-Type': 'application/json'
  };

  await bluebird.map(
    articles,
    ({ id, data }) => {
      data.content = data.content.filter(component => !component._ref.includes('/_components/google-ad-manager'));
      axios.put(`${http}://${id}`, data, { headers }).catch(err => console.log(err));
    },
    { concurrency: 10 }
  );
}

async function getArticlesData(db) {
  const result = await db.query(`
      select id, data
      from components.article
      where data->>'content' like '%google-ad-manager%'
    `)

  return result.rows;
}
