#!/bin/bash

electron-forge publish --targets @electron-forge/maker-zip --platform linux
electron-forge make --targets @electron-forge/maker-zip --platform darwin
#electron-forge make --targets @electron-forge/maker-zip --platform win32

electron-forge make --targets @electron-forge/maker-deb --platform linux

electron-forge make --targets @electron-forge/maker-dmg --platform darwin

#electron-forge make --targets @electron-forge/maker-squirrel --platform win32

electron-forge publish --from-dry-run
