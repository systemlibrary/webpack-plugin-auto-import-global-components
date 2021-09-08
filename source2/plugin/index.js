const fs = require("fs");
const { warn, error } = require('./_console');
const { getValidatedAbsolutePaths, convertToRelativeForwardUri } = require('./_path');
const { getAbsoluteModulePaths, readFile } = require('./_file');
const { getImportStatements } = require('./_getImportStatement');
const { getComponents } = require('./_getComponents');
const { getGlobalStatement } = require('./_getGlobalStatement');

const pluginName = 'auto-import-global-components';

const readEntryExistingImports = (entry) => {
    if (!entry || entry.length === 0) {
        return [];
    }

    const lines = readFile(entry);

    if (lines === undefined || lines === null || lines.length === 0) {
        return [];
    }

    let importlines = []

    lines.forEach(line => {
        if (line.includes('import ')) {
            importlines.push(line);
        }
    })

    return importlines;
}

const validateConfiguration = (options) => {
    if (!options || options === undefined || options.length === 0) {
        error("an array of 'rules' is missing in your webpack configuration");
    }

    let options = [];
    options.forEach(option => {
        option.absoluteFolders = getValidatedAbsolutePaths(option.folders);
        option.absoluteEntries = getValidatedAbsolutePaths(option.entries, true);
        option.imports = [];
        option.globals = [];
        options.push(option);
    })

    return options;
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
        let importLines = readEntryExistingImports(entry);

        let data = "\n//auto-global-react-module-plugin start\n";
        rule.imports.forEach(imp => {
            if (!importLines.includes(imp)) {
                data += imp + '\n';
            }
        })

        rule.globals.forEach(glo => {
            if (!importLines.includes(glo)) {
                data += glo + '\n';
            }
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
            } else {
                warn("auto-global-react-module-plugin start was not found, continue...");
            }
        }
    });
}

class AutoImportGlobalComponentsPlugin {
    constructor(options) {
        //compiler.modifiedFiles = {};
        //compiler.watching.suspended = false;
        //compiler.modifiedFiles = {};
        //compiler.options.entry = {};
        this.options = validateConfiguration(options.rules);
        this.options.debug = options.debug;
        this.options.clean = options.clean;
        this.options.isInWatchBuild = false;
        this.options.isInWatchBuildCancel = false;
        this.options.filesChanged = [];

        this.options.forEach(rule => {
            cleanRuleData(rule);
        });

        warn("Configuration validated", this.options.debug);
    }

    apply(compiler) {

        const hooks = compiler.hooks;

        hooks.watchRun.tap("onWatch", (comp) => {
            this.options.isInWatchBuild = true;

            if (comp.modifiedFiles) {
                this.options.filesChanged = Array.from(comp.modifiedFiles, (file) => convertToRelativeForwardUri(`${file}`));
            }

            console.log("on watch: " + this.options.filesChanged.length);
            if (this.options.filesChanged && this.options.filesChanged.length > 0) {
                let filesChangedCount = this.options.filesChanged.length;
                let currentRuleMatchCount = 0;
                this.options.forEach(rule => {
                    if (rule && rule.entries && rule.entries.length > 0) {
                        let entries = rule.entries;
                        entries.forEach(entry => {
                            if (entry && entry.length > 0) {
                                console.log("entry " + entry);

                                this.options.filesChanged.forEach(changed => {
                                    console.log("CHANGED " + changed);
                                    if (entry.startsWith('.')) {
                                        entry = entry.substring(1);
                                    }
                                    if (changed.endsWith(entry)) {
                                        currentRuleMatchCount++;
                                    }
                                })
                            }
                        })
                    }
                })
                console.log(" AAA " + currentRuleMatchCount + " VS " + filesChangedCount);
                this.options.isInWatchBuildCancel = currentRuleMatchCount === filesChangedCount;
            }
        })

        hooks.beforeCompile.tap('onBeforeCompile', () => {
            if (!this.options.isInWatchBuildCancel) {
                this.options.forEach(rule => {
                    fillRuleData(rule, this.options.debug);
                })
                this.options.forEach(rule => {
                    writeRuleData(rule);
                });
                warn("Import rules applied to entry files", this.options.debug);
            }
        })

        hooks.afterEmit.tap('onAfterCompile', () => {
            if (!this.options.isInWatchBuildCancel) {
                if (this.options.clean !== false) {
                    this.options.forEach(rule => {
                        cleanRuleData(rule);
                    });
                    warn("Cleaned up auto-imported rules", this.options.debug);
                } else {
                    warn("Cleaning up is turned off", this.options.debug);
                }
            }
            else {
                warn("Is in watch, cancelling a build...");
            }
            if (this.options.isInWatchBuild) {
                this.options.isInWatchBuild = false;
                //compiler.options.entry = this.options.entry;
            }
            this.options.isInWatchBuildCancel = false;
        });
    }
};

module.exports = AutoImportGlobalComponentsPlugin;