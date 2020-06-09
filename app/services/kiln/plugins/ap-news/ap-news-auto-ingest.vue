<template>
  <div>
    <h1>AP News Auto Ingest</h1>
    <table>
      <thead>
        <tr>
          <td>stub</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>stub</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script>

  const mockSubscriptions = [
    {
      id: 1,
      data: {
        stationSlug: 'kabc',
        entitlements: [
            {id: '42200', name: 'AP Top News - Business Headlines'},
            {id: '42201', name: 'AP Top News - Entertainment Headlines'},
            {id: '42202', name: 'AP Top News - International Headlines'}
        ]},
        mappings: [
          {sectionFront: 'music', secondarySectionFront: 'rock'}
        ]
      }
  ]

  class ApSubscription {
    constructor () {

    }
  }

  export default {
    data() {
      return {
        subscriptions: [...mockSubscriptions]
      }
    },
    mounted() {
      console.log('hi!')
    },
    methods: {
      getApNewsSubscriptions () {

      },
      createApNewsSubscription () {

      },
      updateApNewsSubscription () {

      },
      deleteApNewsSubscription () {

      }
    },
  }
</script>