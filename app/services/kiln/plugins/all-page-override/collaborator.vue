<template>
  <div class="collaborator" @click.stop="selectCollaborator">
    <avatar class="collaborator-image" :url="user.imageUrl" size="small" :name="user.name || user.username" ref="avatar"></avatar>
    <ui-tooltip trigger="avatar" position="bottom left">{{ user.name || user.username }}</ui-tooltip>
  </div>
</template>

<script>
  const { avatar, UiTooltip } = window.kiln.utils.components;

  export default {
    props: ['user'],
    methods: {
      selectCollaborator() {
        this.$emit('select', this.user.username);
      }
    },
    components: {
      UiTooltip,
      avatar
    }
  };
</script>
