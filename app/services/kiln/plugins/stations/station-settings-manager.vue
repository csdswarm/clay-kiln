<!-- Station Settings Manager -->
<template>
  <div class="station-settings-manager">

    <div class="station-settings-manager__content">
      <h3 class="station-settings-manager__main-title">
        <div class="station-settings-manager__img-wrap">
          <img :src="stationLogo" :alt="stationName">
        </div>
        <div class="station-settings-manager__title-text">
          {{ stationName }}
          <small> &mdash; Station Settings:</small>
        </div>
      </h3>

      <ui-tabs class="station-settings-manager__tabs" fullwidth>
        <ui-tab selected id="theme" title="Theme Settings">
          <StationTheme :station-name="stationName" />
        </ui-tab>
        <ui-tab id="settings" title="Other Settings">
          <StationSettings :station-name="stationName" :station-logo="stationLogo" />
        </ui-tab>
      </ui-tabs>
    </div>

  </div>
</template>

<script>
  const {
      UiCheckbox,
      UiTabs,
      UiTab
    } = window.kiln.utils.components,
    StationTheme = require('./station-theme.vue'),
    StationSettings = require('./station-settings.vue'),
    {
        name: stationName,
        square_logo_large: stationLogo
    } = window.kiln.locals.stationForPermissions

  console.log('[window.kiln.locals.stationForPermissions]', window.kiln.locals.stationForPermissions.square_logo_large);

  export default {
    data() {
      return {
        stationName,
        stationLogo
      }
    },
    components: {
      StationSettings,
      StationTheme,
      UiTabs,
      UiTab
    }
  }
</script>