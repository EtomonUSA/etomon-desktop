

module.exports = () => {
    let urls = {
        'docker-dev': 'https://dev-etomon.com',
        'local': 'http://localhost:4200',
        'production': 'https://etomon.com',
        'china': 'https://www.etomon.cn'
    }

    let pkg = require('fs-extra').readJsonSync(require('path').join(__dirname, 'package.json'));

    let mode = global.mode = process.env.MODE || (pkg.version.indexOf('-dev') !== -1 ? 'docker-dev' : 'production');
    let siteUri = global.siteUri = process.env.SITE_URI || urls[mode];
    let isDev = mode !== 'production';

    let noCache = process.env.NO_CACHE;

    return  {
        urls,
        pkg,
        mode,
        siteUri,
        isDev,
        noCache
    };
}
