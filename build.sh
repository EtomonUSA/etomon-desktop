#!/bin/bash

rm -rf out assets/static

node ./prepack.js

npx electron-forge publish --targets @electron-forge/maker-dmg --platform darwin
npx  electron-forge publish --targets @electron-forge/maker-zip --platform darwin
npx electron-forge publish --targets @electron-forge/maker-zip --platform linux
#electron-forge make --targets @electron-forge/maker-zip --platform win32

npx electron-forge publish --targets @electron-forge/maker-deb --platform linux


#electron-forge make --targets @electron-forge/maker-squirrel --platform win32

