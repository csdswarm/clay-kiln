<!-- Station(s) Select-->
<docs>
  # Station(s) Select
</docs>
<template>
  <div class="station-select">
    <div v-if="stationOptions && stationOptions.length">
      <ui-select
        :placeholder="'Select Station(s)'"
        :hasSearch="true"
        :help="'Select station(s) to syndicate out to. You may search within the dropdown as well.'"
        :multiple="true"
        :options="stationOptions"
        :value="value"
        :disabled="disabled"
        @input="updateSelectedStation"
        @select="onStationSelected"/>
      <div class="station-select__sectionfronts">
        <div v-for="(sectionFronts, slug) in stationSectionFronts" class="station-select__sectionfronts--group">
          <h4 class="station-select__sectionfronts--title">{{ sectionFronts.name }}</h4>
          <ui-select
                  :placeholder="'Primary Section Front'"
                  :hasSearch="true"
                  :options="sectionFronts.primaryOptions"
                  :value="sectionFronts.selectedPrimary"
                  @input="updateSectionFront(slug, 'selectedPrimary', ...arguments)"/>
          <ui-select
                  :placeholder="'Secondary Section Front'"
                  :hasSearch="true"
                  :options="sectionFronts.secondaryOptions"
                  :value="sectionFronts.selectedSecondary"
                  @input="updateSectionFront(slug, 'selectedSecondary', ...arguments)"/>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import _ from 'lodash';
  const { retrieveList } = require('../../../../services/client/lists');
  const { setImmutable, updateImmutable } = require('../../../../services/universal/utils');
  const { DEFAULT_STATION } = require('../../../../services/universal/constants');

  const UiSelect = window.kiln.utils.components.UiSelect;

  export default {
    props: ['name', 'data', 'schema', 'args', 'disabled'],
    data() {
      return {
        stationSectionFronts: {},
        selectedStations: this.transformFromSaveData(),
        stationOptions: this.initOptions()
      };
    },
    computed: {
      value() {
        return this.selectedStations || [];
      },
    },
    methods: {
      initOptions() {
        return _.chain(window.kiln.locals.stationsIHaveAccessTo)
          .values()
          .map(station => ({
            label: `${station.name} | ${station.callsign}`,
            value: station.slug,
          }))
          .sortBy('label')
          .value();
      },
      /**
       * Called to transform our saved data into usable data for this component.
       */
      transformFromSaveData() {
        return (this.data || [])
          .map(syndication => {
            const station = Object.values(window.kiln.locals.stationsIHaveAccessTo).find(station => station.callsign === syndication.callsign);

            if (station) {
              const option = {
                label: `${station.name} | ${station.callsign}`,
                value: station.slug
              };

              // load section front info
              this.renderSectionFronts(station.slug, option.label, syndication.sectionFront, syndication.secondarySectionFront);

              return option;
            } else {
              // if we dont have access to this station, it must have been set by someone else with permission. keep it as is.
              return syndication;
            }
          });
      },
      /**
       * Called to transform our component's data in order to be properly saved.
       */
      transformToSaveData() {
        return this.selectedStations
          .map(({ value }) => {
            const station = window.kiln.locals.stationsIHaveAccessTo[value];

            if (station) {
              const sectionFront = this.stationSectionFronts[value];

              return {
                stationSlug: value,
                callsign: station.callsign,
                sectionFront: _.get(sectionFront, 'selectedPrimary.value'),
                secondarySectionFront: _.get(sectionFront, 'selectedSecondary.value')
              };
            } else {
              // if we dont have access to this station, it must have been set by someone else with permission. keep it as is.
              return value;
            }
          });
      },
      /**
       *  This function is called when a station is selected from the dropdown. Sets it as currently selected.
       * @param {Array<Object>} input
       */
      updateSelectedStation(input) {
        try {
          this.selectedStations = input;
          this.commit();
        } catch (e) {
          console.error('Error committing selected stations:', e);
        }
      },
      /**
       * Updates the form data.
       */
      commit() {
        this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.transformToSaveData() });
      },
      /**
       * Immutably updates a section front's property. Called when a section front is selected from a dropdown.
       * @param {string} stationSlug
       * @param {string} property
       * @param {any} value
       */
      updateSectionFront(stationSlug, property, value) {
        this.stationSectionFronts = setImmutable(this.stationSectionFronts, [stationSlug, property], value);

        this.commit();
      },
      /**
       * Checks if a station is selected by slug.
       * @param {string} slug
       */
      isStationSelected(slug) {
        return this.selectedStations.some(selection => selection.value === slug);
      },
      /**
       * Tries to load and render the section front options for a station.
       * @param {string} slug
       * @param {string} label
       * @param {string} [selectedPrimary]
       * @param {string} [selectedSecondary]
       */
      async renderSectionFronts(slug, label, selectedPrimary, selectedSecondary) {
        const transformSectionFronts = sectionFronts => sectionFronts.map(sf => ({
          label: sf.name,
          value: sf.value
        }));
        const findSectionFrontOption = (value, options) => options.find(o => o.value === value);

        let listPrefix = '';

        if (slug !== DEFAULT_STATION.site_slug) {
          listPrefix = `${slug}-`;
        }

        const [primarySectionFronts, secondarySectionFronts] = await Promise.all([
          retrieveList(`${listPrefix}primary-section-fronts`, true),
          retrieveList(`${listPrefix}secondary-section-fronts`, true),
        ]);

        if (this.isStationSelected(slug)) {
          const partial = {
            name: label,
            primaryOptions: transformSectionFronts(primarySectionFronts),
            secondaryOptions: transformSectionFronts(secondarySectionFronts)
          };

          if (selectedPrimary) {
            partial.selectedPrimary = findSectionFrontOption(selectedPrimary, partial.primaryOptions);
          }

          if (selectedSecondary) {
            partial.selectedSecondary = findSectionFrontOption(selectedSecondary, partial.secondaryOptions);
          }

          this.stationSectionFronts = updateImmutable(this.stationSectionFronts, slug, sf => ({
            ...sf,
            ...partial
          }));
        }
      },
      /**
       * Called when a station is checked or unchecked.
       * @param {Object} option
       * @param {Object} state
       */
      async onStationSelected(option, state) {
        if (state.selected) {
          this.renderSectionFronts(option.value, option.label);
        } else {
          this.stationSectionFronts = _.omit(this.stationSectionFronts, option.value);
        }
      }
    },
    components: {
      UiSelect
    }
  }
</script>
