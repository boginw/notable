import {
	NotableFile
} from '../../interfaces';

import IIOWatcher from './IIOWatcher';

export default interface IIO {
	/**
	 * Opens file and gets its contents
	 * @param {string}  fileName File to open
	 * @return {Promise<string>} File contents
	 */
	openFile(fileName: string): Promise<string>;

	/**
	 * Saves contents to file
	 * @param {string} path Path to file
	 * @param {string} contents Contents to be written to the file 
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	saveFile(path: string, contents: string): Promise<void>;

	/**
	 * Deletes a file
	 * @param {string} path File to delete
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	deleteFile(path: string): Promise<void>;

	/**
	 * Deletes a folder
	 * @param {string} dirPath Folder to delete
	 * @returns {Promise<void>} Fires when the operation has been completed 
	 */
	deleteFolder(dirPath: string): Promise<void>;

	/**
     * Checks if a folder exists, and if not, create it
     * @param {string} dir Folder to ensure exists
     * @return {boolean} Whether or not it was possible to ensure existance.
	 * @returns {Promise<void>} Fires when the operation has been completed
     */
	ensureFolderExists(dir: string): Promise<void>;

	/**
	 * Renames (moves) a file or folder
	 * @param {string} filePath Path to file or folder
	 * @param {string} newName The new path to file or folder
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	rename(filePath: string, newName: string): Promise<void>;

	/**
	 * Creates a folder
	 * @param {string} path Path to the folder to create
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	createFolder(path: string): Promise<void>;

	/**
	 * Checks if a thing in the filesystem exists
	 * @param {string} path Path to thing to check if exists
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	exists(path: string): Promise<void>;

	/**
	 * Provides a quick preview of the file in string format
	 * @param  {string} pathToFile   self explainatory
	 * @param  {int} 	bufferLength length of the buffer which stores the file
	 * @return {Promise<string>}     Provides the file preview when the operation is complete
	 */
	filePreview(pathToFile: string, bufferLength?: number): Promise<string>;

	/**
	 * Provides a watcher for a given directory
	 * @param   {string} dirPath      Directory to be watched
	 * @returns {Promise<IIOWatcher>} Promise of a IIOWatcher
	 */
	watchDir(dirPath: string): Promise<IIOWatcher>;

	/**
	 * Get file stats from file system
	 * @param {string} filePath Path to file
	 * @return {Promise<any>} File stats
	 */
	fileStats(filePath: string): Promise<any>;

	/**
     * Creates notable file object from path
     * @param {string} filePath Path to the file to be created
	 * @returns {Promise<NotableFile>} Notable file from promise
     */
	fileFromPath(filePath: string, stats?: any): Promise<NotableFile>;

	/**
	 * Gets all files in a specific directory
	 * @param dirPath 		Path to the directory
	 * @param acceptedfiles Filter files
	 * @returns {Promise<NotableFile[]>} Array with notable files
	 */
	filesInDirectory(dirPath: string): Promise<NotableFile[]>;
	filesInDirectory(dirPath: string, acceptedfiles?: string[]): Promise<NotableFile[]>;
}