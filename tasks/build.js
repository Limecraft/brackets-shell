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
/*jslint vars:true, regexp:true, nomen:true*/
/*global module, require, process*/

module.exports = function (grunt) {
    "use strict";

    var fs          = require("fs"),
        common      = require("./common")(grunt),
        q           = require("q"),
        semver      = require("semver"),
        spawn       = common.spawn,
        resolve     = common.resolve,
        platform    = common.platform(),
        _           = grunt.util._;

    function getBracketsEnv() {
        var env = _.extend(process.env);

        env.BRACKETS_SRC = resolve(grunt.config("git.www.repo"));
        env.BRACKETS_APP_NAME = grunt.config("build.name");

        return env;
    }

    // task: full-build
    grunt.registerTask("full-build", ["git", "create-project", "build-www", "build", "stage", "package"]);
    grunt.registerTask("installer", ["full-build", "build-installer"]);

    // task: build
    grunt.registerTask("build", "Build shell executable. Run 'grunt full-build' to update repositories, build the shell and package www files.", function (wwwBranch, shellBranch) {
        grunt.task.run("build-" + platform);
    });

    // task: build-www
    grunt.registerTask("build-www", "Check brackets repository for build artifacts", function () {
        var distPath = resolve(grunt.config("copy.www.files")[0].cwd);
        grunt.log.writeln(distPath);

        if (!grunt.file.exists(distPath)) {
            grunt.log.error(distPath + " file does not exist. Run `grunt build` in the brackets repo first.");
            return false;
        }
    });

    // task: build-mac
    grunt.registerTask("build-mac", "Build mac shell", function () {
        var done = this.async();

        spawn([
            "xcodebuild -project appshell.xcodeproj -config Release clean",
            "xcodebuild -project appshell.xcodeproj -config Release build"
        ]).then(function (result) {
            if (result.stderr.match('xcrun: Error')) {
                grunt.log.error('Unable to run : ' + result.cmd + ' ' + result.args.join(' '));
                grunt.log.error(result.stderr);
                return done(false);
            }
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });

    // task: build-win
    grunt.registerTask("build-win", "Build windows shell", function () {
        var done = this.async();

        spawn("cmd.exe /c scripts\\build_projects.bat").then(function () {
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });

    // task: build-linux
    grunt.registerTask("build-linux", "Build linux shell", function () {
        var done = this.async();

        spawn("make").then(function () {
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });

    // task: git
    grunt.registerMultiTask("git", "Pull specified repo branch from origin", function () {
        var repo = this.data.repo;

        if (!repo) {
            grunt.fail.fatal("Missing repo config");
        }

        repo = resolve(repo);

        if (this.data.branch) {
            grunt.log.writeln("Updating repo " + this.target + " at " + repo + " to branch " + this.data.branch);

            var done = this.async(),
                promise = spawn([
                    "git fetch origin",
                    "git checkout " + this.data.branch,
                    "git pull origin " + this.data.branch,
                    "git submodule sync",
                    "git submodule update --init --recursive"
                ], { cwd: repo });

            promise.then(function () {
                done();
            }, function (err) {
                grunt.log.writeln(err);
                done(false);
            });
        } else {
            grunt.log.writeln("Skipping fetch for " + this.target + " repo");
        }
    });

    // task: stage
    grunt.registerTask("stage", "Stage release files", function () {
        // stage platform-specific binaries
        grunt.task.run(["clean:staging-" + platform, "stage-" + platform]);
    });

    // task: stage-mac
    grunt.registerTask("stage-mac", "Stage mac executable files", function () {
        // stage platform-specific binaries, then package www files
        grunt.task.run("copy:mac");
        grunt.task.run("copy:cefplist");
    });

    // task: stage-win
    grunt.registerTask("stage-win", "Stage win executable files", function () {
        // stage platform-specific binaries, then package www files
        grunt.task.run("copy:win");
    });

    // task: stage-linux
    grunt.registerTask("stage-linux", "Stage linux executable files", function () {
        // stage platform-specific binaries, then package www files
        grunt.task.run("copy:linux");
    });

    // task: package
    grunt.registerTask("package", "Package www files", function () {
        grunt.task.run(["clean:www", "copy:www", "copy:samples"]);
        //grunt.task.run(["clean:server", "copy:server"]);
    });

    // task: build-installer
    grunt.registerTask("build-installer", "Build installer", function () {
        // TODO update brackets.config.json
        grunt.task.run(["clean:installer-" + platform, "build-installer-" + platform]);
    });

    // task: build-installer-mac
    grunt.registerTask("build-installer-mac", "Build mac installer", function () {
        var done = this.async();

        spawn(["bash buildInstaller.sh"], { cwd: resolve("installer/mac"), env: getBracketsEnv() }).then(function () {
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });

    // task: build-installer-win
    grunt.registerTask("build-installer-win", "Build windows installer", function () {
        var done = this.async();
        var wixBase = "C:\\Program Files (x86)\\WiX Toolset v3.7";
        var heatCmd = "\"" + wixBase + "\\bin\\heat.exe\"";
        var candleCmd = "\"" + wixBase + "\\bin\\candle.exe\"";
        var lightCmd = "\"" + wixBase + "\\bin\\light.exe\"";
        var settings = grunt.file.readJSON("installer/win/settings.json");
        var heatCommandFull;

        grunt.log.writeln("Building English installer for build " + settings["product.version.name"]);
        grunt.log.writeln("Heat: Generating fileset.");
        heatCommandFull = heatCmd + " dir .\\staging  -cg BRACKETSHARVESTMANAGER -gg -scom -sreg -sfrag -srd -t .\\HeatTransform.xslt -dr INSTALLDIR -out bracketsharvestmanager.wxs";
        grunt.log.writeln(heatCommandFull);
        spawn([heatCommandFull], { cwd: resolve("installer/win"), env: getBracketsEnv() })
            .then(function () {
                var candleArgs, candleCommandFull;
                candleArgs = [
                    "Brackets.wxs",
                    "WixUI_InstallDir.wxs",
                    "VCRedist8.wxs",
                    "ExitDialog.wxs",
                    "UserExit.wxs",
                    "ProgressDlg.wxs",
                    "MaintenanceWelcomeDlg.wxs",
                    "InstallDirDlg.wxs",
                    "bracketsharvestmanager.wxs",
                    "VerifyReadyDlg.wxs",
                    "BrowseDlg.wxs",
                    "-ext WixUtilExtension",
                    "-dcodepage=1252",
                    "-dProductVersionNumber='" + settings["product.version.number"] + "'",
                    "-dProductVersionName='" + settings["product.version.name"] + "'",
                    "-dProductManufacturer='" + settings["product.manufacturer"] + "'",
                    "-dRegistryRoot='" + settings["product.registry.root"] + "'",
                    "-dExeName='" + settings["product.shortname"] + "'",
                    "-dIconFile=appicon.ico",
                    "-dlicenseRtf=License.rtf"
                ];
                grunt.log.writeln("Candle: Prepping installer source.");
                candleCommandFull = candleCmd + " " + candleArgs.join(" ");
                grunt.log.writeln(candleCommandFull);
                return spawn([candleCommandFull], { cwd: resolve("installer/win"), env: getBracketsEnv() });
            })
            .then(function () {
                var lightArgs, lightCommandFull;
                lightArgs = [
                    "-b .\\staging ",
                    "-dvar.Version=" + settings["product.version.number"],
                    "-ext WixUIExtension",
                    "-ext WixUtilExtension",
                    "-cultures:en-us",
                    "Brackets.wixobj",
                    "bracketsharvestmanager.wixobj",
                    "WixUI_InstallDir.wixobj",
                    "VCRedist8.wixobj",
                    "ExitDialog.wixobj",
                    "InstallDirDlg.wixobj",
                    "UserExit.wixobj",
                    "ProgressDlg.wixobj",
                    "MaintenanceWelcomeDlg.wixobj",
                    "BrowseDlg.wixobj",
                    "VerifyReadyDlg.wixobj",
                    "-out '" + settings["product.fullname"] + ".msi'",
                    "-loc Brackets_en-us.wxl"
                ];
                grunt.log.writeln("Light: Compiling installer package.");
                lightCommandFull = lightCmd + " " + lightArgs.join(" ");
                grunt.log.writeln(lightCommandFull);
                return spawn([lightCommandFull], { cwd: resolve("installer/win"), env: getBracketsEnv() });
            })
            .then(function () {
                done();
            }, function (err) {
                grunt.log.error(err);
                done(false);
            });

        // spawn(["cmd.exe /c ant.bat -f brackets-win-install-build.xml"], { cwd: resolve("installer/win"), env: getBracketsEnv() }).then(function () {
        //     done();
        // }, function (err) {
        //     grunt.log.error(err);
        //     done(false);
        // });
    });

    // task: build-installer-linux
    grunt.registerTask("build-installer-linux", "Build linux installer", function () {
        var template = grunt.file.read("installer/linux/debian/control"),
            templateData = {},
            content;

        // populate debian control template fields
        templateData.version = grunt.file.readJSON(grunt.config("config-json")).version;
        templateData.size = 0;
        templateData.arch = (common.arch() === 64) ? "amd64" : "i386";

        // uncompressed file size
        grunt.file.recurse("installer/linux/debian/package-root/opt", function (abspath) {
            templateData.size += fs.statSync(abspath).size;
        });
        templateData.size = Math.round(templateData.size / 1000);

        // write file
        content = grunt.template.process(template, { data: templateData });
        grunt.file.write("installer/linux/debian/package-root/DEBIAN/control", content);

        var done = this.async(),
            version = semver.parse(grunt.config("pkg").version),
            release = version.major + "." + version.minor;

        spawn(["bash build_installer.sh"], { cwd: resolve("installer/linux"), env: getBracketsEnv() }).then(function () {
            return common.rename("installer/linux/brackets.deb", "installer/linux/Brackets Release " + release + " " + common.arch() + "-bit.deb");
        }).then(function () {
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });

    // task: build-linux-archive
    grunt.registerTask("build-linux-archive", "Build portable Linux .tar.gz", function () {
        var done = this.async(),
            version = semver.parse(grunt.config("pkg").version),
            release = version.major + "." + version.minor;

        spawn(["bash build_archive.sh"], { cwd: resolve("installer/linux"), env: getBracketsEnv() }).then(function () {
            return common.rename("installer/linux/brackets.tar.gz", "installer/linux/Brackets Release " + release + " " + common.arch() + "-bit.tar.gz");
        }).then(function () {
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });
};
