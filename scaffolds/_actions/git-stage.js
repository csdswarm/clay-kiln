'use strict'

const
  { exec } = require('child_process'),
  { promisify } = require('util'),

  shell = promisify(exec);

module.exports = plop => {

  plop.setActionType('gitStage', async (answers, { paths }, plop) => {

    for (const path of paths) {
      const targetPath = plop.renderString(path, answers);
      console.log(`staging ${ targetPath }`);

      const { stdErr } = await shell(`git add ${ targetPath }`);

      if (stdErr) {
        console.error(stdErr);
      }
    }

    return 'Finished staging files to git.';
  });
}
