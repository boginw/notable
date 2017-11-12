import IPlugin from "./IPlugin";
import MetaPlugin from "./MetaPlugin";

const { app } = require('electron').remote; // native electron module
const path = require('path');
const async = require('async');
const fs = require('fs');
const downloadNpmPackage = require('download-npm-package');
const npmRun = require('npm-run');
const userData = app.getPath('userData');

export default class PluginInstaller {
	private context: { pluginsDir: any; sharedContext: any };

	public constructor(sharedContext) {
		this.context = {
			pluginsDir: path.join(userData, 'plugins'),
			sharedContext: sharedContext
		};
	}

	public installPlugin(plugin: MetaPlugin, addToConfig:boolean = false): Promise<IPlugin> {
		return new Promise<IPlugin>(
			(resolve: (value: IPlugin) => void, reject: (msg: string) => any) => {
				this.getPluginPackage(plugin).then((value:MetaPlugin)=>{
					return this.npmInstallPlugin(value);
				}).then((val:IPlugin)=>{
					if(addToConfig){
						this.addToPluginConfig(plugin);
					}
					resolve(val);
				}).catch((err:string) => {
					reject(err);
				});
			});
	}

	private addToPluginConfig(plugin: MetaPlugin): Promise<void>{
		return new Promise<void>((resolve, reject) => {
			let configPath = path.join(userData, 'config.json');
			fs.readFile(configPath, { encoding: 'utf8' }, (err, contents) => {
				let config = JSON.parse(contents);
				if(plugin.version == undefined){
					plugin.version = "latest";
				}
				config.plugins[plugin.name] = plugin.version;
				fs.writeFile(configPath, JSON.stringify(config), (err) => {
					if (err) {
						reject("Cannot create config.json file due to: " + err);
					}
					resolve();
				});
			});
		});
	}

	private npmInstallPlugin(plugin: MetaPlugin): Promise<IPlugin> {
		let main: string = plugin.config.main,
			name: string = plugin.name,
			version: string = plugin.version,
			pluginFolder: string = path.join(this.context.pluginsDir, name),
			cmd: string = "",
			args: string[] = [];

		return new Promise<IPlugin>((resolve: (value: IPlugin) => void, reject: (msg: string) => any) => {
			fs.access(path.join(pluginFolder, "node_modules"), fs.constants.R_OK, (err: string) => {
				// if the folder already exists we don't want to run npm install. We 
				// would much rather save a few seconds. So we just run empty command
				if (err) {
					cmd = 'npm';
					args = ["install"];
					let child = npmRun.spawn(cmd, args, { cwd: pluginFolder });
					// Wait for spawn to exit
					child.on('exit', (code) => {
						this.npmInstallPlugin(plugin).then((val:IPlugin)=>{
							resolve(val);
						});
					});
				} else {
					let Plugin = require(path.resolve(pluginFolder, main));
					let mod: IPlugin = new Plugin(this.context.sharedContext);
					resolve(mod);
				}
			});
		});
	}

	private getPluginPackage(plugin: MetaPlugin): Promise<MetaPlugin> {
		let packagePath = path.join(this.context.pluginsDir, plugin.name, 'package.json');
		
		return new Promise<MetaPlugin>(
			(resolve: (value: MetaPlugin) => void, reject: (msg: string) => void) => {
				// Load the package.json in either the linked dev directory or from the downloaded plugin
				async.map(
					[plugin.version],
					(version, callback) => {
						fs.readFile(packagePath, { encoding: 'utf8' }, (err, result) => {
							if (err) {
								downloadNpmPackage({
									arg: plugin.name + '@' + (plugin.version || "latest"),
									dir: this.context.pluginsDir
								}).then(() => {
									this.getPluginPackage(plugin).then((val) => {
										callback(null, val);
									}).catch((err) => {
										reject(err);
									});
								});
								return;
							}

							callback(null, <MetaPlugin>{
								name: plugin.name,
								version: plugin.version,
								config: JSON.parse(result)
							});
						});
					},
					(err, results) => {
						// If neither file is found, or there was an unexpected error then fail
						let result = results[0] || results[1];
						if (err || !result) {
							return reject(err || 'ENOENT');
						}
						resolve(result);
					}
				);
			});
	}
}