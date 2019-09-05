<!-- Brightcove Ad Config -->
<docs>
    # Brightcove Ad Config
</docs>
<template>
    <div class="brightcove-adconfig">
        <div v-if="adConfigOptions && adConfigOptions.length">
            <ui-select
                    :placeholder="'Select Brightcove Ad Config'"
                    :hasSearch="true"
                    :help="'Select the Brightcove Ad Config you wish to use. You may search within the dropdown as well.'"
                    :options="adConfigOptions"
                    :value="value"
                    @input="updateSelectedAdConfig"
            >
            </ui-select>
        </div>
    </div>
</template>
<script>
    import axios from 'axios';

    const UiSelect = window.kiln.utils.components.UiSelect,
        log = require('../../../../services/universal/log').setup({file: __filename});

    export default {
        props: ['name', 'data', 'schema', 'args'],
        data() {
            return {
                selectedAdConfig: this.data,
                adConfigOptions: null
            };
        },
        mounted () {
            this.populateAdConfigs()
        },
        computed: {
            value() {
                return this.adConfigOptions
                    ? this.adConfigOptions.find(opt => opt.value === this.selectedAdConfig)
                    : null;
            },
        },
        methods: {
            /**
             *  This function is called when the component is mounted.
             *  It queries Brightcove for a list of ad configurations and sets them as selectable.
             */
            populateAdConfigs() {
                axios.get('/brightcove/adconfigs').then(({ status, data }) => {
                    if (status === 200 && data) {
                        const options = data.map(config => ({
                            label: config.name,
                            value: config.id
                        }));

                        this.adConfigOptions = options;

                        if (!this.data && options.length) {
                            this.updateSelectedAdConfig(options[0]);
                        }
                    }
                }).catch(e => {
                    log('error', 'Unable to fetch Brightcove ad configs.', e);
                });
            },
            /**
             *  This function is called when an ad configuration is selected from the dropdown. Sets it as currently selected.
             * @param {Object} input
             */
            updateSelectedAdConfig(input) {
                try {
                    this.selectedAdConfig = input.value;
                    this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedAdConfig });
                } catch (e) {}
            },
        },
        components: {
            UiSelect
        }
    }
</script>
