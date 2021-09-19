const { success, warn, error } = require('./functions/_console');
const { getRelativeForwardUri, getRelativeBackwardUri } = require('./functions/_path');
const { validateRules, loadComponentsForRules, useCachedImportsAndGlobals, getExportedComponentNames, writeRule, cleanRule } = require('./components/_rules');
const { read } = require('./functions/_file');
const { getImportStatements } = require('./_getImportStatement');
const { getGlobalStatement } = require('./_getGlobalStatement');

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

const getComponentFolderPath = (component, folders) => {
    let result = null;
    if (!folders || folders.length === 0) {
        return result;
    }
    folders.every(folder => {
        folder = getRelativeBackwardUri(folder);
        if (folder.startsWith("/")) {
            folder = folder.substring(1);
        }
        if (component.includes(folder)) {
            result = folder;
            return false;
        }
    })
    return result;
}

const getComponentImportPath = (component, rule) => {
    let componentFolderPath = getComponentFolderPath(component, rule.folders);
    if (componentFolderPath === null) {
        warn("Could not find folder of " + component);
        return null;
    }
    let relativePath = component.split(componentFolderPath)[1].split('.')[0];


    let fullRelativePath = componentFolderPath + relativePath;

    if (fullRelativePath.startsWith('\\') === true) {
        fullRelativePath = fullRelativePath.substring(1);
    }

    if (rule.entries.length > 1) {
        error("rule.entries contains more than 1 entry with first entry: " + rule.entries[0] + ". We currently support only one entry even though its an array");
    }

    rule.entries.forEach(entryPath => {
        let entryParts = getRelativeBackwardUri(entryPath).split("\\");
        entryParts.every(entryPart => {
            if (entryPart.length > 0) {
                if (fullRelativePath.startsWith(entryPart)) {
                    fullRelativePath = fullRelativePath.replace(entryPart, '');
                }
                else {
                    return false;
                }
            }
            return true;
        })
    })

    return "." + getRelativeForwardUri(fullRelativePath);
}

const getExportedComponentsFullPaths = (components, debug) => {
    let exportedComponents = [];
    components.forEach((component, i) => {
        const lines = read(component, debug);
        if (lines && lines.length > 1) {
            exportedComponents = exportedComponents.concat(getExportedComponentNames(lines, component, debug));
        }
    });
    return exportedComponents;
}

const loadImportsAndGlobalsForRule = (rule, debug) => {
    let components = rule.components;

    let exportedComponents = getExportedComponentsFullPaths(components, debug);

    if (useCachedImportsAndGlobals(rule.previousExportedComponents, exportedComponents, debug)) {
        rule.imports = rule.previousImports;
        rule.globals = rule.previousGlobals;
        rule.cachedImportsAndGlobals = true;
    }
    else {
        rule.imports = [];
        rule.globals = [];
        exportedComponents.forEach(component => {
            const importPath = getComponentImportPath(component.path, rule);

            const filteredComponents = exportedComponents.filter(x => x.path === component.path);

            rule.imports = rule.imports.concat(getImportStatements(filteredComponents, importPath, rule.imports, debug));

            const globalPath = getGlobalPath(importPath);
            rule.globals = rule.globals.concat(getGlobalStatement(globalPath, filteredComponents, rule.globals, debug));
        })
    }

    rule.previousExportedComponents = exportedComponents;
    rule.previousGlobals = rule.globals;
    rule.previousImports = rule.imports;
}

const loadGlobalsAndImportsForRules = (options) => {
    let debug = options.debug;
    let rules = options.rules;

    loadComponentsForRules(rules);

    rules.forEach((rule, i) => {
        loadImportsAndGlobalsForRule(rule, debug);
    })
}

class AutoImportGlobalComponentsPlugin {
    previousRun = {
        imports: [],
        globals: []
    }

    constructor(options) {
        validateRules(options.rules);
        this.options = options;
        this.options.isInWatchBuild = false;
        this.options.filesChanged = [];
        this.options.isInWatchBuildCancel = false;

        success("configuration validated");
    }

    apply(compiler) {
        const hooks = compiler.hooks;

        hooks.watchRun.tap("onWatch", (comp) => {
            //let watching = compiler.watching.watchOptions;

            this.options.isInWatchBuild = true;

            if (comp.modifiedFiles) {
                this.options.filesChanged = Array.from(comp.modifiedFiles, (file) => getRelativeForwardUri(`${file}`));
            }

            if (this.options.filesChanged && this.options.filesChanged.length > 0) {
                let filesChangedCount = this.options.filesChanged.length;
                let currentRuleMatchCount = 0;
                this.options.rules.forEach(rule => {
                    if (rule && rule.entries && rule.entries.length > 0) {
                        let entries = rule.entries;
                        entries.forEach(entry => {
                            if (entry && entry.length > 0) {
                                this.options.filesChanged.forEach(changed => {
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
                this.options.isInWatchBuildCancel = currentRuleMatchCount === filesChangedCount;
            }
        })

        hooks.beforeCompile.tap('onBeforeCompile ', () => {
            if (this.options.isInWatchBuildCancel) {
                return;
            }

            loadGlobalsAndImportsForRules(this.options);

            this.options.rules.forEach(rule => {
                writeRule(rule);
            })
            warn("Import rules applied to entry files", this.options.debug);
        })

        hooks.done.tap('onDone ', () => {
            this.options.isInWatchBuildCancel = false;
            this.options.isInWatchBuild = false;
            if (this.options.isInWatchBuildCancel) {
                return;
            }

            if (this.options.clean === true) {
                this.options.rules.forEach(rule => {
                    cleanRule(rule);
                });
            }
        })
    }
}

module.exports = AutoImportGlobalComponentsPlugin;