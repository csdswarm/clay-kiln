<template>
  <div class="subscription-filter">
    <div>filter:</div>
    <div v-for="(value, propertyName, index) in filterProps" :key="index">
      <ui-textbox v-bind:label="propertyName" v-model:value="filterProps[propertyName]" @change="onChange" @input="onInput"></ui-textbox>
    </div>
  </div>
</template>

<script>
  const { UiButton, UiTextbox, UiIconButton } = window.kiln.utils.components;

  export default {
    // name: 'subscription-filter',
    props: ['filterProps'],
    data() {
      return {
        filters: this.filterProps
      };
    },
    methods: {
      onInput: function(e) {
        console.log('input-', e);
      },
      onChange: function(e) {
        console.log('change-', e);
      }
    },
    components: {
      UiTextbox
    },
  };
</script>
