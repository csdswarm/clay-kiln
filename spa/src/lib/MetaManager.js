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
  /**
   *
   * On SPA navigation, update HTML tags that fall outside the SPA.
   *
   * @param {object} spaPayload - The handlebars context payload data.
   */
  updateExternalTags (spaPayload) {
    // Get Meta Title Data.
    let metaTitleData = null
    const dynamicMetaTitleData = queryPayload.findComponent(spaPayload.head, 'dynamic-meta-title')
    if (dynamicMetaTitleData) {
      // Clone string transformation logic from dynamic-meta-title/client.js and dynamic-meta-title/template.hbs.
      const title = `${dynamicMetaTitleData.paramValue.replace(/\b\w/g, l => l.toUpperCase())}${dynamicMetaTitleData.suffix}`
      metaTitleData = {
        title,
        ogTitle: title
      }
    } else {
      metaTitleData = queryPayload.findComponent(spaPayload.head, 'meta-title')
    }

    // Update or strip meta-title component tags (never delete <title> tag).
    if (metaTitleData) {
      this.updateTitleTag(metaTitleData.title)
      this.updateMetaTag('property', 'og:title', metaTitleData.ogTitle, true)
    } else {
      this.deleteMetaTag('property', 'og:title')
    }

    // Get Meta Description Data
    let metaDescriptionData = null
    const dynamicMetaDescriptionData = queryPayload.findComponent(spaPayload.head, 'dynamic-meta-description')
    if (dynamicMetaDescriptionData) {
      metaDescriptionData = {
        description: dynamicMetaDescriptionData.description
      }
    } else {
      metaDescriptionData = queryPayload.findComponent(spaPayload.head, 'meta-description')
    }

    // Update or strip meta-description component tags.
    if (metaDescriptionData) {
      this.updateMetaTag('name', 'description', metaDescriptionData.description, true)
      this.updateMetaTag('name', 'twitter:description', metaDescriptionData.description, true)
      this.updateMetaTag('property', 'og:description', metaDescriptionData.description, true)
    } else {
      this.deleteMetaTag('name', 'description')
      this.deleteMetaTag('name', 'twitter:description')
      this.deleteMetaTag('property', 'og:description')
    }

    // Update or strip meta-image component tags.
    const metaImageData = queryPayload.findComponent(spaPayload.head, 'meta-image')
    if (metaImageData) {
      this.updateMetaTag('name', 'twitter:image', metaImageData.imageUrl, true)
      this.updateMetaTag('property', 'og:image', metaImageData.imageUrl, true)
    } else {
      this.deleteMetaTag('name', 'twitter:image')
      this.deleteMetaTag('property', 'og:image')
    }
  }

  /**
   *
   * Update the page <title> tag.
   *
   * @param {string} newTitle - The new page title.
   */
  updateTitleTag (newTitle) {
    const title = document.head.querySelector('title')

    if (title) {
      title.textContent = newTitle
    }
  }

  /**
   *
   * Create a <meta> tag on the page by name or property attribute and assign content to it.
   *
   * @param {string} attributeType - Attribute to select by ("name" or "property").
   * @param {string} attributeKey - Value of attribute to select for.
   * @param {string} content - New content to be used in meta tag.
   */
  createMetaTag (attributeType, attributeKey, content) {
    // Create <meta> tag element.
    const meta = document.createElement('meta')
    meta.setAttribute(attributeType, attributeKey)
    meta.setAttribute('content', content)

    // Insert <meta> tag into <head>
    document.getElementsByTagName('head')[0].appendChild(meta)
  }

  /**
   *
   * Select a <meta> tag and delete it from the DOM.
   *
   * @param {string} attributeType - Attribute to select by ("name" or "property").
   * @param {string} attributeKey - Value of attribute to select for.
   */
  deleteMetaTag (attributeType, attributeKey) {
    if (attributeType !== 'property' && attributeType !== 'name') {
      throw new Error('invalid meta tag attribute.')
    }

    // Select meta tag.
    const metaTag = document.head.querySelector(`meta[${attributeType}='${attributeKey}']`)

    // If tag exists, remove it from DOM.
    if (metaTag) {
      metaTag.parentNode.removeChild(metaTag)
    }
  }

  /**
   *
   * Update a <meta> tag on the page by name or property attribute.
   *
   * @param {string} attributeType - Attribute to select by ("name" or "property").
   * @param {string} attributeKey - Value of attribute to select for.
   * @param {string} content - New content to be used in meta tag.
   * @param {boolean} createIfNotExist - Similar to database "upsert" functionality, create the meta tag with supplied values if it doesn't exist in DOM currently.
   */
  updateMetaTag (attributeType, attributeKey, content, createIfNotExist = false) {
    if (attributeType !== 'property' && attributeType !== 'name') {
      throw new Error('invalid meta tag attribute.')
    }

    // Select meta tag.
    const metaTag = document.head.querySelector(`meta[${attributeType}='${attributeKey}']`)

    // Update, or potentially "upsert" the meta tag.
    if (metaTag) {
      metaTag.setAttribute('content', content)
    } else if (createIfNotExist) {
      this.createMetaTag(attributeType, attributeKey, content)
    }
  }
}
