/**
 * Babel config
 *
 * @type {import('@babel/core').ConfigFunction}
 */
module.exports = function (api) {
  const browserslistEnv = !api.env('test')
    ? 'production'
    : 'node'

  return {
    presets: [
      ['@babel/preset-env', {
        browserslistEnv
      }]
    ]
  }
}