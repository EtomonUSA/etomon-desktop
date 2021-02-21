node ./prepack.js
npx electron-forge publish --targets @electron-forge/maker-zip --platform win32
npx electron-forge publish --targets @electron-forge/maker-squirrel --platform win32