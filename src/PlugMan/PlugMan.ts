const { app } = require('electron').remote; // native electron module
const path = require('path');
const async = require('async');
const fs = require('fs');
const npmRun = require('npm-run');
const userData = app.getPath('userData');
const downloadNpmPackage = require('download-npm-package');

import IPlugin from './IPlugin';

export default class PlugMan {
	private context: { plugins: any; pluginsDir: any; sharedContext: any };
	private packagePath: string;

	public constructor() {
		if (process.mainModule == undefined) {
			throw "mainModule is undefined";
		}

		this.packagePath = path.join(
			path.dirname(process.mainModule.filename), '../package.json');
	}

	public loadPlugins(sharedContext: any): Promise<{ dep: string[], mod: IPlugin[] }> {
		return new Promise<{ dep: string[], mod: IPlugin[] }>((resolve, reject) => {
			fs.readFile(this.packagePath, { encoding: 'utf8' }, (err, contents) => {
				if (err) {
					throw (err);
				}

				let config = JSON.parse(contents);
				let configPath = path.join(userData, 'config.json');

				fs.readFile(configPath, { encoding: 'utf8' }, (err, contents) => {
					let plugins = {};
					if(err){
						fs.writeFile(configPath, JSON.stringify({plugins:{}}), (err) =>{
							if(err){
								reject("Cannot create config.json file due to: " + err);
							}
						});
						plugins = Object.assign(plugins, config.plugins);
					} else {
						let externalConfig = JSON.parse(contents);
						if(externalConfig.plugins == undefined){
							externalConfig.plugins = {};
						}
						plugins = Object.assign(externalConfig.plugins, config.plugins);
					}

					this.context = {
						plugins: plugins,
						pluginsDir: path.join(userData, 'plugins'),
						sharedContext: sharedContext
					};

					async.map(
						this.getPlugins(this.context.plugins),
						this.getPluginPackage.bind(this),
						(err, results) => {
							if (err) {
								reject(err);
								return;
							}
							this.loadPlugin(this.context, results).then((res: { dep: string[], mod: IPlugin[] }) => {
								resolve(res);
							}).catch((err) => {
								reject(err);
							});
						}
					);
				});
			});
		});
	}

	private getPlugins(plugins) {
		let mapped: any[] = [];
		Object.getOwnPropertyNames(plugins).forEach((key) => {
			mapped.push({
				name: key,
				version: plugins[key]
			});
		});

		return mapped;
	}

	private getPluginPackage(plugin, callback) {
		let name = plugin.name;
		let version = plugin.version;
		let packagePath = path.join(this.context.pluginsDir, name, 'package.json');

		// Load the package.json in either the linked dev directory or from the downloaded plugin
		async.map(
			[version],
			(version, callback) => {

				fs.readFile(packagePath, { encoding: 'utf8' }, (err, result) => {
					if (err) {
						downloadNpmPackage({
							arg: name + '@' + version,
							dir: this.context.pluginsDir
						}).then(() => {
							this.getPluginPackage(plugin, callback);
						});
						return;
					}

					callback(null, {
						name: name,
						version: version,
						config: JSON.parse(result)
					});
				});
			},
			(err, results) => {
				// If neither file is found, or there was an unexpected error then fail
				let result = results[0] || results[1];
				if (err || !result) {
					return callback(err || 'ENOENT');
				}
				callback(null, result);
			});
	}

	private loadPlugin(context, results): Promise<{ dep: string[], mod: IPlugin[] }> {
		return new Promise<{ dep: string[], mod: IPlugin[] }>((resolve, reject) => {
			let modules: IPlugin[] = [];
			let dependencies: string[] = [];
			try {
				let promises: Promise<void>[] = [];
				for (let i = 0, n = results.length; i < n; i++) {
					promises.push(new Promise<void>((resolve, reject) => {
						let plugin = results[i];
						let main = plugin.config.main;
						let name = plugin.name;
						let version = plugin.version;
						let depName = name.replace(/-/g, '.');
						let pluginFolder = path.join(context.pluginsDir, name);

						fs.access(path.join(pluginFolder, "node_modules"), fs.constants.R_OK, (err: string) => {
							let cmd = "-v";
							if (err) {
								cmd = 'install';
							}
							
							let child = npmRun.spawn("npm", ["install"],{ cwd: pluginFolder });
							child.on('exit', (code) => {
								let Plugin = require(path.resolve(pluginFolder, main));
								let mod: IPlugin = new Plugin(this.context.sharedContext);
								modules.push(mod);
								dependencies.push(depName);
								resolve();
							});
						});
					}));
				}
				Promise.all<void>(promises).then((val) => {
					resolve({ dep: dependencies, mod: modules });
				});
			} catch (err) {
				return reject(err);
			}
		});
	}
}