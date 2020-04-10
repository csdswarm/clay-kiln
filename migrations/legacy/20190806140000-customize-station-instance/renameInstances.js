const fs = require('fs'),
	YAML = require('../../../app/node_modules/yamljs'),
	YML = { 'metaTitle': {}, 'metaUrl': {},'metaDescription': {},'sectionFront': {},'moreContentFeed': {} },
	stationFrontRegex = /station\-front\-3$/,
	isObjectLike = require('../../../app/node_modules/lodash/isObjectLike');

Object.keys(YML).forEach(yml => YML[yml] = YAML.load(`${__dirname}/${yml}.yml`));

function recursiveRename (data) {
	if (Array.isArray(data)) {
		data.forEach((item, index) => {
			if (isObjectLike(item)) {
				data[index] = recursiveRename(item);
			}

			if (typeof item === 'string') {
				data[index] = item.replace(stationFrontRegex, 'station-basic-music');
			}
		});
	} else {
		Object.keys(data).forEach((key) => {
			let newKey = key;

			if (key === 'station-front-3') {
				data['station-basic-music'] = data[key];
				delete data[key];

				newKey = 'station-basic-music';
			}

			const item = data[newKey];

			if (isObjectLike(item)) {
				data[newKey] = recursiveRename(item);
			}

			if (typeof item === 'string') {
				data[newKey] = item.replace(stationFrontRegex, 'station-basic-music');
			}
		});
	}

	return data;
}

const renamed = recursiveRename(YML);

Object.keys(renamed).forEach(yml => {
	fs.writeFile(`${__dirname}/renamed_${yml}.yml`, YAML.stringify(renamed[yml], 6, 2), 'utf8', err => {
		if (err) {
			throw err;
		}
	});
});
