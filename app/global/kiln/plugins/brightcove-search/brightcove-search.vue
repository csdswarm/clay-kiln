<!--  Brightcove Search -->
<docs>
    # Brightcove Search
</docs>
<template>
    <div class="brightcove-search">
            <ui-autocomplete
                floating-label
                label="Brightcove Search"
                name="brightcove-search"
                placeholder="Search"

                :suggestions="searchResults"
                @input="populateBrightcove"
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
                videoName: '',
                searchResults: ['something', 'something else'],
                query: ''
            };
        },
        methods: {
            populateBrightcove() {
                const params = {query: this.query};
                
                axios.get('/brightcove/search', {params}).then(response => {
                    console.log(response);
                });
            }
        },
        components: {
            UiAutocomplete
        }
    }
</script>


