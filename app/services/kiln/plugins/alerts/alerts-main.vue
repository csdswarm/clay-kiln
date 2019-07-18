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
                <ui-button @click="openModal('alertModal')">Add Alert</ui-button>
                <div class="alerts-manager__station-select">
                    <ui-select 
                        label="Station"
                        placeholder="Select a station"
                        :options="stationCallsigns"
                        @select="loadAlerts"
                        v-if="!global"
                        v-model="selectedStation">
                    </ui-select>
                </div>
            </div>
            <div>
                <div class="page-list-headers">
                    <span class="page-list-header page-list-headers__start">Start</span>
                    <span class="page-list-header page-list-headers__end">End</span>
                    <span class="page-list-header page-list-headers__message">Message</span>
                    <span class="page-list-header page-list-headers__icons"></span>
                </div>
                <div class="page-list-readout" v-show="!loading">
                    <div
                        :key="alert.message"
                        class="page-list-item"

                        v-for="alert in alerts"
                    >
                        <span class="page-list-item__start">{{alert.start | formatDate}}</span>
                        <span class="page-list-item__end">{{alert.end | formatDate}}</span>
                        <span class="page-list-item__message">{{alert.message}}</span>
                        <span class="page-list-item__icons">
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
            title="Add New Alert"
            ref="alertModal"
        >
                <div>
                    <ui-textbox
                        label="Message"
                        multi-line
                        
                        v-model="message"
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
        UiModal, 
        UiSelect } = window.kiln.utils.components;
    const allStationsCallsigns = window.kiln.locals.allStationsCallsigns || ['KMOX', 'KROX'];

    export default {
        data() {
            return {
                alerts: [],
                breaking: false,
                editMode: false,
                endDate: '',
                endTime: '',
                loading: false,
                message: '',
                startDate: '',
                startTime: '',
                errorMessage: '',
                selectedAlert: {},
                selectedStation: '',
                stationCallsigns: allStationsCallsigns,
                tab: 'global',
                tabs: [{
                    id: 'global',
                    name: 'Global'
                }, {
                    id: 'station',
                    name: 'Station'
                }]
            }
        },
        created() {
            this.loadAlerts();
        },
        computed: {
            end: function () {
                const [hour, minute] = this.endTime.split(':');

                if (!this.endDate || !hour || !minute) {
                    return '';
                }

                return moment.utc(this.endDate).hour(hour).minute(minute).second(0).milliseconds(0).valueOf()/1000; 
            },
            start: function () {
                const [hour, minute] = this.startTime.split(':');

                if (!this.startDate || !hour || !minute) {
                    return '';
                }

                return moment.utc(this.startDate).hour(hour).minute(minute).second(0).milliseconds(0).valueOf()/1000;            
            },
            global: function() {
                return this.tab === 'global';
            },
            station: function() {
                return this.global ? 'NATL-RC' : this.selectedStation;
            },
            validForm: function() {
                return this.message && this.startDate && this.startTime && this.endDate && this.endTime;
            }
        },
        methods: {
            async addAlert() {
                const {
                    breaking,
                    message,
                    start,
                    end,
                    station,
                    selectedAlert
                } = this;

                try {
                    if (this.editMode && selectedAlert) {
                        await axios.put('/alerts', {...selectedAlert, breaking, message, start, end, station})
                        this.editMode = false;
                    } else {
                        await axios.post('/alerts', {breaking, message, start, end, station});
                    }
                    await this.loadAlerts();
                    this.closeModal('alertModal');
                    this.clearModal();
                } catch ({response}) {
                    this.errorMessage = response.data;
                }
                
            },
            clearModal() {
                this.breaking = false;
                this.message = '';
                this.endDate = '';
                this.endTime = '';
                this.startDate = '';
                this.startTime = '';
                this.errorMessage = '';
            },
            closeModal(ref) {
                this.$refs[ref].close();
            },
            confirmDeleteAlert(alert) {
                this.selectedAlert = alert;
                this.$refs['confirmDelete'].open();
            },
            async deleteAlert(){
                await axios.put('/alerts', {...this.selectedAlert, active: false});
                await this.loadAlerts();
            },
            editAlert(alert) {
                this.selectedAlert = alert;
                this.editMode = true;
                this.setForm(alert);
                this.openModal('alertModal')
            },
            async loadAlerts() {
                if (!this.global && !this.selectedStation) {
                    this.alerts = [];
                } else {
                    this.loading = true;
                    const {data = []} = await axios.get('/alerts', {params: {station: this.station}});

                    this.loading = false;
                    this.alerts = data;
                }
            },
            openModal(ref) {
                this.errorMessage = '';
                this.$refs[ref].open();
            },
            setForm(alert) {
                const start = moment.utc(alert.start*1000);
                const end = moment.utc(alert.end*1000);

                this.breaking = alert.breaking;
                this.message = alert.message;
                this.startDate = start.toDate();
                this.startTime = start.format('HH:mm:ss');
                this.endDate = end.toDate();
                this.endTime = end.format('HH:mm:ss');
            },
            updateTab(tab) {
                this.tab = tab;
                this.loadAlerts();
            }
        },
        filters: {
            formatDate: function (value) {
                return moment.utc(value*1000).format('llll')
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
            UiSelect
        }
    }
</script>

