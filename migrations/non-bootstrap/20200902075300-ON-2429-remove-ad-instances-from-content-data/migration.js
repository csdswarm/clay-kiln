'use strict'

let fetchMore = true;

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
  await usingDb(db => getArticlesData(db)
    .then(updateArticleInstances)
    .then(number => {
      console.log(`${number} articles were updated...`);
      if (fetchMore) {
        removeAdsFromExistingArticles();
      }
    })
  );
}

async function updateArticleInstances(articles) {
  const headers = { 
    Authorization: 'token accesskey',
    'Content-Type': 'application/json'
  };

  await bluebird.map(
    articles,
    async ({ id, data }) => {
      data.content = data.content.filter(component => !component._ref.includes('/_components/google-ad-manager'));
      await axios.put(`${http}://${id}`, data, { headers }).catch(err => console.log(err));
    },
    { concurrency: 5 }
  );

  return articles.length;
}

async function getArticlesData(db) {
  const result = await db.query(`
    select id, data
    from components.article
    where data->>'content' like '%google-ad-manager%'
    LIMIT 1000
  `);

  if (result.rows.length === 0) {
    fetchMore = false;
  }

  return result.rows;
}
