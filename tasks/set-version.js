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
/*global module, require*/

module.exports = function (grunt) {
    "use strict";
    
    var common = require("./common")(grunt);

    function safeReplace(content, regexp, replacement) {
        var newContent = content.replace(regexp, replacement);

        if (newContent === content) {
            grunt.fail.fatal("Regexp " + regexp + " did not match");
        }

        return newContent;
    }
    
    // task: set-sprint
    grunt.registerTask("set-version", "Update occurrences of sprint number for all native installers and binaries", function () {
        var packageJsonPath             = "package.json",
            packageJSON                 = grunt.file.readJSON(packageJsonPath),
            winInstallerBuildXmlPath    = "installer/win/brackets-win-install-build.xml",
            buildInstallerScriptPath    = "installer/mac/buildInstaller.sh",
            wxsPath                     = "installer/win/Brackets.wxs",
            versionRcPath               = "appshell/version.rc",
            infoPlistPath               = "appshell/mac/Info.plist",
            version                     = grunt.option("ver"),
            winInstallerSettingsJsonPath = "installer/win/settings.json",
            winInstallerSettingsJSON    = grunt.file.readJSON(winInstallerSettingsJsonPath),
            versionThreeParts,
            versionFourParts,
            versionParts,
            text,
            pad4,
            winVersion; //wix product version compares only three parts, so create a version with three parts
                        //but with all the info in it

        pad4 = function (number) {
            if (number <= 9999) { number = ("000"+number).slice(-4); }
            return number;
        }

        if (!version) {
            grunt.fail.fatal("Please specify a version. e.g. grunt set-version --ver=0.2.0.138");
        }

        versionParts = version.split(".");
        while (versionParts.length < 4) {
            versionParts.push("0");
        }
        versionThreeParts = versionParts[0] + "." + versionParts[1] + "." + versionParts[2];
        versionFourParts = versionThreeParts + "." + versionParts[3];
        winVersion = versionParts[0] + "." + versionParts[1] + "." + (pad4(parseInt(versionParts[2], 10)) + pad4(versionParts[3], 10));

        
        // 1. Update package.json
        packageJSON.version = versionThreeParts;
        common.writeJSON(packageJsonPath, packageJSON);

        // 2a. win/installer/settings.json
        winInstallerSettingsJSON["product.version"] = versionFourParts;
        winInstallerSettingsJSON["product.version.number"] = versionFourParts;
        winInstallerSettingsJSON["product.windowsVersion"] = winVersion;
        winInstallerSettingsJSON["product.version.name"] = versionFourParts;
        common.writeJSON(winInstallerSettingsJsonPath, winInstallerSettingsJSON);

        
        // 2. Open installer/win/brackets-win-install-build.xml and change `product.version`
        text = grunt.file.read(winInstallerBuildXmlPath);
        text = safeReplace(
            text,
            /<property name="product\.version" value="([0-9\.]+)"\/>/,
            '<property name="product.version" value="' + versionFourParts + '"/>'
        );
        grunt.file.write(winInstallerBuildXmlPath, text);
        
        // 3. Open installer/mac/buildInstaller.sh and change `releaseName`
        text = grunt.file.read(buildInstallerScriptPath);
        text = safeReplace(
            text,
            /version="([0-9\.]+)"/,
            'version="' + versionFourParts + '"'
        );
        grunt.file.write(buildInstallerScriptPath, text);
        
        // 4. Open appshell/version.rc and change `FILEVERSION` and `"FileVersion"`
        text = grunt.file.read(versionRcPath);
        text = safeReplace(
            text,
            /(FILEVERSION\s+)([0-9]+,[0-9]+,[0-9]+,[0-9]+)/,
            "$1" + versionFourParts.replace(/\./g, ",")
        );

        //VALUE "FileVersion",      "0.0.0\0"
        text = safeReplace(
            text,
            /(VALUE\s+"FileVersion",\s+)"[0-9\.]+\\0"/,
            '$1"' + versionFourParts + '\\0"'
        );

        grunt.file.write(versionRcPath, text);
        
        // 5. Open appshell/mac/Info.plist and change `CFBundleShortVersionString` and `CFBundleVersion`text = grunt.file.read(wxsPath);
        text = grunt.file.read(infoPlistPath);
        text = safeReplace(
            text,
            /(<key>CFBundleVersion<\/key>\s*<string>)([0-9\.]+)(\s*<\/string>)/,
            "$1" + versionFourParts + "$3"
        );
        text = safeReplace(
            text,
            /(<key>CFBundleShortVersionString<\/key>\s*<string>)([0-9\.]+)(\s*<\/string>)/,
            "$1" + versionFourParts + "$3"
        );
        grunt.file.write(infoPlistPath, text);
    });
};