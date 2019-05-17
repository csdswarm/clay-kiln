<!--  Brightcove Search -->
<docs>
    # Brightcove Search
</docs>
<template>
    <div class="brightcove-search">
        <div v-if="video.id" class="brightcove-video-preview">
            <div class="brightcove-video-preview__info">
                <strong>{{video.name}}</strong>
                <i>{{video.id}}</i>
            </div>
            <img class="brightcove-video-preview__image" :src="video.imageUrl" />
        </div>
        <ui-autocomplete
            floating-label
            :label="args.webLabel"
            name="brightcove-search"
            placeholder="Search"
            :keys="keys"

            :suggestions="searchResults"
            @input="populateSearchResults"
            @select="selectBrightcove"
            v-model="query"
        ></ui-autocomplete>
    </div>
</template>
<script>

    import axios from 'axios';

    const UiAutocomplete = window.kiln.utils.components.UiAutocomplete;
    export default {
        props: ['name', 'data', 'schema', 'args'],
        data() {
            return {
                video: {id: this.data},
                searchResults: [],
                keys: {
                  label: 'name',
                  value: 'id'
                },
                query: ''
            };
        },
        async created() {
            if (this.data) {
                try {
                    const results = await axios.get('/brightcove/search', {params: { query: this.data }});
                    this.video = results.data[0];
                } catch (e) {
                    console.error('Error retrieving video infor');
                }
            }
        },
        methods: {
            populateSearchResults() {
                const params = {query: this.query};
                
                axios.get('/brightcove/search', {params}).then(response => {
                    this.searchResults = response.data;
                    console.log('Results:', this.searchResults.length);
                });
            },
            selectBrightcove(suggestion) {
                this.video = suggestion;
                this.query = ''
                this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.video.id })
            }
        },
        components: {
            UiAutocomplete
        }
    }
</script>


