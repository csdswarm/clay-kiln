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
      <template v-else>
        <span v-if="item.useFilter">
          {{ $options.filters[item.useFilter](subscription[item.key]) }}
        </span>
        <span v-else-if="item.key === 'from_station_slug' && subscription[item.key] === ''">
          Radio.com (NATL-RC)
        </span>
        <span v-else>{{ subscription[item.key] }}</span>
      </template>
    </td>
    <!-- actions -->
    <td>
      <div class="row-actions">
        <ui-icon-button class="edit-subscription-btn" icon="edit" type="primary" color="primary" size="small" :loading="isLoading" @click="onEdit(subscription)" />
        <ui-icon-button class="delete-subscription-btn" icon="delete" type="primary" color="red" size="small" :loading="isLoading" @click="onDelete(subscription)" />
      </div>
    </td>
  </tr>
</template>

<script>
const { UiCollapsible, UiIconButton } = window.kiln.utils.components
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
    formatDate: utcDateStr => moment(utcDateStr).format('lll')
  },
  components: {
    UiIconButton,
    UiCollapsible
  }
}
</script>
