# auto-import-global-components

## Requirements
- Typescript
- React
- Components must be exported as any of these:
    - export default class <className>
    - export default <className>
    - export class <className>
    - export default const <constName>
    - export default <constName>
    - export const <constName>
- The component's file name cannot start with a _ (underscore), all other ts/tsx files will be scanned
    - ./folder/Banner/Banner.tsx or ./folder/Banner/Index.tsx are two examples of files which will be scanned

## Usage
Automatically searches for exported components in folders you specify through plugin-registration in webpack.config.
- Each component found is added as an import statement in each entry file
- Each component found is added to the globalThis object
- Each component can have multiple exports, such as export const func1, export const func2... will be imported as:
    - import { func1, func2, func3 ... } from './src/functions'
- Each component is then available for server-side rendering through globalThis	
	- Tested via .NET package: React.Web.Mvc4
	
## Latest version
- Fixed: previous v.0.0.5 errored if multiple components inside same folder
- Fixed: if 'clean' is false, the next build would error in duplicated imports, the build will always clean initially
- Adjusted readme

## Install
- npm i auto-import-global-components --save-dev

## Setup
Navigate to webpack.config.js:
```
const autoImportGlobalComponentsPlugin = require('auto-import-global-components');
...
new autoImportGlobalComponentsPlugin({
	debug: true/false, //enable/disable some logging output
	clean: true/false, //enable/disable cleanup of text added to entry files during build
    rules: [{
        folders: ['./src/Components/'], //find all components in this folder and its subfolders
        entries: ['src/index.tsx']      //all found components is gets auto imported in these entries
    }],
})
```

## Example:

### Sample structure
```
Project:
node_modules/...
dist/...
src/Modules/HeroBanner/Index.tsx //contains: export default class HeroBanner...
src/Components/Banner/Banner.tsx //contains: export default const Banner...
src/index.tsx
tsconfig.json
webpack.config.js
```

### webpack.config.js
Navigate to webpack.config.js and add:
#### 1
```
const autoImportGlobalComponentsPlugin = require('auto-import-global-components');
```

#### 2
```
plugins: [
    ...
    new autoImportGlobalComponentsPlugin({
		clean: false,	//false, does not remove the imports/global declarations after build
		debug: true,	//true, outputs more logging info that can be turned off	
		rules: [
			{
			  folders: ['./src/Components/'],
			  entries: ['./src/index.tsx']
			},
			{
			  folders: ['./src/Modules/'],
			  entries: ['./src/index.tsx']
			}
		]
    })
    ...
]
```

### 3
Now during compilation, the src/index.tsx will get some new lines at its very bottom
- Lines will be removed if clean is true, else they will remain in the file

## Future
- Performance enhancements/cache...
- Flag to enable smart import/added to global, if not already a module is imported, then add it, else do nothing...
- Adding more outlog logging in case of hitting errors, or wrong folder/module names...
- Less strict naming conventions for folders/files
	* Currently files must be tsx or ts files
- Smarter adding/removal of imports to entry files, now they are always at bottom...


## Lisence
- MIT