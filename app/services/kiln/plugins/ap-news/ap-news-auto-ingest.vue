<template>
  <div class="ap-news-auto-ingest">
    <h1>AP News Subscriptions</h1>
    <ui-button class="add-subscription-btn" color="primary" @click="onCreate" icon="add" :loading="isLoading" size="normal">Add AP News Subscription</ui-button>
    <table class="subscriptions" cellspacing="1" v-if="subscriptions.length">
      <thead>
        <th v-for="(config, index) in tableHeaders" :key="index">
          <td>{{ config.display }}</td>
        </th>
      </thead>
      <tbody>
        <tr v-for="(subscription, index) in subscriptions" :key="index">
          <td>{{ getStation(subscription) }}</td>
          <td>
            <ui-collapsible :title="getFirstItemValue(subscription)">
              <ol class="entitlements-list">
                <li v-for="(entitlement, eindex) in subscription.data.entitlements" :key="eindex">
                  {{ entitlement.name }}
                </li>
              </ol>
            </ui-collapsible>
          </td>
          <td>
            <ui-collapsible :title="getFirstItemValue(subscription, 'mappings[0].sectionFront')">
              <ol class="mappings-list">
                <li v-for="(mapping, mindex) in subscription.data.mappings" :key="mindex">
                  <div class="mapping">
                    <div class="mapping-item">Primary SF: {{ mapping.sectionFront }}</div>
                    <div class="mapping-item">Secondary SF: {{ mapping.secondarySectionFront }}</div>
                  </div>
                </li>
              </ol>
            </ui-collapsible>
          </td>
          <td>
            <div class="row-actions">
              <ui-icon-button class="edit-subscription-btn" icon="edit" type="primary" color="primary" size="small" :loading="isLoading" @click="onEdit(subscription)" />
              <ui-icon-button class="delete-subscription-btn" icon="delete" type="primary" color="red" size="small" :loading="isLoading" @click="onDelete(subscription)" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- subscription modal -->
    <ui-modal ref="subscriptionModal" title="New AP Subscription"  size="large">
        <form action="">
          <h2>Station &amp; Entitlements</h2>
          <fieldset class="station-entitlements-feildset">
            <div role="group">
              <!-- station -->
              <ui-select
                class="station-slug"
                has-search
                label="Station"
                placeholder="Radio.com (NATL-RC)"
                :options="options.stations"
                v-model="workingSubscription.data.station"
                @input="onStationChange"
              ></ui-select>
              <ui-select
                class="entitlements"
                has-search
                label="Entitlements"
                multiple="true"
                :keys="options.entitlementKeys"
                :options="entitlements"
                :invalid="isEntitlementsInvalid"
                placeholder="Select at least ONE enetitlement"
                v-model="workingSubscription.data.entitlements"
              ></ui-select>
            </div>
          </fieldset>
          <!-- mappings -->
          <h2>Mapping</h2>
          <fieldset class="mapping-feildset" v-for="(mapping, index) in workingSubscription.data.mappings" :key="index">
            <div role="group" class="flex-group">
              <!-- primary -->
              <ui-select
                has-search
                label="Primary Section Front"
                placeholder="Select Primary Section Front to Include"
                ref="primarySectionFrontInput"
                :options="primarySectionFronts.map(psf => psf.name)"
                :invalid="isPrimarySectionfrontsInvalid"

                v-model="workingSubscription.data.mappings[index].sectionFront"
              ></ui-select>
              <!-- secondary -->
              <ui-select
                has-search
                label="Secondary Section Front"
                placeholder="Select Secondary Section Front to Include"
                ref="secondarySectionFrontInput"
                :options="secondarySectionFronts.map(essf => essf.name)"

                v-model="workingSubscription.data.mappings[index].secondarySectionFront"
              ></ui-select>
            </div>
          </fieldset>
          <div class="add-mapping">
            <ui-button @click="addMapping" tooltip="Disabled until categories are implemented" :disabled="true">Add Mapping</ui-button>
          </div>
        </form>
        <!-- <pre>{{ workingSubscription }}</pre> -->
        <div slot="footer">
          <template v-if="modalMode === 'new'">
            <ui-button color="primary" @click="createApNewsSubscription" :disabled="isWorkingSubscriptionValid">Add</ui-button>
          </template>
          <template v-else="">
            <ui-button color="primary" @click="updateApNewsSubscription" :disabled="isWorkingSubscriptionValid">Save</ui-button>
          </template>
          <ui-button @click="closeModal('subscriptionModal')">Close</ui-button>
        </div>
    </ui-modal>
    <ui-confirm
      confirm-button-icon="delete"
      confirm-button-text="Delete"
      deny-button-text="Keep"
      ref="deleteConfirm"
      title="Delete Subscription?"
      type="danger"

      @confirm="onConfirmDelete"
    ></ui-confirm>
  </div>
</template>

