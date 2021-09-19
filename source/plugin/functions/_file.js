const fs = require("fs");

const read = (file, debug) => {
    const text = fs.readFileSync(file, "utf8");

    if (text !== null) {
        let lines = text.split('\n');

        if (lines !== null && lines.length > 0) {
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].length === 0 || lines[i] === '\r\n' || lines[i] === '\r' || lines[i] === '\t') {
                    lines[i] = null;
                } else {
                    if (lines[i].length > 7) {
                        if (lines[i][0] === ' ') {
                            lines[i] = lines[i].trimStart();
                        } else if (lines[i][0] === '\t') {
                            lines[i] = lines[i].replace('\t', '');
                        }
                    }
                }
            }
            return lines.filter(line => line !== null && line.length > 0);
        }
    }

    return [];
}

module.exports = { read };