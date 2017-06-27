import { expect, assert } from 'chai';
const path = require('path');

import IO from './IO';

describe('IO', function () {
	it('Should create file, then open file', function(done){
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents:string) => {
			let file: string = IO.openFile(testFilePath);
			assert.equal(fileContents, file);
			IO.deleteFile(testFilePath);		
			done();
		});
	});

	it('Should rename file', function(done){
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents:string) => {
			IO.rename(testFilePath, testFilePath + '2');
			let file: string = IO.openFile(testFilePath + '2');

			assert.equal(fileContents, file);
			IO.deleteFile(testFilePath + '2');
			done();
		});
	});

	it('Should delete file', function(done){
		let fileContents: string = "TEST!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents:string) => {
			IO.deleteFile(testFilePath);
			let exists: boolean = IO.exists(testFilePath);
			assert.equal(exists, false);
			done();
		});
	});

	it('Should create folder', function(){
		let folderPath: string = './testing_folder';

		IO.createFolder(folderPath);
		let exists: boolean = IO.exists(folderPath);
		assert.equal(exists, true);
		IO.deleteFolder(folderPath);
	});

	it('Should delete folder', function(){
		let folderPath: string = './testing_folder';

		IO.createFolder(folderPath);
		IO.deleteFolder(folderPath);
		let exists: boolean = IO.exists(folderPath);
		assert.equal(exists, false);
	});

	it('Should create file preview', function(done){
		let fileContents: string = "TESTING 123 Lorum ipsum!";
		let testFilePath: string = 'testing_file.test';

		IO.saveFile(testFilePath, fileContents, (contents:string) => {
			let preview: string = IO.filePreview(testFilePath);
			assert.equal(fileContents.indexOf(preview), 0);
			IO.deleteFile(testFilePath);
			done();
		});
	});

	it('Should create file preview with specific length', function(done){
		let fileContents: string = "TESTING 123 Lorum ipsum!";
		let testFilePath: string = 'testing_file2.test';
		let previewLength: number = 3;

		IO.saveFile(testFilePath, fileContents, (contents:string) => {
			let preview: string = IO.filePreview(testFilePath, previewLength);
			assert.equal(fileContents.substr(0, previewLength), preview);
			IO.deleteFile(testFilePath);
			done();
		});
	});
});
