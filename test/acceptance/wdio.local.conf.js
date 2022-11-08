import { config } from './wdio.conf'

exports.config = {
  ...config,
  ...{
    //services: ['chromedriver'],
    capabilities: [{
      maxInstances: 1,
      pageLoadStrategy: 'none',
      acceptInsecureCerts: true,
      outputDir: config.outputDir,
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: config.chromeArgs
      }
    }],

    onPrepare: async function (config, capabilities) {
      console.log('Connecting to Local')
    },

    onComplete: function (config, capabilities, results) {
      console.log('Testing complete, Browser closed')
    }
  }
}
