'use strict'

const {
  usingDb,
  parseHost
} = require('../../legacy/migration-utils').v1

const host = process.argv[2] || 'clay.radio.com',
  http = parseHost(host).http == 'http' ? require('http') : require('https'),
  options = {
    host
  },
  failedRequests = []

console.log('Updating meta url to migrated content....')
updateMigratedPages().catch(err => console.log(err))

// helper functions
async function makeRequest (path, method, data) {
  return new Promise((resolve, reject) => {
    let requestOptions = Object.assign({}, options),
      dataStr
    requestOptions.path = path
    requestOptions.method = method
    requestOptions.headers = {
      accept: 'application/json'
    }

    if (method == 'PUT' || method == 'POST') {
      requestOptions.headers.authorization = 'token accesskey'
      if (data) {
        requestOptions.headers['Content-Type'] = 'application/json'
        dataStr = typeof data === 'string' ? data : JSON.stringify(data)
      }
    }

    function handleResponse (res) {
      res.setEncoding('utf8')
      let rawData = ''
      res.on('data', chunk => {
        rawData += chunk
      })
      res.on('end', () => {
        // if a response has a "code", then something went wrong. log it so we can know what failed
        // don't fail the response, just log it for awareness
        if (res.statusCode != 200) {
          try {
            const jsonResponse = JSON.parse(rawData)
            if (jsonResponse.code) {
              // logging so we're aware at runtime, but storing so i can remind after done
              console.log(
                `Request failed for: ${path} with response: ${rawData}`
              )
              failedRequests.push(
                `Request failed for: ${path} with response: ${rawData}`
              )
            }
            resolve(rawData)
          } catch (e) {
            // weird non-json response, log as well
            // logging so we're aware at runtime, but storing so i can remind after done
            console.log(`Request failed for: ${path} with response: ${rawData}`)
            failedRequests.push(
              `Request failed for: ${path} with response: ${rawData}`
            )
            resolve(rawData)
          }
        } else {
          resolve(rawData)
        }
      })
    }
    let req = http.request(requestOptions, handleResponse)

    req.on('error', e => {
      console.error(e)
      reject(e)
    })

    if (dataStr) {
      req.write(dataStr)
    }

    // log for progress
    console.log(
      `${method} to ${parseHost(host)
        .http}://${requestOptions.host}${requestOptions.path}`
    )
    req.end()
  })
}

async function getAllMigratedContent (db, host) {
  const result = await db.query(`
    SELECT id, meta ->> 'urlHistory' as redirect, meta
    FROM public.pages
    WHERE (meta ->> 'url') like '%migrate%'
    AND meta -> 'urlHistory' -> 0 is not null;
    `)

    return (
      result.rows
        .map(({ id, redirect, meta }) => {
          console.log('Data received:', { id, redirect, meta })
          let path = JSON.parse(redirect)
          meta.url = path[0];

          console.log('Processed data:', {id, meta})
          return ({id, path, meta})
        })
        .filter(
          ({id}) =>
            //   skip bad rows comming from different hosts
            id.startsWith(host) &&
            // skip the default instance, just in case
            !id.includes('/_pages/new') &&
            // and finally we can exclude published instances 
            !id.endsWith('@published')
        )
    )
}

async function updateMigratedMetaUrls (pageId, data = '') {
  const metaTagsComponent = `${pageId.replace(host, '')}/meta`  
  return await makeRequest(metaTagsComponent, 'PUT', data)
}

async function updateMigratedPages () {
  await usingDb(async db => {
    const migratedItems = (await getAllMigratedContent(db, host));

    migratedItems.map(async ({id, meta}) => {
      if (id) {
        try {
          await updateMigratedMetaUrls(id, meta)
        } catch (error) {
          console.log(error)
        }
      }
    })
  })
}
