<template>
  <div class="general-success">
    <h1>Success!</h1>
    <h3>(You can close this now.)</h3>
    <p class="small"><a href="mailto:support@radio.com" class="underline-link">Click here</a> to contact support.</p>
  </div>
</template>

<script>
export default {
  name: 'Login'
}
</script>

<style>
.general-success h1,
.general-success h3,
.general-success p {
  color: #1F055E;
  text-align:center;
}
.general-success h1 {
  font-size: 24px;
  font-weight: 500;
  font-family: 'Circular', sans-serif;
}
.general-success p,
.general-success h3{
  font-family: 'CircularMed', sans-serif;
}
.general-success h3 {
  font-size: 18px;
}
</style>
