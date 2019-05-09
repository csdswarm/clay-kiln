'use strict';

const httpOrHttps = process.argv.slice(2)[0],
  host = process.argv.slice(2)[1],
  http = httpOrHttps == 'http' ? require('http') : require('https'),
  options = {
    host
  };

console.log('running unity-pages');

async function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    let requestOptions = Object.assign({}, options), dataStr;
    requestOptions.path = path;
    requestOptions.method = method;
    requestOptions.headers = {
      accept: 'application/json'
    };

    if (method == 'PUT' || method == 'POST') {
      requestOptions.headers.authorization = 'token accesskey';
      if (data) {
        requestOptions.headers['Content-Type'] = 'application/json';
        dataStr = JSON.stringify(data);
        // requestOptions.headers['Content-Length'] = dataStr.length;
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
    let req = http.request(requestOptions, handleResponse);
    
    req.on('error', (e) => {
      console.log(e);
      reject(e);
    });

    if (dataStr) {
      req.write(dataStr);
    }

    console.log(`${method} to ${requestOptions.path}`);
    req.end();
  });
}

async function letsDoThis() {
  // create default meta-tags instance
  await makeRequest('/_components/meta-tags/instances/general', 'PUT', {
    authors: [],
    publishDate: '',
    automatedPublishDate: '',
    contentType: '',
    sectionFront: '',
    secondaryArticleType: ''
  });
  await makeRequest('/_components/meta-tags/instances/general@published', 'PUT');

  const pagesRes = await makeRequest('/_pages', 'GET'),
    pages = JSON.parse(pagesRes),
    publishedPagesRes = await makeRequest('/_pages/@published', 'GET'),
    publishedPages = JSON.parse(publishedPagesRes);

  updatePages(pages, publishedPages);
}

async function updatePages(pages, publishedPages) {
  pages.forEach(async function(page) {
    const published = publishedPages.includes(`${page}@published`);

    // unity created pages are alpha-numeric 25 chars
    // imported (sbp were imported) content is a number --> handled by upgrade
    // other - layout level pages use /_components/meta-tags/instances/general
    let hash = page.match(/_pages\/(?<unity>[a-zA-Z0-9]{25})?(?<imported>\d+|sbp-\d+)?(?<other>.+)?/);
    if (hash) {
      if (hash.groups.unity == 'cjvfme79q0000joo1twbi8ne5') {
        const pageUri = `/_pages/${hash.groups.unity}`;

        let pageJsonRes = await makeRequest(pageUri, 'GET'),
          pageJson = JSON.parse(pageJsonRes);

        let addedMetaTags = await addMetaTags(pageJson, published, hash.groups.unity);
        if (addedMetaTags) {
          await makeRequest(pageUri, 'PUT', pageJson);
          if (published) {
            await makeRequest(`${pageUri}@published`, 'PUT');
          }
        }
      } else if (hash.groups.imported) {
        // do a get to make sure upgrade occurred (does this need to be @published?)
        await makeRequest(`/_components/article/instances/${hash.groups.imported}`, 'GET');
        if (published) {
          await makeRequest(`/_components/article/instances/${hash.groups.imported}@published`, 'GET');
        }
      } else if (hash.groups.other) {
        const pageUri = `/_pages/${hash.groups.other}`;

        let pageJsonRes = await makeRequest(pageUri, 'GET'),
          pageJson = JSON.parse(pageJsonRes);
        
        let addedMetaTags = await addMetaTags(pageJson, published);

        if (addedMetaTags) {
          await makeRequest(pageUri, 'PUT', pageJson);
          if (published) {
            await makeRequest(`${pageUri}@published`, 'PUT');
          }
        }
      }
    }
  });
}

async function addMetaTags(page, published, hash = 'general') {
  const metaTagsComponent = `/_components/meta-tags/instances/${hash}`,
    metaTagsComponentWHost = `${host}${metaTagsComponent}`;

  let added = false;
  if (page && page.head && !page.head.includes(metaTagsComponentWHost)) {
    page.head.push(metaTagsComponentWHost);
    added = true;

    // /_components/meta-tags/instances/general has already been created and published
    if (hash != 'general') {
      await makeRequest(metaTagsComponent, 'PUT', {
        authors: [],
        publishDate: '',
        automatedPublishDate: '',
        contentType: '',
        sectionFront: '',
        secondaryArticleType: ''
      });

      if (published) {
        await makeRequest(`${metaTagsComponent}@published`, 'PUT');
      }
    }
  }

  return Promise.resolve(added);
}

letsDoThis();