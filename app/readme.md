# Frontend

## Building and running on localhost
- npm i
- npm run build
- view the dist folder that it is built properly

## Production Build
- npm run prod

## Running
- "npm run server" hosts a index.html
- the html-file have includes all needed dist/* files manually in its head tag
- adjust the index.html to load the component/module/feature youre working on


## AutoImportGlobalComponentsPlugin Configuration Options

new autoImportGlobalComponentsPlugin({
    clean: false,
    debug: true,
    rules: [
    {
        folders: ['./src/Modules/'],
        entries: ['./src/index.tsx']
    },
    ],
})