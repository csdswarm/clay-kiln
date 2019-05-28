const fs = require('fs')
const YAML = require('../../../app/node_modules/yamljs')
const fetch = require('../../../app/node_modules/node-fetch')
const {get: _get, set: _set} = require('../../../app/node_modules/lodash')
const [host] = process.argv.slice(2)
const memoized = {}
const final = {}
const pageMultiValueProps = ['head', 'pageHeader', 'main', 'tertiary']

if (!host) {
  throw new Error('Missing host')
}

// Save page specific info about each new page added from YAML files
const info = {
  legal: {
    name: 'legal',
    customUrl: '/legal',
    data: YAML.load('page_legal.yml')
  },
  subscribe: {
    name: 'newsletter-subscribe',
    customUrl: '/newsletter/subscribe',
    data: YAML.load('page_subscribe.yml')
  },
  rules: {
    name: 'contest-rules',
    customUrl: '/contest-rules',
    data: YAML.load('page_contest_rules.yml')
  }
}

/**
 * Break apart a reference url (root/store/:componentName/instances/:instanceName) into the parts needed
 * url is store/:componentName/instances/:instanceName
 * @param ref
 * @returns {{instanceName: *, componentName: *, url: *}}
 */
function parseReferenceUrl(ref) {
  const refParts = ref.split('/')
  const url = refParts.slice(1).join('/')
  const componentName = refParts[2]
  const instanceName = refParts[4]
  return {url, componentName, instanceName}
}

/**
 * Saves data to a global object that will be written into YAML when processing
 * is complete
 * @param url
 * @param data
 * @returns {Promise<void>}
 */
async function storeData(url, data) {
  if (data) {
    // was originally saving this data, but that wasn't working, so pretend we did
    // by adding to memoized data
    memoized[url] = data
    _set(final, url.split('/'), data)
  }
}

/**
 * fetches existing data from the target environment
 * @param url
 * @param context
 * @returns {Promise<*>}
 */
async function getData(url, context) {
  try {
    const response = await fetch(`${host}/${url}`)
    if(response.status === 404){
      return null
    }
    const jsonValue = await response.json()
    return jsonValue
  } catch (e) {
    const message = `There was a problem getting data for ${url}.\nContext: ${context}\n`
    console.log(message, e)
  }
  return null
}

/**
 * Wrapper for getData, memoizes all retrieved data so subsequent requests for the same
 * data are already cached. Additionally, storeData will update the memoized data so data
 * that was hypothetically saved, can be retrieved in the same way.
 * @param url
 * @returns {Promise<any>}
 */
async function getMemoizedData(url) {
  if (!memoized[url]) {
    memoized[url] = await getData(url, `getMemoizedData:  ${url}`)
  }
  return JSON.parse(JSON.stringify(memoized[url]))
}

/**
 * Composes a "new" instance for the "static-page" component
 * @returns {Promise<void>}
 */
async function addStaticPageComponent() {
  return await storeData('_components/static-page/instances/new', {
    headline: '',
    content: [{_ref: '/_components/paragraph/instances/new'}],
    pageTitle: ''
  })
}

/**
 * When retrieving data, often references include the hostname of the target
 * environment. For some reason this seems to cause problems when importing data
 * so strip it off and just use '/' for the root
 * @param value
 * @returns {string}
 */
function removeRoot(value) {
  return '/' + value.split('/').slice(1).join('/')
}

/**
 * This looks over a set of properties on an object and removes the hostname (if any)
 * from each. setting useRefs to true looks for objects in the array with a _ref prop
 * otherwise, it is assumed the property is a string
 * @param obj
 * @param useRefs
 * @param props
 */
function removeEnvironmentRoots(obj, useRefs, ...props) {
  const mapWithoutRoot = useRefs ? (({_ref}) => ({_ref: removeRoot(_ref)})) : removeRoot

  props.forEach(prop => {
    obj[prop] = obj[prop].map(mapWithoutRoot)
  })
}

/**
 * Creates a new "static-page" two-column-layout based on the article instance
 * @returns {Promise<void>}
 */
