<!--  Brightcove Search -->
<docs>
    # Brightcove Search
</docs>
<template>
    <div class="brightcove-search">
        <ui-textbox
            floating-label
            :label="args.webLabel"
            name="brightcove-search"
            placeholder="Search Text"
            help="Use quotes to match whole phrases, and + to indicate required words or phrases"

            @input="populateSearchResults"
            v-model="query"
        ></ui-textbox>
        <div class="brightcove-search__date-range">
            <div class="ui-textbox__label-text">Last Updated: </div>
            <ui-datepicker
                error="Start date must be before end date"
                icon="events"
                placeholder="Start"

                :invalid="!validDateRange"

                @input="populateSearchResults"
                v-model="startDate"
            ></ui-datepicker>
            <ui-datepicker
                icon="events"
                placeholder="End"

                :invalid="!validDateRange"

                @input="populateSearchResults"
                v-model="endDate"
            ></ui-datepicker>
            <ui-button
                type="primary"
                @click="clearDateRange"
            >Clear</ui-button>
        </div>
        <div v-if="showResults" class="brightcove-search__search-results">
            <ul v-if="!loading">
                <li class="search-results__header">
                    <div>Brightcove Video Name</div><div>Updated On</div>
                </li>
                <li v-for="result in searchResults"
                    :key="result.id"
                    class="search-results__item"
                    @click="selectBrightcove(result)">
                    <div>{{ result.name }}</div><div>{{ new Date(result.updated_at).toLocaleDateString('en-US') }}</div>
                </li>
            </ul>
            <ui-progress-circular v-show="loading"></ui-progress-circular>
        </div>
        <div v-if="video.id" class="brightcove-video-preview">
            <div class="video-preview__info">
                <strong>{{video.name}}</strong>
                <i class="video-preview__id">ID: {{video.id}}</i>
            </div>
            <img class="video-preview__image" :src="video.imageUrl" />
        </div>
    </div>
</template>
<script>

    import axios from 'axios';

    const _debounce = require('lodash/debounce');
    const UiButton = window.kiln.utils.components.UiButton;
    const UiDatepicker = window.kiln.utils.components.UiDatepicker;
    const UiProgressCircular = window.kiln.utils.components.UiProgressCircular;
    const UiTextbox = window.kiln.utils.components.UiTextbox;

    export default {
        props: ['name', 'data', 'schema', 'args'],
        data() {
            return {
                video: {id: this.data},
                searchResults: [],
                loading: false,
                query: '',
                startDate: null,
                endDate: null
            };
        },
        computed: {
            params: function () {
                const {endDate, query, startDate} = this;
                if (endDate && startDate && endDate < startDate) {
                    return {query};
                }
                return {query, endDate, startDate};
            },
            showResults: function () {
                return this.loading || this.searchResults.length !== 0;
            },
            validDateRange: function () {
                return !this.endDate || !this.startDate || this.endDate > this.startDate;
            }
        },
        async created() {
            if (this.data) {
                try {
                    const results = await axios.get('/brightcove/search', {params: { query: this.data }});
                    if (results.data[0]) {
                        this.video = results.data[0];
                    }
                } catch (e) {
                    console.error('Error retrieving video info');
                }
            }
        },
        methods: {
            clearDateRange(event) {
                event.preventDefault();
                this.startDate = this.endDate = null;
                this.populateSearchResults();
            },
            debouncedPopulateSearchResults: _debounce(function() {
                const {query, endDate, startDate} = this.params

                if (query || endDate || startDate) {
                    axios.get('/brightcove/search', {params: {query, endDate, startDate}}).then(response => {
                        this.searchResults = response.data;
                        this.loading = false;
                    });
                } else {
                    this.searchResults = [];
                    this.loading = false;
                }
            }, 1000),
            populateSearchResults: function() {
                this.loading = true;

                this.debouncedPopulateSearchResults();
            },
            selectBrightcove(suggestion) {
                this.video = suggestion;
                this.searchResults = [];
                this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.video.id })
            }
        },
        components: {
            UiButton,
            UiDatepicker,
            UiProgressCircular,
            UiTextbox
        }
    }
</script>


