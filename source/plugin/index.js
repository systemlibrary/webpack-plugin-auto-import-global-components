const fs = require("fs");
const { warn, error } = require('./_console');
const { getValidatedAbsolutePaths, convertToRelativeForwardUri } = require('./_path');
const { getAbsoluteModulePaths, readFile } = require('./_file');
const { getImportStatements } = require('./_getImportStatement');
const { getComponents } = require('./_getComponents');
const { getGlobalStatement } = require('./_getGlobalStatement');

const validateConfiguration = (rules) => {
    if (!rules || rules === undefined || rules.length === 0) {
        error("an array of 'rules' is missing in your webpack configuration");
    }

    let validatedRules = [];
    rules.forEach(rule => {
        rule.absoluteFolders = getValidatedAbsolutePaths(rule.folders);
        rule.absoluteEntries = getValidatedAbsolutePaths(rule.entries, true);
        rule.imports = [];
        rule.globals = [];
        validatedRules.push(rule);
    })

    return validatedRules;
}

const getGlobalPath = (importPath) => {
    if (!importPath) return '';

    let path = '';

    importPath = importPath.replace('./', '');

    let lastIndex = 1;
    if (importPath.endsWith('/')) {
        lastIndex = 2;
    }

    let parts = importPath.split('/');
    parts.forEach((part, i) => {
        if (i < parts.length - lastIndex) {
            path = path + part;
            if (i < parts.length - (lastIndex + 1)) {
                path = path + '.';
            }
        }
    })
    return path;
}

const getImportPath = (rule, absoluteModulePath) => {
    absoluteModulePath = convertToRelativeForwardUri(absoluteModulePath);

    let result = '';

    rule.folders.forEach(folder => {
        folder = convertToRelativeForwardUri(folder);
        if (folder.startsWith("/")) {
            folder = folder.substring(1);
        }
        if (absoluteModulePath.includes(folder)) {
            let relativePath = absoluteModulePath.split(folder)[1];
            let fullRelativePath = folder + relativePath;

            rule.entries.forEach(entryPath => {
                let entryParts = convertToRelativeForwardUri(entryPath).split('/');
                entryParts.forEach(entryPart => {
                    if (fullRelativePath.startsWith(entryPart)) {
                        fullRelativePath = fullRelativePath.replace(entryPart, '');
                        if (fullRelativePath.startsWith('/')) {
                            fullRelativePath = fullRelativePath.substring(1);
                        }
                    }
                })
            })

            let extension = fullRelativePath.split('.').pop();
            let fullRelativeModule = fullRelativePath.replace('.' + extension, '');
            result = './' + fullRelativeModule;
        }
    })
    return result;
}

const fillRuleData = (rule, debug) => {
    rule.folders.forEach((folder, i) => {
        const moduleFiles = getAbsoluteModulePaths(folder);

        moduleFiles.forEach(file => {
            const lines = readFile(file);

            const importPath = getImportPath(rule, file);

            const globalPath = getGlobalPath(importPath);

            const components = getComponents(lines, debug);

            rule.imports = rule.imports.concat(getImportStatements(components, importPath, debug));

            rule.globals = rule.globals.concat(getGlobalStatement(globalPath, components, rule.globals, debug));
        });
    });
}

const writeRuleData = (rule) => {
    rule.absoluteEntries.forEach(entry => {
        let data = "\n//auto-global-react-module-plugin start\n";
        rule.imports.forEach(imp => {
            data += imp + '\n';
        })

        rule.globals.forEach(glo => {
            data += glo + '\n';
        })

        data += "//auto-global-react-module-plugin end\n";

        fs.appendFileSync(entry, data);
    });
}

const cleanRuleData = (rule) => {
    rule.absoluteEntries.forEach(entry => {
        const readFileStream = fs.readFileSync(entry, "utf8");
        const content = readFileStream.toString();

        if (content && content.length > 32) {
            let index = content.indexOf('\n//auto-global-react-module-plugin start');
            if (index >= 0) {
                fs.writeFileSync(entry, content.substring(0, index));
                //TODO: also search for 'plugin end' after the index, to append those lines again if any.
            }
        }
    });
}

class AutoImportGlobalComponentsPlugin {
    constructor(options) {
        this.options = validateConfiguration(options.rules);
        this.options.debug = options.debug;
        this.options.clean = options.clean;

        warn("Configuration validated", this.options.debug);

        this.options.forEach(rule => {
            cleanRuleData(rule);
            console.log(rule.globals);
        });
    }

    apply(compiler) {
        compiler.hooks.compilation.tap("AutoImportGlobalComponentsPlugin", (compilation) => {
            this.options.forEach(rule => {
                fillRuleData(rule, this.options.debug);
            })

            this.options.forEach(rule => {
                writeRuleData(rule);
            });
            warn("Import rules applied to entry files", this.options.debug);
        });

        compiler.hooks.afterEmit.tap('AfterCompile', (compiliation) => {
            if (this.options.clean !== false) {
                this.options.forEach(rule => {
                    cleanRuleData(rule);
                    console.log(rule.globals);
                });
                warn("Cleaned up auto-imported rules", this.options.debug);
            } else {
                warn("Cleaning up is turned off", this.options.debug);
            }
        });
    }
};

module.exports = AutoImportGlobalComponentsPlugin;