async function addStaticPageLayoutInstance() {
  const newStaticPageLayout = await getMemoizedData('_layouts/two-column-layout/instances/article')
  if (newStaticPageLayout.secondary && Array.isArray(newStaticPageLayout.secondary)) {
    newStaticPageLayout.secondary = newStaticPageLayout.secondary.filter(({_ref}) => !_ref.includes('recirculation'))
  }
  removeEnvironmentRoots(newStaticPageLayout, true, 'headLayout', 'top', 'secondary', 'bottom', 'kilnInternals', 'static')
  await storeData('_layouts/two-column-layout/instances/static-page', newStaticPageLayout)
}

/**
 * Creates a new "static-page" based on the "new-two-col" page
 * @returns {Promise<void>}
 */
async function addNewStaticPage() {
  const newStaticPage = await getMemoizedData('_pages/new-two-col')
  newStaticPage.layout = removeRoot(newStaticPage.layout).replace(/instances\/.*$/, 'instances/static-page')
  if (newStaticPage.tertiary && Array.isArray(newStaticPage.tertiary)) {
    newStaticPage.tertiary = newStaticPage.tertiary.filter(i => !i.includes('recirculation'))
  }
  const articleInst = newStaticPage.main.findIndex(i => i.includes('article'))
  if (articleInst !== -1) {
    newStaticPage.main[articleInst] = newStaticPage.main[articleInst].replace('article', 'static-page')
  }
  removeEnvironmentRoots(newStaticPage, false, 'head', 'pageHeader', 'main', 'tertiary')
  await storeData('_pages/new-static-page', newStaticPage)
}

/**
 * Adds the new "static-page" template to the pages list, but ensures that it won't
 * duplicate if it's already there for some reason. (NOTE: side effect is that it will
 * also clean up duplicates of the "gallery" page, which does not seem to have done this
 * sort of check)
 * @returns {Promise<void>}
 */
async function addStaticPageTemplateToLists() {
  const newPages = await getMemoizedData('_lists/new-pages')
  const newStaticPage = {id: 'new-static-page', title: 'New Static Page'}
  const pagesArrToObj = (obj, {id, title}) => ({...obj, [id]: title})
  const generalContent = newPages.find(({id}) => id === 'General-content')
  const dedupPages = arr => Object.entries(arr
      .reduce(pagesArrToObj, {}))
      .map(([id, title]) => ({id, title})
    )
  const pages = generalContent.children
  pages.push(newStaticPage)
  generalContent.children = dedupPages(pages)

  await storeData('_lists/new-pages', newPages)
}

/**
 * Adds a new "static-page" template based on the "new-two-col" template
 * @returns {Promise<void>}
 */
async function addNewStaticPageTemplate() {
  console.log('Composing New Static Page Template\n')
  await addStaticPageComponent()
  await addStaticPageLayoutInstance()
  await addNewStaticPage()
  await addStaticPageTemplateToLists()
  console.log('\n')
}

/**
 * Some components are at a lower level in the hierarchy and
 * are referenced somewhat differently. This creates a function
 * that handles the specifics of modifying those types of components
 * to be specfic to the imported page type (legal, newsletter-subscribe, etc)
 * @param data
 * @returns {Function}
 */
function createNewSubComponentsFromRef(data) {
  return async ref => {
    const {url} = parseReferenceUrl(ref)
    const newSubComponent = _get(data, url.split('/'))
    await storeData(url, newSubComponent)
  }
}

/**
 * Creates the new id for the component ref.
 * NOTE: google-ad-manager usually has multiple instances in a page
 * so the page ref type is prepended to that instance for the page
 * @param name
 * @param componentName
 * @param instanceName
 * @returns {string}
 */
function createNewReferenceIdForPageComponents(name, componentName, instanceName) {
  if (instanceName.includes(name)) {
    return `_components/${componentName}/instances/${instanceName}`
  }
  const newInstanceName = (componentName === 'google-ad-manager')
    ? `${name}-${instanceName}`
    : name
  return `_components/${componentName}/instances/${newInstanceName}`
}

/**
 * Creates a new function that gets individual components based on references,
 * and modifies them to be specific for the target page (legal, contest-rules, etc)
 * @param name
 * @param data
 * @returns {function(*=): string}
 */
