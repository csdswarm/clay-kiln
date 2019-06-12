<!-- Content Import Content -->
<template>
    <div class="content-import">
        <div class="content-import__input">
            <ui-textbox
                floating-label
                label="Import Content"
                placeholder="Import Url"
                class="content-import__input-textbox"

                @keydown-enter="importContent"
                v-model="contentUrl"
            ></ui-textbox>
            <ui-icon-button icon="check" :disabled="!valid" @click="importContent" :tooltip="tooltipText" tooltipPosition="top center"></ui-icon-button>
        </div>
        <div class="content-import__error">{{ error }}</div>
        <ui-progress-circular v-show="loading" :size="54"></ui-progress-circular>
    </div>
</template>

<script>
    import contentImport from '../../../client/contentImportApi';
    import rest from '../../../universal/rest';
    import urlParse from 'url-parse';

    const UiIconButton = window.kiln.utils.components.UiIconButton;
    const UiProgressCircular = window.kiln.utils.components.UiProgressCircular;
    const UiTextbox = window.kiln.utils.components.UiTextbox;

    export default {
        data() {
            return {
                contentUrl: '',
                error: '',
                loading: false
            }
        },
        computed: {
            tooltipText: function () {
                return !this.valid ? 'Must be valid radio.com url' : 'Import';
            },
            valid: function () {
                return this.contentUrl.includes('radio.com');
            }
        },
        methods: {
            async importContent() {
                this.error = '';
                this.loading = true;
                const { host, pathname} = urlParse(this.contentUrl);

                try {
                    const [result] = await rest.post('/import-content', {domain: host, filter: {slug: pathname}});
                    if (result && result.success) {
                        window.location.href = `${window.location.protocol}//${window.location.hostname}${result.url}`;
                    }
                } catch (e) {
                    this.loading = false;
                    this.error = 'There was an error importing this content.  Please try again.';
                }
            }
        },
        components: {
            UiIconButton,
            UiProgressCircular,
            UiTextbox
        }
    }
</script>

