/*!
 * fetch-files <https://github.com/jonschlinkert/fetch-files>
 *
 * Copyright (c) 2015 .
 * Licensed under the MIT license.
 */

'use strict';

/* deps:mocha */
var assert = require('assert');
var should = require('should');
var FetchFiles = require('./');
var downloader;

var github = {
  url: 'https://raw.githubusercontent.com',
  fn: function (preset, config) {
    config.pathname = config.url.split('/').slice(-3).join('_');
    return preset.url;
  }
};

describe('fetch-files', function () {
  this.timeout(5000);
  this.slow(1000);

  beforeEach(function () {
    downloader = new FetchFiles({destBase: 'test/actual/fetched'});
  });

  it('should store a preset:', function () {
    downloader.preset('github', github);
    downloader.presets.should.have.property('github');
  });

  it('should use a preset to get a file from github:', function (done) {
    downloader
      .preset('github', github)
      .queue('/verbose/verb/master/.verb.md', {preset: 'github'})
      .fetch(function (err, files) {
        if (err) return done(err);
        assert.equal(files.length, 1);
        done();
      });
  });

  it('should pass each file to the callback:', function (done) {
    downloader
      .preset('github', github)
      .queue('/verbose/verb/master/.verb.md', {preset: 'github'})
      .fetch(function(file) {
        assert.equal(typeof file.dest, 'string');
      }, function (err, files) {
        if (err) return done(err);
        assert.equal(files.length, 1);
        done();
      });
  });

  it('should get multiple files from github:', function (done) {
    downloader
      .preset('github', github)
      .queue('/assemble/assemble/v0.6.0/.verb.md', {preset: 'github'})
      .queue('/jonschlinkert/template/master/.verb.md', {preset: 'github'})
      .queue('/verbose/verb/master/.verb.md', {preset: 'github'})
      .fetch(function (err, files) {
        if (err) return done(err);

        assert.equal(files.length, 3);
        done();
      });
  });
});
