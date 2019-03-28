<template>
  <div class="reset-password-success">
    <generic-success content="Your password has been successfully reset."/>
  </div>
</template>

<script>
import GenericSuccess from '@/components/GenericSuccess'

export default {
  name: 'ResetPasswordSuccess',
  components: {
    GenericSuccess
  }
}
</script>
