const fs = require("fs");
const { join } = require('path');

const getFilesInFolder = (folder, regex) => {
    if (folder === undefined || !folder) {
        error("getFilesInFolder() errored, folder argument is undefined or null");
    }

    if (regex !== undefined && regex !== null) {
        if (typeof regex === 'string' || regex instanceof String) {
            regex = new RegExp(regex + '$', 'i');
        }
    }

    const recurse = (root, folder, depth) => {
        let files = [];
        if (depth > 16) {
            return files;
        }


        for (const item of fs.readdirSync(folder)) {
            const uri = join(folder, item);
            if (fs.lstatSync(uri).isDirectory())
                recurse(root, uri, depth++).forEach(subfile => {
                    if (regex !== undefined && regex !== null && regex.test(subfile)) {
                        files.push(subfile)
                    }
                })
            else {
                if (regex !== undefined && regex !== null && regex.test(uri)) {
                    files.push(uri);
                } else {
                    files.push(uri);
                }
            }
        }
        return files;
    }

    return recurse(folder, folder, 0);
}


module.exports = { getFilesInFolder };