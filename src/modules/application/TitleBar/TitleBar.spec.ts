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

	it('Should fullscreen the app', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);
		
		remote.getCurrentWindow().on('maximize', ()=>{
			done();
		});

		(<HTMLElement>base.querySelector('.button-fullscreen')).click();
	});
	
	it('Triggers when fullscreen is clicked', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		Events.on('titlebar.fullscreen',() => {
			done();
		});
		
		(<HTMLElement>base.querySelector('.button-fullscreen')).click();
	});

	it('Should minimize the app', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		remote.getCurrentWindow().on('minimize', ()=>{
			done();
		});

		(<HTMLElement>base.querySelector('.button-minimize')).click();
	});

	it('Triggers when minimize is clicked', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		Events.on('titlebar.minimize',() => {
			done();
		});

		(<HTMLElement>base.querySelector('.button-minimize')).click();
	});

	it('Should close when close is clicked', function (done) {
		let base: HTMLElement = document.createElement('div');
		let titleBar = new TitleBar(base);

		Events.on('titlebar.close',() => {
			done();
		});
		
		(<HTMLElement>base.querySelector('.button-close')).click();
	});
});