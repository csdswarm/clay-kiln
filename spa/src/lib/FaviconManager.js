import _get from 'lodash/get'
import QueryPayload from './QueryPayload'

const queryPayload = new QueryPayload()
const RDC_FAVICON = '/media/components/favicon/favicon.png'

function getFileTypeFromPath (path) {
  return path.slice(path.lastIndexOf('.') + 1)
}

function setAttributes (headIconElement, path, iconFileType) {
  headIconElement.setAttribute('href', path)
  if (headIconElement.getAttribute('type')) {
    headIconElement.setAttribute('type', `image/${iconFileType}`)
  }
}

export default class FaviconManager {
  updateIcons (spaPayload) {
    const faviconComponentData = queryPayload.findComponent(
      spaPayload.headLayout, 'favicon'
    )
    const defaultStationId = _get(spaPayload, 'locals.defaultStation.id')
    const stationId = _get(faviconComponentData, '_computed.stationId')
    const favicon = stationId === defaultStationId ? RDC_FAVICON : _get(faviconComponentData, '_computed.stationOptions.favicon')

    if (!favicon) {
      return
    }

    // find the icons
    const headIconElements = [
      ...document.querySelectorAll('head>link[rel="icon"]'),
      ...document.querySelectorAll('head>link[rel="apple-touch-icon-precomposed"]')
    ]
    // get the file type
    const iconFileType = getFileTypeFromPath(favicon)

    // replace type and href attributes where needed
    headIconElements.forEach(headIconElement => {
      setAttributes(headIconElement, favicon, iconFileType)
    })
  }
}
