<template>
  <div class="national-subscriptions">
    <h1>
      {{stationName}} NATIONAL SUBSCRIPTIONS:
    <hr>
    <ui-button class="add-subscription-btn" color="primary" @click="onCreate" icon="add" :loading="isLoading" size="large">Add Subscription</ui-button>
    </h1>
    <table class="subscriptions" cellspacing="1" v-if="subscriptions.length">
      <thead>
        <tr>
          <th :key="index" v-for="(config, index) in tableHeaders" :class="config.display">{{ config.display }}</th>
        </tr>
      </thead>
      <tbody>
        <SubscriptionRow
          v-for="(subscription, index) in subscriptions"
          :key="index"
          :subscription="subscription"
          :config="subscriptionRowConfig"
          :isLoading="isLoading"
          @editSubscriptionRow="onEditSubscriptionRow"
          @deleteSubscriptionRow="onDeleteSubscriptionRow"
        />
      </tbody>
    </table>
    <template v-if="!subscriptions.length">
      <p>There are currently no subscriptions. Click the Add Subscription button to make one.</p>
    </template>
    <ui-modal ref="subscriptionModal" title="New National Subscription">
        <form action="">
          <ui-select
            class="from-station-slug"
            has-search
            label="From Station"
            placeholder="Radio.com (NATL-RC)"

            :options="stations"

            v-model="workingSubscription.from_station_slug"
          ></ui-select>
          <ui-textbox
              error="The short description may not be more than 50 characters"
              help="Write a short description not more than 50 characters"
              label="Short Description"
              placeholder="Enter a short description"

              :maxlength="50"
              :invalid="workingSubscription.short_desc.length > 50"

              v-model="workingSubscription.short_desc"
          ></ui-textbox>
          <ui-radio-group
            name="populateFrom"
            vertical
            :options="workingSubscriptionOptions.populateFrom"
            v-model="workingSubscription.filter.populateFrom"
          >Populate content from?</ui-radio-group>
          <hr>
          <!-- pop from tag -->
          <simple-list
            v-if="includeSectionTags"
            :data="workingTags"
            name="tags"
            :args="simpleListArgs"
            :schema="{}"
          ></simple-list>
          <!-- pop from section front -->
          <ui-select
            v-if="includeSectionFronts"
            has-search
            label="Section Front"
            placeholder="Select Primary Section Front to Include"

            :options="primarySectionFronts.map(psf => psf.name)"

            v-model="workingSubscription.filter.sectionFront"
          ></ui-select>
          <!-- secondary section fronts -->
          <ui-select
            v-if="workingSubscription.filter.populateFrom === 'sectionFront' || workingSubscription.filter.populateFrom === 'sectionFrontAndTag' || workingSubscription.filter.populateFrom === 'sectionFrontOrTag'"
            has-search
            label="Secondary Section Front"
            placeholder="Select Secondary Section Front to Include"

            :options="secondarySectionFronts.map(essf => essf.name)"

            v-model="workingSubscription.filter.secondarySectionFront"
          ></ui-select>
          <!-- on all pop from choices -->
          <ui-checkbox-group
            :options="workingSubscriptionOptions.contentTypes"
            v-model="workingSubscription.filter.contentType"
          >Content Types</ui-checkbox-group>
          <!-- exclude tags -->
          <simple-list
            :data="workingExcludeTags"
            name="excludeTags"
            :args="simpleListArgs"
            :schema="{}"
          ></simple-list>
          <!-- exclude section fronts -->
          <ui-select
            has-search
            label="Exclude Section Fronts"
            placeholder="Select Primary Section Fronts to Exclude"
            multiple

            :options="primarySectionFronts.map(psf => psf.name)"

            v-model="workingSubscription.filter.excludeSectionFronts"
          ></ui-select>
          <!-- exclude secondary section fronts -->
          <ui-select
            has-search
            label="Exclude Secondary Section Fronts"
            placeholder="Select Secondary Section Fronts to Exclude"
            multiple

            :options="secondarySectionFronts.map(essf => essf.name)"

            v-model="workingSubscription.filter.excludeSecondarySectionFronts"
          ></ui-select>
        </form>
        <div slot="footer">
          <template v-if="modalMode === 'new'">
            <ui-button color="primary" @click="createSubscription" :disabled="!workingSubscription.short_desc.trim().length">Add</ui-button>
          </template>
          <template v-else="">
            <ui-button color="primary" @click="updateSubscription" :disabled="!workingSubscription.short_desc.trim().length">Save</ui-button>
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
  const { UiButton, UiTextbox, UiIconButton, UiConfirm, UiModal, UiRadioGroup, UiSelect, UiCheckboxGroup } = window.kiln.utils.components;
  const _get = require('lodash/get')
  const _set = require('lodash/set')
  const _upperFirst = require('lodash/upperFirst')
  const SimpleList = window.kiln.inputs['simple-list']
  const SubscriptionRow = require('./national-subscriptions-row.vue')
  const startCase = require('lodash/startCase')
  const axios = require('axios')
  const PAGE_TYPES = require('../../../universal/constants').PAGE_TYPES
  const tableConfig = [
    {
      key: 'id',
      display: 'id',
      isHeader: false,
      isDataProp: false,
      dataType: Number
    },
    {
      key: 'from_station_slug',
      display: 'from station',
      isHeader: true,
      isDataProp: true,
      dataType: String
    },
    {
      key: 'short_desc',
      display: 'description',
      isHeader: true,
      isDataProp: true,
      dataType: String
    },
    {
      key: 'station_slug',
      display: 'to sation',
      isHeader: false,
      isDataProp: false,
      dataType: String
    },
    {
      key: 'last_updated_utc',
      display: 'updated',
      isHeader: true,
      isDataProp: true,
      dataType: Date,
      useFilter: 'formatDate'
    },
    {
      key: 'filter',
      display: 'filter',
      isHeader: true,
      isDataProp: true,
      dataType: Object,
      propOrder: ['populateFrom', 'contentType', 'sectionFront', 'secondarySectionFront', 'tags', 'excludeSectionFronts', 'excludeSecondarySectionFronts', 'excludeTags']
    },
    {
      key: 'actions',
      display: 'actions',
      isHeader: true,
      isDataProp: false,
      dataType: null
    }
  ]
  const capitalize = require('../../../client/dom-helpers').capitalize

