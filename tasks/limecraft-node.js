/*jslint vars:true*/
/*global module, require, process*/
module.exports = function (grunt) {
    "use strict";

    var link, q, fs;

    q = require("q");
    fs = require("fs");

    // cross-platform symbolic link
    link = (function () {
        var typeArg,
            symlink;

        if (process.platform === "win32") {
            typeArg = "junction";
        }

        symlink = q.denodeify(fs.symlink);

        return function (srcpath, destpath) {
            return symlink(srcpath, destpath, typeArg);
        };
    }());

    grunt.registerTask("limecraft-node", "Replaces brackets-shell node-core with other project", function (target) {
        var config, repoPath, commit, done, links, linkPath;

        done = this.async();

        //read config
        config = grunt.config('limecraft-node');
        repoPath = config['repo'];
        commit = config['commit'];

        //create symlink(s)
        links = [];
        linkPath = "appshell/node-core";

        //delete existing node-core folder
        if (grunt.file.exists(linkPath) && !grunt.file.isLink(linkPath)) {
            grunt.file.delete(linkPath);
        }

        //create link
        if (grunt.file.exists(repoPath)) {
            if (!grunt.file.exists(linkPath)) {
                grunt.log.writeln("Limecraft: symlink " + linkPath + " to " + repoPath);
                links.push(link(repoPath, linkPath));
            }
        } else {
            grunt.log.error("Limecraft: limecraft-node fails because couldn't find " + repoPath);
            return; done(false);
        }

        q.all(links).then(function () {
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });

    grunt.registerTask("limecraft-release-node", "Replaces Release/node-core with symlink to other project", function (target) {
        var config, repoPath, commit, done, links, linkPath;

        done = this.async();

        //read config
        config = grunt.config('limecraft-node');
        repoPath = config['repo'];
        commit = config['commit'];

        //create symlink(s)
        links = [];
        linkPath = "Release/node-core";

        //delete existing node-core folder
        if (grunt.file.exists(linkPath) && !grunt.file.isLink(linkPath)) {
            grunt.file.delete(linkPath);
        }

        //create link
        if (grunt.file.exists(repoPath)) {
            if (!grunt.file.exists(linkPath)) {
                grunt.log.writeln("Limecraft: symlink " + linkPath + " to " + repoPath);
                links.push(link(repoPath, linkPath));
            }
        } else {
            grunt.log.error("Limecraft: limecraft-node fails because couldn't find " + repoPath);
            return; done(false);
        }

        q.all(links).then(function () {
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });
};