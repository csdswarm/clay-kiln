/**
 *
 * Meta Manager
 *
 * This library is used to manage meta tag updates during SPA navigation.
 *
 * Example: When the SPA navigates to a new page we need to also update the <title> tag
 * to reflect the new page that has been rendered in the content body. This library encapsulates all
 * that meta tag management logic.
 *
 */

import QueryPayload from './QueryPayload'

const queryPayload = new QueryPayload()

export default class MetaManager {
  updateExternalTags (spaPayload) {
    // Update meta-title component tags.
    const metaTitleData = queryPayload.findComponent(spaPayload.head, 'meta-title')
    if (metaTitleData) {
      this.updateTitleTag(metaTitleData.title)
      this.updateMetaTag('property', 'og:title', metaTitleData.ogTitle)
    }

    // Update meta-description component tags.
    const metaDescriptionData = queryPayload.findComponent(spaPayload.head, 'meta-description')
    if (metaDescriptionData) {
      this.updateMetaTag('name', 'description', metaDescriptionData.description)
    }

    // Update meta-image component tags.
    const metaImageData = queryPayload.findComponent(spaPayload.head, 'meta-image')
    if (metaImageData) {
      this.updateMetaTag('name', 'twitter:image', metaImageData.imageUrl)
      this.updateMetaTag('property', 'og:image', metaImageData.imageUrl)
    }
  }

  updateTitleTag (newTitle) {
    const title = document.head.querySelector('title')

    title.textContent = newTitle
  }

  updateMetaTag (attributeType, attributeKey, content) {
    if (attributeType !== 'property' && attributeType !== 'name') {
      throw new Error('invalid meta tag attribute.')
    }

    document.head.querySelector(`meta[${attributeType}='${attributeKey}']`).setAttribute('content', content)
  }
}
