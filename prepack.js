require('./cacher').prepack()
    .then(() => process.exit(0))
    .catch(err => console.error(err.stack) && process.exit(1))