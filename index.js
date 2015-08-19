'use strict';

var path = require('path');
var util = require('util');
var url = require('url');
var lazy = require('lazy-cache')(require);

/**
 * Lazily required module dependencies
 */

lazy('async-each', 'each');
lazy('object.omit', 'omit');
lazy('extend-shallow', 'extend');
lazy('request', 'request');
lazy('write');

/**
 * Create an instance of `FetchFiles` with the given `options`.
 *
 * @param {Object} `options`
 * @api public
 */

function FetchFiles(options) {
  this.options = options || {};
  this.presets = {};
  this._queue = [];
}

/**
 * Store a preset with the given configuration values.
 *
 * @param {String} `name` Preset name, e.g. `github`
 * @param {Object} `config`
 * @return {Object} Returns `FetchFiles` for chaining
 * @api public
 */

FetchFiles.prototype.preset = function(name, config) {
  if (arguments.length === 1) {
    return this.presets[name];
  }
  this.presets[name] = config;
  return this;
};

/**
 * Add a URL to the download queue.
 *
 * @param {String} `url`
 * @param {Object} `config` The configuration to use for the URL.
 * @return {Object} Returns `FetchFiles` for chaining
 * @api public
 */

FetchFiles.prototype.queue = function(url, config) {
  this._queue.push(lazy.extend({url: url}, config));
  return this;
};

/**
 * Normalize configuration values.
 *
 * @param {Object} `config` The configuration value to normalize.
 * @return {Object} normalized config object.
 */

FetchFiles.prototype.config = function(config) {
  var opts = lazy.extend({}, this.options, config);
  opts.destBase = opts.destBase || process.cwd();

  if (opts.preset && this.presets[opts.preset]) {
    var preset = this.presets[opts.preset];

    // if `fn` is defined, use it to resolve the URL to download
    if (typeof preset.fn === 'function') {
      var base = preset.fn.call(this, lazy.omit(preset, 'fn'), opts);
      opts.url = url.resolve(base, opts.url);
    }
  }
  // resolve the destination filepath
  opts.dest = path.resolve(process.cwd(), opts.destBase, opts.pathname);
  return opts;
};

/**
 * Set the dest filepath to use.
 *
 * @param {String} `fp`
 * @return {Object}
 */

FetchFiles.prototype.dest = function(fp) {
  this.options.pathname = fp;
  return this;
};

/**
 * Write a file to disk.
 *
 * @param {String} `fp`
 * @return {Object}
 */

FetchFiles.prototype.write = function(fp) {
  lazy.write.stream(fp);
  return this;
};

/**
 * Fetch all files in the queue.
 *
 * @param {Function} `cb` callback
 * @return {Object} Returns `FetchFiles` for chaining
 * @api public
 */

FetchFiles.prototype.fetch = function(cb) {
  if (typeof cb !== 'function') {
    cb = function noop () {};
  }

  var queue = this._queue;
  this._queue = [];

  lazy.each(queue, function (options, next) {
    var config = this.config(options);
    if (!config.dest) {
      next(new Error('fetch-files needs a dest path.'));
      return;
    }
    if (!config.url) {
      next(new Error('fetch-files needs a url.'));
      return;
    }
    config.contents = lazy.request(config);
    next(null, config);
  }.bind(this), cb);
  return this;
};

/**
 * Static method, exposed as a convenience for
 * inheriting `FetchFiles`.
 *
 * @param {Object} `Ctor`
 * @return {Object}
 */

FetchFiles.extend = function(Ctor) {
  util.inherits(Ctor, FetchFiles);
  lazy.extend(Ctor, FetchFiles);
};

/**
 * Utils
 */

function isFunction (val) {
  return typeof val === 'function';
}

function isObject (val) {
  return val && typeof val === 'object'
    && typeof val !== 'function';
}


/**
 * Expose `FetchFiles`
 */

module.exports = FetchFiles;
