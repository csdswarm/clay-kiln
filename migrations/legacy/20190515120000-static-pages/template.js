const YAML = require('../../../app/node_modules/yamljs')
const fetch = require('../../../app/node_modules/node-fetch')
const {get: _get} = require('../../../app/node_modules/lodash')
const [host] = process.argv.slice(2)
const memoized = {}
const pageMultiValueProps = ['head', 'pageHeader', 'main', 'tertiary']

if (!host) {
  throw new Error('Missing host')
}

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

function parseReferenceUrl(ref) {
  const refParts = ref.split('/')
  const root = refParts[0]
  const url = refParts.slice(1).join('/')
  const componentName = refParts[2]
  const instanceName = refParts[4]
  return {root, url, componentName, instanceName}
}

async function save(url, data, context) {
  const options = {
    method: 'PUT',
    headers: {
      'Authorization': 'token accesskey',
      'Content-Type': 'application/json'
    }
  }
  if (data) {
    options.body = JSON.stringify(data)
  }
  try {
    const response = await fetch(`${host}/${url}`, options)
    console.log(`Saving: ${host}/${url}`)
    return response.json()
  } catch (e) {
    const message = `There was a problem saving.\nContext: ${context}\n`
    console.log(message, e)
    throw e
  }
}

async function getDataAsObject(url, context) {
  try {
    const response = await fetch(`${host}/${url}`)
    return response.json()
  } catch (e) {
    const message = `There was a problem getting data for ${url}.\nContext: ${context}\n`
    console.log(message, e)
    throw e
  }
}

async function getInstance(url) {
  if (!memoized[url]) {
    memoized[url] = await getDataAsObject(url, `getInstance:  ${url}`)
  }
  return JSON.parse(JSON.stringify(memoized[url]))
}

async function saveNewPage(url, data) {
  await save(url, data, 'saveNewPage')
  await save(`${url}@published`, data, 'saveNewPage: Publish')
}

async function addStaticPageComponent() {
  return await save('_components/static-page/instances/new', {
    headline: '',
    content: [{_ref: '/_components/paragraph/instances/new'}],
    pageTitle: ''
  }, 'addStaticPageComponent')
}

async function composeNewStaticPageInst() {
  const staticPageInst = await getDataAsObject('_components/two-column-layout/instances/article', 'composeNewStaticPageInstance')
  if(staticPageInst.secondary && Array.isArray(staticPageInst.secondary)){
    staticPageInst.secondary = staticPageInst.secondary.filter(({_ref}) => !_ref.includes('recirculation'))
  }
  return staticPageInst
}

async function addStaticPageLayoutInstance() {
  const newStaticPageLayout = await composeNewStaticPageInst()
  await save('_components/two-column-layout/instances/static-page', newStaticPageLayout, 'addStaticPageLayoutInstance')
  await save('_components/two-column-layout/instances/static-page@published', newStaticPageLayout, 'addStaticPageLayoutInstance - publish')
}

async function getNewTwoColAndModify() {
  const newStaticPage = await getDataAsObject('_pages/new-two-col', 'getNewTwoColAndModify')
  newStaticPage.layout = newStaticPage.layout.replace(/instances\/.*$/, 'instances/new-static-page')
  if(newStaticPage.tertiary && Array.isArray(newStaticPage.tertiary)){
    newStaticPage.tertiary = newStaticPage.tertiary.filter(i => !i.includes('recirculation'))
  }
  const articleInst = newStaticPage.main.findIndex(i => i.includes('article'))
  if(articleInst !== -1){
    newStaticPage.main[articleInst] = newStaticPage.main[articleInst].replace('article', 'static-page')
  }
  return newStaticPage
}

async function addNewStaticPage() {
  const newStaticPage = await getNewTwoColAndModify()
  await save('_pages/new-static-page', newStaticPage, 'addNewStaticPage')
}

