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
            <ui-icon-button icon="check" @click="importContent"></ui-icon-button>
        </div>
        {{ contentUrl }}
    </div>
</template>

<script>
import contentImport from '../../../client/contentImportApi';

const UiIconButton = window.kiln.utils.components.UiIconButton;
const UiTextbox = window.kiln.utils.components.UiTextbox;

export default {
    data() {
        return {
            contentUrl: ''
        }
    },
    methods: {
        async importContent() {
            const result = await contentImport(this.contentUrl);
            if (result) {
                window.location.href = `${result}?edit=true`;
            }
        }
    },
    components: {
        UiIconButton,
        UiTextbox
    }
}
</script>

