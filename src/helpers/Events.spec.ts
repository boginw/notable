import { expect, assert } from 'chai';
const path = require('path');

// TODO: FIX THIS!!!
import Events from '../../dist/helpers/Events';

describe('Events', function () {
	it('Should fire due to subscription', function(){
		let fire = false;
		Events.on('test',()=>{
			fire = true;
		});
		Events.trigger('test');
		assert.equal(true,fire);
	});

	it('Should not fire due to unsubscription', function(){
		let fire = false;

		let listener = ()=>{
			fire = true;
		};

		Events.on('test',listener);
		Events.off('test',listener);
		Events.trigger('test');
		assert.equal(false,fire);
	});
});
