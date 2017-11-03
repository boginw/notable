import { expect, assert } from 'chai';
const path = require('path');
const { remote } = require('electron'); // native electron module

import TitleBar from './TitleBar';
import Events from '../Events/Events';

describe('TitleBar', function () {

	it('Should assure that TitleBar doesn\'t throw', function () {
		let base: HTMLElement = document.createElement('div');
		assert.doesNotThrow(() => {
			let titleBar = new TitleBar(base);
		});
	});

	it('Should fullscreen the app', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);
		let called: boolean = false;		

		// Due to this: https://github.com/electron/electron/issues/1418
		// This test cannot pass in this framework and therefore is ignored
		if(titleBar.isWindows){
			remote.getCurrentWindow().on('maximize', ()=>{
				if(!called){
					called = true;	
					done();
				}
			});
		} else {
			done();
		}

		if(remote.getCurrentWindow().isMaximized()){
			remote.getCurrentWindow().on('unmaximize', ()=>{
				(<HTMLElement>base.querySelector('.button-fullscreen')).click();
			});
			remote.getCurrentWindow().unmaximize();
		}else{
			(<HTMLElement>base.querySelector('.button-fullscreen')).click();
		}
	});
	
	it('Should minimize the app', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);
		let called: boolean = false;

		// Due to this: https://github.com/electron/electron/issues/1418
		// This test cannot pass in this framework and therefore is ignored
		if(titleBar.isWindows){
			remote.getCurrentWindow().on('minimize', ()=>{
				if(!called){
					called = true;
					done();
				}
			});
		} else {
			done();
		}

		if(remote.getCurrentWindow().isMinimized()){
			remote.getCurrentWindow().on('restore', ()=>{
				(<HTMLElement>base.querySelector('.button-minimize')).click();		
			});
			remote.getCurrentWindow().restore();
		}else{
			(<HTMLElement>base.querySelector('.button-minimize')).click();
		}

	});

	it('Triggers when logo is clicked', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		Events.on('titlebar.logo',() => {
			done();
		});
		
		(<HTMLElement>base.querySelector('.logo')).click();
	});

	it('Triggers when login is clicked', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		Events.on('titlebar.login',() => {
			done();
		});
		
		(<HTMLElement>base.querySelector('.login')).click();
	});

	
	it('Triggers when fullscreen is clicked', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		Events.on('titlebar.fullscreen',() => {
			done();
		});
		
		(<HTMLElement>base.querySelector('.button-fullscreen')).click();
	});


	it('Triggers when minimize is clicked', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		Events.on('titlebar.minimize',() => {
			done();
		});

		(<HTMLElement>base.querySelector('.button-minimize')).click();
	});

	it('Triggers when close is clicked', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		Events.on('titlebar.close',() => {
			done();
		});
		
		(<HTMLElement>base.querySelector('.button-close')).click();
	});

});