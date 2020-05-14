<template>
  <tr>
    <td v-for="(item, configIndex) in config" :key="configIndex">
      <!-- filter -->
      <template v-if="item.key === 'filter'">
        <ui-collapsible :title="item.propOrder[0] +': '+ subscription[item.key][item.propOrder[0]]">
          <ol class="filterList">
            <li class="filterList-item" v-for="(key) in item.propOrder" :set="value = subscription[item.key][key]" :key="key">
              <div class="filterList-item-key">{{ key }}: <span class="filterList-item-value">{{ value }}</span></div>

            </li>
          </ol>
        </ui-collapsible>
      </template>
      <!-- /filter -->
      <template v-else="">
        <span v-if="item.useFilter">
          {{ $options.filters[item.useFilter](subscription[item.key]) }}
        </span>
        <span v-else>{{ subscription[item.key] }}</span>
      </template>
    </td>
    <!-- actions -->
    <td>
      <ui-button class="edit-subscription-btn" type="primary" color="primary" size="small" :loading="isLoading" @click="onEdit(subscription)">Edit</ui-button>
      <ui-button class="delete-subscription-btn" type="primary" color="red" size="small" :loading="isLoading" @click="onDelete(subscription)">Delete</ui-button>
    </td>
  </tr>
</template>

<script>
const { UiButton, UiCollapsible } = window.kiln.utils.components
const moment = require('moment')

export default {
  props: [
    'subscription', 'config', 'isLoading'
  ],
  methods: {
    onEdit (subscription) {
      this.$emit('editSubscriptionRow', subscription)
    },
    onDelete (subscription) {
      this.$emit('deleteSubscriptionRow', subscription)
    }
  },
  filters: {
    formatDate: utcDateStr => moment(utcDateStr).format('llll')
  },
  components: {
    UiButton,
    UiCollapsible
  }
}
</script>

<style lang="scss">
</style>
