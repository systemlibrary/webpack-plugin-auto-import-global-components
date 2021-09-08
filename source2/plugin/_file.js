const fs = require("fs");
const path = require('path');
const { join } = require('path');
const { error } = require('./_console');

const getAbsoluteFilePathsRelative = (root, folder, regex) => {
    const files = [];

    for (const item of fs.readdirSync(folder)) {
        const fullFolderPath = join(folder, item);
        if (fs.lstatSync(fullFolderPath).isDirectory())
            getAbsoluteFilePathsRelative(root, fullFolderPath).forEach(subfile => files.push(subfile))
        else {
            if (regex && regex.test(fullFolderPath)) {
                files.push(fullFolderPath);
            } else {
                files.push(fullFolderPath);
            }
        }
    }
    return files;
}

const getAbsoluteFilePaths = (folder, regex) => {
    if (folder === undefined || !folder) {
        error("Folder is not specified for getAbsoluteFilePaths");
    }

    if (regex) {
        if (typeof regex === 'string' || regex instanceof String) {
            regex = new RegExp(regex, 'g');
        }
    }

    return getAbsoluteFilePathsRelative(folder, folder, regex);
}

const getAbsoluteModulePaths = (folder) => {
    const regex = new RegExp('.*(\.ts|\.tsx)$', 'g');

    const files = getAbsoluteFilePaths(folder, regex);

    const result = [];
    files.forEach(file => {
        let relativeFolderPath = file.replace(folder, '').split('.')[0];
        let parts = relativeFolderPath.split('\\');
        if (!parts || parts.length <= 1) {
            parts = parts.split('/');
        }
        let partCount = parts.length;
        let moduleName = parts[partCount - 1].toLowerCase();
        if (!moduleName.startsWith('_') && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            result.push(file);
        }
    });

    return result;
}

const readFile = (file) => {
    const fileStream = fs.readFileSync(file, "utf8");

    if (fileStream !== null) {
        const lines = fileStream.toString().split("\n");

        if (lines !== null && lines.length > 0) {
            for (var i = 0; i < lines.length; i++) {
                lines[i] = lines[i].trimStart();
            }
            return lines;
        }
    }

    return [];
}

module.exports = { getAbsoluteModulePaths, getAbsoluteFilePaths, readFile };