'use strict';

const {
  addComponentToContainers,
  usingDb,
  parseHost
} = require('../migration-utils').v1;

const host = process.argv[2] || 'clay.radio.com',
  http = parseHost(host).http == 'http' ? require('http') : require('https'),
  options = {
    host
  },
  failedRequests = [];

  updateExistingAuthorsPages()
    .catch(err => console.log(err))
  
  // helper functions

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
      console.log('DEBUG:::::::::::::::::::::: requestOptions', requestOptions);
      let req = http.request(requestOptions, handleResponse);
      
      req.on('error', (e) => {
        console.error(e);
        reject(e);
      });
  
      if (dataStr) {
        req.write(dataStr);
      }
  
      // log for progress
      console.log(`${method} to ${parseHost(host).http}://${requestOptions.host}${requestOptions.path}`);
      req.end();
    });
  }
  
  async function getAllAuthorPagesId(db, host) {
    const result = await db.query(`
      select id, data 
      from public.pages 
      where data#>>'{main,0}' like '%/author-page/instances%'
    `)
  
    return result.rows.map(({ id }) => id)
      .filter(id => (
        // there exists bad rows in the database which come from different hosts
        //   so it's easiest if we skip over them
        id.startsWith(host)
        // we don't want the default instance because that causes an error on
        //   publish.  We will rely on bootstrap.yml updating it.
        && !id.includes('/_pages/new')
        // and finally we can exclude published instances since the latest
        //   instances will get published
        && !id.endsWith('@published')
      ))
      // then remove the host from the beginning so it's compatible with
      //   addComponentToContainers' signature
      .map(id => id.slice((host + '/').length));
  }


  async function createMetaTagComponent(data, hash = 'general') {
    const metaTagsComponent = `/_components/meta-tags/instances/${hash}`;
        return await makeRequest(metaTagsComponent, 'PUT', metaTags);
  }
  
  async function updateExistingAuthorsPages() {
    await usingDb(async db => {
      const authorsId = await getAllAuthorPagesId(db, host);
      // console.log('DEBUG:::::::::::::::::::::: authorsId', authorsId);

      const metaTags = await makeRequest(`/_components/meta-tags/instances/general`, 'GET');
      authorsId.map(author => {
        let hash = author.match(/_pages\/([a-zA-Z0-9]{25})?(\d+|sbp-\d+)?(.+)?/);
        const slug = hash[1] || 'general'
        console.log('DEBUG:::::::::::::::::::::: hash', hash[0], slug);
      });
      // await addComponentToContainers(
      //   host,
      //   authorsId,
      //   '_components/meta-tags/instances/general',
      //   'head'
      // );
    })
  }
  