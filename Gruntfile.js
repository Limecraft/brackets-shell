/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */
/*jslint regexp:true*/
/*global module, require, process*/
module.exports = function (grunt) {
    "use strict";

    var common  = require("./tasks/common")(grunt),
        resolve = common.resolve,
        platform = common.platform(),
        _ = grunt.util._,
        staging;
    
    if (platform === "mac") {
        staging = "installer/mac/staging/<%= build.name %>.app/Contents";
    } else if (platform === "win") {
        staging = "installer/win/staging";
    } else {
        staging = "installer/linux/debian/package-root/opt/brackets";
    }

    grunt.initConfig({
        "pkg":              grunt.file.readJSON("package.json"),
        "config-json":      staging + "/www/config.json",
        "downloads":        grunt.option("downloads") || "downloads",
        "curl-dir": {
            /* linux */
            "cef-linux32": {
                "dest"      : "<%= downloads %>",
                "src"       : "<%= cef.url %>/cef_binary_<%= cef.version %>_linux32_release.zip"
            },
            "cef-linux64": {
                "dest"      : "<%= downloads %>",
                "src"       : "<%= cef.url %>/cef_binary_<%= cef.version %>_linux64_release.zip"
            },
            "node-linux32": {
                "dest"      : "<%= downloads %>",
                "src"       : "http://nodejs.org/dist/v<%= node.version %>/node-v<%= node.version %>-linux-x86.tar.gz"
            },
            "node-linux64": {
                "dest"      : "<%= downloads %>",
                "src"       : "http://nodejs.org/dist/v<%= node.version %>/node-v<%= node.version %>-linux-x64.tar.gz"
            },
            /* mac */
            "cef-mac": {
                "dest"      : "<%= downloads %>",
                "src"       : "<%= cef.url %>/cef_binary_<%= cef.version %>_macosx32.zip"
            },
            "cef-mac-symbols": {
                "src"  : "<%= cef.url %>/cef_binary_<%= cef.version %>_macosx32_release_symbols.zip",
                "dest" : "<%= downloads %>/cefsymbols"
            },
            "node-mac": {
                "dest"      : "<%= downloads %>",
                "src"       : "http://nodejs.org/dist/v<%= node.version %>/node-v<%= node.version %>-darwin-x86.tar.gz"
            },
            /* win */
            "cef-win": {
                "dest"      : "<%= downloads %>",
                "src"       : "http://10.100.16.13/cef_binary_3.1750.1774_windows32.zip"
                //"src"       : "<%= cef.url %>/cef_binary_<%= cef.version %>_windows32.zip"
            },
            "cef-win-symbols": {
                "src"  : ["<%= cef.url %>/cef_binary_<%= cef.version %>_windows32_debug_symbols.zip", "<%= cef.url %>/cef_binary_<%= cef.version %>_windows32_release_symbols.zip"],
                "dest" : "<%= downloads %>/cefsymbols"
            },
            "node-win": {
                "dest"      : "<%= downloads %>",
                "src"       : ["http://nodejs.org/dist/v<%= node.version %>/node.exe",
                               "http://nodejs.org/dist/npm/npm-<%= npm.version %>.zip"]
            }
        },
        "clean": {
            "downloads"         : ["downloads"],
            "installer-mac"     : ["installer/mac/*.dmg"],
            "installer-win"     : ["installer/win/*.msi"],
            "installer-linux"   : ["installer/linux/debian/*.deb"],
            "staging-mac"       : ["installer/mac/staging"],
            "staging-win"       : ["installer/win/staging"],
            "staging-linux"     : ["<%= build.staging %>"],
            "www"               : ["<%= build.staging %>/www", "<%= build.staging %>/samples"]
        },
        "copy": {
            "win": {
                "files": [
                    {
                        "expand"    : true,
                        "cwd"       : "Release/",
                        "src"       : [
                            "locales/**",
                            "node-core/**",
                            "extra-includes/**",
                            "Brackets.exe",
							"*.exe",
                            "node.exe",
                            "cef.pak",
                            "devtools_resources.pak",
                            "icudt.dll",
                            "libcef.dll",

                            //Limecraft custom: extra necessary libs
                            "ffmpegsumo.dll",
                            "avcodec-55.dll",
                            "avformat-55.dll",
                            "avutil-52.dll"
                        ],
                        "dest"      : "installer/win/staging/"
                    }
                ]
            },
            // FIXME: see stage-mac task issues with copying .app bundles
            /*
            "mac": {
                "files": [
                    {
                        "expand"    : true,
                        "cwd"       : "xcodebuild/Release/<%= build.name %>.app/",
                        "src"       : ["**"],
                        "dest"      : "installer/mac/staging/<%= build.name %>.app/"
                    }
                ]
            },
            */
            "linux": {
                "files": [
                    {
                        "expand"    : true,
                        "cwd"       : "out/Release/",
                        "src"       : [
                            "lib/**",
                            "locales/**",
                            "node-core/**",
                            "appshell*.png",
                            "Brackets",
                            "node",
                            "cef.pak",
                            "devtools_resources.pak"
                        ],
                        "dest"      : "<%= build.staging %>"
                    },
                    {
                        "expand"    : true,
                        "cwd"       : "installer/linux/debian/",
                        "src"       : [
                            "brackets.desktop",
                            "brackets"
                        ],
                        "dest"      : "<%= build.staging %>"
                    }
                ]
            },
            "www": {
                "files": [
                    {
                        "dot"       : true,
                        "expand"    : true,
                        "cwd"       : "<%= git.www.repo %>",
                        "src"       : ["**", "!**/.git*"],
                        "dest"      : "<%= build.staging %>/www/"
                    }
                ]
            },
            "samples": {
                "files": [
                    {
                        "dot"       : true,
                        "expand"    : true,
                        "cwd"       : "<%= git.www.repo %>/samples",
                        "src"       : ["**"],
                        "dest"      : "<%= build.staging %>/samples/"
                    }
                ]
            },
            "limecraft-node-backup": {
                files: [
                    {src: ["appshell/node-core/**"], dest: "appshell/node-core-backup", expand: true}
                ]
            }
        },
        "unzip": {
            "cef": {
                "src"       : "<%= cef_zip %>",
                "dest"      : "deps/cef"
            }
        },
        "jshint": {
            "all"           : ["Gruntfile.js", "tasks/**/*.js"],
            "options": {
                "jshintrc"  : ".jshintrc"
            }
        },
        "build": {
            "name"              : "Field Dock",
            "staging"           : staging
        },
        "git": {
            "www": {
                "repo"      : grunt.option("www-repo") || "../edge-js",    // TODO user configurable?
                "branch"    : grunt.option("www-branch") || "development"
            },
            "shell": {
                "repo"      : ".",
                "branch"    : grunt.option("shell-branch") || ""
            }
        },
        "cef": {
            "url"           : "http://s3.amazonaws.com/files.brackets.io/cef",
            "version"       : "3.1750.1738"
        },
        "node": {
            "version"       : "0.10.24"
        },
        "npm": {
            "version"       : "1.3.24"
        },
        "limecraft-node": {
            "repo": grunt.option("limecraft-node-repo") || "../edge"
        },
        "limecraft-release-node": {
            "repo": grunt.option("limecraft-node-repo") || "../edge"
        }
    });

    grunt.loadTasks("tasks");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-curl");

    grunt.registerTask('configure-barracuda', "Configure barracuda", function () {
        var configFile = grunt.option["barracuda-config-file"] || "appshell/node-core/config/default.json",
            json = grunt.file.readJSON(configFile);

        _.each([
            "backend",
            "contentRoot",
            "debug",
            "refreshRate",
            "numberTranscoders",
            "numberProbes",
            "isBrackets",
            "build_no",
            "ignoredrives",
            "skip_proxyengine"
        ], function (key) {
            json[key] = grunt.option("barracuda-" + key) || json[key];
        });
        grunt.file.write(configFile, JSON.stringify(json, undefined, 4));
    });

    grunt.registerTask("default", ["limecraft-node", "setup", "build"]);
};
