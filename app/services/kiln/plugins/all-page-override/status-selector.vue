<template>
  <div class="status-selector" :class="{ 'is-vertical': vertical }">
    <ui-radio-group class="status-select-radio" color="accent" :options="options" v-model="selectedStatus" @input="input"></ui-radio-group>
  </div>
</template>

<script>
  const { UiRadioGroup } = window.kiln.utils.components;
  const options = [
    {
      label: 'All',
      value: 'all'
    },
    {
      label: 'Draft',
      value: 'draft'
    },
    {
      label: 'Scheduled',
      value: 'scheduled'
    },
    {
      label: 'Published',
      value: 'published'
    },
    {
      label: 'Archived',
      value: 'archived'
    }
  ]

  export default {
    props: ['selectedStatus', 'vertical'],
    data() {
      return {
        options
      }
    },
    methods: {
      input(status) {
        this.$emit('select', status);
      }
    },
    components: {
      UiRadioGroup
    }
  };
</script>
