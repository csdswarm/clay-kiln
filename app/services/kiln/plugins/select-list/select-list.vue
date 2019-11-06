<!-- Select List -->
<docs>
    # Select List
</docs>
<template>
    <div class="select-list">
        <ui-select
            :label="label"
            floatingLabel="true"
            :options="listOptions"
            :value="selected"
            @input="handleInput"
        ></ui-select>
    </div>
</template>
<script>
    const _get = require('lodash/get');
    const UiSelect = window.kiln.utils.components.UiSelect;

    export default {
        props: ['name', 'data', 'schema', 'args'],
        data() {
            return {
                label: this.schema._label,
                listOptions: [],
                selected: this.data || ''
            };
        },
        mounted() {
            if (this.args.list) {
                this.fetchListItems().then((listItems) => {
                    this.listOptions = listItems.map(i => i.text);
                }).catch(() => {
                    log.error(`Error getting list for ${this.args.list}`);
                });
            }
        },
        methods: {            
            fetchListItems() {
                const listName = this.args.list,
                list = _get(this, `$store.state.lists['${listName}']`, {});

                let promise;

                if (list.items && !list.isLoading && !list.error) {
                    promise = Promise.resolve(list.items);
                } else {
                    promise = this.$store.dispatch('getList', listName).then(() => _get(this, `$store.state.lists['${listName}'].items`, []));
                }

                return promise;
            },
            handleInput(data) {
                this.selected = data;
                this.$store.commit('UPDATE_FORMDATA', { path: this.name, data });
            },
        },
        components: {
            UiSelect
        }
    }
</script>
