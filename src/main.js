const fs = require('fs-extra');
const process = require('process');
const isObject = require('lodash.isobject');
const { buildNpmConfig } = require('./npm');
const { buildMavenConfig } = require('./maven');
const { assignDeep, flattenMap, toPromise } = require('./util');

const NOT_MATCHED_KEYS = ['PLUGIN_IGNORE_BRANCH'];

function buildDefaultConfig() {
  const repoFullName = process.env['DRONE_REPO'] || '';
  const branchName = process.env['DRONE_BRANCH'] || '';
  const ignoreBranch = !!process.env['PLUGIN_IGNORE_BRANCH'];

  const pluginConfig = Object.keys(process.env)
    .filter(key => key.startsWith('PLUGIN_'))
    .filter(key => !NOT_MATCHED_KEYS.includes(key))
    .reduce((memo, key) => {
      const sonarKey = key.toLowerCase().replace('plugin_', 'sonar.');

      let sonarVal = process.env[key];
      if (sonarVal.startsWith('[') || sonarVal.startsWith('{')) {
        sonarVal = JSON.parse(sonarVal);
      } else {
        const valArray = sonarVal.split(',');
        sonarVal = valArray.length > 1 ? valArray : valArray[0];
      }

      memo[sonarKey] = sonarVal;

      return memo;
    }, {});

  const defaultConfig = {
    'sonar.projectKey': (ignoreBranch ? repoFullName : `${repoFullName}:${branchName}`).replace(/\//g, ':'),
    'sonar.projectName': `${repoFullName}${branchName === 'master' ? '' : `:${branchName}`}`,
    'sonar.branch.name': branchName,
    'sonar.login': process.env['SONAR_LOGIN'],
    ...flattenMap(pluginConfig),
  };

  return Object.keys(defaultConfig)
    .filter(key => !!defaultConfig[key])
    .reduce((memo, key) => {
      memo[key] = defaultConfig[key];
      return memo;
    }, {});
}

function serializeConfig(config) {
  if (Array.isArray(config)) {
    return config.join(',');
  } else if (isObject(config)) {
    return Object.keys(config)
      .map(key => `${key}=${serializeConfig(config[key])}`)
      .join('\n');
  } else {
    return config;
  }
}

const defaultConfig = buildDefaultConfig();

async function writeProjectPropertis() {
  let config;
  if (await fs.pathExists('package.json')) {
    config = await buildNpmConfig(defaultConfig);
  } else if (await fs.pathExists('pom.xml')) {
    config = await buildMavenConfig(defaultConfig);
  } else {
    throw new Error('Can not decide project type.');
  }

  return fs.outputFile('sonar-project.properties', serializeConfig(config));
}

module.exports = {
  buildDefaultConfig,
  serializeConfig,
  writeProjectPropertis,
};
