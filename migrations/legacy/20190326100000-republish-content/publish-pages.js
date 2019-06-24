'use strict';


const h = require('highland'),
  httpOrHttps = process.argv.slice(2)[0],
  host = process.argv.slice(2)[1],
  http = httpOrHttps == 'http' ? require('http') : require('https'),
  options = {
    host
  },
  failedRequests = [];

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

    // log for progress
    console.log(`${method} to ${httpOrHttps}://${requestOptions.host}${requestOptions.path}`);
    req.end();
  });
}

function isContent(page) {
  const hash = page.match(/_pages\/([a-zA-Z0-9]{25})?(\d+|sbp-\d+)?(.+)?/);

  // only republish content, skip other pages
  return hash && (hash[1] || hash[2]);
}

async function republishPages() {
  const publishedPagesRes = await makeRequest('/_pages/@published', 'GET'),
    publishedPages = JSON.parse(publishedPagesRes);

  return h(publishedPages)
    .filter(isContent)
    .map(page => {
      const uri = page.split('.com')[1];
      return h(makeRequest(uri, 'PUT'));
    })
    .parallel(4)
    // consume stream
    .done(() => {
      console.log(`Republish finished with ${failedRequests.length} failed requests.`);
      failedRequests.forEach( error => {
        console.log(error);
      });
    });
}

republishPages();