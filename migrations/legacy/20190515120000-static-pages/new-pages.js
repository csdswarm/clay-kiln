const fs = require('fs')
const YAML = require('../../../app/node_modules/yamljs')
const fetch = require('../../../app/node_modules/node-fetch')
const [url] = process.argv.slice(2)

if (!url) {
  throw new Error('Missing url')
}

const logAndContinue = message => value => {
  console.log(message, value)
  return value
}

const handleError = err => {
  if (err) throw new Error(err)
}

const getPagesFromClay = async ({url}) => {
  const response = await fetch(url)
  return response.json()
}

// prevents duplication by id
const pageArrayToObj = pages => pages.reduce((obj, {id, title}) => ({...obj, [id]: title}), {})

const addNewListItem = pagesObj => ({...pagesObj, 'new-static-page': 'New Static Page'})

const objToPageArray = pagesObj => Object.entries(pagesObj).map(([id, title]) => ({id, title}))

const pageArrayToList = pages => ({'_lists': {'new-pages': pages}})

const toYAML = pages => YAML.stringify(pages, 6, 2)

const saveToFile = pagesYml => {
  fs.writeFile(`${__dirname}/new_pages.yml`, pagesYml, 'utf8', handleError)
  return pagesYml
}

getPagesFromClay({url})
  .then(pageArrayToObj)
  .then(addNewListItem)
  .then(objToPageArray)
  .then(pageArrayToList)
  .then(toYAML)
  .then(logAndContinue('Updated List:'))
  .then(saveToFile)
