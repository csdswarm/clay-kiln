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
                <div>
                    New {{ tab.name }} alert
                </div>

                </ui-tab>
        </ui-tabs>
    </div>
</template>

<script>
    const UiIconButton = window.kiln.utils.components.UiIconButton;
    const UiProgressCircular = window.kiln.utils.components.UiProgressCircular;
    const UiTabs = window.kiln.utils.components.UiTabs;
    const UiTab = window.kiln.utils.components.UiTab;
    const UiTextbox = window.kiln.utils.components.UiTextbox;

    export default {
        data() {
            return {
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
        methods: {
            async loadAlerts(value) {
                console.log(`Should load all ${value} alerts`);
            }
        },
        components: {
            UiTabs,
            UiTab
        }
    }
</script>

