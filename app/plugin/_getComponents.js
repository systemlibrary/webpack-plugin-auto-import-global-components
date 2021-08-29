const { warn } = require("./_console");

function getComponents(lines, debug) {
    /*
    - export default class <className>
    - export default <className>
    - export class <className>
    - export default const <constName>
    - export default <constName>
    - export const <constName>
    */

    if (!lines || lines.length <= 0) return [];

    const exports = lines.filter(s => s.startsWith("export default") || s.startsWith("export class") || s.startsWith("export const"));

    if (!exports || exports.length <= 0) {
        warn("Could not find any exports, first line in file is: " + lines[0], debug);
        return [];
    }

    const components = [];

    exports.forEach(e => {
        if (e.length > 14) {
            let isDefault = e.includes('default');
            let componentName = e.replace('export default class ', '')
                .replace('export default const ', '')
                .replace('export class ', '')
                .replace('export const ', '')
                .replace('export default ');

            if (componentName && componentName.length > 0) {
                let name = componentName.trimStart().split(' ')[0];
                components.push({ name: name, isDefault: isDefault });
            }
        }
    });

    return components;
};

module.exports = { getComponents };