// needed for using simple-list outside of kiln
_set(window.kiln.toolbarButtons, 'overlay.methods.onResize', function onResize() {
  const style = _get(this, '$el.style')

  if (style) {
    style.height = 'auto';
  }
})

  class NationalSubscription {
    constructor (options = {
      from_station_slug: { label: 'Radio.com (NATL-RC)', value: ''},
      station_slug: window.kiln.locals.station.site_slug,
      short_desc: '',
      filter: {
        // as currently described in get-national-subscriptions.js
        populateFrom: 'allContent', // {string}
        contentType: [PAGE_TYPES.ARTICLE, PAGE_TYPES.GALLERY], // {string[]}
        sectionFront: '', // {string}
        secondarySectionFront: '', // {string}
        tags: [], // {string[]}
        excludeSectionFronts: [], // {string[]}
        excludeSecondarySectionFronts: [], // {string[]}
        excludeTags: [] // {string[]}
      }
    }) {
      this.id = '#'
      this.from_station_slug = options.from_station_slug
      this.last_updated_utc = 'N/A'
      this.station_slug = options.station_slug
      this.short_desc = options.short_desc
      this.filter = { ...options.filter }
    }
  }

  export default {
    data() {
      const {
        stationForPermissions: { name: stationName }
      } = window.kiln.locals

      return {
        subscriptions: [...window.kiln.locals.nationalSubscriptions],
        workingSubscription: new NationalSubscription(),
        workingTags: [],
        workingExcludeTags: [],
        primarySectionFronts: [],
        secondarySectionFronts: [],
        stationName,
        isLoading: false,
        modalMode: null,
      }
    },
    methods: {
      openModal (ref) {
        this.$refs[ref].open()
      },
      closeModal (ref) {
        this.$refs[ref].close()
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
      createSubscription () {
        if (this.isLoading) return
        this.isLoading = true
        const newSub = {
          fromStationSlug: this.workingSubscription.from_station_slug.value,
          stationSlug: this.workingSubscription.station_slug,
          shortDescription: this.workingSubscription.short_desc,
          filter: { ...this.workingSubscription.filter }
        }
        axios.post(`/rdc/national-subscription`, newSub)
          .then(response => {
            this.subscriptions.push(response.data)
            this.showSnack('Subscription Added')
            this.workingSubscription = new NationalSubscription()
            this.closeModal('subscriptionModal')
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      updateSubscription () {
        if (this.isLoading) return
        this.isLoading = true
        const updatedSub = {
          fromStationSlug: this.workingSubscription.from_station_slug.value || '',
          stationSlug: this.workingSubscription.station_slug,
          shortDescription: this.workingSubscription.short_desc,
          filter: { ...this.workingSubscription.filter }
        }
        axios.put(`/rdc/national-subscription/${this.workingSubscription.id}`, updatedSub)
          .then(response => {
            this.subscriptions = this.subscriptions.map(sub => {
              if (sub.id === response.data.id) {
                return { ...response.data }
              } else {
                return sub
              }
            }).sort((a,b) => a.last_updated_utc < b.last_updated_utc ? -1 : 1)
            this.showSnack('Subscription Updated')
            this.closeModal('subscriptionModal')
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      deleteSubscription (id) {
        if (this.isLoading) return
        this.isLoading = true
        axios.delete(`/rdc/national-subscription/${id}`)
          .then(response => {
            this.subscriptions = this.subscriptions.filter(sub => sub.id !== id)
            this.showSnack('Subscription Deleted')
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      onCreate () {
        this.modalMode = 'new'
        this.workingSubscription = new NationalSubscription()
        this.workingTags = []
        this.workingExcludeTags = []
        this.openModal('subscriptionModal')
      },
      onEditSubscriptionRow (subscription) {
        this.modalMode = 'edit'
        this.workingSubscription = { ...subscription }
        this.workingTags = subscription.filter.tags.map(t => ({text: t}))
        this.workingExcludeTags = subscription.filter.excludeTags.map(t => ({text: t}))
        this.openModal('subscriptionModal')
      },
      onDeleteSubscriptionRow (subscription) {
        this.workingSubscription = subscription
        this.$refs.deleteConfirm.open()
      },
      onConfirmDelete () {
        this.deleteSubscription(this.workingSubscription.id)
      },
      getList (listName, dataKey) {
        axios.get(`/_lists/${listName}`)
          .then(r => {
            this[dataKey] = [...r.data]
          })
      },
      hookDataToTags() {
        // since we are using SimpleList outside kiln we need to hook into the
        // mutation events on the store and we also need to to just return the
        // value of the tags and not the whole object
        this.$store.subscribe(mutation => {
          const { payload, type } = mutation,
            { path, data } = payload || {}

          if (mutation.type !== 'UPDATE_FORMDATA' || path !== 'tags' && path !== 'excludeTags') {
            return
          }

          this['working' + _upperFirst(path)] = data
          this.workingSubscription.filter[path] = data.map(d => d.text)
        })
      }
    },
    mounted () {
      this.getList('primary-section-fronts', 'primarySectionFronts')
      this.getList('secondary-section-fronts', 'secondarySectionFronts')
    },
    created () {
      this.hookDataToTags()
    },
    computed: {
      tableHeaders () {
        return tableConfig.filter(config => config.isHeader)
      },
      subscriptionRowConfig () {
        return tableConfig.filter(config => config.isDataProp)
      },
      workingSubscriptionOptions () {
        return {
          populateFrom: [
            {
              label: 'All Content',
              value: 'allContent'
            },
            {
              label: 'Section Front',
              value: 'sectionFront'
            },
            {
              label: 'Tag',
              value: 'tag'
            },
            {
              label: 'Contains Both Section Front and Tag',
              value: 'sectionFrontAndTag'
            },
            {
              label: 'Contains Either Section Front or Tag',
              value: 'sectionFrontOrTag'
            }
          ],
          contentTypes: [
            {
              label: capitalize(PAGE_TYPES.ARTICLE),
              value: PAGE_TYPES.ARTICLE
            },
            {
              label: capitalize(PAGE_TYPES.GALLERY),
              value: PAGE_TYPES.GALLERY
            }
          ]
        }
      },
      includeSectionFronts () {
        return this.workingSubscription.filter.populateFrom === 'sectionFront'
          || this.workingSubscription.filter.populateFrom === 'sectionFrontAndTag'
          || this.workingSubscription.filter.populateFrom === 'sectionFrontOrTag'
      },
      includeSectionTags () {
        return this.workingSubscription.filter.populateFrom === 'tag'
          || this.workingSubscription.filter.populateFrom === 'sectionFrontAndTag'
          || this.workingSubscription.filter.populateFrom === 'sectionFrontOrTag'
      },
      simpleListArgs() {
        return {
          badge: 'FR',
          autocomplete: {
            list: 'tags',
            allowRemove: false,
            allowCreate: false
          }
        }
      },
      stations () {
        return Object.entries(window.kiln.locals.stationsIHaveAccessTo).map(station => {
          return { label: `${station[1].name} (${station[1].callsign})`, value: station[1].slug}
        })
      }
    },
    components: {
      UiTextbox,
      UiButton,
      UiIconButton,
      UiConfirm,
      UiModal,
      UiRadioGroup,
      UiSelect,
      UiCheckboxGroup,
      SubscriptionRow,
      SimpleList
    }
  }
</script>

