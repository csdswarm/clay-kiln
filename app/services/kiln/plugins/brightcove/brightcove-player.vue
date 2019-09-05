<!-- Brightcove Player -->
<docs>
    # Brightcove Player
</docs>
<template>
    <div class="brightcove-player">
        <div v-if="playerOptions && playerOptions.length">
            <ui-select
                    :placeholder="'Select Brightcove Player'"
                    :hasSearch="true"
                    :help="'Select the Brightcove Player you wish to use. You may search within the dropdown as well.'"
                    :options="playerOptions"
                    :value="value"
                    @input="updateSelectedPlayer"
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
                selectedPlayer: this.data,
                playerOptions: null
            };
        },
        mounted () {
            this.populatePlayers()
        },
        computed: {
            value() {
                return this.playerOptions
                    ? this.playerOptions.find(opt => opt.value === this.selectedPlayer)
                    : null;
            },
        },
        methods: {
            /**
             *  This function is called when the component is mounted.
             *  It queries the Brightcove Player Management API for a list of players and sets them as selectable.
             */
            populatePlayers() {
                axios.get('/brightcove/players').then(({ status, data }) => {
                    if (status === 200 && data) {
                        const options = data.map(player => ({
                            label: player.name,
                            value: player.id
                        }));

                        this.playerOptions = options;

                        if (!this.data && options.length) {
                            this.selectedPlayer = options[0].value;
                        }
                    }
                }).catch(e => {
                    log('error', 'Unable to fetch Brightcove players.', e);
                });
            },
            /**
             *  This function is called when a player is selected from the dropdown. Sets it as currently selected.
             * @param {Object} input
             */
            updateSelectedPlayer(input) {
                try {
                    this.selectedPlayer = input.value;
                    this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedPlayer });
                } catch (e) {}
            },
        },
        components: {
            UiSelect
        }
    }
</script>
