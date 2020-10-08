const fs = require('fs'),
  settingsJSON = require(`${__dirname}/settings.json`),
  host = process.argv.slice(2)[0];

if (!host) {
  throw new Error('Missing host');
}

newSettingsJSON = {
  'analysis': settingsJSON[Object.keys(settingsJSON)[0]].settings.index.analysis
};

fs.writeFile(`${__dirname}/settings.txt`, '"settings": ' + JSON.stringify(newSettingsJSON), 'utf8', function(err) {
    if (err) throw err;
  }
);
