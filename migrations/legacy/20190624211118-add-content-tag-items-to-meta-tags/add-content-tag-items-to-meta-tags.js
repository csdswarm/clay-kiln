'use strict';

// most of this was shamelessly copied from jeff's migration
//   at <timestamp>-meta-tags/

const httpOrHttps = process.argv.slice(2)[0],
  host = process.argv.slice(2)[1],
  http = httpOrHttps == 'http' ? require('http') : require('https'),
  options = {
    host
  },
  failedRequests = [],
  requestIsFiring = false,
  waitMs = ms => {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    });
  };

console.log("updating 'contentTagItems' property of non-upgrade'able meta-tags");

async function makeJsonRequest(...args) {
  return JSON.parse(await makeRequest(...args));
}

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
  })
    .then((result) => waitMs(1000).then(() => result))
    .catch(err => {
      if (err.code === 'ETIMEDOUT') {
        return makeRequest(path, method, data);
      }
      return Promise.reject(err);
    });
}

async function letsDoThis() {
  const general = await makeJsonRequest('/_components/meta-tags/instances/general', 'GET'),
    generalPublished = await makeJsonRequest('/_components/meta-tags/instances/general@published', 'GET');

  general.contentTagItems = [];
  generalPublished.contentTagItems = [];

  await makeRequest('/_components/meta-tags/instances/general', 'PUT', general);
  await makeRequest('/_components/meta-tags/instances/general@published', 'PUT', generalPublished);

  const pages = await makeJsonRequest('/_pages', 'GET'),
    setOfPublishedPages = new Set(await makeJsonRequest('/_pages/@published', 'GET'));

  updatePages(pages, setOfPublishedPages);
}

async function updatePages(pages, setOfPublishedPages) {
  for (let i = 0; i < pages.length; i++) {
    try {
      const page = pages[i],
        isPublished = setOfPublishedPages.has(`${page}@published`);

      // unity created pages are alpha-numeric 25 chars
      // imported (sbp were imported) content is a number --> handled by upgrade, do nothing
      // other - layout level pages (new-two-col, gallery, etc) use /_components/meta-tags/instances/general
      // keeping named-groups as comment for clarity on which group is which
      // let hash = page.match(/_pages\/(?<unity>[a-zA-Z0-9]{25})?(?<imported>\d+|sbp-\d+)?(?<other>.+)?/);
      const hash = page.match(/_pages\/([a-zA-Z0-9]{25})?(\d+|sbp-\d+)?(.+)?/);

      if (!hash) {
        continue;
      }

      const unity = hash[1],
        imported = hash[2],
        other = hash[3],
        // we don't need to do this for imported content, upgrade scripts handle this
        slug = unity || other || (imported == '404' ? imported : undefined);

      // we only need to update the unity pages.  All others will be handled by
      //   the upgrade script
      if (!unity) {
        continue;
      }

      const pageUri = `/_pages/${slug}`,
        pageJson = await makeJsonRequest(pageUri, 'GET');

      // send in unity hash -- "other" pages default to meta-tags general instance
      await addContentTagItems(pageJson, isPublished, unity);
    } catch (e) {
      // a request should have failed in this scenario which will be
      //   logged after
    }
  };

  failedRequests.forEach(failure => {
    console.log(failure);
  });
}

function removeHost(uri) {
  return uri.slice(host.length);
}

function getMetaTagsUri(page) {
  if (!page || !page.head) {
    return false;
  }

  const uri = page.head.find(instance => instance.includes('/_components/meta-tags/instances/'));

  // remove host from the uri
  return uri
    ? removeHost(uri)
    : uri;
}

function getArticleOrGalleryUri(page) {
  if (!page || !page.main) {
    return false;
  }

  const articleOrGalleryRe = /_components\/(article|gallery)\//,
    uri = page.main.find(uri => articleOrGalleryRe.test(uri));

  return uri
    ? removeHost(uri)
    : uri;
}

async function addContentTagItems(page, isPublished) {
  const metaTagsUri = getMetaTagsUri(page),
    contentUri = getArticleOrGalleryUri(page);

  if (!metaTagsUri || !contentUri) {
    return;
  }

  const metaTagsData = await makeJsonRequest(metaTagsUri, 'GET'),
    contentData = await makeJsonRequest(contentUri, 'GET'),
    metaTagsPublishedData = isPublished ? await makeJsonRequest(metaTagsUri + '@published', 'GET') : null,
    contentPublishedData = isPublished ? await makeJsonRequest(contentUri + '@published', 'GET') : null,
    tagsUri = removeHost(contentData.tags._ref),
    tagsPublishedUri = isPublished ? removeHost(contentPublishedData.tags._ref) : null,
    tagsData = await makeJsonRequest(tagsUri, 'GET'),
    tagsPublishedData = isPublished ? await makeJsonRequest(tagsPublishedUri, 'GET') : null;

  metaTagsData.contentTagItems = tagsData.items;
  if (isPublished) {
    metaTagsPublishedData.contentTagItems = tagsPublishedData.items;
  }

  await makeRequest(metaTagsUri, 'PUT', metaTagsData);
  if (isPublished) {
    await makeRequest(metaTagsUri + '@published', 'PUT', metaTagsPublishedData);
  }
}

letsDoThis();
