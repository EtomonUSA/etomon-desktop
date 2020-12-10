module.exports = {
    "packagerConfig": {
        "icon": "assets/icon",
        "platform": "all",
        executableName: "etomon-desktop"
    },
    "makers": [
        {
            "name": "@electron-forge/maker-squirrel",
            "config": {
                "name": "etomon_electron",
                "platforms": [
                    'win32',
                    // 'darwin',
                    // 'linux'
                ]
            }
        },
        {
            "name": "@electron-forge/maker-zip",
            "platforms": [
                'win32',
                'darwin',
                'linux'
            ]
        },
        {
            name: '@electron-forge/maker-dmg',
            config: {
                format: 'ULFO',
                "platforms": [
                    'darwin'
                ]
            }
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    maintainer: 'Etomon',
                    homepage: 'https://etomon.com',
                }
            },
            "platforms": [
                'linux'
            ]
        }
    ],
    publishers: [
        {
            "name": "@electron-forge/publisher-s3",
            "config": {
                "bucket": "desktop.static.etomon.com",
                "public": true
            }
        },
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'EtomonUSA',
                    name: 'etomon-desktop'
                },
                prerelease: true
            }
        }
    ]
};