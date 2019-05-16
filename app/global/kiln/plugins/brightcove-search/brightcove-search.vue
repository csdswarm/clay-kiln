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
                v-model="selectedVideo"
            ></ui-autocomplete>
    </div>
</template>
<script>
    const UiAutocomplete = window.kiln.utils.components.UiAutocomplete;
    export default {
        props: ['name', 'data', 'schema', 'args'],
        data() {
            return {
                videoName: '',
                searchResults: ['something', 'something else'],
                selectedVideo: ''
            };
        },
        methods: {
            populateBrightcove() {
                console.log('this is where I need to do the search')
                console.log(this.selectedVideo);
            }
        },
        components: {
            UiAutocomplete
        }
    }
</script>