function createNewComponentsFromRef(name, data) {
  const createSubComponents = createNewSubComponentsFromRef(data)
  return async ref => {
    const {url, componentName, instanceName} = parseReferenceUrl(ref)
    const existingComponent = await getMemoizedData(url)
    const newRoute = createNewReferenceIdForPageComponents(name, componentName, instanceName)
    const newRef = `/${newRoute}`
    const compUpdates = _get(data, newRoute.split('/'), {})
    const preExistingComponent = await getMemoizedData(newRoute)
    const newComponent = preExistingComponent
      ? {...existingComponent, ...preExistingComponent, ...compUpdates}
      : {...existingComponent, ...compUpdates}
    if (componentName === 'static-page') {
      for (const contentRef of compUpdates.content) {
        await createSubComponents(contentRef._ref)
      }
    }
    await storeData(newRoute, newComponent)
    return newRef
  }
}

/**
 * generates a function that generates localized components for each page
 * (e.g. legal page might need to create specific instance versions from
 * static page like instances/legal, etc)
 * @param pageTemplate
 * @param name
 * @param data
 * @returns {Function}
 */
function mergeUpdatesIntoPageProperties(pageTemplate, name, data) {
  return async prop => {
    const newRefs = []
    const createNewComponentFromRef = createNewComponentsFromRef(name, data)
    for (const ref of pageTemplate[prop]) {
      newRefs.push(await createNewComponentFromRef(ref))
    }
    pageTemplate[prop] = newRefs
  }
}

/**
 * Handles merging yml data into the newly created static-page template
 * and storing for later import
 * @param name
 * @param customUrl
 * @param data
 * @returns {Promise<void>}
 */
async function createNewStaticPageFromTemplate({name, customUrl, data}) {
  const pageTemplate = await getMemoizedData('_pages/new-static-page')
  const updateProps = mergeUpdatesIntoPageProperties(pageTemplate, name, data)
  for (const prop of pageMultiValueProps) {
    await updateProps(prop)
  }
  pageTemplate.customUrl = customUrl
  await storeData(`_pages/${name}`, pageTemplate)
}

/**
 * Merges in data from the page_legal.yml file into a static-page in the current
 * environment and stores the data for importing
 * @returns {Promise<void>}
 */
async function addNewLegalPage() {
  console.log('Composing New Legal Page\n')
  await createNewStaticPageFromTemplate(info.legal)
  console.log('\n')
}

/**
 * Merges in data from the page_contest_rules.yml file into a static-page in the current
 * environment and stores the data for importing
 * @returns {Promise<void>}
 */
async function addNewContestRulesPage() {
  console.log('Composing New Contest Rules Page\n')
  await createNewStaticPageFromTemplate(info.rules)
  console.log('\n')
}

/**
 * Merges in data from the page_subscribe.yml file into a static-page in the current
 * environment and stores the data for importing
 * @returns {Promise<void>}
 */
async function updateSubscriptionPage() {
  console.log('Composing Subscribe Page Updates\n')
  await createNewStaticPageFromTemplate(info.subscribe)
  console.log('\n')
}

/**
 * Takes the JS object (final) that has been composed throughout
 * this process, turns it into YAML and saves it so it can be
 * imported with clay cli.
 *
 * For some reason, using PUT was not working (or when I was
 * converting to this I inadvertently fixed something that was
 * messed up) in that I was not able to publish pages when done
 *
 * Composing the YAML and importing with clay cli seems to do the
 * trick.
 */
function writeOutFinalResult() {
  const yaml = YAML.stringify(final, 8, 2)
  console.log('Saving page and component definitions:\n')
  console.log(yaml)
  fs.writeFile(`${__dirname}/_update.yml`, yaml, 'utf8', function (err) {
    if (err) throw err
  })
  console.log('\n')
}


// Start here. names pretty much describe what's happening
addNewStaticPageTemplate()
  .then(addNewLegalPage)
  .then(addNewContestRulesPage)
  .then(updateSubscriptionPage)
  .then(writeOutFinalResult)
