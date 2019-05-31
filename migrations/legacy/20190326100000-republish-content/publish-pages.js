'use strict';

const httpOrHttps = process.argv.slice(2)[0],
  host = process.argv.slice(2)[1],
  http = httpOrHttps == 'http' ? require('http') : require('https'),
  options = {
    host
  };

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

    console.log(`${method} to ${httpOrHttps}://${requestOptions.host}${requestOptions.path}`);
    req.end();
  });
}

async function republishPages() {
  const publishedPagesRes = await makeRequest('/_pages/@published', 'GET'),
    publishedPages = JSON.parse(publishedPagesRes);

  for (let i = 0; i < publishedPages.length; i++) {
    let page = publishedPages[i],
      hash = page.match(/_pages\/(?<unity>[a-zA-Z0-9]{25})?(?<imported>\d+|sbp-\d+)?(?<other>.+)?/);

    if (hash) {
      // only republish content, skip other pages
      const slug = hash.groups.unity || hash.groups.imported;

      if (slug) {
        await makeRequest(`/_pages/${slug}@published`, 'PUT');
      }
    }
  }
}

republishPages();