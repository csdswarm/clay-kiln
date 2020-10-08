'use strict';


// IMPORTANT: follow open/closed principle. The following methods may be extended
// but the public interface may not be changed in a way that could break existing
// legacy scripts that might be using it.

// If you must do so, create another version
// ex:
// ```
// const v2 = {...v1, clayImport: require('./clay-import').v2 };
//
// module.exports = { v1, v2 };
// ```
// where clayImport.V2 is a function with a different structure that clayImport in v1
// or where it does significantly different things that would break a prior migration
// - CSD

/*******************************************************************************************
 *                                     Version 1.0                                         *
 *******************************************************************************************/
const esQuery = require('./es-query'),
  parseHost = require('./parse-host'),
  usingDb = require('./using-db'),
  v1 = {
    ...(require('./base')),
    ...(require('./execute-sql').v1),
    ...(require('./read-file').v1),
    addComponentToContainers: require('./add-component-to-containers').v1,
    clayExport: require('./clay-export').v1,
    clayImport: require('./clay-import').v1,
    dbCursor: require('./db-cursor').v1,
    elasticsearch: require('./elasticsearch').v1,
    ensureStartsWith: require('./ensure-starts-with').v1,
    esQuery: esQuery.v1,
    formatAxiosError: require('./format-axios-error').v1,
    httpGet: require('./http-get').v1,
    httpRequest: require('./http-request').v1,
    parseHost: parseHost.v1,
    removeComponentsFromContainers: require('./remove-components-from-containers').v1,
    republish: require('./republish').v1,
    retrieveList: require('./list-retrieve').v1,
    updateList: require('./list-update').v1,
    usingDb: usingDb.v1,
  },
  v2 = {
    esQuery: esQuery.v2,
    parseHost: parseHost.v2,
    usingDb: usingDb.v2
  };

module.exports = {
  v1,
  v2,
};
