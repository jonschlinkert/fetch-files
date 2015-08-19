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
  this.urls = [];
}

FetchFiles.prototype = {
  constructor: FetchFiles,

  /**
   * Store a preset with the given configuration values.
   *
   * ```js
   * downloader.preset('github', {
   *   url: 'https://raw.githubusercontent.com',
   *   fn: function (preset, config) {
   *     config.pathname = config.url.split('/').slice(-3).join('_');
   *     return preset.url;
   *   }
   * });
   * ```
   * @name .preset
   * @param {String} `name` Preset name, e.g. `github`
   * @param {Object} `config`
   * @return {Object} Returns `FetchFiles` for chaining
   * @api public
   */

  preset: function(name, config) {
    if (arguments.length === 1) {
      return this.presets[name];
    }
    this.presets[name] = config;
    return this;
  },

  /**
   * Add a URL to the download queue.
   *
   * ```js
   * downloader.queue('/assemble/assemble/v0.6.0/.verb.md', {preset: 'github'});
   * ```
   * @name .queue
   * @param {String} `url`
   * @param {Object} `config` The configuration to use for the URL.
   * @return {Object} Returns `FetchFiles` for chaining
   * @api public
   */

  queue: function(url, config) {
    this.urls.push(lazy.extend({url: url}, config));
    return this;
  },

  /**
   * Normalize configuration values.
   *
   * @name .config
   * @param {Object} `config` The configuration value to normalize.
   * @return {Object} normalized config object.
   */

  config: function(config) {
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
  },

  /**
   * Fetch all files in the queue.
   *
   * ```js
   * downloader.fetch(function (err, res) {
   *   console.log(res);
   * });
   * ```
   * @name .fetch
   * @param {Function} `cb` callback
   * @return {Object} Returns `FetchFiles` for chaining
   * @api public
   */

  fetch: function(cb, done) {
    if (arguments.length === 1) {
      done = cb;
      cb = function noop() {};
    }

    var queue = this.urls;
    this.urls = [];

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
      cb(config);
      next(null, config);
    }.bind(this), done);
    return this;
  }
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
 * Expose `FetchFiles`
 */

module.exports = FetchFiles;
