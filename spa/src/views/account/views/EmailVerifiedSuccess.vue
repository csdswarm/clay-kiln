<template>
  <div class="email-verified-success">
    <generic-success content="Your email has been successfully verified."/>
  </div>
</template>

<script>
import GenericSuccess from '@/components/GenericSuccess'

export default {
  name: 'EmailVerifiedSuccess',
  components: {
    GenericSuccess
  }
}
</script>
