const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
     .then(createWindowsInstaller)
     .catch((error) => {
	     console.error(error.message || error);
	     process.exit(1);
	 })

function getInstallerConfig () {
    console.log('creating windows installer');
    const rootPath = path.join('./');
    const outPath = path.join(rootPath, 'releases');

    return Promise.resolve({
       appDirectory: path.join(outPath, 'builds/win32/'),
       authors: 'boginw',
       noMsi: true,
       outputDirectory: path.join(outPath, 'windows-installer'),
       exe: 'notable.exe',
       setupExe: 'notable_setup.exe'
   });
}