import { expect, assert } from 'chai';
const path = require('path');

import Events from './Events';

describe('Events', function () {
	it('Should fire due to subscription', function(){
		let fire: boolean = false;
		Events.on('test',()=>{
			fire = true;
		});
		Events.trigger('test');
		assert.equal(true,fire);
	});

	it('Should not fire due to unsubscription', function(){
		let fire: boolean = false;

		let listener = ()=>{
			fire = true;
		};

		Events.on('test',listener);
		Events.off('test',listener);
		Events.trigger('test');
		assert.equal(false,fire);
	});

	it('Should fire twice', function(){
		let fire: number = 0;

		let listener = 

		Events.on('test',()=>{
			fire++;
		});
		Events.trigger('test');
		Events.trigger('test');

		assert.equal(2,fire);
	});
});
