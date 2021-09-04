const exit = () => process.exit(1);

const warn = (msg, debug) => {
    if (debug !== false) {
        console.warn('\x1b[33m%s\x1b[0m', "auto-import-global-components tips: " + msg);
    }
}

const success = (msg) => console.log('\x1b[32m%s\x1b[0m', "auto-import-global-components: " + msg);

const error = (msg) => {
    console.error('\x1b[31m%s\x1b[0m', "auto-import-global-components errored: " + msg);
    exit();
}

module.exports = { error, success, warn, exit };