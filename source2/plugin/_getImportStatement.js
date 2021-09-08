const { warn, success } = require('./_console');

function getImportStatements(components, importPath, debug) {
    if (!components || components.length <= 0) return [];

    if (!importPath || importPath.length <= 0) {
        warn('importPath is empty while components were found (count: ' + components.length + ')', debug);
    }

    let impDefault = null;
    let defaultComponent = components.find(c => c.isDefault);
    if (defaultComponent) {
        impDefault = 'import ' + defaultComponent.name + " from '" + importPath + "';";
    }
    let imp = null;
    let impComponents = components.filter(c => !c.isDefault);

    impComponents.forEach((c, i) => {
        if (imp === null) {
            imp = 'import { ';
        }
        imp += c.name;
        if (i < impComponents.length - 1) {
            imp += ', ';
        } else {
            imp += ' ';
        }
    })
    if (imp !== null) {
        imp += "} from '" + importPath + "';";
    }
    let imports = [];
    if (impDefault !== null)
        imports.push(impDefault);
    if (imp !== null)
        imports.push(imp);

    return imports;
};

module.exports = { getImportStatements };