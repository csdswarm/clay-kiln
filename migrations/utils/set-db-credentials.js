'use strict';

const { promisify } = require('util');
const { yamljs:YAML } = require('./base');
const setAwsToken = require('./set-aws-token').v1;
const shell = require('child_process');
const exec = promisify(shell.exec);

/**
 * Determines the current environment, decrypts the private creds from the
 * AWS token (NOTE: requires that AWS token has been set recently), and
 * sets them on process.env.
 *
 * returns process.env if successful, throws if unsuccessful.
 * @param {string} environment: the environment value to decrypt from
 */
async function setDbCredentials_v1(environment) {
  const env = await setAwsToken();

  if(env.AWS_SESSION_TOKEN) {
    // The reason for the reverse assigns, is so that we always take what is in process.env
    // and only assign decrypted db values if none were explicitly set beforehand
    const dbCredentials = {...await decryptCredentials(environment, env), ...process.env };

    return Object.assign(process.env, dbCredentials);
  } else {
    console.error(`Unable to decrypt db credentials for environment:${environment}`);
  }
}

/**
 * Handles decrypting the data and returning the data retrieved.
 * @param {string} targetEnv
 * @param {object} env - process.env with AWS tokens applied
 * @returns {*}
 */
async function decryptCredentials(targetEnv, env) {
  if(targetEnv === 'local') {
    return {
      PGDATABASE: 'clay',
      PGHOST: 'localhost',
      PGPASSWORD: 'example',
      PGUSER: 'postgres',
    }
  }

  const targetDir = `${__dirname}/../../deploy/${targetEnv}`;

  try{
    await exec(`sops --decrypt ${targetDir}/clay-radio.secret.sops.yml > ${targetDir}/unencrypted.yml`, { env });

    const { stringData } = YAML.load(`${targetDir}/unencrypted.yml`);
    const { configmap: { data }} = YAML.load(`${targetDir}/${targetEnv}.values.yml`);
    const { CLAY_STORAGE_POSTGRES_DB, CLAY_STORAGE_POSTGRES_HOST } = data;
    const { CLAY_STORAGE_POSTGRES_USER, CLAY_STORAGE_POSTGRES_PASSWORD } = stringData;

    return {
      PGDATABASE: CLAY_STORAGE_POSTGRES_DB,
      PGHOST: CLAY_STORAGE_POSTGRES_HOST,
      PGPASSWORD: CLAY_STORAGE_POSTGRES_PASSWORD,
      PGUSER: CLAY_STORAGE_POSTGRES_USER,
    };

  } catch(e) {
    console.log('could not get sops data');
  }

}

module.exports = {
  v1: setDbCredentials_v1
}
