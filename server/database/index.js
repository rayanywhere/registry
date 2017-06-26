const fsx = require('fs-extra');
const fs = require('fs');
const STORAGE_PATH = `${__dirname}/../../data`;
const STORAGE_FILE = `${STORAGE_PATH}/database.json`;

module.exports = class Database {
	constructor() {
		this._mapName2Config = new Map();
		this._mapConfig2Name = new Map();
		if (fs.existsSync(STORAGE_FILE)) {
			let map = require(STORAGE_FILE);
			for (let name in map) {
				this._mapName2Config.set(name, map[name]);
				this._mapConfig2Name.set(map[name].host+':'+map[name.port], name);
			}
		}
	}

	add(name, config) {
		const configKey = config.host + ':' + config.port;
		const oldName = this._mapConfig2Name.get(configKey);
		if (oldName !== undefined) {
			this._mapName2Config.delete(oldName);
		}

		this._mapName2Config.set(name, config);
		this._mapConfig2Name.set(config.host+':'+config.port, name);
		this._save();
	}

	query(name) {
		return this._mapName2Config.get(name);
	}

	_save() {
		fsx.ensureDirSync(STORAGE_PATH);
		let map = {};
		for (let [name, config] of this._mapName2Config) {
			map[name] = config;
		}
		fs.writeFileSync(STORAGE_FILE, JSON.stringify(map, null, 2));
	}
}