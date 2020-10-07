const fs = require('fs'),
  YAML = require('yamljs'),
  fetch = require('node-fetch'),
  _set = require('lodash/set'),
  host = process.argv.slice(2)[0];

if (!host) {
  throw new Error('Missing host');
}

const domain = host.split('/')[2];
const themeRef = {
  _ref: `${domain}/_components/theme/instances/default`
};

const run = async () => {
  const object = {};

  const writeFile = () => {
    fs.writeFile(`${__dirname}/layouts.yml`, YAML.stringify(object, 6, 2), 'utf8', function(err) {
        if (err) throw err;
      }
    );
  };

  const get = async (uri) => {
    const path = uri.charAt(0) === '/' ? uri : `/${uri.split('/').splice(1).join('/')}`;
    const response = await fetch(`${host}${path}`);

    return await response.json();
  };

  const addTheme = async (instance) => {
    const components = await get(instance);

    components.top = [ themeRef, ...components.top ];

    const key = instance.split('/').splice(1).join('.')

    _set(object, key, components)
  };

  const addThemeToEach = async (layout) => {
    const instances = await get(`/_layouts/${layout}/instances`);

    for (const instance of instances) {
      await addTheme(instance);
    }

  };

  // get every version of each layout and add the theme instance as the fist item in top
  const layouts = await get('/_layouts');

  for (const layout of layouts) {
    await addThemeToEach(layout);
  }

  writeFile();
};


run();
