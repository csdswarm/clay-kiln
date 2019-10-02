const { clayImport, clayExport, _get, _set } = require('../migration-utils').v1;
const _chunk = require('lodash/chunk');
const host = process.argv[2] || 'clay.radio.com';
const logMessage = message => data => {
  console.log(message + '\n\n');
  return data
};
const splitArrayIntoEvenChunks = (arr, chunkCount) => {
    const chunks = [];
    for (let i = chunkCount; i > 0; i--) {
        chunks.push(arr.splice(0, Math.ceil(arr.length / i)))
    }
    return chunks;
}

const COMPONENT_INSTANCE = '_components/top-nav/instances/default';

function getComponentInstance() {
  return clayExport({ componentUrl: `${host}/${COMPONENT_INSTANCE}` });
}

function updateComponentInstance({ data }) {
  const path = COMPONENT_INSTANCE.split('/'),
    component = _get(data, [...path]);

  component.headerLinks = component.headerLinks.map(({text, list, ...rest}) => {
      if (list) {
        let newList = [];
        switch (text) {
          case 'music':
          case 'news':
          case 'sports':
            list.map(({list: subList, text: subText, hasHeader, ...rest}, index) => {
                // if hasHeader is set, migration has already been run -- Don't run twice
                if (hasHeader === undefined && subList && subText && subText.toLowerCase() !== 'find a station') {
                    splitArrayIntoEvenChunks(subList, index === 0 ? 3 : 2)
                        .forEach((listChunk, index) => {
                            if (!listChunk.length) {
                                return;
                            }
                            if (index === 0) {
                                newList.push({list: listChunk, text: subText, ...rest, hasHeader: !!subText});
                            } else {
                                newList.push({list: listChunk, hasHeader: false});
                            }
                        });
                } else {
                    newList.push({list: subList, text: subText, ...rest, hasHeader: !!subText});
                }
            });
            break;
          case 'more':
            list.map(({list: subList, text: subText, hasHeader, ...rest}) => {
                // if hasHeader is set, migration has already been run -- Don't run twice
                if (hasHeader === undefined && subText && subText.toLowerCase() === 'find us') {
                    splitArrayIntoEvenChunks(subList, 5)
                        .forEach((listChunk, index) => {
                            if (!listChunk.length) {
                                return;
                            }
                            if (index === 0) {
                                newList.push({list: listChunk, text: subText, ...rest, hasHeader: !!subText});
                            } else {
                                newList.push({list: listChunk, hasHeader: false});
                            }
                        });
                } else {
                    newList.push({list: subList, text: subText, ...rest, hasHeader: !!subText});
                }
            });
            break;
          default:
            return { list, text, ...rest, hasHeader: !!text };
        }
        return { list: newList, text, ...rest, hasHeader: !!text};
      } else {
        return { text, list, ...rest };
      }
  });

  return data;
}

function importComponent(payload) {
  return clayImport({
    payload,
    hostUrl: host,
    publish: true
  });
}

getComponentInstance()
  .then(logMessage('Retrieved default top-nav instance.'))
  .then(updateComponentInstance)
  .then(logMessage('Updated default top-nav instance.'))
  .then(importComponent)
  .catch(console.error);
