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
      console.error(e);
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
    secondaryArticleType: '',
    metaTags: []
  });
  await makeRequest('/_components/meta-tags/instances/general@published', 'PUT');

  const pagesRes = await makeRequest('/_pages', 'GET'),
    pages = JSON.parse(pagesRes),
    publishedPagesRes = await makeRequest('/_pages/@published', 'GET'),
    publishedPages = JSON.parse(publishedPagesRes);

  updatePages(pages, publishedPages);
}

async function updatePages(pages, publishedPages) {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i], 
      published = publishedPages.includes(`${page}@published`);

    // unity created pages are alpha-numeric 25 chars
    // imported (sbp were imported) content is a number --> handled by upgrade, do nothing
    // other - layout level pages (new-two-col, gallery, etc) use /_components/meta-tags/instances/general
    let hash = page.match(/_pages\/(?<unity>[a-zA-Z0-9]{25})?(?<imported>\d+|sbp-\d+)?(?<other>.+)?/);
    if (hash) {
      // we don't need to do this for imported content, upgrade scripts handle this
      const slug = hash.groups.unity || hash.groups.other;

      if (slug) {
        const pageUri = `/_pages/${slug}`,
          pageJsonRes = await makeRequest(pageUri, 'GET'),
          pageJson = JSON.parse(pageJsonRes),
          // send in unity hash -- "other" pages default to meta-tags general instance
          addedMetaTags = await addMetaTags(pageJson, published, hash.groups.unity);

        if (addedMetaTags) {
          await makeRequest(pageUri, 'PUT', pageJson);
          if (published) {
            await makeRequest(`${pageUri}@published`, 'PUT');
          }
        }
      }
    }
  };
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
      const metaTags = {
        authors: [],
        publishDate: '',
        automatedPublishDate: '',
        contentType: '',
        sectionFront: '',
        secondaryArticleType: '',
        metaTags: []
      };

      // if this is an article or gallery, we have to modify the metaTags obj since it's only updated on kiln pub/sub
      if (page.main && page.main.length == 1 && (page.main[0].includes('/article/') || page.main[0].includes('/gallery/'))) {
        const content = await makeRequest(page.main[0].replace(host, ''), 'GET');
        if (content) {
          const contentObj = JSON.parse(content);
          metaTags.authors = contentObj.authors || [];
          metaTags.publishDate = contentObj.date || '';
          metaTags.automatedPublishDate = contentObj.dateModified || '';
          metaTags.contentType = contentObj.contentType || '';
          metaTags.sectionFront = contentObj.sectionFront || '';
          metaTags.secondaryArticleType = contentObj.secondaryArticleType || '';
        }
      }
      await makeRequest(metaTagsComponent, 'PUT', metaTags);

      if (published) {
        await makeRequest(`${metaTagsComponent}@published`, 'PUT');
      }
    }
  }

  return Promise.resolve(added);
}

letsDoThis();