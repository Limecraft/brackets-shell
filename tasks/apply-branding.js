/**
 * Grunt task that will copy icons, images around so branding is correct
 */

/*global module, require*/

module.exports = function (grunt) {
    "use strict";

    var common = require("./common")(grunt);

    /**
     * Regexp replace with extra check afterwards to see if anything has changed
     *
     * @param content
     * @param regexp
     * @param replacement
     * @param {Boolean} mustChange - does the result have to differ from the original?
     * @returns {String} newContent
     */
    function safeReplace(content, regexp, replacement, mustChange) {
        var newContent, matches;
        newContent = content.replace(regexp, replacement);

        matches = content.match(regexp);
        if (matches === null) {
            grunt.fail.fatal("Regexp " + regexp + " did not match");
        }

        if (mustChange && (newContent === content)) {
            grunt.fail.fatal("Regexp " + regexp + " replace had no effect");
        }

        return newContent;
    }

    function safeReplaceFile(path, regexp, replacement, mustChange) {
        var text;
        text = grunt.file.read(path);
        text = safeReplace(
            text,
            regexp,
            replacement,
            mustChange
        );
        grunt.file.write(path, text);
    }

    // task: apply-branding
    grunt.registerTask("apply-branding", "Apply branding in images etc.", function () {
        var brand, config, brandingConfig,
            winInstallerSettingsJsonPath = "installer/win/settings.json",
            winInstallerSettingsJSON    = grunt.file.readJSON(winInstallerSettingsJsonPath);

        brand = grunt.option("brand") || "limecraft";

        //copy image resources (logos)
        grunt.task.run(["copy:branding"]);

        //read config
        config = grunt.config('apply-branding');
        brandingConfig = config['brands'][brand];
        grunt.log.write("Using " + brand + " branding parameters:\n", JSON.stringify(brandingConfig, undefined, 2));

        // 1. Window background color
        safeReplaceFile(
            "appshell/cef_dark_window.h",
            /(#define\s+CEF_COLOR_BACKGROUND_ACTIVE\s+)(RGB\(\d+,\s*\d+,\s*\d+\))/,
            '$1' + brandingConfig.background
        );

        // 2. releaseName mac
        safeReplaceFile(
            "installer/mac/buildInstaller.sh",
            /releaseName="[^"]+"/,
            'releaseName="' + brandingConfig.shortName + '"'
        );

        // 3. CFBundleIdentief in mac Info.plist
        safeReplaceFile(
            "appshell/mac/Info.plist",
            /(<key>CFBundleIdentifier<\/key>\s*<string>)([^<]+)(<\/string>)/,
            "$1" + brandingConfig.bundleIdentifier + "$3"
        );

        // 4. ProductName, ShortProductName in Brackets_en-us.wxl, Brackets_fr-fr.wxl
        safeReplaceFile(
            "installer/win/Brackets_en-us.wxl",
            /(<String Id="ProductName">)([^<]+)(<\/String>)/,
            "$1" + brandingConfig.fullName + "$3"
        );
        safeReplaceFile(
            "installer/win/Brackets_en-us.wxl",
            /(<String Id="ShortProductName">)([^<]+)(<\/String>)/,
            "$1" + brandingConfig.shortName + "$3"
        );
        safeReplaceFile(
            "installer/win/Brackets_fr-fr.wxl",
            /(<String Id="ProductName">)([^<]+)(<\/String>)/,
            "$1" + brandingConfig.fullName + "$3"
        );
        safeReplaceFile(
            "installer/win/Brackets_fr-fr.wxl",
            /(<String Id="ShortProductName">)([^<]+)(<\/String>)/,
            "$1" + brandingConfig.shortName + "$3"
        );

        // 5. product.xxx properties for win installer
        winInstallerSettingsJSON["product.shortname"] = brandingConfig.shortName;
        winInstallerSettingsJSON["product.registry.root"] = brandingConfig.shortName;
        winInstallerSettingsJSON["product.fullname"] = brandingConfig.fullName;
        winInstallerSettingsJSON["product.manufacturer"] = brandingConfig.manufacturer;
        common.writeJSON(winInstallerSettingsJsonPath, winInstallerSettingsJSON);

        // 6. APP_NAME in config.h
        safeReplaceFile(
            "appshell/config.h",
            /(#define\s+APP_NAME\s+[@L]?")([^"]+)(")/g,
            "$1" + brandingConfig.shortName + "$3"
        );

        // 7. appname in appshell_config.gypi
        safeReplaceFile(
            "appshell_config.gypi",
            /('appname':\s*")(.*)(")/g,
            "$1" + brandingConfig.shortName + "$3"
        );

        // 8. Flow in appshell/mac/LANG.lproj/MainMenu.xib
        safeReplaceFile(
            "appshell/mac/English.lproj/MainMenu.xib",
            /(Flow)/g,
            brandingConfig.fullName
        );
        safeReplaceFile(
            "appshell/mac/French.lproj/MainMenu.xib",
            /(Flow)/g,
            brandingConfig.fullName
        );
        safeReplaceFile(
            "appshell/mac/Japanese.lproj/MainMenu.xib",
            /(Flow)/g,
            brandingConfig.fullName
        );
    });
};