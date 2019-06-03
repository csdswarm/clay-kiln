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
              :help="'Select station(s) to syndicate out to'"
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
                return this.selectedStation || [];
            },
        },
        methods: {
            /**
             *  This function is both called when the component is mounted and when the "Search for a station" filter is modified.
             *  It queries the api.radio.com for stations and sets them as selectable.
             *  @param {boolean} reselect - Whether this invocation should undo any current station selection
             */
            async populateStations(reselect = true) {
                try {
                    if (reselect) {
                        console.log("reset selections");
                        this.selectedStation = [];
                    }
                    if (this.cachedResults[this.filter]) {
                        this.stationOptions = this.cachedResults[this.filter];
                    } else {
                        let apiRequest = 'https://api.radio.com/v1/stations?page[size]=1000&sort=name';

                        if (this.filter && this.filter.length) {
                            apiRequest += `&q=${encodeURIComponent(this.filter)}`;
                        }

                        const stationsResponse = await radioApi.get(apiRequest);

                        if (stationsResponse) {
                            this.stationOptions = stationsResponse.data.map(station => {
                                return station.attributes.name;
                            });
                            this.cachedResults[this.filter] = this.stationOptions;
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            },
            /**
             *  This function is called when a station is selected from the dropdown. Sets it as currently selected.
             * @param {Object} input
             */
            updateSelectedStation(input) {
                try {
                    this.selectedStation = input;
                    this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedStation })
                } catch (e) {
                    console.log("error updating selection: ", e);
                }
            },
        },
        components: {
            UiSelect,
            UiTextbox
        }
    }
</script>
