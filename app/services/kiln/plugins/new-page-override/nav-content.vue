<docs>
This component adds functionality on top of clay-kiln's `lib/nav/new-page.vue`
where most of this code is copied from.  Specifically this component allows the
user to select a station for which the new content will belong to.

If the user only has permissions to create content for a single station, then a
label is displayed showing its name.

If the user doesn't have permissions to create content for any stations, then
a header indicates such.
</docs>

<template>
  <div class="new-page-override">
    <station-select class="new-page-override__station-select" />
    <filterable-list v-if="isAdmin"
      class="new-page-nav"
      :content="pages"
      :secondaryActions="secondaryActions"
      :initialExpanded="initialExpanded"
      filterLabel="Search Page Templates"
      :addIcon="addIcon"
      header="Page Template"
      @child-action="itemClick">
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
</template>

<script>
import _ from 'lodash';
import axios from 'axios';
import { mapGetters } from 'vuex'
import stationSelect from '../../shared-vue-components/station-select'
import StationSelectInput from '../../shared-vue-components/station-select/input.vue'
import {
  editExt,
  htmlExt,
  pagesRoute,
  refProp,
  setItem,
  sortPages,
  uriToUrl
} from './clay-kiln-utils';

const { filterableList } = window.kiln.utils.components;

export default {
  data() {
    const secondaryActions = [],
      { user } = window.kiln.locals,
      canEditTemplate = user.can('update').a('page-template').value;

    if (canEditTemplate) {
      secondaryActions.push({
        icon: 'settings',
        tooltip: 'Edit Template',
        action: this.editTemplate
      });
    }

    return { secondaryActions };
  },
  computed: Object.assign(
    {},
    mapGetters(stationSelect.storeNs, ['selectedStation']),
    {
      isAdmin() {
        return _.get(this.$store, 'state.user.auth') === 'admin';
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
        return _.get(this.$store, 'state.ui.favoritePageCategory');
      },
      pages() {
        let items = _.cloneDeep(_.get(this.$store, 'state.lists[new-pages].items', []));

        return sortPages(items);
      }
    }
  ),
  methods: {
    async itemClick(id, title) {
      const category = _.find(this.pages, category => _.find(category.children, child => child.id === id));

      this.$store.commit('CREATE_PAGE', title);

      await setItem('kiln-page-category', category.id) // save category so it'll be open next time

      //
      // instead of calling store.dispatch('createPage', id), we need to
      //   duplicate most of that functionality in order to call the new
      //   endpoint and include the station.
      //
      // the createPage dispatch code can be found at
      // lib/page-data/actions.js: line 102
      //
      this.$store.dispatch('startProgress', 'save');

      const prefix = _.get(this.$store, 'state.site.prefix'),
        { data: pageBody } = await axios.get(uriToUrl(`${prefix}${pagesRoute}${id}`)),
        { data: newPage } = await axios.post(
          uriToUrl(`${prefix}/create-page`),
          {
            stationSlug: this.selectedStation.slug,
            pageBody
          },
          { withCredentials: true }
        ),
        editNewPageUrl = uriToUrl(newPage[refProp]) + htmlExt + editExt;

      this.$store.dispatch('finishProgress', 'save');
      
      window.location.href = editNewPageUrl;
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
    }
  },
  components: {
    filterableList,
    'station-select': StationSelectInput
  }
};
</script>
