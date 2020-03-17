<!-- Alerts Manager -->
<template>
    <div class="alerts-manager">
        <ui-tabs
            class="alerts-manager__tabs"
            fullwidth
            @tab-change="updateTab">
            <ui-tab
                :key="tab.id"
                :id="tab.id"
                :title="tab.name"

                v-for="tab in tabs">
            </ui-tab>
            <div class="alerts-manager__toolbar">
                <ui-button class="alerts-manager__add-alert"
                    @click="newAlert">

                    Add Alert
                </ui-button>
                <station-select v-show="!global"
                    class="alerts-manager__station-select" />
            </div>
            <div>
                <div class="page-list-headers">
                    <span class="alerts-manager__page-list-headers page-list-header page-list-headers__start">Start</span>
                    <span class="alerts-manager__page-list-headers page-list-header page-list-headers__end">End</span>
                    <span class="alerts-manager__page-list-headers page-list-header page-list-headers__message">Message</span>
                    <span class="alerts-manager__page-list-headers page-list-header page-list-headers__icons"></span>
                </div>
                <div class="page-list-readout" v-show="!loading">
                    <div
                        :key="alert.message"
                        class="page-list-item"

                        v-for="alert in alerts"
                    >
                        <span class="alerts-manager__page-list-item__start">{{alert.start | formatDate}}</span>
                        <span class="alerts-manager__page-list-item__end">{{alert.end | formatDate}}</span>
                        <div class="alerts-manager__page-list-item__message">
                            <div>{{alert.message}}</div>
                            <div class="alerts-manager-page-list-item__link" v-if="alert.link">Link: <a :href="alert.link">{{alert.link}}</a></div>
                        </div>
                        <span class="alerts-manager__page-list-item__icons">
                            <ui-icon-button
                                icon="error"
                                color="red"
                                tooltip="BREAKING"
                                v-if="alert.breaking"></ui-icon-button>
                        </span>
                        <span class="page-list-item__menu">
                            <ui-icon-button
                                icon="more_vert"
                                has-dropdown
                                ref="itemButton">
                                <div class="page-list-item__dropdown" slot="dropdown">
                                    <ui-button @click="editAlert(alert)">Edit</ui-button>
                                    <ui-button @click="confirmDeleteAlert(alert)">Delete</ui-button>
                                </div>
                            </ui-icon-button>
                        </span>
                    </div>
                </div>
                <ui-progress-circular v-show="loading"></ui-progress-circular>
            </div>
        </ui-tabs>
        <ui-confirm
            ref='confirmDelete'
            title='Confirm Delete'

            @confirm="deleteAlert"
            >
            Are you sure you want to delete this alert?
        </ui-confirm>
        <ui-modal
            :title="heading"
            @close="clearModal"
            ref="alertModal"
        >
                <div>
                    <ui-textbox
                        label="Message"
                        multi-line

                        error="Please limit alert to 140 characters or less"
                        :maxlength="140"
                        :invalid="message.length > 140"

                        v-model="message"
                    ></ui-textbox>
                    <ui-textbox
                        label="Link"
                        type="url"
                        :error="validLinkError"
                        :invalid="!validLink"

                        v-model="link"
                    ></ui-textbox>
                    <div class="alerts-manager__time-picker">
                        <ui-datepicker
                            placeholder="Select the start date"
                            :maxDate="endDate"

                            v-model="startDate"
                        >Start Date</ui-datepicker>
                        <ui-textbox
                            label="Start Time"
                            type="time"

                            v-model="startTime"
                        ></ui-textbox>
                    </div>
                    <div class="alerts-manager__time-picker">
                        <ui-datepicker
                            placeholder="Select the end date"
                            :minDate="startDate"

                            v-model="endDate"
                        >End Date</ui-datepicker>
                        <ui-textbox
                            label="End Time"
                            type="time"

                            v-model="endTime"
                        ></ui-textbox>
                    </div>
                    <div>
                        <ui-checkbox
                            v-model="breaking"
                        >Breaking</ui-checkbox>
                    </div>
                </div>
                <ui-button
                    class="alerts-manager__save-alert"
                    @click="addAlert"
                    :disabled="!validForm">Save Alert</ui-button>
                <div class="alerts-manager__error-message">{{ errorMessage }}</div>
        </ui-modal>
    </div>
</template>

