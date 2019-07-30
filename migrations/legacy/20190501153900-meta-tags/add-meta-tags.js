'use strict';

const httpOrHttps = process.argv.slice(2)[0],
  host = process.argv.slice(2)[1],
  http = httpOrHttps == 'http' ? require('http') : require('https'),
  options = {
    host
  },
  failedRequests = [];

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
        // if a response has a "code", then something went wrong. log it so we can know what failed
        // don't fail the response, just log it for awareness
        if (res.statusCode != 200) {
          try {
            const jsonResponse = JSON.parse(rawData);
            if (jsonResponse.code) {
              // logging so we're aware at runtime, but storing so i can remind after done
              console.log(`Request failed for: ${path} with response: ${rawData}`);
              failedRequests.push(`Request failed for: ${path} with response: ${rawData}`);
            } else {
              console.log(`Non-200 status for ${path}: ${res.statusCode}`);
            }
            resolve(rawData);
          } catch (e) {
            // weird non-json response, log as well
            // logging so we're aware at runtime, but storing so i can remind after done
            console.log(`Request failed for: ${path} with response: ${rawData}`);
            failedRequests.push(`Request failed for: ${path} with response: ${rawData}`);
            resolve(rawData);
          }
        } else {
          resolve(rawData);
        }
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
    secondarySectionFront: '',
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
    // keeping named-groups as comment for clarity on which group is which
    // let hash = page.match(/_pages\/(?<unity>[a-zA-Z0-9]{25})?(?<imported>\d+|sbp-\d+)?(?<other>.+)?/);
    let hash = page.match(/_pages\/([a-zA-Z0-9]{25})?(\d+|sbp-\d+)?(.+)?/);
    if (hash) {
      const unity = hash[1],
        imported = hash[2],
        other = hash[3],
        // we don't need to do this for imported content, upgrade scripts handle this
        slug = unity || other || (imported == '404' ? imported : undefined);

      if (slug) {
        const pageUri = `/_pages/${slug}`,
          pageJsonRes = await makeRequest(pageUri, 'GET'),
          pageJson = JSON.parse(pageJsonRes),
          // send in unity hash -- "other" pages default to meta-tags general instance
          addedMetaTags = await addMetaTags(pageJson, published, unity);

        if (addedMetaTags) {
          await makeRequest(pageUri, 'PUT', pageJson);
          if (published) {
            await makeRequest(`${pageUri}@published`, 'PUT');
          }
        }
      }
    }
  };

  failedRequests.forEach(failure => {
    console.log(failure);
  });
}

function hasMetaTagsComponent(head) {
  return Boolean(head.find(instance => instance.includes('/_components/meta-tags/instances/')));
}

async function addMetaTags(page, published, hash = 'general') {
  const metaTagsComponent = `/_components/meta-tags/instances/${hash}`,
    metaTagsComponentWHost = `${host}${metaTagsComponent}`;

  let added = false;
  if (page && page.head && !(hasMetaTagsComponent(page.head))) {
    page.head.push(metaTagsComponentWHost);
    added = true;

    // /_components/meta-tags/instances/general has already been created and published
    if (hash != 'general' && hash != '404') {
      const metaTags = {
        authors: [],
        publishDate: '',
        automatedPublishDate: '',
        contentType: '',
        sectionFront: '',
        secondarySectionFront: '',
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
          metaTags.secondarySectionFront = contentObj.secondarySectionFront || '';
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
