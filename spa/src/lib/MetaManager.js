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
      // Clone string concat logic from dynamic-meta-title/template.hbs.
      const title = `${dynamicMetaTitleData.paramValue}${dynamicMetaTitleData.suffix}`
      const metaTitle = `${dynamicMetaTitleData.metaValue}${dynamicMetaTitleData.suffix}`

      metaTitleData = {
        title,
        ogTitle: metaTitle,
        twitterTitle: metaTitle
      }
    } else {
      metaTitleData = queryPayload.findComponent(spaPayload.head, 'meta-title')

      // ensure a title exists on the page
      if (!metaTitleData) {
        const defaultTitle = 'RADIO.COM: Listen to Free Radio Online | Music, Sports, News, Podcasts'

        metaTitleData = {
          title: defaultTitle,
          ogTitle: defaultTitle,
          twitterTitle: defaultTitle
        }
      } else if (!metaTitleData.twitterTitle) {
        // default to the SEO title for backwards compatibility
        metaTitleData.twitterTitle = metaTitleData.ogTitle
      }
    }

    // meta-tags component needs to be added to every page
    const metaTagsData = queryPayload.findComponent(spaPayload.head, 'meta-tags')
    if (metaTagsData) {
      if (metaTagsData.metaTags) {
        metaTagsData.metaTags.forEach(tag => {
          if (tag.name) {
            this.updateMetaTag('name', tag.name, tag.content, true)
          } else if (tag.property) {
            this.updateMetaTag('property', tag.property, tag.content, true)
          }
        })
      }

      // lets us only have to update meta-tags component when adding / removing meta tags
      if (metaTagsData.unusedTags) {
        // tag will be of schema
        // { type: 'property', property: 'some:property' }
        // { type: 'name', name: 'some:name' }
        metaTagsData.unusedTags.forEach(tag => {
          this.deleteMetaTag(tag.type, tag[tag.type])
        })
      }
    }

    // Update or strip meta-title component tags (never delete <title> tag).
    if (metaTitleData) {
      this.updateTitleTag(metaTitleData.title)
      this.updateMetaTag('property', 'og:title', metaTitleData.ogTitle, true)
      this.updateMetaTag('name', 'twitter:title', metaTitleData.twitterTitle, true)
    } else {
      this.deleteMetaTag('property', 'og:title')
      this.deleteMetaTag('name', 'twitter:title')
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
      this.updateMetaTag('name', 'twitter:card', 'summary_large_image', true)
      this.updateMetaTag('name', 'twitter:site', '@radiodotcom', true)
      this.updateMetaTag('name', 'twitter:image', metaImageData.imageUrl, true)
      this.updateMetaTag('property', 'og:image', metaImageData.imageUrl, true)
    } else {
      this.deleteMetaTag('name', 'twitter:card')
      this.deleteMetaTag('name', 'twitter:site')
      this.deleteMetaTag('name', 'twitter:image')
      this.deleteMetaTag('property', 'og:image')
    }

    // Get Meta Url Data.
    let metaUrlData = null
    const dynamicMetaUrlData = queryPayload.findComponent(spaPayload.head, 'dynamic-meta-url')
    if (dynamicMetaUrlData) {
      metaUrlData = {
        rel: dynamicMetaUrlData.url,
        ogUrl: dynamicMetaUrlData.url
      }
    } else {
      metaUrlData = queryPayload.findComponent(spaPayload.head, 'meta-url')
      metaUrlData = {
        // Clone string concat logic from meta-url/template.hbs.
        rel: metaUrlData.syndicatedUrl || metaUrlData.url,
        ogUrl: metaUrlData.url
      }
    }

    // Update or strip rel component tag
    if (metaUrlData) {
      this.updateLinkTag(metaUrlData.rel)
      this.updateMetaTag('property', 'og:url', metaUrlData.ogUrl)
    } else {
      this.deleteLinkTag()
      this.deleteMetaTag('property', 'og:url')
    }
  }

  /**
   *
   * Update the page <title> tag.
   *
   * @param {string} newTitle - The new page title.
   */
  updateTitleTag (newTitle) {
    const title = document.head.querySelector('title') || document.head.appendChild(document.createElement('title'))

    title.textContent = newTitle
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

  /**
   *
   * Create a <link> tag on the page by name or property attribute and assign content to it.
   *
   * @param {string} href - New href to be used in link tag.
   */
  createLinkTag (href) {
    // Create <link> tag element.
    const meta = document.createElement('link')
    meta.setAttribute('rel', 'canonical')
    meta.setAttribute('href', href)

    // Insert <meta> tag into <head>
    document.getElementsByTagName('head')[0].appendChild(meta)
  }

  /**
   *
   * Select a <link> tag and delete it from the DOM.
   */
  deleteLinkTag () {
    // Select link tag.
    const linkTag = document.head.querySelector(`link[rel='canonical']`)

    // If tag exists, remove it from DOM.
    if (linkTag) {
      linkTag.parentNode.removeChild(linkTag)
    }
  }

  /**
   *
   * Update a <link> tag on the page by name or property attribute.
   *
   * @param {string} href - New href to be used in link tag.
   * @param {boolean} createIfNotExist - Similar to database "upsert" functionality, create the meta tag with supplied values if it doesn't exist in DOM currently.
   */
  updateLinkTag (href, createIfNotExist = false) {
    // Select link tag.
    const linkTag = document.head.querySelector(`link[rel='canonical']`)

    // Update, or potentially "upsert" the meta tag.
    if (linkTag) {
      linkTag.setAttribute('href', href)
    } else if (createIfNotExist) {
      this.createLinkTag(href)
    }
  }
}