<script>
  const axios = require('axios')
  const { UiButton, UiTextbox, UiIconButton, UiConfirm, UiModal, UiRadioGroup, UiSelect, UiCheckbox, UiCheckboxGroup, UiCollapsible } = window.kiln.utils.components
  const _get = require('lodash/get')
  const _set = require('lodash/set')
  const tableConfig = [
    {
      key: 'id',
      display: 'id',
      isHeader: false
    },
    {
      key: 'data.station',
      display: 'station slug',
      isHeader: true
    },
    {
      key: 'data.entitlements',
      display: 'entitlements',
      isHeader: true
    },
    {
      key: 'data.mappings',
      display: 'mappings',
      isHeader: true
    },
    {
      key: 'actions',
      display: 'actions',
      isHeader: true
    }
  ]
  const apiEndpoint = '/rdc/ap-subscriptions'

  class ApSubscription {
    constructor () {
      this.data = {
        station: { label: 'Radio.com (NATL-RC)', value: ''},
        entitlements: [],
        mappings: [{
          sectionFront: '',
          secondarySectionFront: ''
        }]
      }
    }
  }

  export default {
    data() {
      return {
        subscriptions: [],
        entitlements: [],
        primarySectionFronts: [],
        secondarySectionFronts: [],
        workingSubscription: new ApSubscription(),
        isLoading: false,
        modalMode: null,
      }
    },
    mounted() {
      this.getList('ap-media-entitlements', 'entitlements')
      this.getList('primary-section-fronts', 'primarySectionFronts')
      this.getList('secondary-section-fronts', 'secondarySectionFronts')
      this.getApNewsSubscriptions()
    },
    methods: {
      openModal (ref) {
        this.$refs[ref].open()
      },
      closeModal (ref) {
        this.$refs[ref].close()
      },
      getList (listName, dataKey) {
        this.isLoading = true
        axios.get(`/_lists/${listName}`)
          .then(r => {
            this[dataKey] = [...r.data]
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      showSnack (message, duration = 4000) {
        this.$store.dispatch('showSnackbar', {
          message,
          duration: 4000
        })
      },
      handleError (err, duration = 4000) {
        console.error(err)
        this.showSnack(`Error: ${err.message}`)
      },
      getShortEntitlementName(longName) {
        if(!longName) return ''
        const split = longName.split(' - ')
        return split[1]
      },
      getApNewsSubscriptions () {
        axios.get(apiEndpoint)
          .then(response => {
            this.subscriptions = [...response.data]
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      createApNewsSubscription () {
        if (this.isLoading) return
        this.isLoading = true
        const newSub = {
          ...this.workingSubscription.data
        }
        axios.post(apiEndpoint, newSub)
          .then(response => {
            this.subscriptions.push({...response.data})
            this.showSnack('AP News Subscription Added')
            this.closeModal('subscriptionModal')
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      updateApNewsSubscription () {
        if (this.isLoading) return
        this.isLoading = true
        const updatedSub = {
          ...this.workingSubscription.data
        }
        axios.put(`${apiEndpoint}/${this.workingSubscription.id}`, updatedSub)
          .then(response => {
            this.subscriptions = this.subscriptions.map(sub => {
              if (sub.id === response.data.id) {
                return { ...response.data }
              } else {
                return sub
              }
            })
            this.showSnack('AP News Subscription Updated')
            this.closeModal('subscriptionModal')
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      deleteApNewsSubscription (id) {
        if (this.isLoading) return
        this.isLoading = true
        axios.delete(`${apiEndpoint}/${id}`)
          .then(response => {
            this.subscriptions = this.subscriptions.filter(sub => sub.id !== id)
            this.showSnack('AP News Subscription Removed')
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      addMapping() {
        // here for when multiple mappings are possible
      },
      onCreate () {
        this.modalMode = 'new'
        this.workingSubscription = new ApSubscription()
        this.onStationChange(this.workingSubscription.data.station)
        this.openModal('subscriptionModal')
      },
      onEdit (subscription) {
        this.modalMode = 'edit'
        this.workingSubscription = { ...subscription }
        this.onStationChange(this.workingSubscription.data.station, false)
        this.openModal('subscriptionModal')
      },
      onConfirmDelete () {
        this.deleteApNewsSubscription(this.workingSubscription.id)
      },
      onDelete (subscription) {
        this.workingSubscription = { ...subscription }
        this.$refs.deleteConfirm.open()
      },
      onEntitlementChange (e, entitlement) {
        if(e) {
          this.workingSubscription.data.entitlements.push(entitlement)
        } else {
          this.workingSubscription.data.entitlements = this.workingSubscription.data.entitlements.filter(ent => ent.value !== entitlement.value)
        }
      },
      onStationChange (station, reset=true) {
        const delim = station.value === '' ? '' : '-'
        // get new lists based on station selection
        this.getList(`${station.value}${delim}primary-section-fronts`, 'primarySectionFronts')
        this.getList(`${station.value}${delim}secondary-section-fronts`, 'secondarySectionFronts')
        // reset the selections if needed
        if (reset) {
          this.$refs.primarySectionFrontInput.forEach(psfi => psfi.reset())
          this.$refs.secondarySectionFrontInput.forEach(ssfi => ssfi.reset())
        }
      },
      getFirstItemValue(subscription, path='entitlements[0].name') {
        const name = _get(subscription, `data.${path}`)
        return name ? name + '...' : ''
      },
      getStation(subscription) {
        const slug = _get(subscription, 'data.station.value')
        return slug ? slug : 'Radio.com (NATL-RC)'
      }
    },
    computed: {
      tableHeaders () {
        return tableConfig.filter(config => config.isHeader)
      },
      options () {
        return {
          stations: Object.values(window.kiln.locals.stationsIHaveAccessTo).map(station => {
            return { label: `${station.name} (${station.callsign})`, value: station.slug }
          }),
          entitlementKeys: {
            class: 'class',
            label: 'name',
            image: 'image'
          }
        }
      },
      isEntitlementsInvalid () {
        return this.workingSubscription.data.entitlements.length < 1
      },
      isPrimarySectionfrontsInvalid () {
        return this.workingSubscription.data.mappings.some((mapping) => mapping.sectionFront === '')
      },
      isWorkingSubscriptionValid () {
        return (
          this.isEntitlementsInvalid || this.isPrimarySectionfrontsInvalid
        )
      }
    },
    components: {
      UiButton,
      UiCheckbox,
      UiCollapsible,
      UiConfirm,
      UiIconButton,
      UiModal,
      UiSelect
    }
  }
</script>