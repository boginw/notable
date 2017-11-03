import { expect, assert } from 'chai';
const path = require('path');

import IO from './IO';
import IIO from './IIO';
import { exists } from 'fs';

describe('IO', function () {
	it('Should create file', function (done) {
		let io: IIO = new IO();
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		io.saveFile(testFilePath, fileContents).then(() => {
			return io.openFile(testFilePath);
		}).then((contents:string) => {
			assert.equal(fileContents, contents);
			return io.deleteFile(testFilePath);
		}).then(()=>{
			done();
		});
	});

	it('Should open file', function (done) {
		let io: IIO = new IO();	
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		io.saveFile(testFilePath, fileContents).then(() => {
			return io.openFile(testFilePath);
		}).then((file:string) => {
			assert.equal(fileContents, file);
			return io.deleteFile(testFilePath);
		}).then(()=>{
			done();
		});
	});

	it('Should rename file', function (done) {
		let io: IIO = new IO();			
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		io.saveFile(testFilePath, fileContents).then(() => {
			return io.rename(testFilePath, testFilePath + '2');
		}).then(()=>{
			return io.openFile(testFilePath + '2');
		}).then((file:string) => {
			assert.equal(fileContents, file);
			return io.deleteFile(testFilePath + '2');
		}).then(()=>{
			done();
		});
	});

	it('Should delete file', function (done) {
		let io: IIO = new IO();			
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		io.saveFile(testFilePath, fileContents).then(() => {
			return io.deleteFile(testFilePath);
		}).then(() => {
			return io.exists(testFilePath);
		}).then(()=> {
			assert.fail("If this doesn't fail the file still exists");	
			done();			
		}).catch(()=>{
			done();
		});
	});

	it('Should create folder', function (done) {
		let io: IIO = new IO();					
		let folderPath: string = './testing_folder';

		io.createFolder(folderPath).then(()=>{
			return io.exists(folderPath);
		}).then(()=>{
			return io.deleteFolder(folderPath);
		}).then(()=>{
			done();
		}).catch((err) => {
			assert.fail(err);
			done();
		});
	});

	it('Should delete folder', function (done) {
		let io: IIO = new IO();							
		let folderPath: string = './testing_folder';
		io.createFolder(folderPath).then(()=>{	
			return io.deleteFolder(folderPath);
		}).then(()=>{
			return io.exists(folderPath);
		}).then(()=>{
			assert.fail("Folder still exists");
			done();
		}).catch((err) => {
			done();
		});
	});

	it('Should delete non-empty folder', function (done) {
		let io: IIO = new IO();							
		let folderPath: string = './test_folder';
		let filePath: string = path.join(folderPath, 'testfile.test');

		io.createFolder(folderPath).then(()=>{
			return io.saveFile(filePath, "");
		}).then(() => {
			return io.deleteFolder(folderPath);
		}).then(()=>{
			return io.exists(folderPath);
		}).then(()=>{
			assert.fail("Folder still exists");
			done();
		}).catch((err)=>{
			done();
		});
	});

	it('Should create file preview', function (done) {
		let io: IIO = new IO();									
		let fileContents: string = "TESTING 123 Lorum ipsum!";
		let testFilePath: string = 'testing_file.test';

		io.saveFile(testFilePath, fileContents).then(() => {
			return io.filePreview(testFilePath);
		}).then((preview:string)=>{
			assert.equal(fileContents.indexOf(preview), 0);
			return io.deleteFile(testFilePath);
		}).then(()=>{
			done();
		});
	});

	it('Should create file preview with specific length', function (done) {
		let io: IIO = new IO();											
		let fileContents: string = "TESTING 123 Lorum ipsum!";
		let testFilePath: string = 'testing_file2.test';
		let previewLength: number = 3;

		io.saveFile(testFilePath, fileContents).then(() => {
			return io.filePreview(testFilePath, previewLength);
		}).then((preview:string) => {
			assert.equal(fileContents.substr(0, previewLength), preview);
			return io.deleteFile(testFilePath);
		}).then(()=>{
			done();
		});
	});

	it('Should ensure that a directory exists', function (done) {
		let io: IIO = new IO();											
		let folderPath = ['.', 'first', 'second', 'third'];
		let joinedPath = path.join(...folderPath);
		io.ensureFolderExists(joinedPath).then(()=>{
			return io.exists(joinedPath);
		}).then(()=>{
			return io.deleteFolder(path.join(folderPath[0], folderPath[1]));
		}).then(()=>{
			done();
		});
	});

	it('Should rename file', function (done) {
		let io: IIO = new IO();	
		let filePath = './testFile.test';
		let newFilePath = './testFile2.test';
		let fileContents = 'TEST test';
		io.saveFile(filePath, fileContents).then(() => {
			return io.rename(filePath, newFilePath);
		}).then(()=>{
			return io.openFile(newFilePath);
		}).then((contents:string)=>{
			assert.equal(contents, fileContents);	
			return io.deleteFile(newFilePath);
		}).then(()=>{
			done();
		});
	});

	/*it('Should crawl folder', function (done) {
		let io: IIO = new IO();		
		let folderPath = './testFolder';
		io.createFolder(folderPath);
		io.watchDirectory(folderPath, (f, curr, prev) => {
			assert.isObject(f);
			assert.equal(Object.keys(f).length, 1);
			io.deleteFolder(folderPath).then(()=>{
				done();
			});
		});
	});*/

	it('Should get file stats', function (done) {
		let io: IIO = new IO();			
		let filePath = './test.test';
		let fileContents = "TEST";
		io.saveFile(filePath, fileContents).then(() => {
			return io.fileStats(filePath);
		}).then((stats)=>{
			assert.equal(stats.size, fileContents.length);
			assert.isTrue(stats.isFile());
			assert.isFalse(stats.isDirectory());
			return io.deleteFile(filePath);
		}).then(()=>{
			done();
		});
	});
});
