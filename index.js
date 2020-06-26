"use strict";

var Service, Characteristic, Formats, Perms, HomebridgeAPI;

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  Formats = homebridge.hap.Formats;
  Perms = homebridge.hap.Perms;
  homebridge.registerAccessory("homebridge-index", "IndexCounter", IndexCounter);
}

function IndexCounter(log, config) {
  this.log = log;
  this.name = config.name;
  this.max = config.max;
  this.time = config.time;
  this._service = new Service('Counter', '000000CE-0000-1000-8000-0026ABCDEF02');
  
  this.cacheDirectory = HomebridgeAPI.user.persistPath();
  this.storage = require('node-persist');
  this.storage.initSync({dir:this.cacheDirectory, forgiveParseErrors: true});
  
  let indexCustomCharacteristic = new Index();
	
  this._service.addCharacteristic(indexCustomCharacteristic);
  indexCustomCharacteristic.on('set', this._setIndex.bind(this));
}

IndexCounter.prototype.getServices = function() {
  return [this._service];
}

IndexCounter.prototype._setIndex = function(index, callback) {

  this.log("Setting index to " + index);
  this.storage.setItemSync(this.name, index);
  setTimeout(function() {
    let newRand = Math.floor(Math.random() * (this.max + 1));
    let indexCustomCharacteristic = new Index();
    let indexCharacteristic = this._service.getCharacteristic(indexCustomCharacteristic);
    this._service.setCharacteristic(indexCharacteristic, newRand);
  }.bind(this), this.time);

  callback();
}
	
class Index extends Characteristic {

  constructor() {
    super('Index', '000000CE-0000-1000-8000-0026ABCDEF01');
    this.setProps({
      format: Formats.UINT32,
      maxValue: 5,
      minValue: 0,
      minStep: 1,
      perms: [Perms.READ, Perms.WRITE, Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  }
}
