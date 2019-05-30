'use strict';

const dev = 'dev-clay.radio.com',
  stg = 'stg-clay.radio.com',
  prod = 'www.radio.com',
  environments = [dev, stg],
  https = require('https');

console.log('updating dev and staging pages to have /_pages/*/meta');

async function makeRequest(host, path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      host,
      path,
      method,
      headers: {
        accept: 'application/json'
      }
    };

    let dataStr;
    if (method == 'PUT' || method == 'POST') {
      options.headers.authorization = 'token accesskey';
      if (data) {
        options.headers['Content-Type'] = 'application/json';
        dataStr = JSON.stringify(data);
      }
    }

    function handleResponse(res) {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        resolve(rawData);
      });
    }
    let req = https.request(options, handleResponse);
    
    req.on('error', (e) => {
      console.error(e);
      reject(e);
    });

    if (dataStr) {
      req.write(dataStr);
    }

    console.log(`${method} to ${options.host}${options.path}`);
    req.end();
  });
}

async function addMetaForEnvPages(env) {
  let pagesRes = await makeRequest(env, '/_pages', 'GET'),
    pages = JSON.parse(pagesRes),
    publishedPagesRes = await makeRequest(env, '/_pages/@published', 'GET'),
    publishedPages = JSON.parse(publishedPagesRes);

  pages = pages.filter( page => {
    let hash = page.match(/_pages\/(?<unity>[a-zA-Z0-9]{25})?(?<imported>\d+|sbp-\d+)?(?<other>.+)?/);

    if (hash && hash.groups.other) {
      return true;
    } else {
      return false;
    }
  });

  for (const page of pages) {
    let metaRes = await makeRequest(env, `${page.replace(env, '')}/meta`, 'GET');
    if (metaRes == "null") {
      let prodMetaRes = await makeRequest(prod, `${page.replace(env, '')}/meta`, 'GET');
      if (prodMetaRes != null) {
        let prodMeta = JSON.parse(prodMetaRes),
          { url, title, archived, siteSlug, createdAt, published, scheduled, updateTime, publishTime, scheduleTime, titleTruncated, firstPublishTime } = prodMeta,
          envUrl = url.replace(prod, env),
          envMeta = {
            url: envUrl,
            title,
            users: [],
            authors: [],
            history: [],
            archived,
            siteSlug,
            createdAt,
            published,
            scheduled,
            updateTime,
            publishTime,
            scheduleTime,
            titleTruncated,
            firstPublishTime
          };

          // some pages have empty string as url, skip these
          if (!!envUrl) {
            // pages lost customUrl
            let pageRes = await makeRequest(env, `${page.replace(env, '')}`, 'GET'),
              pageObj = JSON.parse(pageRes);

            if (!pageObj.customUrl) {
              pageObj.customUrl = envUrl;
            }

            await makeRequest(env, `${page.replace(env, '')}`, 'PUT', pageObj);
          }
          await makeRequest(env, `${page.replace(env, '')}/meta`, 'PUT', envMeta);

          // i think this has to happen after meta is added
          if (!!envUrl && publishedPages.includes(`${page}@published`)) {
            await makeRequest(env, `${page.replace(env, '')}@published`, 'PUT');
          }

      } else {
        console.log('Prod meta endpoint doesn\'t exist');
      }
    }
  }
}

for (const env of environments) {
  addMetaForEnvPages(env);
}