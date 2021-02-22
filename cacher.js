const Url = require('url');
const Query = require('querystring');
const  fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const fetch =  require('node-fetch');
const _ = require('lodash');

const msgpack = require('@msgpack/msgpack');

const {
    urls,
    pkg,
    mode,
    siteUri,
    isDev,
    noCache
} = require('./version');

async function get$(url = '/') {
    let homepage = await (await fetch(siteUri+url, { headers: { 'etomon-desktop': 1 } })).text();
    return cheerio.load(homepage);
}

async function getVersion() {
    return await (await fetch(siteUri+'/system/version')).json();
}


async function getVersionKey() { return (await getVersion()).versionKey; }

async function getItem(path) {
    if (noCache || !await fs.pathExists(path))
        return null;

    let data = await fs.readFile(path);
    let meta = await fs.readFile(path+'.etomon-cache-meta');

    return {
        data,
        ...(msgpack.decode(meta))
    };
}

async function putItem(path, item) {
    if (noCache)
        return;
    await fs.ensureFile(path);
    let data = item.data;
    await fs.writeFile(path, data);
    let encodeItem = _.cloneDeep(item);
    delete encodeItem.data;
    await fs.writeFile(path+'.etomon-cache-meta', msgpack.encode(encodeItem));
}

let lastSolidVersionKey;

async function getPathFromCache(url, globalWait = ((() => {}))) {
    url = Url.parse(url);
    let siteUriParsed = Url.parse(siteUri);
    let q = Query.parse(url.query);
    lastSolidVersionKey = q.versionKey || lastSolidVersionKey;
    let versionKey =  q.versionKey || lastSolidVersionKey || await getVersionKey();

    globalWait(true);

    let e, cachedItem;
    try {
        let staticPath = path.join(__dirname, 'assets', 'static');
        await fs.ensureDir(staticPath);
        let cacheDir = path.join(staticPath, versionKey);

        let filePath = path.join(cacheDir, url.pathname);
        let fileKey = filePath;

        let vKeys = (await fs.readdir(path.join(staticPath))).filter(f => f !== versionKey);
        for (let k of vKeys)
            await fs.remove(path.join(staticPath, k));

        cachedItem = await getItem(fileKey);
        if (!cachedItem) {
            let domain = siteUriParsed.host;
            if (siteUriParsed.protocol === ('https:')) {
                url.host = 'assets.static.' + domain;
                url.protocol = siteUriParsed.protocol;
            } else {
                url.host = domain;
                url.protocol = siteUriParsed.protocol
            }

            let finalUrl = Url.format(url);
            let resp = await fetch(finalUrl);

            let mimeType = resp.headers.get('content-type') || 'application/octet-stream';
            mimeType = mimeType.split(';').shift();
            let data = Buffer.from(await (resp).arrayBuffer());

            cachedItem = { mimeType, data };
            await putItem(fileKey, cachedItem)
        }
    } catch (err) { e = err; } finally {
        globalWait(false);
        if (e)
            throw e;
        else
            return cachedItem;
    }
}

async function prepack(pages = [ '/nav' ]) {
    for (let page of pages) {
        let $ = await get$(page);

        let files = $('link[rel="preload"],link[rel="prefetch"]');

        for (let ele of files) {
            let link = $(ele).attr('href') || $(ele).attr('src');
            if (!link || link.indexOf('/file') !== -1 || link.indexOf('public-photos') !== -1) {
                continue;
            }
            try { await getPathFromCache(link); }
            catch (err){}
        }
    }
}

module.exports = { getPathFromCache, prepack, get$ };