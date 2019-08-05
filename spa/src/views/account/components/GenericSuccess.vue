<template>
  <div class="generic-success">
    <fieldset>
      <h3 align="center">Success!</h3>
      <h1 align="center">{{content}}</h1>
    </fieldset>
  </div>
</template>

<script>
export default {
  name: 'GenericSuccess',
  props: ['content']
}
</script>
