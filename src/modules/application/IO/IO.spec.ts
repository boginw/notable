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
			done();
		});
	});

	it('Should delete file', function(){
		let testFilePath: string = 'testing_file.test';
		IO.deleteFile(testFilePath);
		let exists: boolean = IO.exists(testFilePath);

		assert.equal(exists, false);
	});
});
