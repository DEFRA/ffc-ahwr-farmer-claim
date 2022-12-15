import { config } from './wdio.conf'

exports.config = {
  ...config,
  ...{
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    exclude: ['./scratch/**'],
    services: [
      ['browserstack', {
        browserstackLocal: true
      }]
    ],
    capabilities: [{
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: config.chromeArgs
      },
      acceptInsecureCerts: true,
      'bstack:options': {
        networkLogs: true,
        consoleLogs: 'info'
      }
    }],

    onPrepare: async function (config, capabilities) {
      console.log('Connecting to BrowserstackLocal')
    },

    onComplete: function (exitCode, config, capabilities, results) {
      console.log('Testing complete, BrowserstackLocal closed')
    }
  }
}
