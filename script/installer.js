#!/usr/bin/env node

const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')
const rimraf = require('rimraf')

deleteOutputFolder()
  .then(getInstallerConfig)
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  const rootPath = path.join(__dirname, '..')
  const outPath = path.join(rootPath, 'out')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'Notable-win32-ia32'),
    iconUrl: "https://raw.githubusercontent.com/boginw/notable/master/app/img/logo.ico",
    loadingGif: path.join(rootPath, 'app', 'img', 'loading_inst.gif'),
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    setupExe: 'notableSetup.exe',
    setupIcon: path.join(rootPath, 'app', 'img', 'app.ico'),
    skipUpdateIcon: true
  })
}

function deleteOutputFolder () {
  return new Promise((resolve, reject) => {
    rimraf(path.join(__dirname, '..', 'out', 'windows-installer'), (error) => {
      error ? reject(error) : resolve()
    })
  })
}