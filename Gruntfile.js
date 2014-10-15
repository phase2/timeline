module.exports = function(grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  grunt.initConfig({
    jasmine: {
      timeline: {
        src: ['dateFormat.js', 'dateWrapper.js', 'usableTimeline.js'],
        options: {
          specs: 'spec/*.spec.js',
          summary: true,
          vendor: [
            "bower_components/jquery/dist/jquery.js"
          ]
        }
      }
    }
  });

  grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('default', ['test']);
};
