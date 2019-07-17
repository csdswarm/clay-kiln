'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const kilnInput = new KilnInput(schema);

  kilnInput.subscribe('UPDATE_COMPONENT', async ({data, fields}) => {
    if (['article', 'gallery'].includes(data.componentVariation) && fields.includes('feedImgUrl')) {
      const metaImageUri = kilnInput.getComponentInstances('meta-image')[0],
        metaImageData = await kilnInput.getComponentData(metaImageUri);

      if (!metaImageData.imageUrl) {
        metaImageData.imageUrl = data.feedImgUrl;
      }

      await kilnInput.saveComponent(metaImageUri, metaImageData);
    }
  });

  return schema;
};
