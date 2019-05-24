<!-- Content Import Content -->
<template>
    <div class="content-import">
        <div class="content-import__input">
            <ui-textbox
                floating-label
                label="Import Content"
                placeholder="Import Url"
                class="content-import__input-textbox"

                v-model="contentUrl"
            ></ui-textbox>
            <ui-icon-button icon="check" @click="importContent"></ui-icon-button>
        </div>
        {{ contentUrl }}
    </div>
</template>

<script>
const UiIconButton = window.kiln.utils.components.UiIconButton;
const UiTextbox = window.kiln.utils.components.UiTextbox;

export default {
    data() {
        return {
            contentUrl: ''
        }
    },
    methods: {
        importContent() {
            console.log('contentUrl', this.contentUrl);
        }
    },
    components: {
        UiIconButton,
        UiTextbox
    }
}
</script>

