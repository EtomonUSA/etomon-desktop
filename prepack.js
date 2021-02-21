const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');

let urls = {
    'docker-dev': 'https://dev-etomon.com',
    'local': 'http://localhost:4200',
    'production': 'https://etomon.com'
}

let mode = global.mode = process.env.MODE || 'production';
let siteUri = global.siteUri = process.env.SITE_URI || urls[mode];
let isDev = mode !== 'production';

async function build() {
    let homepage = await (await fetch(siteUri)).text();
    let $ = cheerio.load(homepage);

    let files = $('link[rel="preload"]');

    let css = [], js = [];

    for (let ele of files) {
        let type = $(ele).attr('as');
        let link = $(ele).attr('href');
        let bin = await (await fetch(siteUri+link)).text();
        if (type === 'style') {
            css.push(bin);
        } else if (type === 'script') {
            js.push(bin);
        }
    }

    fs.writeFileSync('./bundle.js', js.join("\n"));
    fs.writeFileSync('./bundle.css', css.join("\n"));

    process.exit(0);
}

build();