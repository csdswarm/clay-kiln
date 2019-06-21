<!-- Content Import Content -->
<template>
    <div class="content-import">
        <div class="content-import__input">
            <ui-textbox
                floating-label
                label="Import Content (Paste Full Url)"
                class="content-import__input-textbox"

                @keydown-enter="importContent"
                v-model="contentUrl"
            ></ui-textbox>
            <ui-icon-button icon="check" @click="importContent" tooltip="Import" tooltipPosition="top center"></ui-icon-button>
        </div>
        <div class="content-import__error">{{ error }}</div>
        <ui-progress-circular v-show="loading" :size="54"></ui-progress-circular>
    </div>
</template>

<script>
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
        methods: {
            async importContent() {
                this.error = '';
                this.loading = true;
                const includesProtocol = this.contentUrl.startsWith('http');

                const { host, pathname} = urlParse(`${includesProtocol ? '' : 'https://'}${this.contentUrl}`, {});

                try {
                    const [result] = await rest.post('/import-content', {domain: host, filter: {slug: pathname}});
                    if (result && result.success) {
                        window.location.href = `${window.location.protocol}//${window.location.hostname}${result.url}?edit=true`;
                    } else {
                        this.loading = false;
                        this.error = `This content failed to import.  Please log an error ticket with the error "${result.message}`
                    }
                } catch (e) {
                    this.loading = false;
                    this.error = 'An unexpected error has occurred.';
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

