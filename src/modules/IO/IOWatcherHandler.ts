import IIOWatcher from "./IIOWatcher";

export default class IOWatcherHandler implements IIOWatcher {
	public watchingDir: string;
	public isRecursive: boolean;

	public constructor(private ioWatchers: IIOWatcher[]) {

	}

	public watch(dir: string, isRecursive: boolean): Promise<void> {
		return new Promise((resolve, reject) => {
			Promise.all(this.ioWatchers.map((watcher) => {
				return watcher.watch(dir, isRecursive);
			})).then(() => {
				resolve();
			});
		});
	}
	
	public on(event: string, trigger: (evt: string, name: string) => void): void {
		this.ioWatchers.forEach((watcher) => {
			watcher.on(event, trigger);
		});
	}

	public close(): void {
		this.ioWatchers.forEach((watcher) => {
			watcher.close();
		});
	}

	public isClosed(): boolean {
		return this.ioWatchers.every((watcher) => {
			return watcher.isClosed();
		});
	}

}