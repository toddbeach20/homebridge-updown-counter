"use strict";

var Service, Characteristic, HomebridgeAPI;

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	HomebridgeAPI = homebridge;
	homebridge.registerAccessory("homebridge-index", "IndexCounter", IndexCounter);
}

const IndexUUID = '000000CE-0000-1000-8000-0026ABCDEF01';
const IndexCharacteristic = function() {
	const char = new Characteristic('Index', IndexUUID);
	char.setProps({
		format: Characteristic.Formats.UINT32,
		perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.PAIRED_WRITE, Characteristic.Perms.NOTIFY],
		minValue: 0,
		maxValue: 100,
		minStep: 1
	});
	char.value = char.getDefaultValue();
	return char;
};
IndexCharacteristic.UUID = IndexUUID;

const IncrementUUID = '000000CE-0000-1050-8000-0026ABCDE201';
const IncrementCharacteristic = function() {
	const char = new Characteristic('Increment', IncrementUUID);
	char.setProps({
		format: Characteristic.Formats.BOOL,
		perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.PAIRED_WRITE, Characteristic.Perms.NOTIFY]
	});
	char.value = char.getDefaultValue();
	return char;
};
IncrementCharacteristic.UUID = IncrementUUID;

const RandomizeUUID = '102000CE-0000-1050-8900-0026ABCDE203';
const RandomizeCharacteristic = function() {
	const char = new Characteristic('Randomize', RandomizeUUID);
	char.setProps({
		format: Characteristic.Formats.BOOL,
		perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.PAIRED_WRITE, Characteristic.Perms.NOTIFY]
	});
	char.value = char.getDefaultValue();
	return char;
};
RandomizeCharacteristic.UUID = RandomizeUUID;

function IndexCounter(log, config) {
	this.log = log;
	this.name = config.name;
	this.max = config.max;
	this.delay = config.delay;
	this.randomizeAfterDelay = config.randomizeAfterDelay;
	this._service = new Service.Switch(this.name);
	this.cacheDirectory = HomebridgeAPI.user.persistPath();
	this.storage = require('node-persist');
	this.storage.initSync({dir:this.cacheDirectory, forgiveParseErrors: true});

	this._service.addCharacteristic(IndexCharacteristic);
	this._service.getCharacteristic('Index').setProps({
		minValue: 0,
		maxValue: this.max
	});
	this._service.getCharacteristic('Index').on('set', this._setCurrentIndex.bind(this));

	this._service.addCharacteristic(IncrementCharacteristic);
	this._service.getCharacteristic('Increment').on('set', this._setIncrement.bind(this));

	this._service.getCharacteristic(Characteristic.On).on('set', this._setIncrement.bind(this));

	this._service.addCharacteristic(RandomizeCharacteristic);
	this._service.getCharacteristic('Randomize').on('set', this._setRandomize.bind(this));

	var cachedState = this.storage.getItemSync(this.name);
	if((cachedState === undefined) || (cachedState === false)) {
		this._service.setCharacteristic('Index', 0);
	} else {
		this._service.setCharacteristic('Index', cachedState);
	}
}

IndexCounter.prototype.getServices = function() {
	return [this._service];
}

IndexCounter.prototype._setCurrentIndex = function(index, callback) {
	this.log("Setting index to " + index);
	this.storage.setItemSync(this.name, index);

	if (this.randomizeAfterDelay) {
		setTimeout(function() {
			this.randomizeAfterDelay = false;
			let newRand = Math.floor(Math.random() * (this.max + 1));
			this._service.setCharacteristic('Index', newRand);
			this.randomizeAfterDelay = true;
		}.bind(this), this.delay);
	}

  	callback();
}

IndexCounter.prototype._setIncrement = function(on, callback) {
	if (on) {
		this.log("Incrementing");

		let currentIndex = this._service.getCharacteristic('Index').value;
		if (currentIndex < this.max) {
			this._service.setCharacteristic('Index', (currentIndex + 1));
		} else {
			this._service.setCharacteristic('Index', 0);
		}

		setTimeout(function() {
			this._service.setCharacteristic('Increment', false);
			this._service.setCharacteristic(Characteristic.On, false);
		}.bind(this), 500);
	}
	callback();
}

IndexCounter.prototype._setRandomize = function(on, callback) {
	if (on) {
		this.log("Randomizing");

		let newRand = Math.floor(Math.random() * (this.max + 1));
		this._service.setCharacteristic('Index', newRand);
		setTimeout(function() {
			this.ignoreRandomize = true;
			this._service.setCharacteristic('Randomize', false);
		}.bind(this), 500);
	}
	callback();
}
