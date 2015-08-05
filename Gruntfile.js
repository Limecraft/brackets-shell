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
                "src"       : "<%= cef.url %>/cef_binary_<%= cef.version %>_windows32.zip"
            },
            "cef-win-symbols": {
                "src"  : ["<%= cef.url %>/cef_binary_<%= cef.version %>_windows32_debug_symbols.zip", "<%= cef.url %>/cef_binary_<%= cef.version %>_windows32_release_symbols.zip"],
                "dest" : "<%= downloads %>/cefsymbols"
            },
            "node-win": {
                "dest"      : "<%= downloads %>",
                "src"       : ["http://10.100.16.13/brackets-edge/v<%= node.version %>/node.exe",
                               "http://10.100.16.13/brackets-edge/npm-<%= npm.version %>.zip"]
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
            "www"               : ["<%= build.staging %>/www", "<%= build.staging %>/samples"],
            "server"            : ["Release/node-core", "<%= build.staging %>/node-core"]
        },
        "copy": {
            "serverToRelease":  {
                "files": [
                    {
                        "expand": true,
                        "cwd": "<%=git.server.repo%>",
                        "src": ["**", "!**/.git*"],
                        "dest": "Release/node-core/"
                    }
                ]
            },
            "branding": {
                "files": [
                    {
                        "expand": true,
                        "cwd": "branding/<%= grunt.option('brand') || 'limecraft' %>",
                        "src": ["appshell.ico", "appshell32.png", "appshell48.png", "appshell128.png", "appshell256.png"],
                        "dest": "appshell/res/"
                    },
                    {
                        "expand": true,
                        "cwd": "branding/<%= grunt.option('brand') || 'limecraft' %>",
                        "src": ["win_install_banner.jpg"],
                        "dest": "installer/win/"
                    }
                ]
            },
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
                            "cef_100_percent.pak",
                            "cef_200_percent.pak",
                            "devtools_resources.pak",
                            "libcef.dll",
                            "icudtl.dat",
                            "icudt.dll",

                            //Limecraft custom: extra necessary libs
                            "ffmpegsumo.dll",
                            "avcodec-55.dll",
                            "avformat-55.dll",
                            "avutil-52.dll",
                            "*.dll"
                        ],
                        "dest"      : "installer/win/staging/"
                    },
                    {
                        "expand"    : true,
                        "cwd"       : "Resources/",
                        "src"       : [
                            "*.*",
                            "locales/**"
                        ],
                        "dest"      : "installer/win/staging/"
                    }
                ]
            },
            "mac": {
                "files": [
                    {
                        "expand"    : true,
                        "cwd"       : "xcodebuild/Release/<%= build.name %>.app/",
                        "src"       : [
                            "**",
                            "!**/Contents/Frameworks/Chromium Embedded Framework.framework/Libraries/**"
                        ],
                        "dest"      : "installer/mac/staging/<%= build.name %>.app/"
                    }
                ],
                options: {
                    mode: true
                }
            },
            "cefplist" : {
                "files": [
                    {
                        "src"  : "CEF-Info.plist",
                        "dest" : "installer/mac/staging/<%= build.name %>.app/Contents/Frameworks/Chromium Embedded Framework.framework/Resources/Info.plist"
                    }
                ]
            },
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
                        "src"       : ["**", "!node_modules/**", "!.*/**", "!doc/**", "!styles/**", "!test/**"],
                        "dest"      : "<%= build.staging %>/www/"
                    }
                ]
            },
            "server": {
                "files": [
                    {
                        "dot"       : true,
                        "expand"    : true,
                        "cwd"       : "<%= git.server.repo %>",
                        "src"       : ["**", "!**/.git*"],
                        "dest"      : "<%= build.staging %>/node-core/"
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
            "name"              : "<%= grunt.config('apply-branding')['brands'][grunt.option('brand') || 'limecraft'].shortName %>",
            "staging"           : staging
        },
        "git": {
            "www": {
                "repo"      : grunt.option("www-repo") || "../edge-js/dist",    // TODO user configurable?
                "branch"    : grunt.option("www-branch") || "development"
            },
            "server": {
                "repo"      : grunt.option("server-repo") || "../edge",
                "branch"    : grunt.option("server-branch") || "master"
            },
            "shell": {
                "repo"      : ".",
                "branch"    : grunt.option("shell-branch") || ""
            }
        },
        "cef": {
            "url"           : "http://10.100.16.13",    //http://s3.amazonaws.com/files.brackets.io/cef",
            "version"       : "3.2171.2069"    //"3.2171.1902"
        },
        "node": {
            "version"       : "0.10.24"
        },
        "npm": {
            "version"       : "1.4.12"
        },
        "server-project": {
            "repo": "<%=git.server.repo%>"
        },
        "apply-branding": {
            "brands": {
                "limecraft": {
                    //short application name
                    shortName: "Edge",

                    //full application name
                    fullName: "Limecraft Edge",

                    //background color used for window
                    background: "RGB(74, 80, 85)",

                    //bundle identifier in mac Info.plist
                    bundleIdentifier: "com.limecraft.edge.appshell",

                    //manufacturer
                    manufacturer: "Limecraft"
                },
                "fielddock": {
                    shortName: "Field Dock",
                    fullName: "Dock10 Field Dock",
                    background: "RGB(74, 80, 85)",
                    bundleIdentifier: "com.limecraft.fielddock.appshell",
                    manufacturer: "Limecraft"
                }
            }
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

    grunt.registerTask("default", ["setup", "build"]);
};
