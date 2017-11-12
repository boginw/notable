const mergeText = require('plus.merge-text');

import IIO from './IIO';
import IO from './IO';
import IIOWatcher from './IIOWatcher';
import { Stats } from 'fs';
import { NotableFile } from '../../interfaces';
import IOWatcherHandler from './IOWatcherHandler';
import Events from '../Events/Events';
import ISyncPlugin from '../../PlugMan/ISyncPlugin';

export default class IOHandler implements IIO {
	private defaultIO: IIO;
	private additionalIO: IIO[];

	public constructor() {
		this.defaultIO = new IO();
		this.additionalIO = [];

		Events.on("IOHandler.AddIO", (newIO:ISyncPlugin) => {
			this.additionalIO.push(newIO);
		});
	}

	public push(watcher:IIO){
		this.additionalIO.push(watcher);
		return this.additionalIO.length;
	}

	public openFile(fileName: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.defaultIO.openFile(fileName).then((contents) => {
				Promise.all(this.additionalIO.map((io) => {
					return io.openFile(fileName);
				})).then((val) => {
					// resolve(mergeText.merge(val).toString());
				});
				resolve(contents);
			});
		});
	}

	public saveFile(path: string, contents: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.defaultIO.saveFile(path, contents).then(() => {
				setTimeout(() => {
					Promise.all(this.additionalIO.map((io) => {
						return io.saveFile(path, contents);
					})).then(() =>{
						console.log("Synced");
					});
				},0);
				resolve();
			});
		});
	}

	public deleteFile(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.defaultIO.deleteFile(path).then(() => {
				Promise.all(this.additionalIO.map((io) => {
					return io.deleteFile(path);
				}));
				resolve();
			});
		});
	}

	public deleteFolder(dirPath: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.defaultIO.deleteFolder(dirPath).then(() => {
				Promise.all(this.additionalIO.map((io) => {
					return io.deleteFolder(dirPath);
				}));
				resolve();
			});
		});
	}

	public ensureFolderExists(dir: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.defaultIO.ensureFolderExists(dir).then(() => {
				Promise.all(this.additionalIO.map((io) => {
					return io.ensureFolderExists(dir);
				}));
				resolve();
			});
		});
	}

	public rename(filePath: string, newName: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.defaultIO.rename(filePath, newName).then(() => {
				Promise.all(this.additionalIO.map((io) => {
					return io.rename(filePath, newName);
				}));
				resolve();
			});
		});
	}

	public createFolder(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.defaultIO.createFolder(path).then(() => {
				Promise.all(this.additionalIO.map((io) => {
					return io.createFolder(path);
				}));
				resolve();
			});
		});
	}

	public exists(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.defaultIO.exists(path).then(() => {
				Promise.all(this.additionalIO.map((io) => {
					return io.exists(path);
				}));
				resolve();
			});
		});
	}

	public filePreview(pathToFile: string, bufferLength?: number): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.defaultIO.filePreview(pathToFile, bufferLength).then((preview) => {
				Promise.all(this.additionalIO.map((io) => {
					return io.filePreview(pathToFile, bufferLength);
				})).then((val) => {
					// resolve(mergeText.merge(val.reverse()));
				});
				resolve(preview);
			});
		});
	}

	public watchDir(dirPath: string): Promise<IIOWatcher> {
		return new Promise<IIOWatcher>((resolve, reject) => {
			Promise.all([this.defaultIO, ...this.additionalIO].map((io) => {
				return io.watchDir(dirPath);
			})).then((val) => {
				let handler = new IOWatcherHandler(val);
				handler.watch(dirPath, true);
				resolve(handler);
			});
		});
	}

	public fileStats(filePath: string): Promise<Stats> {
		return new Promise<Stats>((resolve, reject) => {
			this.defaultIO.fileStats(filePath).then((stats) => {
				Promise.all(this.additionalIO.map((io) => {
					return io.fileStats(filePath);
				}));
				resolve(stats);
			});
		});
	}

	public fileFromPath(filePath: string, stats?: Stats): Promise<NotableFile> {
		return new Promise<NotableFile>((resolve, reject) => {
			this.defaultIO.fileFromPath(filePath, stats).then((file) => {
				Promise.all(this.additionalIO.map((io) => {
					return io.fileFromPath(filePath, stats);
				}));
				resolve(file);
			});
		});
	}

	public filesInDirectory(dirPath: string, acceptedfiles?: string[]): Promise<NotableFile[]> {
		return new Promise<NotableFile[]>((resolve, reject) => {
			this.defaultIO.filesInDirectory(dirPath, acceptedfiles).then((files) => {
				Promise.all(this.additionalIO.map((io) => {
					return io.filesInDirectory(dirPath, acceptedfiles);
				})).then((val) => {
					let s = new Set();
					val.forEach((files) => {
						s = this.union(s, new Set(files));
					});
					resolve([...s]);
				});
				resolve(files);
			});
		});
	}

	private union<T>(setA:Set<T>, setB:Set<T>): Set<T> {
		let union:Set<T> = new Set<T>(setA);
		for(let i = 0; i < setB.size; i++){
			union.add(setB[i]);
		}

		return union;
	}
}