<template>
  <div class="content-subscriptions">
    <h1>
      {{stationName}} SUBSCRIPTIONS:
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
    <ui-modal ref="subscriptionModal" title="New Subscription">
        <form action="">
          <ui-select
            class="from-station-slug"
            has-search
            label="From Station"

            :options="stations"
            :value="workingFromStation"
            @input="handleNewFromStation"
          ></ui-select>
          <ui-select
            :placeholder="'Primary Section Front'"
            hasSearch
            :options="stationPrimarySectionFronts"
            :value="workingSubscription.mapped_section_fronts.primarySectionFront"
            @input="opt => updateMappedSectionFront('primarySectionFront', opt)"/>

          <ui-select
            :placeholder="'Secondary Section Front'"
            hasSearch
            :options="stationSecondarySectionFronts"
            :value="workingSubscription.mapped_section_fronts.secondarySectionFront"
            @input="opt => updateMappedSectionFront('secondarySectionFront', opt)"/>

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
            :options="primarySectionFronts"
            :value="workingSectionFront"
            @input="opt => setSectionFrontFilter('sectionFront', opt)"
          ></ui-select>
          <!-- secondary section fronts -->
          <ui-select
            v-if="shouldShowSecondarySectionFront"
            has-search
            label="Secondary Section Front"
            placeholder="Select Secondary Section Front to Include"
            :options="secondarySectionFronts"
            :value="workingSecondarySectionFront"
            @input="opt => setSectionFrontFilter('secondarySectionFront', opt)"
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
            :options="primarySectionFronts"
            :value="workingExcludeSectionFronts"
            @input="opt => setSectionFrontFilter('excludeSectionFronts', opt)"
          ></ui-select>
          <!-- exclude secondary section fronts -->
          <ui-select
            has-search
            label="Exclude Secondary Section Fronts"
            placeholder="Select Secondary Section Fronts to Exclude"
            multiple
            :options="secondarySectionFronts"
            :value="workingExcludeSecondarySectionFronts"
            @input="opt => setSectionFrontFilter('excludeSecondarySectionFronts', opt)"
          ></ui-select>
        </form>
        <div slot="footer">
          <template v-if="modalMode === 'new'">
            <ui-button color="primary" @click="createSubscription" :disabled="!workingSubscription.short_desc.trim().length">Add</ui-button>
          </template>
          <template v-else>
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
  const SubscriptionRow = require('./subscription-row.vue')
  const startCase = require('lodash/startCase')
  const axios = require('axios')
  const { DEFAULT_STATION, PAGE_TYPES } = require('../../../universal/constants')
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
      display: 'to station',
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
  const toStationOption = station => ({
    label: `${station.name} (${station.callsign})`,
    value: station === DEFAULT_STATION
      ? station.site_slug
      : station.slug
  })
  const nationalFromStationOption = toStationOption(DEFAULT_STATION)

  // needed for using simple-list outside of kiln
  _set(window.kiln.toolbarButtons, 'overlay.methods.onResize', function onResize() {
    const style = _get(this, '$el.style')

    if (style) {
      style.height = 'auto';
    }
  })

  class ContentSubscription {
    constructor (options = {
      from_station_slug: nationalFromStationOption.value,
      station_slug: window.kiln.locals.station.site_slug,
      mapped_section_fronts: {
        primarySectionFront: null,
        secondarySectionFront: null
      },
      short_desc: '',
      filter: {
        // as currently described in get-content-subscriptions.js
        populateFrom: 'all-content', // {string}
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
      this.mapped_section_fronts = { ...options.mapped_section_fronts }
    }
  }

  const getNewWorkingSectionFrontProps = () => ({
    workingSectionFront: '',
    workingSecondarySectionFront: '',
    targetWorkingSectionFront: '',
    targetWorkingSecondarySectionFront: '',
    workingExcludeSectionFronts: [],
    workingExcludeSecondarySectionFronts: [],
  })

  const getNewWorkingProps = () => ({
    workingSubscription: new ContentSubscription(),
    workingTags: [],
    workingExcludeTags: [],
    workingFromStation: nationalFromStationOption,
    ...getNewWorkingSectionFrontProps()
  })

  export default {
    data() {
      const {
        stationForPermissions: { name: stationName }
      } = window.kiln.locals

      const initialData = {
        subscriptions: [...window.kiln.locals.contentSubscriptions],
        primarySectionFronts: [],
        secondarySectionFronts: [],
        stationPrimarySectionFronts: [],
        stationSecondarySectionFronts: [],
        mapped_section_fronts: {
          primarySectionFront: null,
          secondarySectionFront: null
        },
        stationName,
        isLoading: false,
        modalMode: null,
      };

      return Object.assign(initialData, getNewWorkingProps())
    },
    methods: {
      updateMappedSectionFront(property, opt) {
        this.mapped_section_fronts[property] = opt;
        this.workingSubscription.mapped_section_fronts[property] = opt.value ? opt.value : ''
      },
      setSectionFrontFilter(key, option) {
        this['working' + capitalize(key)] = option

        this.workingSubscription.filter[key] = Array.isArray(option)
          ? option.map(opt => opt.value)
          : option.value;
      },
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
          fromStationSlug: this.workingSubscription.from_station_slug,
          stationSlug: this.workingSubscription.station_slug,
          shortDescription: this.workingSubscription.short_desc,
          filter: { ...this.workingSubscription.filter },
          mapped_section_fronts: { ...this.workingSubscription.mapped_section_fronts },
        }
        axios.post(`/rdc/content-subscription`, newSub)
          .then(response => {
            this.subscriptions.push(response.data)
            this.showSnack('Subscription Added')
            this.workingSubscription = new ContentSubscription()
            this.closeModal('subscriptionModal')
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      async handleNewFromStation(opt) {
        this.workingFromStation = opt;
        this.workingSubscription.from_station_slug = opt.value;

        await this.loadSectionFronts();

        Object.assign(this, getNewWorkingSectionFrontProps());

        Object.assign(this.workingSubscription.filter, {
          sectionFront: this.workingSectionFront,
          secondarySectionFront: this.workingSecondarySectionFront,
          excludeSectionFronts: this.workingExcludeSectionFronts,
          excludeSecondarySectionFronts: this.workingExcludeSecondarySectionFronts
        });
      },
      async loadSectionFronts() {
        const slug = this.workingSubscription.from_station_slug,
          currentStationSlug = window.kiln.locals.station.site_slug,
          listPrefix = slug
            ? slug + '-'
            : '',
          currentStationPrefix = currentStationSlug
            ? currentStationSlug + '-'
            : '';

        await Promise.all([
          this.loadList(`${listPrefix}primary-section-fronts`, 'primarySectionFronts'),
          this.loadList(`${listPrefix}secondary-section-fronts`, 'secondarySectionFronts'),
          this.loadList(`${currentStationPrefix}primary-section-fronts`, 'stationPrimarySectionFronts'),
          this.loadList(`${currentStationPrefix}secondary-section-fronts`, 'stationSecondarySectionFronts')
        ])
      },
      updateSubscription () {
        if (this.isLoading) return
        this.isLoading = true
        const updatedSub = {
          fromStationSlug: this.workingSubscription.from_station_slug,
          stationSlug: this.workingSubscription.station_slug,
          shortDescription: this.workingSubscription.short_desc,
          filter: { ...this.workingSubscription.filter },
          mapped_section_fronts: { ...this.workingSubscription.mapped_section_fronts },
        }
        axios.put(`/rdc/content-subscription/${this.workingSubscription.id}`, updatedSub)
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
        axios.delete(`/rdc/content-subscription/${id}`)
          .then(response => {
            this.subscriptions = this.subscriptions.filter(sub => sub.id !== id)
            this.showSnack('Subscription Deleted')
          })
          .catch(this.handleError)
          .finally(() => { this.isLoading = false })
      },
      onCreate () {
        this.modalMode = 'new'
        Object.assign(this, getNewWorkingProps())
        this.loadSectionFronts()
        this.openModal('subscriptionModal')
      },
      onEditSubscriptionRow (subscription) {
        this.modalMode = 'edit'

        const { filter } = subscription;

        Object.assign(this, {
          workingSubscription: { ...subscription },
          workingTags: filter.tags.map(t => ({text: t})),
          workingExcludeTags: filter.excludeTags.map(t => ({text: t})),
          workingFromStation: this.stations.find(({ value }) => value === subscription.from_station_slug),
          workingSectionFront: filter.sectionFront,
          workingSecondarySectionFront: filter.secondarySectionFront,
          workingExcludeSectionFronts: filter.excludeSectionFronts,
          workingExcludeSecondarySectionFronts: filter.excludeSecondarySectionFronts
        });

        this.loadSectionFronts()

        this.openModal('subscriptionModal')
      },
      onDeleteSubscriptionRow (subscription) {
        this.workingSubscription = subscription
        this.$refs.deleteConfirm.open()
      },
      onConfirmDelete () {
        this.deleteSubscription(this.workingSubscription.id)
      },
      async loadList(listName, dataKey) {
        let items = []

        try {
          items = (await axios.get(`/_lists/${listName}`)).data
        } catch (err) {
          // if it's a 404 then we should use the empty list - otherwise rethrow
          if (_get(err, 'response.status') !== 404) {
            throw err
          }
        }

        this[dataKey] = items.map(({ name, value }) => ({
          label: name,
          value
        }))
      },
      hookDataToTags() {
        // since we are using SimpleList outside kiln we need to hook into the
        // mutation events on the store and we also need to to just return the
        // value of the tags and not the whole object
        this.$store.subscribe(mutation => {
          const { payload, type } = mutation,
            { path, data } = payload || {}

          if (
            mutation.type !== 'UPDATE_FORMDATA'
            || (
              path !== 'tags'
              && path !== 'excludeTags'
            )
          ) {
            return
          }

          this['working' + _upperFirst(path)] = data
          this.workingSubscription.filter[path] = data.map(d => d.text)
        })
      }
    },
    mounted () {
      this.loadSectionFronts()
    },
    created () {
      this.hookDataToTags()
    },
    computed: {
      shouldShowSecondarySectionFront() {
        return this.workingSubscription.filter.populateFrom.includes('section-front');
      },
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
              value: 'all-content'
            },
            {
              label: 'Section Front',
              value: 'section-front'
            },
            {
              label: 'Tag',
              value: 'tag'
            },
            {
              label: 'Contains Both Section Front and Tag',
              value: 'section-front-and-tag'
            },
            {
              label: 'Contains Either Section Front or Tag',
              value: 'section-front-or-tag'
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
        return ['section-front', 'section-front-and-tag', 'section-front-or-tag']
          .includes(this.workingSubscription.filter.populateFrom);
      },
      includeSectionTags () {
        return ['tag', 'section-front-and-tag', 'section-front-or-tag']
          .includes(this.workingSubscription.filter.populateFrom);
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
        const stationOptions = Object.assign(
          // even if the user doesn't have access to the national station, they
          //   should still be able to subscribe to it
          { [DEFAULT_STATION.site_slug]: DEFAULT_STATION },

          window.kiln.locals.stationsIHaveAccessTo
        )

        return Object.values(stationOptions).map(toStationOption)
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
