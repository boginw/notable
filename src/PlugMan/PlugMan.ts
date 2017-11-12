const { app } = require('electron').remote; // native electron module
const async = require('async');
const npmRun = require('npm-run');
const downloadNpmPackage = require('download-npm-package');

import * as fs from 'fs';
import * as path from 'path';

import IPlugin from './IPlugin';
import PluginInstaller from './PluginInstaller';
import MetaPlugin from './MetaPlugin';

const userData = app.getPath('userData');

export default class PlugMan {
	private packagePath: string;

	public constructor() {
		if (process.mainModule == undefined) {
			throw "mainModule is undefined";
		}

		this.packagePath = path.join(
			path.dirname(process.mainModule.filename), '../package.json');
	}

	public loadPlugins(sharedContext: any): Promise<IPlugin[]> {
		return new Promise<IPlugin[]>((resolve, reject) => {
			fs.readFile(this.packagePath, { encoding: 'utf8' }, (err, contents) => {
				if (err) {
					throw (err);
				}

				let config = JSON.parse(contents);
				let configPath = path.join(userData, 'config.json');

				fs.readFile(configPath, { encoding: 'utf8' }, (err, contents) => {
					let plugins = {};
					if (err) {
						fs.writeFile(configPath, JSON.stringify({ plugins: {} }), (err) => {
							if (err) {
								reject("Cannot create config.json file due to: " + err);
							}
						});
						plugins = Object.assign(plugins, config.plugins);
					} else {
						let externalConfig = JSON.parse(contents);
						if (externalConfig.plugins == undefined) {
							externalConfig.plugins = {};
						}
						plugins = Object.assign(externalConfig.plugins, config.plugins);
					}

					let installer: PluginInstaller = new PluginInstaller(sharedContext);
					let metaPlugins: MetaPlugin[] = this.getPlugins(plugins);

					Promise.all(metaPlugins.map((val, i, a): Promise<IPlugin> => {
						return installer.installPlugin(val);
					})).then((val: IPlugin[]) => {
						resolve(val);
					}).catch((msg) => {
						reject(msg);
					});
				});
			});
		});
	}

	private getPlugins(plugins): MetaPlugin[] {
		let mapped: MetaPlugin[] = [];
		Object.getOwnPropertyNames(plugins).forEach((key) => {
			mapped.push(<MetaPlugin>{
				name: key,
				version: plugins[key]
			});
		});

		return mapped;
	}
}