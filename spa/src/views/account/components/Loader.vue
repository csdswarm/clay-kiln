<template>
  <div
    class="form-loading">
    <img
      class="loading-image"
      src="../../../assets/spinner.gif" >
  </div>
</template>

<style>
  .form-loading {
    user-select: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.03);
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    -webkit-align-items: center;
    align-items: center;
    -webkit-justify-content: center;
    justify-content: center;
  }
</style>
