const fs = require("fs");
const { warn, error } = require('./../functions/_console.js');
const { getAbsolutePaths } = require('./../functions/_path');
const { getFilesInFolder } = require('./../functions/_directory');

function getExportedComponentNames(lines, component, debug) {
    /*
    - export default class <className>
    - export default const <constName>
    - export default function <funcName>
    - export class <className>
    - export function <funcName>
    - export const <constName>
    - export default <name>
    */

    if (!lines || lines.length <= 0) return [];

    const exports = lines.filter(s => s.startsWith("export default ") || s.startsWith("export class ") || s.startsWith("export const ") || s.startsWith("export function "));

    if (!exports || exports.length <= 0) {
        warn("Could not find any exports, first line in file is: " + lines[0], debug);
        return [];
    }

    let exportedComponentNames = [];

    exports.forEach(e => {
        if (e && e.length > 14) {
            let isDefault = e.includes('default');
            let componentName = e
                .replace('export default class ', '')
                .replace('export default const ', '')
                .replace('export default function ', '')
                .replace('export function ', '')
                .replace('export class ', '')
                .replace('export const ', '')
                .replace('export default ', '');

            if (componentName && componentName.length > 0) {
                let name = componentName.trimStart();
                if (name.includes(' ')) {
                    name = name.split(' ')[0];
                }
                if (name.includes('(')) {
                    name = name.split('(')[0];
                }
                if (name[name.length - 1] === ';') {
                    name = name.substring(0, name.length - 1);
                }
                exportedComponentNames.push({ name: name, isDefault: isDefault, path: component });
            }
        }
    });

    if (exportedComponentNames.length > 0) {
        for (var i = 0; i < exportedComponentNames.length - 1; i++) {
            for (var j = i + 1; j < exportedComponentNames.length; j++) {
                if (exportedComponentNames[i] !== null &&
                    exportedComponentNames[j] !== null &&
                    exportedComponentNames[i].name === exportedComponentNames[j].name) {
                    if (exportedComponentNames[i].isDefault === true) {
                        exportedComponentNames[j] = null;
                    } else {
                        exportedComponentNames[i] = null;
                    }
                }
            }
        }
        exportedComponentNames = exportedComponentNames.filter(e => e !== null);
    }

    return exportedComponentNames;
};

const getComponentsForRule = (folders, debug) => {
    const regex = '(\.ts|\.tsx)';

    let components = [];
    folders.forEach(folder => {
        let files = getFilesInFolder(folder, regex, debug);
        files.forEach(file => {
            if (file && !file.startsWith('_')) {
                components.push(file)
            }
        })
    })

    return components
}

const loadComponentsForRules = (rules, debug) => {
    for (var i = 0; i < rules.length; i++) {
        let rule = rules[i];
        if (!rule) {
            continue;
        }
        rule.components = getComponentsForRule(rule.absoluteFolders, debug);
    }
}

const validateRules = (rules, debug) => {
    if (!rules || rules === undefined || rules.length === 0) {
        error("an array of 'rules' is missing in your webpack configuration");
    }
    for (var i = 0; i < rules.length; i++) {
        let rule = rules[i];
        if (!rule) {
            continue;
        }
        if (rule.folders === undefined || !rule.folders || rule.entries === undefined || !rule.entries) {
            error("Missing file entries or folders for a configured rule. Make sure each rule looks like: { folders: ['./...'], entries: ['./...'] }");
        }
        rule.absoluteFolders = getAbsolutePaths(rule.folders, debug);
        rule.absoluteEntries = getAbsolutePaths(rule.entries, debug);
        rule.components = [];
        rule.imports = [];
        rule.globals = [];
        rule.previousComponentsPaths = [];
        rule.previousExportedComponents = [];
        rule.previousImports = [];
        rule.previousGlobals = [];
        rule.cachedImportsAndGlobals = false;
    }
}

const useCachedImportsAndGlobals = (previousExportedComponents, exportedComponents, debug) => {
    if (!previousExportedComponents || previousExportedComponents.length === 0 || !exportedComponents || exportedComponents.length === 0) {
        return false;
    }

    if (previousExportedComponents.length !== exportedComponents.length) {
        return false;
    }

    for (var i = 0; i < exportedComponents.length; i++) {
        if (exportedComponents[i] === null ||
            previousExportedComponents[i] === null ||
            exportedComponents[i].path !== previousExportedComponents[i].path ||
            exportedComponents[i].name !== previousExportedComponents[i].name ||
            exportedComponents[i].isDefault !== previousExportedComponents[i].isDefault) {
            return false
        }
    }

    if (debug) {
        console.log("Reusing from cache imports and globals!");
    }
    return true;
}


