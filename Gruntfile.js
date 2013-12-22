module.exports = function(grunt) {

    grunt.initConfig({
        sprockets: {
            files: ["js/src/index.js"],
            dest: "js/application.min.js"
        },
        sass: {
            dist: {
                files: {
                    "css/application.min.css" : "css/scss/style.scss"
                }
            }
        },
        cssmin: {
            minify: {
                src: ["css/application.css"],
                dest: "css/application.min.css"
            }
        },
        uglify: {
            minify: {
                files: {
                    "js/application.min.js" : ["js/application.min.js"]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-sprockets');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['sprockets', 'sass']);
    grunt.registerTask('deploy', ['sprockets', 'sass', 'cssmin', 'uglify']);
};
