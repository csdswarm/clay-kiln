<!-- Station(s) Select-->
<docs>
    # Station(s) Select
</docs>
<template>
    <div class="station-select">
        <div class="ui-textbox__input">
            <ui-textbox
              v-model="filter"
              :placeholder="'Search for a station'"
              @input="populateStations"
            />
        </div>
        <div v-if="stationOptions && stationOptions.length">
            <ui-select
              :placeholder="'Select Station(s)'"
              :hasSearch="true"
              :help="'Select multiple by holding down cmd or ctl key'"
              :multiple="true"
              :options="stationOptions"
              :value="value"
              @input="updateSelectedStation"
            >
            </ui-select>
        </div>
    </div>
</template>
<script>
    const radioApi = require('../../../../services/client/radioApi'),
      UiSelect = window.kiln.utils.components.UiSelect,
      UiTextbox = window.kiln.utils.components.UiTextbox;

    export default {
        props: ['name', 'data', 'schema', 'args'],
        data() {
            return {
                cachedResults: {},
                filter: '',
                selectedStation: this.data,
                stationOptions: null
            };
        },
        mounted () {
            this.populateStations(false)
        },
        computed: {
            value() {
                return this.selectedStation ?  this.selectedStation : { label: 'Select a station...'  }
            },
        },
        methods: {
            /**
             *  This function is both called when the component is mounted and when the "Search for a station" filter is modified.
             *  It queries the api.radio.com for stations and sets them as selectable.
             *  @param {boolean} reselect - Whether this invocation should undo any current station selection
             */
            async populateStations(reselect = true) {
                console.log(radioApi.get);
                try {
                    if (reselect) {
                        this.selectedStation = null;
                    }
                    const self = this;
                    if (self.cachedResults[self.filter]) {
                        self.stationOptions = self.cachedResults[self.filter];
                    } else {
                        let apiRequest = 'https://api.radio.com/v1/stations?page[size]=1000&sort=name';

                        if (self.filter && self.filter.length) {
                            apiRequest += `&q=${encodeURIComponent(self.filter)}`;
                        }

                        const stationsResponse = await radioApi.get(apiRequest);
                        console.log('response', stationsResponse)
                        
                        if (stationsResponse) {
                            self.stationOptions = stationsResponse.data.map(station => {
                                return {
                                    label: station.attributes.name,
                                    value: station.attributes.name,
                                    slug: station.attributes.slug,
                                    site_slug: station.attributes.site_slug,
                                    id: station.attributes.id,
                                    name: station.attributes.name,
                                    callsign: station.attributes.callsign,
                                }
                            });
                            self.cachedResults[self.filter] = self.stationOptions
                        }
                    }
                    console.log(self);
                } catch (e) {
                    console.log(e);
                }
            },

            /**
             *  This function is called when a station is selected from the dropdown. Sets it as currently selected.
             * @param {Object} input
             */
            updateSelectedStation(input) {
                this.selectedStation = input;
                this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedStation })
            },
        },
        components: {
            UiSelect,
            UiTextbox
        }
    }
</script>
