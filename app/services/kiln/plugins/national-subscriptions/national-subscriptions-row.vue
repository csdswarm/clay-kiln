<template>
  <tr class="DataRow">
    <td :key="configIndex" v-for="(config, configIndex) in rowConfig">
      <div v-if="config.isEditable && config.dataType === String">
        <input class="inputText" type="text" :value="data[config.key]" @change="onDescriptionChange($event, config.key)">
      </div>
      <div v-else-if="config.isEditable && config.dataType === Object">
        <div class="objRow" :key="propIndex" v-for="(value, key, propIndex) in data[config.key]">
          <div class="objProp">
            {{key}}
          </div>
          <div class="objValue">
            <!-- check if array or string -->
            <template v-if="isArray(value)">
              <div class="Array">
                <div class="ArrayItem" :key="itemIndex" v-for="(item, itemIndex) in value">
                  <div class="ItemText">{{item}}</div>
                  <button @click="onRemoveArrayItem(itemIndex, value)">x</button>
                </div>
                <div class="ArrayAddItem">
                  <input type="text" :ref="'newItemInput-'+propIndex" />
                  <button @click="onAddArrayItem(value, propIndex, 'newItemInput-'+propIndex)">+</button>
                </div>
              </div>
            </template>
            <template v-else-if="isString(value)">
              <input class="inputText" type="text" :value="value" @change="onChange($event, data[config.key],[key])">
            </template>
          </div>
        </div>
      </div>
      <div v-else>{{ data[config.key] }}</div>
    </td>
    <td>
      <template v-if="mode === 'create'">
        <button @click="onNew(data)">Create</button>
      </template>
      <template v-else="">
        <button @click="onSave(data)">Save</button>
        <button @click="onDelete(data)">Delete</button>
      </template>
    </td>
  </tr>
</template>


<script>
export default {
  props: [
    'data', 'rowConfig', "mode"
  ],
  methods: {
    isString(value) {
      return (typeof value === 'string' || value instanceof String)
    },
    isArray(value) {
      return (value instanceof Array)
    },
    onDescriptionChange(e, key) {
      this.data[key] = e.target.value;
    },
    onChange(e, filter, filterKey) {
      filter[filterKey] = e.target.value;
    },
    onAddArrayItem(array, propIndex, ref) {
      const input = this.$refs[ref][0];
      array.push(input.value);
      input.value = "";
    },
    onRemoveArrayItem(index, array) {
      array.splice(index, 1);
    },
    onNew(data) {
      this.$emit('onNewDataRow', data);
    },
    onSave(data) {
      this.$emit('onSaveDataRow', data);
    },
    onDelete(data) {
      this.$emit('onDeleteDataRow', data);
    }
  }
}
</script>