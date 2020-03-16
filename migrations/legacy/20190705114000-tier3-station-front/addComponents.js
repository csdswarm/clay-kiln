const fs = require('fs'),
  YAML = require('yamljs'),
  fetch = require('node-fetch'),
  host = process.argv.slice(2)[0],
  _set = require('../../../app/node_modules/lodash/set');

if (!host) {
  throw new Error('Missing host');
};

const getComponent = async (component, instance) => {
  return {
    [component]: {
      instances: {
        'station-front-3' : await(await fetch(`${host}/_components/${component}/instances/${instance}`)).json()
      }
    }
  };
};

const createYaml = async () => {
  const components = [
    { component: 'meta-title', instance: 'general' },
    { component: 'meta-description', instance: 'general' },
    { component: 'meta-url', instance: 'general' },
    { component: 'section-front', instance: 'new' },
    { component: 'section-lead', instance: 'new' },
    { component: 'more-content-feed', instance: 'section-front' }
  ];

  const componentData = (await Promise.all(components.map(item => getComponent(item.component, item.instance))))
      .reduce((obj, item) => {
          const key = Object.keys(item)[0];

          return { ...obj, [key] : item[key] }
        }, {});

  const componentList = {
    _components: {
      'station-listen-nav': {
        instances: {
          new: {
            featuredLinks: []
          }
        }
      },
      'station-nav': {
        instances: {
          default: {
            primaryLinks: [
              {
                "url": "/",
                "text": "playlist",
                "drawer": false
              },
              {
                "url": "",
                "text": "shows",
                "drawer": true,
                "secondaryLinks": []
              },
              {
                "url": "",
                "text": "contests",
                "drawer": true,
                "secondaryLinks": []
              },
              {
                "url": "",
                "text": "events",
                "drawer": true,
                "secondaryLinks": []
              },
              {
                "url": "",
                "text": "more from station",
                "drawer": true,
                "secondaryLinks": []
              }
            ],
            featuredLinks: [],
            listenNav: {
              _ref: '/_components/station-listen-nav/instances/new'
            }
          }
        }
      },
      ...componentData
    }
  };

  componentList._components['more-content-feed'].instances['station-front-3'].populateFrom = 'all-content';
  componentList._components['more-content-feed'].instances['station-front-3'].sectionFrontManual = '';
  componentList._components['more-content-feed'].instances['station-front-3'].content = [];
  componentList._components['more-content-feed'].instances['station-front-3'].locationOfContentFeed = 'station-front';
  componentList._components['section-front'].instances['station-front-3'].stationsCarousel = [];
  componentList._components['section-front'].instances['station-front-3'].includePodcastModule = false;
  _set(
    componentList._components['section-front'].instances['station-front-3'],
    'moreContentFeed._ref',
    '/_components/more-content-feed/instances/station-front-3'
  );

  const clay = host.split('/')[2];
  const yaml = YAML.stringify(JSON.parse(JSON.stringify(componentList).replace(new RegExp(clay, 'g'), '')), 6, 2);

  fs.writeFile(`${__dirname}/components.yml`, yaml, 'utf8', function (err) {
      if (err) throw err;
    }
  );
}
createYaml();
