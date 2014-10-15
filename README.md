#Requirements

* jQuery
* jQuery.mousewheel - Only needed if you want to support scrolling on the timeline
* Hammer.js - Only required if you need to support touch events.

#Testing

Timeline uses Grunt and Jasmine for running tests. Bower is used to handle loading vendor requirements.

    npm install
    bower install
    grunt test
