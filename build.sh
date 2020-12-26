#!/bin/bash
rm -rf out
npx electron-forge publish --targets @electron-forge/maker-zip --platform linux
npx electron-forge publish --targets @electron-forge/maker-zip --platform darwin
#electron-forge make --targets @electron-forge/maker-zip --platform win32

npx electron-forge publish --targets @electron-forge/maker-deb --platform linux

npx electron-forge publish --targets @electron-forge/maker-dmg --platform darwin

#electron-forge make --targets @electron-forge/maker-squirrel --platform win32