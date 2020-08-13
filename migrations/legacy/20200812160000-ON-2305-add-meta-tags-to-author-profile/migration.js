'use strict';

const {
  addComponentToContainers,
  formatAxiosError,
  usingDb
} = require('../migration-utils').v1;

const { parseHost } = require('../migration-utils').v2;

const host = process.argv[2] || 'clay.radio.com',
  options = {
    host
  },
  failedRequests = [];

  console.log('DEBUG:::::::::::::::::::::: hostinfo', parseHost(host));


  updateExistingAuthorsPages()
    .catch(err => console.error(formatAxiosError(err, { includeStack: true })))
  
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


  async function createMetaTagComponent(page, published, hash = 'general') {
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
  
  async function updateExistingAuthorsPages() {
    await usingDb(async db => {
      const authorsId = await getAllAuthorPagesId(db, host);
      console.log('DEBUG:::::::::::::::::::::: authorsId', authorsId);

      const response = await makeRequest('_components/meta-tag/instances/general', 'GET');
      console.log('DEBUG:::::::::::::::::::::: response', response);
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
  