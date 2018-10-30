/**
 *
 * Query Payload
 *
 * This library is used to query the SPA Payload object.
 *
 * This object is the exact same data payload that is passed to the view engine
 * in server-side clay (amphora). It contains all the data necessary for the view engine
 * to render the full page.
 *
 * Sometimes in the SPA we only need slices of this data, so any logic that gets data from
 * the spaPayload object should go in this library.
 *
 * See Also: this.$store.state.spaPayload
 *
 */

export default class QueryPayload {
  findComponent (data, componentName) {
    let component = null

    /**
     * If data passed in is a component-list, extract directly.
     * Else walk over payload object keys and extract until component
     * is found or not.
     */
    if (Array.isArray(data)) {
      const match = this.extractComponentDataFromComponentList(data, componentName)
      if (match) {
        component = match
      }
    } else {
      let match = null
      for (const componentListKey in data) {
        if (data.hasOwnProperty(componentListKey)) {
          match = this.extractComponentDataFromComponentList(data[componentListKey], componentName)
          if (match) {
            component = match
            break // If match is found, return early instead of continuing to iterate and search.
          }
        }
      }
    }

    return component
  }

  extractComponentDataFromComponentList (componentList, componentName) {
    return componentList.find((component) => {
      const regEx = new RegExp(`_components/${componentName}/instances`)

      return regEx.test(component['_ref'])
    })
  }
}