<script>
    const axios = require('axios');
    const moment = require('moment');
    const _get = require('lodash/get');
    const { mapGetters } = require('vuex');
    const { isUrl } = require('../../../universal/utils');
    const { unityAppDomainName: unityApp } = require('../../../universal/urps');
    const stationSelect = require('../../shared-vue-components/station-select');
    const StationSelectInput = require('../../shared-vue-components/station-select/input.vue');
    const { getAlerts } = require('../../../client/alerts');
    const {
        UiButton,
        UiCheckbox,
        UiConfirm,
        UiDatepicker,
        UiIconButton,
        UiProgressCircular,
        UiTabs,
        UiTab,
        UiTextbox,
        UiModal } = window.kiln.utils.components;

    /**
     * Simple cache-buster value to append to rest URL's to ensure they get the latest version of data
     * TODO: consider replacing this as a part of any initiative involving ON-953 - CSD
     * @returns {{cb: *}}
     */
    function cb(){
      return {cb:Date.now()};
    }

    export default {
        data() {
            return {
                alerts: [],
                breaking: false,
                editMode: false,
                endDate: '',
                endTime: '',
                link: '',
                loading: false,
                message: '',
                startDate: '',
                startTime: '',
                errorMessage: '',
                selectedAlert: {},
                tab: 'global',
                validLinkError: ''
            }
        },
        /** Load current alerts, load callsigns, and set default tab when component is created */
        async created() {
            this.tab = this.tabs[0].id;
            this.loadAlerts();
        },
        watch: {
            selectedStation() {
                this.loadAlerts();
            }
        },
        computed: Object.assign(
            {},
            mapGetters(stationSelect.storeNs, ['selectedStation']),
            {
                end() {
                    return this.combineDateAndTime(this.endDate, this.endTime);
                },
                start() {
                    return this.combineDateAndTime(this.startDate, this.startTime);
                },
                global() {
                    return this.tab === 'global';
                },
                heading() {
                    return `${this.editMode ? 'Edit' : 'Add New'} Alert`;
                },
                /** Current station, or global station */
                station() {
                    return this.global ? 'GLOBAL' : this.selectedStation.callsign;
                },
                tabs() {
                    const { user, stationsIHaveAccessTo } = kiln.locals,
                        tabs = [],
                        hasGlobalAlertPermissions = user.can('create').a('global-alert').for(unityApp).value
                            || user.can('update').a('global-alert').for(unityApp).value;

                    if (hasGlobalAlertPermissions) {
                        tabs.push({ id: 'global', name: 'Global' });
                    }

                    if (Object.keys(stationsIHaveAccessTo).length) {
                        tabs.push({ id: 'station', name: 'Station' });
                    }

                    return tabs;
                },
                /** True if all required fields are entered */
                validForm() {
                    return (
                        this.message
                        && this.startDate
                        && this.startTime
                        && this.endDate
                        && this.endTime
                        && !moment(this.start).isSameOrAfter(this.end)
                        && this.validLink
                    );
                },
                validLink() {
                    if (this.link && !isUrl(this.link)) {
                        this.validLinkError = /(http|https):\/\//.test(this.link) ? 'Not a valid link' : 'Link must include http/https';
                        return false;
                    }
                    this.validLinkError = '';
                    return true;
                }
            }
        ),
        methods: {
            /**
             * Adds or updates an alert based on if in editMode
             */
            async addAlert() {
                const {
                    breaking,
                    message,
                    link,
                    start,
                    end,
                    station,
                    selectedAlert
                } = this;
                const alert = {breaking, link, message, start, end, station, params: cb()};

                try {
                    if (this.editMode && selectedAlert) {
                        await axios.put('/alerts', {...selectedAlert, ...alert})
                        this.editMode = false;
                    } else {
                        await axios.post('/alerts', alert);
                    }
                    await this.loadAlerts();
                    this.closeModal('alertModal');
                    this.clearModal();
                } catch ({response}) {
                    this.errorMessage = response.data;
                }

            },
            newAlert(){
                this.editMode = false;
                this.openModal('alertModal');
            },
            /** Clears the new/update alert form */
            clearModal() {
                this.breaking = false;
                this.message = '';
                this.link = '';
                this.endDate = '';
                this.endTime = '';
                this.startDate = '';
                this.startTime = '';
                this.errorMessage = '';
            },
            closeDropdown(ref) {
                const el = [].concat(this.$refs[ref])[0]; // may or may not be in an array, force it to be
                el.closeDropdown && el.closeDropdown()
            },
            closeModal(ref) {
                this.$refs[ref].close();
            },
            /** Combines date and time input into one field */
            combineDateAndTime(date, time) {
                const [hour, minute] = time.split(':');

                if (!date || !hour || !minute) {
                    return '';
                }

                return moment(date).hour(hour).minute(minute).second(0).milliseconds(0);
            },
            /** Checks to confirm that an alert should be deleted */
            confirmDeleteAlert(alert) {
                this.selectedAlert = alert;
                this.closeDropdown('itemButton');
                this.$refs['confirmDelete'].open();
            },
            /** Sets the current selectedAlert active flag to false*/
            async deleteAlert(){
                await axios.put('/alerts', {...this.selectedAlert, active: false, params: cb()});
                await this.loadAlerts();
            },
            /** Sets editMode to true and opens the modal */
            editAlert(alert) {
                this.selectedAlert = alert;
                this.editMode = true;
                this.setForm(alert);
                this.closeDropdown('itemButton');
                this.openModal('alertModal')
            },
            /** Loads all current and future alerts globally or by station */
            async loadAlerts() {
                if (!this.global && !this.selectedStation.callsign) {
                    this.alerts = [];
                } else {
                    this.loading = true;
                    const data = await getAlerts({
                        station: this.station,
                        ...cb()
                    });

                    this.loading = false;
                    this.alerts = data;
                }
            },
            openModal(ref) {
                this.errorMessage = '';
                this.$refs[ref].open();
            },
            /** Populates the form with selectedAlert when in editMode */
            setForm(alert) {
                const start = moment(alert.start);
                const end = moment(alert.end);

                this.breaking = alert.breaking;
                this.message = alert.message;
                this.link = alert.link;
                this.startDate = start.toDate();
                this.startTime = start.format('HH:mm:ss');
                this.endDate = end.toDate();
                this.endTime = end.format('HH:mm:ss');
            },
            /** Loads alerts when the tab is changed */
            updateTab(tab) {
                this.tab = tab;
                this.loadAlerts();
            }
        },
        filters: {
            /** Date formatter */
            formatDate: function (value) {
                return moment.utc(value).local().format('llll')
            }
        },
        components: {
            UiButton,
            UiCheckbox,
            UiConfirm,
            UiDatepicker,
            UiIconButton,
            UiProgressCircular,
            UiTabs,
            UiTab,
            UiTextbox,
            UiModal,
            'station-select': StationSelectInput
        }
    }
</script>
