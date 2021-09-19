# auto-import-global-components

## Requirements
- Typescript
- React
- Components must be exported as any of these:
    - export default class <className>
    - export default function <funcName>
    - export default const <constName>
    - export class <className>
    - export function <funcName>
    - export const <constName>
    - export default <name>

- The component's file name cannot start with a _ (underscore), all other ts/tsx files will be scanned
    - ./folder/Banner/Banner.tsx or ./folder/Banner/Index.tsx are two examples of files which will be scanned

## Usage
Automatically searches for exported components in folders you specify through plugin-registration in webpack.config.
- Each component found is added as an import statement in each entry file at the very top, if the import statement do not already exists
- Each component found is added to globalThis object making it available for server side rendering
- Each component can have multiple exports, such as export class car, export class user... will be imported as:
    - import { car, user, ... } from './folder/file'
- Each component is then available for server-side rendering through globalThis
	- Tested via .NET package: React.Web.Mvc4

## Latest version
- Supporting the --watch true to avoid infinite looping
- Added some caching in case the same import/exports are to be used to save some looping and reading of files
- Updated readme and docs

## Install
- npm i auto-import-global-components --save-dev

## Setup
Navigate to webpack.config.js:
```
const autoImportGlobalComponentsPlugin = require('auto-import-global-components');
...
new autoImportGlobalComponentsPlugin({
	debug: true/false, //enable/disable some logging output
	clean: true/false, //enable/disable cleanup of "globalThis" added to the entry files, the "import statements" cannot be undone
    rules: [{
        folders: ['./src/Components/'], //find all components in 'Components' folder and its subfolders
        entries: ['src/index.tsx']      //all found components gets imported in these entries, currently supporting only 1 entry file per rule
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
Before compilation the src\index.tsx file will get new import statements at the top of the file, and at the bottom of the file globalThis initialization per component found
- The globalThis initialization can be removed if 'clean' is true

## Future
- Further supporting --watch to avoid double compilation (watch command/plugin and webpack just sucks, no easy way to just "stop watching/resume watching" through the compiler object [looked at compiler.watching and its variables "validate", "suspend", etc...seems like one need to iterate over all watchers...) ]
- Smarter way of adding globalThis to the entry file, which results in removal of "clean" flag
- Supporting multiple entry files (Why? No clue yet)
- Currently reading only ts and tsx files, might support ".js" and ".jsx" too

## Lisence
- Free forever, copy paste as you'd like