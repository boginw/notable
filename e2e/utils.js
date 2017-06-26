import electron from 'electron';
import { Application } from 'spectron';
const timeout = 5000;

var beforeEach = function () {
    this.timeout(timeout);
    this.app = new Application({
        path: electron,
        args: ['.'],
        startTimeout: timeout,
        waitTimeout: timeout,
    });
    return this.app.start();
};

var afterEach = function () {
    this.timeout(timeout);
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
