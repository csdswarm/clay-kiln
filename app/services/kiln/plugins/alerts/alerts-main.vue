<!-- Alerts Manager -->
<template>
    <div class="alerts-manager">
        <ui-tabs
            fullwidth
            @tab-change="updateTab">
            <ui-tab
                :key="tab.id"
                :id="tab.id"
                :title="tab.name"
                @select="loadAlerts"
                
                v-for="tab in tabs">
            </ui-tab>
            <ui-button @click="openModal('alertModal')">Add Alert</ui-button>
            <div class="page-list-headers">
                <span class="page-list-header page-list-headers__start">Start</span>
                <span class="page-list-header page-list-headers__end">End</span>
                <span class="page-list-header page-list-headers__message">Message</span>
                <span class="page-list-header page-list-headers__breaking">Breaking</span>
            </div>
            <div class="page-list-readout">
                <div
                    :key="alert.message"
                    class="page-list-item"

                    v-for="alert in formattedAlerts"
                >
                    <span class="page-list-item__start">{{alert.start}}</span>
                    <span class="page-list-item__end">{{alert.end}}</span>
                    <span class="page-list-item__message">{{alert.message}}</span>
                    <span class="page-list-item__breaking">{{alert.breaking}}</span>
                </div>
            </div>
        </ui-tabs>
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
                            :maxDate:="endDate"
                            
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
                    <ui-checkbox
                        v-model="breaking"
                    >Breaking</ui-checkbox>
                </div>
                <ui-button
                    @click="addAlert"
                    :disabled="validForm">Save Alert</ui-button>
        </ui-modal>
    </div>
</template>

<script>
    const axios = require('axios');
    const moment = require('moment');
    const { UiButton, UiCheckbox, UiDatepicker, UiTabs, UiTab, UiTextbox, UiModal } = window.kiln.utils.components;
    const allStationsCallsigns = window.kiln.locals.allStationsCallsigns || ['NATL-RC', 'KMOX', 'KROX'];

    export default {
        data() {
            return {
                alerts: [],
                endDate: '',
                endTime: '',
                startDate: '',
                startTime: '',
                stationCallsigns: allStationsCallsigns,
                tabs: [{
                    id: 'global',
                    name: 'Global',
                    onSelect: 'loadGlobalAlerts'
                }, {
                    id: 'station',
                    name: 'Station',
                    onSelect: 'loadStationAlerts'
                }]
            }
        },
        computed: {
            end: function () {
                const [hour, minute] = this.endTime.split(':');

                if (!this.endDate || !hour || !minute) {
                    return '';
                }

                return moment.utc(this.endDate).hour(hour).minute(minute).second(0).milliseconds(0).valueOf(); 
            },
            start: function () {
                const [hour, minute] = this.startTime.split(':');

                if (!this.startDate || !hour || !minute) {
                    return '';
                }

                return moment.utc(this.startDate).hour(hour).minute(minute).second(0).milliseconds(0).valueOf();            
            },
            formattedAlerts: function() {
                return this.alerts.map(alert => {
                    return {
                        ...alert,
                        start: moment.utc(alert.start).format('llll'),
                        end: moment.utc(alert.end).format('llll')
                    };
                });
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
                    end
                } = this;

                try {
                    await axios.post('/alerts', {breaking, message, start, end});
                    this.loadAlerts();
                    this.closeModal('alertModal');
                    this.clearModal();
                } catch (e) {
                    console.log('throw error');
                }
                
            },
            clearModal() {
                this.breaking = false;
                this.message = '';
                this.endDate = '';
                this.endTime = '';
                this.startDate = '';
                this.startTime = '';
            },
            closeModal(ref) {
                this.$refs[ref].close();
            },
            async loadAlerts() {
                const {data = []} = await axios.get('/alerts');

                this.alerts = data;
            },
            openModal(ref) {
                this.$refs[ref].open();
            }
        },
        components: {
            UiButton,
            UiCheckbox,
            UiDatepicker,
            UiTabs,
            UiTab,
            UiTextbox,
            UiModal
        }
    }
</script>

