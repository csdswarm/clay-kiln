'use strict';

const splitArrayIntoEvenChunks = (arr, chunkCount) => {
  const chunks = [];

  for (let i = chunkCount; i > 0; i--) {
    chunks.push(arr.splice(0, Math.ceil(arr.length / i)));
  }

  return chunks;
};

module.exports['1.0'] = async (uri, data) => {
  // eslint-disable-next-line no-unused-vars
  data.headerLinks = data.headerLinks.map(({ text, list, hasHeader: removing, ...rest }) => {
    if (list) {
      const newList = [];

      switch (text) {
        case 'music':
        case 'news':
        case 'sports':
          list.map(({ list: subList, text: subText, hasHeader, ...rest }, index) => {
            // if hasHeader is set, migration has already been run -- Don't run twice
            if (hasHeader === undefined && subList && subText && subText.toLowerCase() !== 'find a station') {
              splitArrayIntoEvenChunks(subList, index === 0 ? 3 : 2)
                .forEach((listChunk, index) => {
                  if (!listChunk.length) {
                    return;
                  }
                  if (index === 0) {
                    newList.push({ list: listChunk, text: subText, ...rest, hasHeader: !!subText });
                  } else {
                    newList.push({ list: listChunk, hasHeader: false });
                  }
                });
            } else {
              newList.push({ list: subList, text: subText, hasHeader: !!subText, ...rest });
            }
          });
          break;
        case 'more':
          list.map(({ list: subList, text: subText, hasHeader, ...rest }) => {
            // if hasHeader is set, migration has already been run -- Don't run twice
            if (hasHeader === undefined && subText && subText.toLowerCase() === 'find us') {
              splitArrayIntoEvenChunks(subList, 5)
                .forEach((listChunk, index) => {
                  if (!listChunk.length) {
                    return;
                  }
                  if (index === 0) {
                    newList.push({ list: listChunk, text: subText, ...rest, hasHeader: !!subText });
                  } else {
                    newList.push({ list: listChunk, hasHeader: false });
                  }
                });
            } else {
              newList.push({ list: subList, text: subText, hasHeader: !!subText, ...rest });
            }
          });
          break;
        default:
          return { list, text, ...rest };
      }
      return { list: newList, text, ...rest };
    } else {
      return { text, list, ...rest };
    }
  });

  return data;
};
