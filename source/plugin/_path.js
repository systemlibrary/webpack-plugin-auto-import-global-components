const fs = require("fs");
const path = require('path');
const { error, warn } = require('./_console');
const { replaceAll } = require('./_functions');

const pathExists = (relativePath, relativeRoot) => {
    let root = path.resolve(__dirname, relativeRoot);
    let absolutePath = path.resolve(root, relativePath);

    let exists = fs.existsSync(absolutePath);
    if (exists)
        return absolutePath;
    return null;
}

const getValidatedAbsolutePath = (relativePath, warnOnFileNotExists, debug) => {
    let absolutePath = pathExists(relativePath, '../') || pathExists(relativePath, '../../') || pathExists(relativePath, '../../../') || pathExists(relativePath, '../../../../');
    if (!absolutePath) {
        if (warnOnFileNotExists === true) {
            warn("Path does not exist: " + relativePath + ", trying to continue...", debug);
        }
        else {
            error("Path does not exist: " + relativePath + " for a configured rule. Note: Folder and files should start with either ./ or just the name. Note: Folders can end with slash or not");
        }
    }
    return absolutePath;
}

const getValidatedAbsolutePaths = (relativePaths, warnOnFileNotExists) => {
    if (!relativePaths || relativePaths === undefined) {
        error("Missing file entries or folders for a configured rule. Make sure each rule looks like: { folders: ['./...'], entries: ['./...'] }");
    }
    let absolutePaths = [];
    relativePaths.forEach(rel => {
        let abs = getValidatedAbsolutePath(rel, warnOnFileNotExists);
        absolutePaths.push(abs);
    });

    return absolutePaths;
}

const convertToRelativeForwardUri = (uri) => {
    let u = replaceAll(uri, '\\', '/');
    if (u.endsWith('/')) {
        u = u.substring(0, u.length - 1);
    }
    if (u.startsWith('.') || u.startsWith('~')) {
        u = u.substring(1);
    }
    return u;
}

module.exports = { getValidatedAbsolutePaths, getValidatedAbsolutePath, convertToRelativeForwardUri };