const parse = require('csv-parse');
const fs = require('fs')

const parser = parse({delimiter:"\t"}, (err, csv) => {
  //console.log(vendors)
  const vendors = csv.map(data => {
    let id = data[2].toString()
    id = id.replace('https://www.nclive.org/cgi-bin/nclsm?rsrc=','')
    return {
      name: data[1],
      id: id,
      urls: [
        {
          type: "Landing Page",
          url: data[3]
        },
        {
          type: "Search Results",
          url: data[5]
        },
        {
          type: "Single Item / Other",
          url: data[7]
        }
      ]
    }
  })
  fs.writeFileSync('./config.test.json', JSON.stringify(vendors, null, 2))
})

fs.createReadStream('./reports/vendors.tsv').pipe(parser)
