<template>
  <div class="radio-com-form">
    <div class="section light-bg">
      <div class="container">
        <div class="row">
          <div class="form-style-5" >
            <form>
              <slot/>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RadioComForm'
}
</script>
