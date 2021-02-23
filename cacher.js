const Url = require('url');
const Query = require('querystring');
const  fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const fetch =  require('node-fetch');
const _ = require('lodash');
const {XXHash3} = require('xxhash-addon');

const msgpack = require('@msgpack/msgpack');

const {
    urls,
    pkg,
    mode,
    siteUri,
    isDev,
    noCache
} = require('./version')();

async function get$(url = '/') {
    const {
        urls,
        pkg,
        mode,
        siteUri,
        isDev,
        noCache
    } = require('./version')();
    let homepage = await (await fetch(siteUri+url, { headers: { 'etomon-desktop': 1 } })).text();
    return cheerio.load(homepage);
}

async function getVersion() {
    const {
        urls,
        pkg,
        mode,
        siteUri,
        isDev,
        noCache
    } = require('./version')();
    return await (await fetch(siteUri+'/system/version')).json();
}



function quickHash(filePath) {
    const xxhash = new XXHash3(0);
    let buf = Buffer.from(filePath, 'utf8');
    buf = xxhash.hash(buf);
    return buf.toString('base64').replace('=', '').replace('/', '-').replace('\\', '_');
}

function filenames(str) {
    return {
        file: path.join(__dirname, 'assets', 'static', quickHash(str).toString('base64')),
        meta: path.join(__dirname, 'assets', 'static', quickHash(str+'.eto').toString('base64'))
    }
}


async function getVersionKey() { return (await getVersion()).versionKey; }

async function getItem(path) {

    const {
        urls,
        pkg,
        mode,
        siteUri,
        isDev,
        noCache
    } = require('./version')();
    if (noCache || !await fs.pathExists(path))
        return null;

    let { file, meta: metaPath } = filenames(path);

    let data = await fs.readFile(file);
    let meta = await fs.readFile(metaPath);

    return {
        data,
        ...(msgpack.decode(meta))
    };
}

async function putItem(path, item) {
    const {
        urls,
        pkg,
        mode,
        siteUri,
        isDev,
        noCache
    } = require('./version')();
    if (noCache)
        return;

    let { file, meta } = filenames(path);

    await fs.ensureFile(file);
    await fs.ensureFile(meta);
    let data = item.data;
    await fs.writeFile(file, data);
    let encodeItem = _.cloneDeep(item);
    delete encodeItem.data;
    await fs.writeFile(meta, msgpack.encode(encodeItem));
}

let lastSolidVersionKey;

let cdnResource = null

async function getPathFromCache(url, globalWait = ((() => {})), branch = mode) {
    if (url === 'etomon:///') url = 'etomon:///nav';
    if (url.indexOf('/home/home') !== -1 ) url = url.replace('/home/home', '/home');
    const {
        urls,
        pkg,
        mode,
        siteUri,
        isDev,
        noCache
    } = require('./version')();
    url = Url.parse(url, true);
    let siteUriParsed = Url.parse(siteUri);
    let q = (url.query);
    lastSolidVersionKey = q.versionKey || lastSolidVersionKey;
    let versionKey =  (q.versionKey || lastSolidVersionKey || await getVersionKey());

    globalWait(true);

    let e, cachedItem;
    try {
        let staticPath = path.join(__dirname, 'assets', 'static');
        await fs.ensureDir(staticPath);
        let cacheDir = staticPath;

        let filePath = path.join(cacheDir, url.pathname);
        let fileKey = filePath;

        cachedItem = await getItem(fileKey);

        let domain = siteUriParsed.host;
        // if (siteUriParsed.protocol === ('https:') && domain === 'etomon.com') {
        //     url.host = 'assets.static.' + domain;
        //     url.protocol = siteUriParsed.protocol;
        // }
        // else {
        url.host = domain;
        url.protocol = siteUriParsed.protocol

        // }
        let finalUrl = Url.format(url);

        if (cachedItem && cachedItem.versionKey !== versionKey) {
            if (!cachedItem.etag) cachedItem = null;
            let resp = await fetch(finalUrl, {
                headers: {
                    'etomon-desktop': 1
                },
                method: 'HEAD'
            });

            if (resp.status > 399 || resp.headers.get('etag') !== cachedItem.etag) {
                cachedItem = null;
            }
        }

        if (!cachedItem) {
            let resp = await fetch(finalUrl, {
                headers: {
                    'etomon-desktop': 1
                }
            });



            let mimeType = resp.headers.get('content-type') || 'application/octet-stream';
            mimeType = mimeType.split(';').shift();
            let data = Buffer.from(await (resp).arrayBuffer());

            cachedItem = { mimeType, data, etag: resp.headers.get('etag'), versionKey};
            if (resp.status < 400) {
                putItem(fileKey, cachedItem).catch(err => console.error(err.stack));
            }
        }
    } catch (err) { e = err; } finally {
        globalWait(false);
        if (e)
            throw e;
        else
            return cachedItem;
    }
}

async function prepack(pages = [
    '/',
    '/nav'
]) {
    let exclude = new Set();
    for (let page of pages) {
        let $ = await get$(page);

        let files = $('link[rel="preload"],link[rel="prefetch"]');

        for (let ele of files) {
            let link = $(ele).attr('href') || $(ele).attr('src');
            if (exclude.has(link)) continue;
            else exclude.add(link);
            // console.log(link);
            if (!link || link.indexOf('/file') !== -1 || link.indexOf('public-photos') !== -1) {
                continue;
            }
            try { await getPathFromCache(link); }
            catch (err){}
        }
    }
}

module.exports = { getPathFromCache, prepack, get$ };