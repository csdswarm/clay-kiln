<template>
    <div class="valid-source filterable-list">
        <div class="filterable-list-input">
            <ui-textbox
                    floating-label
                    label="Search Source Terms"
                    class="valid-source__input-textbox"
                    v-model="filter"
                    :disabled="loading"
            ></ui-textbox>
        </div>
        <div class="filterable-list-headers">
            <span class="filterable-list-header filterable-list-header-title">Source terms</span>
            <span class="filterable-list-header filterable-list-header-action">Action</span>
        </div>
        <div class="filterable-list-readout">
            <ul class="filterable-list-readout-list">
                <li class="filterable-list-item"
                    v-for="item in items">
                    <div class="filterable-list-item-child">
                        <ui-textbox
                                class="valid-source__input-textbox"
                                :value="item"
                                @input="handleInput"
                                @blur="updateItem(item)"
                                :disabled="loading"
                        ></ui-textbox>

                        <ui-icon-button
                                icon="delete"
                                class="filterable-list-item-child-secondary-action"
                                tooltip="Remove this item"
                                tooltipPosition="top center"
                                @click="removeItem(item)"
                                :disabled="loading"
                        ></ui-icon-button>
                    </div>
                </li>
            </ul>
            <ui-progress-circular v-show="loading"></ui-progress-circular>
        </div>
        <div class="filterable-list-add">
            <ul class="filterable-list-readout-list">
                <li class="filterable-list-item">
                    <div class="filterable-list-item-child">
                        <ui-textbox
                                floating-label
                                label="Add Source Term"
                                class="valid-source__input-textbox"
                                v-model="newItem"
                                :disabled="loading"
                        ></ui-textbox>

                        <ui-icon-button
                                icon="add"
                                class="filterable-list-item-child-secondary-action"
                                @click="addItem"
                                tooltip="Add Source Term"
                                tooltipPosition="top center"
                                :disabled="loading"
                        ></ui-icon-button>
                    </div>
                </li>
            </ul>
        </div>

        <div v-if="error" class="valid-source__error">
            {{ error }}
        </div>
    </div>
</template>

<script>
  import rest from '../../../universal/rest';

  const UiIconButton = window.kiln.utils.components.UiIconButton;
  const UiTextbox = window.kiln.utils.components.UiTextbox;
  const UiProgressCircular = window.kiln.utils.components.UiProgressCircular;

  const REQUEST = {
    GET: {
      verb: 'get',
      method: 'get'
    },
    ADD: {
      verb: 'add',
      method: 'post'
    },
    UPDATE: {
      verb: 'update',
      method: 'put'
    },
    REMOVE: {
      verb: 'remove',
      method: 'delete'
    }
  };

  export default {
    components: {
      UiIconButton,
      UiTextbox,
      UiProgressCircular
    },
    data() {
      return {
        inputValue: '',
        newItem: '',
        data: [],
        error: '',
        loading: false,
        filter: ''
      }
    },
    computed: {
      items() {
        return this.data.filter(item => !this.filter || item.includes(this.filter))
      }
    },
    methods: {
      /**
       * keep track of the current input being modified
       *
       *  @param {string} value
       */
      handleInput(value) {
        this.inputValue = value;
      },
      /**
       * calls the valid scripts endpoint to add an item
       *
       * @param {object} action
       * @param {object} [data]
       *
       */
      async request(action, data) {
        this.error = '';

        this.loading = true;

        try {
          const results = await rest[action.method]('/valid-source', data);

          if (results && results.items) {
            this.data = results.items;
          } else {
            this.error = `Failed to ${ action.verb } the item "${ results.message }"`;
          }
        } catch (e) {
          this.error = `An unexpected error has occurred. ${e}`;
        }

        this.loading = false;
      },
      /**
       * calls the valid scripts endpoint to add an item
       */
      async addItem() {
        if (!this.newItem) {
          this.error = 'Please enter an item.';

          return;
        }

        document.getElementsByClassName('filterable-list-item')[0].scrollIntoView();

        await this.request(REQUEST.ADD, { item: this.newItem });

        if (!this.error) {
          this.newItem = '';
        }
      },
      /**
       * calls the valid scripts endpoint to remove an item
       */
      async removeItem(item) {
        await this.request(REQUEST.REMOVE, { item });
      },
      /**
       * calls the valid scripts endpoint to update an item
       */
      async updateItem(oldItem) {
        if (this.inputValue) {
          const newItem = this.inputValue;

          this.inputValue = '';

          this.data = this.data.map(item => item === oldItem ? newItem : item);

          await this.request(REQUEST.UPDATE, { old: oldItem, new: newItem });
        }
      }
    },
    /**
     * populate the items
     */
    async mounted() {
      await this.request(REQUEST.GET);
    }
  }
</script>
