<docs>
  This component adds functionality on top of clay-kiln's `lib/nav/new-page.vue`
  where most of this code is copied from.  Specifically this component allows a
  user to filter the page list by station.

  1. a station in the context of the 'new-pages' list is a template category
     with a 'stationCallsign' property
  2. if a category exists that isn't a station then it's assumed to be the
     national station
  3. if a user can only access one station then no dropdown is shown.  This is
     determined by the number of 'new-pages' with a 'stationCallsign'
</docs>

<template>
  <div class="new-page-override">
    <div class="new-page-override__station-select" v-if="stationIsSelectable">
      <ui-select
        class="station-select"
        has-search
        label="Select a station"
        placeholder="Search a station"
        :options="stationSelectItems"
        v-model="selectedStation"
      ></ui-select>
    </div>
    <div v-if="anyPagesExist">
      <filterable-list v-if="isAdmin"
        class="new-page-nav"
        :content="pages"
        :secondaryActions="secondaryActions"
        :initialExpanded="initialExpanded"
        filterLabel="Search Page Templates"
        :addTitle="addTitle"
        :addIcon="addIcon"
        header="Page Template"
        @child-action="itemClick"
        @add="addTemplate">
      </filterable-list>
      <filterable-list v-else
        class="new-page-nav"
        :content="pages"
        :initialExpanded="initialExpanded"
        filterLabel="Search Page Templates"
        header="Page Template"
        @child-action="itemClick">
      </filterable-list>
    </div>
    <h3 class="new-page-override__no-permissions-notification" v-else>
      You don't have permissions to create a&nbsp;page
    </h3>
  </div>
</template>

<script>
import _ from 'lodash';
import { editExt, htmlExt, pagesRoute, setItem, sortPages, uriToUrl } from './clay-kiln-utils';

const { filterableList, UiSelect } = window.kiln.utils.components,
  nationalStationSelectItem = { value: 'NATL-RC', label: 'National' };

export default {
  created() {
    this.selectedStation = this.stationSelectItems.includes(nationalStationSelectItem)
      ? nationalStationSelectItem
      : stationSelectItems[0];
  },
  data() {
    return {
      selectedStation: {},
      secondaryActions: [{
        icon: 'settings',
        tooltip: 'Edit Template',
        action: this.editTemplate
      }, {
        icon: 'delete',
        tooltip: 'Remove Template',
        action: this.removeTemplate
      }]
    };
  },
  computed: {
    allPages() {
      return _.get(this.$store, 'state.lists[new-pages].items', []);
    },
    anyPagesExist() {
      return !!this.allPages.length;
    },
    isAdmin() {
      return _.get(this.$store, 'state.user.auth') === 'admin';
    },
    addTitle() {
      return _.get(this.$store, 'state.ui.metaKey') ? 'Duplicate Current Page' : 'Add Current Page To List';
    },
    addIcon() {
      return _.get(this.$store, 'state.ui.metaKey') ? 'plus_one' : 'add';
    },
    initialExpanded() {
      // the page list will open to the last used category. this is:
      // 1. the category that the last page was created from
      // 2. the category that the last page was added to
      // 3. the category that the last page was removed from
      // this provides a more seamless edit experience with less clicking around
      // for common actions, and allows users to immediately view the results
      // of their (adding / removing) actions
      return this.nationalIsSelected
        ? _.get(this.$store, 'state.ui.favoritePageCategory')
        : this.stationCallsignToCategoryId[this.selectedStation.value]
    },
    nationalIsSelected() {
      return this.selectedStation.value === nationalStationSelectItem.value;
    },
    pages() {
      const stationPages = this.stationIsSelectable
        ? this.allPages.filter(this.bySelectedStation)
        : this.allPages;

      return sortPages(_.cloneDeep(stationPages));
    },
    stationIsSelectable() {
      return this.stationSelectItems.length > 1
    },
    stationSelectItems() {
      const items = _.get(this.$store, 'state.lists[new-pages].items', [])
        .filter(({ stationCallsign }) => stationCallsign)
        .map(({ stationCallsign }) => ({
          label: stationCallsign,
          value: stationCallsign
        })),
        { user } = window.kiln.locals;

      if (user.can('access').the('station').at(nationalStationSelectItem.value)) {
        items.push(nationalStationSelectItem);
      }

      return _.sortBy(items, 'label');
    },
    stationCallsignToCategoryId() {
      return _.get(this.$store, 'state.lists[new-pages].items', [])
        .filter(({ stationCallsign }) => stationCallsign)
        .reduce(
          (result, { id, stationCallsign }) => _.set(result, stationCallsign, id),
          {}
        )
    }
  },
  methods: {
    bySelectedStation({ id, stationCallsign }) {
      return stationCallsign === this.selectedStation.value
        || (this.nationalIsSelected && !stationCallsign);
    },
    itemClick(id, title) {
      const category = _.find(this.pages, category => _.find(category.children, child => child.id === id));

      this.$store.commit('CREATE_PAGE', title);

      return setItem('kiln-page-category', category.id) // save category so it'll be open next time
        .then(() => this.$store.dispatch('createPage', id).then(url => window.location.href = url));
    },
    editTemplate(id) {
      const prefix = _.get(this.$store, 'state.site.prefix');

      window.location.href = uriToUrl(`${prefix}${pagesRoute}${id}${htmlExt}${editExt}`);
    },
    removeTemplate(id, title) {
      this.$store.dispatch('openConfirm', {
        title: 'Confirm Template Removal',
        text: `Remove the "${title}" template from this list? This cannot be undone.`,
        button: 'Yes, Remove Template',
        onConfirm: this.onDeleteConfirm.bind(this, id)
      });
    },
    onDeleteConfirm(id) {
      let currentCategoryID;

      return this.$store.dispatch('updateList', {
        listName: 'new-pages',
        fn: (items) => {
          let currentCategoryIndex,
            currentCategory,
            currentIndex;

          items = sortPages(items);
          currentCategoryIndex = _.findIndex(items, item => _.find(item.children, child => child.id === id));
          currentCategory = items[currentCategoryIndex];
          currentIndex = _.findIndex(currentCategory.children, child => child.id === id);

          // remove page from the category it's inside
          currentCategory.children.splice(currentIndex, 1);

          // set the category that should be expanded after we save this
          // note: the category may be removed (below) if the last child is removed
          currentCategoryID = currentCategory.id;

          // if the category doesn't contain any children anymore, remove it
          if (_.isEmpty(currentCategory.children)) {
            items.splice(currentCategoryIndex, 1);
          }

          return items;
        }
      }).then(() => this.$store.commit('CHANGE_FAVORITE_PAGE_CATEGORY', currentCategoryID));
    },
    addTemplate() {
      const isMetaKeyPressed = _.get(this.$store, 'state.ui.metaKey'),
        uri = _.get(this.$store, 'state.page.uri'),
        currentPageID = uri.match(/pages\/([A-Za-z0-9\-]+)/)[1];

      if (isMetaKeyPressed) {
        this.$store.commit('CREATE_PAGE', currentPageID);

        return this.$store.dispatch('createPage', currentPageID)
          .then(url => window.location.href = url);
      } else {
        this.$store.dispatch('openModal', {
          title: 'Add Page Template',
          type: 'add-page'
        });
      }
    }
  },
  components: {
    'filterable-list': filterableList,
    'ui-select': UiSelect
  }
};
</script>
