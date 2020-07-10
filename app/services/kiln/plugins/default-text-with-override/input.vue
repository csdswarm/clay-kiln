<docs>
  # `default-text-with-override`
  Provides a text input which gets its default value from the provided field.
  Optionally it allows you to override this value with custom text.

  Dynamic events (subscribed to via kilnjs) do not work on this field due to the
  override behavior

  Note: this input sets a couple properties on the component for internal use
  For example, if this input is assigned to a field 'msnTitle', the following
  fields will be saved onto the component data.

  _msnTitle: {
    shouldOverride: bool
    customText: string
  }

  I know this goes against kiln's pattern of having one input per field, but
  until kiln starts exposing more functionality**, I need these internal fields
  for a good UX

  ** Of course it's possible I'm missing something on how to use kiln to provide
     this functionality.
</docs>

<template>
  <div class="default-text-with-override">
    <h4 class="default-text-with-override__label">{{ schema._label }}</h4>
    <div class="default-text-with-override__value">{{ data }}</div>

    <ui-checkbox v-if="canOverride"
      v-model="shouldOverride"
      class="default-text-with-override__should-override"
      color="accent"
      label="Override the default?"
      :value="shouldOverride"
      @input="updateShouldOverride"
    />
    <div class="ui-textbox__feedback" v-if="canOverride && overrideHelp">
      <div class="ui-textbox__feedback-text">{{ overrideHelp }}</div>
    </div>

    <ui-textbox v-if="canOverride && shouldOverride"
      class="default-text-with-override__custom-text"
      :floatingLabel="true"
      :help="customTextHelp"
      :label="customTextLabel"
      :invalid="isInvalid"
      :value="customText"
      @input="updateCustomText"
      @keydown-enter="closeFormOnEnter"
    />

    <div v-if="errorMessage"
      class="default-text-with-override__error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
  import _get from 'lodash/get';
  import _set from 'lodash/set';

  const {
    fieldHelpers: { getValidationError },
    components: { UiCheckbox, UiTextbox }
  } = window.kiln.utils;

  export default {
    name: 'default-text-with-override',
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        customText: this.getInternalState('customText', this.getDefaultText()),
        shouldOverride: this.getInternalState('shouldOverride', false)
      };
    },
    computed: {
      canOverride() {
        const { permissionToOverride } = this.args;

        if (!permissionToOverride) {
          return true;
        }

        const { user } = window.kiln.locals,
          [action, target] = Object.entries(permissionToOverride)[0];

        return user.can(action, target).value;
      },
      closeFormOnEnter(e) {
        if (e.metaKey || e.ctrlKey) {
          // close form when hitting enter in text fields
          this.$store.dispatch('unfocus');
        }
      },
      customTextHelp() {
        return _get(this.args, 'customText.help');
      },
      customTextLabel() {
        return _get(this.args, 'customText.label', 'Custom Text');
      },
      errorMessage() {
        return getValidationError(
          this.data,
          this.validate,
          this.$store,
          this.name
        );
      },
      isInvalid() {
        return !!this.errorMessage;
      },
      overrideHelp() {
        return _get(this.args, 'overrideCheckbox.help');
      },
      type() {
        const { type } = this.args;

        return !type || type === 'multi-line'
          ? 'text'
          : type;
      },
      validate() {
        const { validate } = this.args;

        if (!validate) {
          return {};
        }

        const { min, max, pattern } = validate;

        return Object.assign(
          {
            requiredMessage: 'A value is required',
            minMessage: `The value must be at least ${min} characters`,
            maxMessage: `The value must be at most ${max} characters`,
            patternMessage: `The value must match the pattern "/${pattern}/ig`
          },
          validate
        );
      },
    },
    methods: {
      getCurrentText() {
        return this.shouldOverride
          ? this.customText
          : this.getDefaultText()
      },
      getComponentData() {
        return this.$store.state.components[this.getUri()];
      },
      getDefaultText() {
        return this.getComponentData()[this.args.defaultField];
      },
      getInternalState(key, defaultVal) {
        return _get(this.getComponentData(), `_${this.name}.${key}`, defaultVal);
      },
      getUri() {
        return this.$store.state.ui.currentForm.uri;
      },
      setInternalState(key, newVal) {
        // all internal state will be held in our vue component's data as well
        //   as in the store.  We'd be able to use getters from the store if
        //   kiln used vuex correctly.
        this[key] = newVal;

        const componentData = this.getComponentData();

        _set(componentData, `_${this.name}.${key}`, newVal);

        this.$store.commit(
          'UPDATE_COMPONENT',
          {
            uri: this.getUri(),
            data: componentData,
            fields: [`_${this.name}`]
          }
        );

        this.updateFieldData();
      },
      updateCustomText(newVal) {
        this.setInternalState('customText', newVal);
      },
      updateFieldData() {
        this.$store.commit(
          'UPDATE_FORMDATA',
          { path: this.name, data: this.getCurrentText() }
        );
      },
      updateShouldOverride(newVal) {
        this.setInternalState('shouldOverride', newVal);
      }
    },
    components: {
      UiTextbox,
      UiCheckbox
    }
  };
</script>
