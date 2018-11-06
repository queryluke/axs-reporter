const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

function sleeper(ms) {
  return function(x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}

function launchChromeAndRunLighthouse(url, startingUrl, opts, config = null) {
  return chromeLauncher.launch({startingUrl: startingUrl}).then(sleeper(6000)).then(chrome => {
    opts.port = chrome.port;
    return lighthouse(url, opts, config).then(results => {
      // use results.lhr for the JS-consumeable output
      // https://github.com/GoogleChrome/lighthouse/blob/master/typings/lhr.d.ts
      // use results.report for the HTML/JSON/CSV output as a string
      // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
      return chrome.kill().then(() => results.lhr)
    });
  });
}
const opts = {
  onlyCategories: ['accessibility']
};


// Setup csv
const date = new Date()
const filename = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}${date.getMinutes()}${date.getSeconds()}.csv`
let lines = ''


// fs.writeFileSync(`${path}.json`, JSON.stringify(items, null, 2))


const vendors = require('./config.json')

launchChromeAndRunLighthouse("https://fod.infobase.com/p_Home.aspx", "https://www.nclive.org/cgi-bin/nclsm?rsrc=379", opts).then(results => {
  fs.writeFileSync(`./reports/${filename}`, JSON.stringify(results, null, 2))
});

for (const vendor of vendors) {
  for (const url of vendor.urls) {
    // launchChromeAndRunLighthouse(url.url, opts).then(results => {
    //   console.log(results)
    // });
  }
}

/*
First check for results.runtimeError.code === "NO_ERROR"

  "runtimeError": {
    "code": "NO_ERROR",
    "message": ""
  },


Loop through results.audits

Score = 1 = pass
Score = 0 = fail
Store the id, title, and description


Final score = results.categories.accessibility.score
*/

