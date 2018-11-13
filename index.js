const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

function sleeper(ms) {
  return function(x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function launchChromeAndRunLighthouse(url, startingUrl, opts, config = null) {
  return chromeLauncher.launch({startingUrl: startingUrl}).then(sleeper(10000)).then(chrome => {
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
  onlyCategories: ['accessibility'],
  emulatedFormFactor: 'desktop'
};

function writeLine(vendorId, vendor, url, urlType, score, issueKey, itemTitle, itemDescription, impact) {
  return `"${vendorId}","${vendor}","${url}","${urlType}","${score}","${issueKey}","${itemTitle}","${itemDescription}","${impact}",\r\n`
}



function runVendorAudit(vendor, filename) {
  // Setup csv
  let lines = ''

  const startingUrl = vendor.id !== '' ? `https://www.nclive.org/cgi-bin/nclsm?rsrc=${vendor.id}` : null
  const promises = vendor.urls.map(url => {
    return launchChromeAndRunLighthouse(url.url,
      startingUrl, opts).then(results => {
      if (results.runtimeError.code === "NO_ERROR") {
        for (const audit of Object.values(results.audits)) {
          if (audit.score === 0) {
            lines += writeLine(vendor.id, vendor.name, url.url,
                url.type, results.categories.accessibility.score * 100,
                audit.id, audit.title, audit.description,
                audit.details.impact)
          }
        }
      } else {
        lines += writeLine(vendor.id, vendor.name, url, url.type, 0,
            'error',
            'Error with url', results.runtimeError.message, 'none')
      }
    })
  })

  Promise.all(promises).then(() => {
    console.log('file')
    fs.appendFile(`./reports/${filename}.csv`, lines)
  })
  return true
}


const vendors = require('./config.json')
runVendorAudit(vendors[0],'audit')

/*
const date = new Date()
const filename = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}${date.getMinutes()}${date.getSeconds()}.csv`
fs.writeFileSync(`./reports/${filename}.csv`, '')

function loop(i, vendors) {
  setTimeout(() => {
    runVendorAudit(vendors[i], filename)
    if (--i) loop(i, vendors)
  }, 30000)
}

loop(vendors.length - 1, vendors)
*/