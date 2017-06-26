import { expect, assert } from 'chai';
import testUtils from './utils';
const path = require('path');

import ZoomFactor from '../dist/modules/application/ZoomFactor/ZoomFactor';
import TitleBar from '../dist/modules/application/TitleBar/TitleBar';
import Explorer from '../dist/modules/application/Explorer/Explorer';
import Editor from '../dist/modules/application/Editor/Editor';
import Events from '../dist/helpers/Events';

/*
describe('toolbar', function () {

    beforeEach(testUtils.beforeEach);
    afterEach(testUtils.afterEach);

    it('shows Notable icon', function(){
        return this.app.client.getAttribute('.logo > img','src').then(function (src) {
            expect(src).to.equal('file://'+path.join(__dirname,'images','logo.png'));
        });
    });

    it('shows title bar buttons', function(){
        return this.app.client.element('div.header.bordered').isVisible().then(function (visibility) {
            expect(visibility).to.equal(true);
        });
    });

    it('minimizes the app', function(done){
        this.app.client.click('div.header.bordered .button-minimize').then((btn) => { 
            return this.app.client.browserWindow.isMinimized().then(isMinimized => {
                assert.equal(true,isMinimized === true);
                done();
            })
        })
        .catch((error) => {
            done(error);
        });
    });

    it('maximizes the app', function(done){
        this.app.client.click('div.header.bordered .button-fullscreen').then((btn) => { 
            testUtils.delay(250);
            return this.app.client.browserWindow.isMaximized().then(isMaximized => {
                assert.equal(true,isMaximized === true);
                done();
            })
        })
        .catch((error) => {
            done(error);
        });
    });

    // Cannot write test for close, since that disconnects from chrome
});
*/