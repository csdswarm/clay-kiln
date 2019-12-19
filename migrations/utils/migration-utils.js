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
const v1 = {
  ...(require('./base')),
  ...(require('./execute-sql').v1),
  ...(require('./read-file').v1),
  addComponentToContainers: require('./add-component-to-containers').v1,
  clayExport: require('./clay-export').v1,
  clayImport: require('./clay-import').v1,
  elasticsearch: require('./elasticsearch').v1,
  esQuery: require('./es-query').v1,
  httpGet: require('./http-get').v1,
  httpRequest: require('./http-request').v1,
  parseHost: require('./parse-host').v1,
  republish: require('./republish').v1,
  usingDb: require('./using-db').v1,
};

module.exports = {
  v1,
};
