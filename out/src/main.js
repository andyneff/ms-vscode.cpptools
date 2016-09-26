'use strict';
var vscode = require('vscode');
var path = require('path');
var util = require('./common');
var vsutil = require('./common_vscode');
var Telemetry = require('./telemetry');
var C_Cpp = require('./LanguageServer/C_Cpp');
var DebuggerExtension = require('./Debugger/extension');
var platform_1 = require('./platform');
var packageManager_1 = require('./packageManager');
function activate(context) {
    Telemetry.activate(context);
    util.setExtensionPath(context.extensionPath);
    processRuntimeDependencies(function () {
        DebuggerExtension.activate(context);
        C_Cpp.activate(context);
    });
}
exports.activate = activate;
function deactivate() {
    C_Cpp.deactivate();
    DebuggerExtension.deactivate();
    Telemetry.deactivate();
}
exports.deactivate = deactivate;
function processRuntimeDependencies(activateExtensions) {
    util.checkLockFile().then(function (lockExists) {
        if (!lockExists) {
            var channel_1 = vsutil.getOutputChannel();
            channel_1.show();
            channel_1.appendLine("Updating C/C++ dependencies...");
            var statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            var errorMessage_1 = '';
            var installationStage_1 = 'getPlatformInfo';
            var platformInfo_1;
            var packageManager_2;
            platform_1.PlatformInformation.GetPlatformInformation()
                .then(function (info) {
                platformInfo_1 = info;
                packageManager_2 = new packageManager_1.PackageManager(info, channel_1, statusItem);
                channel_1.appendLine("");
                installationStage_1 = "downloadPackages";
                return packageManager_2.DownloadPackages();
            })
                .then(function () {
                channel_1.appendLine("");
                installationStage_1 = "installPackages";
                return packageManager_2.InstallPackages();
            })
                .then(function () {
                installationStage_1 = "makeBinariesExecutable";
                return vsutil.allowExecution(path.resolve(util.getDebugAdaptersPath(), "OpenDebugAD7"));
            })
                .then(function () {
                installationStage_1 = "rewriteManifest";
                return rewriteManifest();
            })
                .then(function () {
                checkDistro(channel_1, platformInfo_1);
                installationStage_1 = "touchLockFile";
                return util.touchLockFile();
            })
                .catch(function (error) {
                errorMessage_1 = error.toString();
                channel_1.appendLine("Failed at stage: " + installationStage_1);
                channel_1.appendLine(errorMessage_1);
            })
                .then(function () {
                channel_1.appendLine("");
                installationStage_1 = '';
                channel_1.appendLine("Finished");
                var acquisitionEvent = {
                    'success': (!errorMessage_1).toString(),
                    'stage': installationStage_1,
                    'error': errorMessage_1
                };
                if (platformInfo_1.distribution) {
                    acquisitionEvent['linuxDistroName'] = platformInfo_1.distribution.name;
                    acquisitionEvent['linuxDistroVersion'] = platformInfo_1.distribution.version;
                }
                acquisitionEvent['osArchitecture'] = platformInfo_1.architecture;
                Telemetry.logDebuggerEvent("acquisition", acquisitionEvent);
                statusItem.dispose();
                activateExtensions();
            });
        }
        else {
            activateExtensions();
        }
    });
}
function checkDistro(channel, platformInfo) {
    if (platformInfo.platform != 'win32' && platformInfo.platform != 'linux' && platformInfo.platform != 'darwin') {
        channel.appendLine("Warning: Debugging has not been tested for this platform. " + util.getReadmeMessage());
    }
}
function rewriteManifest() {
    var manifestPath = path.resolve(util.getExtensionPath(), "package.json");
    return util.readFileText(manifestPath)
        .then(function (manifestString) {
        var manifestObject = JSON.parse(manifestString);
        manifestObject.contributes.debuggers[0].runtime = undefined;
        manifestObject.contributes.debuggers[0].program = './debugAdapters/OpenDebugAD7';
        manifestObject.contributes.debuggers[0].windows = { "program": "./debugAdapters/bin/OpenDebugAD7.exe" };
        manifestString = JSON.stringify(manifestObject, null, 2);
        return util.writeFileText(manifestPath, manifestString);
    });
}
//# sourceMappingURL=main.js.map