const { warn } = require('./_console');

function getGlobalStatement(globalPath, components, existingGlobals, debug) {
    if (components.length <= 0) return [];

    if (!globalPath || globalPath.length <= 1) {
        warn("Global path was not found, but found components count: " + components.length, debug);
        return [];
    }

    let globals = [];

    let parts = globalPath.split('.');
    let parent = 'global.';

    //New up objects on the "globalThis" equal to the folder structure of components
    parts.forEach(part => {
        let tempModule = parent + part;
        parent += part + '.';

        let newModule = tempModule + ' = {};';
        if (existingGlobals.includes(newModule)) {
            warn("Skipping " + newModule + " as it already has been added");
        }
        else {
            if (!globals.includes(newModule))
                globals.push(newModule);
        }
    });

    components.forEach(c => {
        globals.push('global.' + globalPath + '.' + c.name + ' = ' + c.name + ';');
    })

    return globals;
}

module.exports = { getGlobalStatement };