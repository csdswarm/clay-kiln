const {
  _set,
  _unset,
  clayExport,
  clayImport,
  parseHost,
  prettyJSON,
} = require('../../utils/migration-utils').v1;

const {message, url} = parseHost(process.argv[2]);

async function start() {
  console.log('\n\nStarting migration for: ON-1541-HOTFIX-LATEST-RECIRC-POPULATE-FROM\n');
  console.log(message);

  const {result, data, params, error} = await clayExport({componentUrl: `${url}/_components/latest-recirculation/instances/new`});

  let notice;

  if (result === 'success') {
    _unset(data, '_components.latest-recirculation.instances.new.populateBy');
    _set(data, '_components.latest-recirculation.instances.new.populateFrom', 'section-front');

    const {result, params, error} = await clayImport({payload: data, hostUrl: url});

    if (result === 'fail') {
      notice = {when: 'on import', params, error};
    }
  } else {
    notice = {when: 'on export', params, error};
  }
  if (notice && notice.error) {
    console.error(
      'There was a problem updating the latest-recirculation component:\n',
      prettyJSON(notice)
    );
  } else {
    console.log('updated latest-recirculation successfully');
  }
}

start()
  .then(() => console.log('\nFinished\n'))
  .catch(console.error);
