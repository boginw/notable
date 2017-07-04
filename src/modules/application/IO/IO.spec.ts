import { expect, assert } from 'chai';
const path = require('path');

import IO from './IO';

describe('IO', function () {
	it('Should create file', function (done) {
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents: string) => {
			let file: string = IO.openFile(testFilePath);
			assert.equal(fileContents, file);
			IO.deleteFile(testFilePath);
			done();
		});
	});

	it('Should open file', function (done) {
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents: string) => {
			let file: string = IO.openFile(testFilePath);
			assert.equal(fileContents, file);
			IO.deleteFile(testFilePath);
			done();
		});
	});

	it('Should rename file', function (done) {
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents: string) => {
			IO.rename(testFilePath, testFilePath + '2');
			let file: string = IO.openFile(testFilePath + '2');

			assert.equal(fileContents, file);
			IO.deleteFile(testFilePath + '2');
			done();
		});
	});

	it('Should delete file', function (done) {
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents: string) => {
			IO.deleteFile(testFilePath);
			let exists: boolean = IO.exists(testFilePath);
			assert.equal(exists, false);
			done();
		});
	});

	it('Should create folder', function () {
		let folderPath: string = './testing_folder';

		IO.createFolder(folderPath);
		let exists: boolean = IO.exists(folderPath);
		assert.equal(exists, true);
		IO.deleteFolder(folderPath);
	});

	it('Should delete folder', function () {
		let folderPath: string = './testing_folder';

		IO.createFolder(folderPath);
		IO.deleteFolder(folderPath);
		let exists: boolean = IO.exists(folderPath);
		assert.equal(exists, false);
	});

	it('Should delete non-empty folder', function (done) {
		let folderPath: string = './test_folder';
		let filePath: string = path.join(folderPath, 'testfile.test');

		IO.createFolder(folderPath);
		IO.saveFile(filePath, "", () => {
			IO.deleteFolder(folderPath);

			assert.isFalse(IO.exists(folderPath), 
				"Could not delete folder");
			done();
		});
	});

	it('Should create file preview', function (done) {
		let fileContents: string = "TESTING 123 Lorum ipsum!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents: string) => {
			let preview: string = IO.filePreview(testFilePath);
			assert.equal(fileContents.indexOf(preview), 0);
			IO.deleteFile(testFilePath);
			done();
		});
	});

	it('Should create file preview with specific length', function (done) {
		let fileContents: string = "TESTING 123 Lorum ipsum!";
		let testFilePath: string = 'testing_file2.test';
		let previewLength: number = 3;

		IO.saveFile(testFilePath, fileContents, (contents: string) => {
			let preview: string = IO.filePreview(testFilePath, previewLength);
			assert.equal(fileContents.substr(0, previewLength), preview);
			IO.deleteFile(testFilePath);
			done();
		});
	});

	it('Should ensure that a directory exists', function () {
		let folderPath = ['.', 'first', 'second', 'third'];
		let joinedPath = path.join(...folderPath);
		let folderCreated = IO.ensureFolderExists(joinedPath);
		let folderExists = IO.exists(joinedPath);

		assert.equal(
			(folderCreated && folderExists),
			true, "Could not ensure that folder was created");

		IO.deleteFolder(path.join(folderPath[0], folderPath[1]));
	});

	it('Should rename file', function (done) {
		let filePath = './testFile.test';
		let newFilePath = './testFile2.test';
		let fileContents = 'TEST test';
		IO.saveFile(filePath, fileContents, () => {
			IO.rename(filePath, newFilePath);
			assert.equal(IO.openFile(newFilePath), fileContents);
			IO.deleteFile(newFilePath);

			done();
		});
	});

	it('Should crawl folder', function (done) {
		let folderPath = './testFolder';
		IO.createFolder(folderPath);
		IO.watchDirectory(folderPath, (f, curr, prev) => {
			assert.isObject(f);
			assert.equal(Object.keys(f).length, 1);
			IO.deleteFolder(folderPath);
			done();
		});
	});

	it('Should get file stats', function (done) {
		let filePath = './test.test';
		let fileContents = "TEST";
		IO.saveFile(filePath, fileContents, () => {
			let stats = IO.fileStats(filePath);
			assert.equal(stats.size, fileContents.length);
			assert.isTrue(stats.isFile());
			assert.isFalse(stats.isDirectory());
			IO.deleteFile(filePath);
			done();
		});
	});
});
