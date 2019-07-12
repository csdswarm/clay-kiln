'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);
  let formURI;

  schema.video = new KilnInput(schema, 'video');
  schema.newVideo = new KilnInput(schema, 'newVideo');
  schema.updateVideo = new KilnInput(schema, 'updateVideo');
  schema.searchVideo = new KilnInput(schema, 'searchVideo');
  schema.autoplayUnmuted = new KilnInput(schema, 'autoplayUnmuted');
  schema.clickToPlay = new KilnInput(schema, 'clickToPlay');

  schema.clickToPlay.on('change', (value) => {
    if (value) {
      schema.autoplayUnmuted.value(false);
    }
  });

  schema.autoplayUnmuted.on('change', (value) => {
    if (value) {
      schema.clickToPlay.value(false);
    }
  });

  /* This field is set by searchVideo, newVideo or updateVideo
  * and should not be visible in editor settings
  */
  schema.video.hide();

  subscriptions.subscribe('UPDATE_FORMDATA', async input => {
    // set video if new video or search video was changed
    if (input.path === 'searchVideo' || input.path === 'newVideo' || input.path === 'updateVideo') {
      schema.video.value(input.data);

      console.log("Update form data.", input);
        
      try {
        if (input.path !== 'updateVideo') {
          // show newly selected video in update tab
          schema.updateVideo.value(input.data);
          schema.updateVideo.setProp('_has', { input: 'brightcove-update' });
          schema.updateVideo.hide();
          schema.updateVideo.show();

          /* 
            TODO: need to figure out how to trigger updated() or created() hook of update plugin 
            to reflect newly selected video when searchVideo or newVideo is set. 
            Changing updateVideo's value through kilnjs's value() method does not trigger updated() hook / vuex state change. 
            Using UPDATE_FORMDATA event or kilnjs reRenderInstance() also does not trigger lifecycle hook change.
          */
          // const instanceData = await subscriptions.getComponentData(formURI);

          // subscriptions.saveComponent(formURI, { ...instanceData, video: input.data });
          // subscriptions.reRenderInstance(formURI); // does not rerender input, doesnt trigger hook in updateVideo plugin
        }
      } catch(e) {console.log(e);}
    }
  });

  subscriptions.subscribe('OPEN_FORM', ({uri}) => {
    // set updateVideo input and value if video exists
    const video = schema.video.value(),
      bc = document.querySelector(`[data-uri="${uri}"]`);

    formURI = uri;

    if (!bc.closest('.lead')) {
      schema.autoplayUnmuted.hide();
      schema.clickToPlay.hide();
    } else {
      schema.autoplayUnmuted.show();
      schema.clickToPlay.show();
    }

    if (video) {
      schema.updateVideo.value(video);
      schema.updateVideo.setProp('_has', { input: 'brightcove-update' });
    }
  });

  return schema;
};
