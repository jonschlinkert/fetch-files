
/**
 * Example usage
 */

var Downloader = require('./');
var downloader = new Downloader({destBase: 'foo/bar'});

downloader.preset('github', {
  url: 'https://raw.githubusercontent.com',
  fn: function (preset, config) {
    config.pathname = config.url.split('/').slice(-3).join('_');
    return preset.url;
  }
});

downloader
  .queue('/assemble/assemble/v0.6.0/.verb.md', {preset: 'github'})
  .queue('/jonschlinkert/template/master/.verb.md', {preset: 'github'})
  .queue('/verbose/verb/master/.verb.md', {preset: 'github'})
  .fetch(function (err, res) {
    if (err) console.error(err);
    console.log(res)
  })