async function addNewPageWithoutRedundancy(pages, newPage) {
  const pagesArrToObj = (obj, {id, title}) => ({...obj, [id]: title})
  pages.push(newPage)
  const pagesWithoutDuplicates = Object
    .entries(pages.reduce(pagesArrToObj, {}))
    .map(([id, title]) => ({id, title}))

  await save('_lists/new-pages', pagesWithoutDuplicates, 'addNewPageWithoutRedundancy')
}

// modifies existing list
async function addStaticPageTemplateToLists() {
  const newPages = await getDataAsObject('_lists/new-pages', 'addStaticPageTemplateToLists')
  await addNewPageWithoutRedundancy(newPages, {id: 'new-static-page', title: 'New Static Page'})
}

// based on new-two-col
async function addNewStaticPageTemplate() {
  console.log('Adding New Static Page Template\n\n')
  await addStaticPageComponent()
  await addStaticPageLayoutInstance()
  await addNewStaticPage()
  await addStaticPageTemplateToLists()
  console.log('\n\n\n\n')
}

function createNewSubComponentsFromRef(data){
  return async ref => {
    const {url} = parseReferenceUrl(ref)
    const newSubComponent = _get(data, url.replace(/\//g, '.'))
    await save(url, newSubComponent, `createNewSubComponentsFromRef: ${ref}`)
  }
}

function createNewReferenceIdForPageComponents(root, name, componentName,  instanceName){
  if(instanceName.includes(name)){
    return `_components/${componentName}/instances/${instanceName}`
  }
  const newInstanceName = (componentName === 'google-ad-manager')
    ? `${name}-${instanceName}`
    : name
  return `_components/${componentName}/instances/${newInstanceName}`
}

function createNewComponentsFromRef(name, data) {
  const createSubComponents = createNewSubComponentsFromRef(data)
  return async ref => {
    const {root, url, componentName, instanceName} = parseReferenceUrl(ref)
    const existingComponent = await getInstance(url)
    const newRoute = createNewReferenceIdForPageComponents(root, name, componentName, instanceName)
    const newRef = `${root}/${newRoute}`
    const compUpdates = _get(data, newRoute.replace(/\//g, '.'), {})
    const preExistingComponent = await getInstance(newRoute)
    const newComponent = (preExistingComponent && preExistingComponent.code !== 404)
      ? {...existingComponent, ...preExistingComponent, ...compUpdates}
      : {...existingComponent, ...compUpdates}
    if(componentName === 'static-page'){
      for(const contentRef of compUpdates.content){
        await createSubComponents(contentRef._ref)
      }
    }
    await save(newRoute, newComponent, `setStaticPageAndComponentInfo: ${newRef}`)
    return newRef
  }
}

function mergeUpdatesIntoPageProperties(pageTemplate, name, data) {
  return async prop => {
    const newRefs = []
    const createNewComponentFromRef = createNewComponentsFromRef(name, data)
    for(const ref of pageTemplate[prop]){
      newRefs.push(await createNewComponentFromRef(ref))
    }
    pageTemplate[prop] = newRefs
  }
}

async function createNewStaticPageFromTemplate({name, customUrl, data}) {
  const pageTemplate = await getInstance('_pages/new-static-page')
  const updateProps = mergeUpdatesIntoPageProperties(pageTemplate, name, data)
  for (const prop of pageMultiValueProps) {
    await updateProps(prop)
  }
  pageTemplate.customUrl = customUrl
  await saveNewPage(`_pages/${name}`, pageTemplate)
}

async function addNewLegalPage() {
  console.log('Adding New Legal Page\n\n')
  await createNewStaticPageFromTemplate(info.legal)
  console.log('\n\n\n\n')
}

async function addNewContestRulesPage() {
  console.log('Adding New Contest Rules Page\n\n')
  await createNewStaticPageFromTemplate(info.rules)
  console.log('\n\n\n\n')
}

async function updateSubscriptionPage() {
  console.log('Updating Subscribe Page\n\n')
  await createNewStaticPageFromTemplate(info.subscribe)
  console.log('\n\n\n\n')
}

addNewStaticPageTemplate()
  .then(addNewLegalPage)
  .then(addNewContestRulesPage)
  .then(updateSubscriptionPage)
