import electron from 'electron';
import { Application } from 'spectron';


var beforeEach = function () {
    this.timeout(5000);
    this.app = new Application({
        path: electron,
        args: ['.'],
        startTimeout: 5000,
        waitTimeout: 5000,
    });
    return this.app.start();
};

var afterEach = function () {
    this.timeout(5000);
    if (this.app && this.app.isRunning()) {
        return this.app.stop();
    }
};

export default {
    beforeEach: beforeEach,
    afterEach: afterEach,
    delay: function(ms){
        var e = new Date().getTime() + (ms);
        while (new Date().getTime() <= e) {}
    }
};
