const fs = require("fs");
const path = require('path');
const { error } = require('./_console');
const { replaceAll } = require('./_string');

const getRelativeBackwardUri = (uri) => {
    let u = replaceAll(uri, '/', '\\');
    if (u.endsWith('\\')) {
        u = u.substring(0, u.length - 1);
    }
    if (u.startsWith('.') || u.startsWith('~')) {
        u = u.substring(1);
    }
    return u;
}


const getRelativeForwardUri = (uri) => {
    let u = replaceAll(uri, '\\', '/');
    if (u.endsWith('/')) {
        u = u.substring(0, u.length - 1);
    }
    if (u.startsWith('.') || u.startsWith('~')) {
        u = u.substring(1);
    }
    return u;
}

const getAbsolutePath = (relativePath, debug) => {
    const exists = (uri, relative) => {
        let root = path.resolve(__dirname, relative);
        let absolutePath = path.resolve(root, uri);

        let exists = fs.existsSync(absolutePath);
        if (exists)
            return absolutePath;
        return null;
    }
    let absolutePath = exists(relativePath, '../') || exists(relativePath, '../../') || exists(relativePath, '../../../') || exists(relativePath, '../../../../');

    if (!absolutePath) {
        error("Path does not exist: " + relativePath + " for a configured rule. Note: Folder and files should start with either ./ or just the name. Note: Folders can end with slash or not");
    }
    return absolutePath;
}

const getAbsolutePaths = (uri, debug) => {
    if (uri === undefined || !uri) {
        error("Missing file entries or folders for a configured rule. Make sure each rule looks like: { folders: ['./...'], entries: ['./...'] }");
    }

    let paths = [];

    uri.forEach(rel => {
        paths.push(getAbsolutePath(rel, debug));
    });

    return paths;
}

module.exports = { getAbsolutePaths, getAbsolutePath, getRelativeForwardUri, getRelativeBackwardUri };