const readExistingImports = (text) => {
    if (!text || text.length === 0) {
        return [];
    }
    let lines = []
    if (text !== null) {
        lines = text.split('\n');

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
            lines = lines.filter(line => line !== null && line.length > 0);
        }
    }

    if (lines === undefined || lines === null || lines.length === 0) {
        return [];
    }

    let imports = []

    lines.every(line => {
        if (line.startsWith('import ') === true) {
            imports.push(line);
            return true;
        }
        else {
            if (line.startsWith('//') || line.startsWith('/*') || line.length < 7) {
                return true;
            }
            else {
                return false;
            }
        }
    })

    return imports;
}

const getImports = (imports) => {
    if (!imports || imports.length === 0) {
        return null;
    }

    let res = [];

    imports.forEach(line => {
        if (line.length > 7 && line.includes(' * as ') === false) {     //TODO: Support '* as alias' ... somehow, someway...
            let data = line.replace('import ', '').split('\'');
            let path = data[1];
            let componentNames = data[0].split(' ');                    // "BreadCrumbs, { Show, Hide } from "
            if (componentNames === null || componentNames.length === 0) {
                warn("Could not find component names in line: " + line);
            }
            else {
                let isDefault = true;
                componentNames.every(tmp => {
                    if (tmp === '{') {
                        isDefault = false;
                    }
                    if (tmp !== '{' && tmp !== '}' && tmp !== ',' && tmp !== '') {
                        if (tmp.toLowerCase() === 'from') {
                            return false;
                        }
                        let compName = tmp.replace(',', '');
                        res.push({ path: path, name: compName, isDefault: isDefault });
                    }
                    return true;
                });
            }
        }
    })
    return res;
}

const writeRule = (rule) => {
    cleanRule(rule);

    if (!rule.absoluteEntries) {
        warn("A rule did not have any absolute entries - absolute paths for a rule was not found...");
        return;
    }

    const alreadyImported = (add, existing) => {
        if (!add) {
            return false;
        }
        if (!existing) {
            return false;
        }

        let exists = false;
        existing.every(e => {
            if (e.path === add.path &&
                e.name === add.name &&
                e.isDefault === add.isDefault) {
                exists = true;
                return false;
            }
            return true;
        })
        return exists;
    }

    rule.absoluteEntries.forEach(entry => {
        let content = fs.readFileSync(entry).toString();
        let importLines = readExistingImports(content);

        let existing = getImports(importLines);
        let additional = getImports(rule.imports);

        let importData = '';

        additional.forEach((add, i) => {
            if (alreadyImported(add, existing) === false) {
                if (rule.imports.length > i && rule.imports[i] !== undefined && rule.imports[i] !== null && rule.imports[i] !== '') {
                    importData += rule.imports[i] + '\n';
                }
            }
        });

        let globalData = '';
        if (rule.globals.length > 0) {
            globalData = "\n//auto-import-react-components-plugin globalThis start\n";
            rule.globals.forEach(glo => {
                if (!importLines.includes(glo)) {
                    globalData += glo + '\n';
                }
            })
            globalData += "//auto-import-react-components-plugin globalThis end\n";
        }

        fs.writeFileSync(entry, importData + content + globalData);
        //fs.appendFileSync(entry, globalData);
    });
}

const cleanRule = (rule) => {
    rule.absoluteEntries.forEach(entry => {
        const content = fs.readFileSync(entry, "utf8").toString()

        if (content && content.length > 60) {
            let index = content.indexOf('\n//auto-import-react-components-plugin globalThis start');
            if (index >= 0) {
                fs.writeFileSync(entry, content.substring(0, index));
                //TODO: also search for 'plugin end' after the index, to append those lines again if any.
            }
        }
        warn("Cleaned " + entry);
    });
}


module.exports = { validateRules, loadComponentsForRules, useCachedImportsAndGlobals, getExportedComponentNames, writeRule, cleanRule };