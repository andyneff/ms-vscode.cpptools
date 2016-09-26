"use strict";
var vscode = require('vscode');
var path = require('path');
var util = require('./common');
var platform_1 = require('./platform');
var packageManager_1 = require('./packageManager');
var telemetry_1 = require('../telemetry');
var attachToProcess_1 = require('./attachToProcess');
var nativeAttach_1 = require('./nativeAttach');
function activate(context) {
    util.setExtensionPath(context.extensionPath);
    util.checkLockFile().then(function (lockExists) {
        if (!lockExists) {
            var channel = vscode.window.createOutputChannel("C++ (DBG)");
            channel.show();
            channel.appendLine("Updating C++ Debugger dependencies...");
            var statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            var errorMessage_1 = '';
            var installationStage_1 = 'getPlatformInfo';
            var platformInfo_1;
            var packageManager_2;
            platform_1.PlatformInformation.GetPlatformInformation()
                .then(function (info) {
                platformInfo_1 = info;
                packageManager_2 = new packageManager_1.PackageManager(info, channel, statusItem);
                channel.appendLine("");
                installationStage_1 = "downloadPackages";
                return packageManager_2.DownloadPackages();
            })
                .then(function () {
                channel.appendLine("");
                installationStage_1 = "installPackages";
                return packageManager_2.InstallPackages();
            })
                .then(function () {
                channel.appendLine("");
                installationStage_1 = "makeBinariesExecutable";
                return util.allowExecution(path.resolve(util.getDebugAdaptersPath(), "OpenDebugAD7"));
            })
                .then(function () {
                installationStage_1 = "rewriteManifest";
                return rewriteManifest();
            })
                .then(function () {
                checkDistro(channel, platformInfo_1);
                installationStage_1 = "touchLockFile";
                return util.touchLockFile();
            })
                .catch(function (error) {
                errorMessage_1 = error.toString();
                channel.appendLine("Failed at stage: " + installationStage_1);
                channel.appendLine(errorMessage_1);
            })
                .then(function () {
                channel.appendLine("");
                installationStage_1 = '';
                channel.appendLine("Finished");
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
                telemetry_1.logDebuggerEvent("acquisition", acquisitionEvent);
                statusItem.dispose();
            });
        }
    });
    var attachItemsProvider = nativeAttach_1.NativeAttachItemsProviderFactory.Get();
    var attacher = new attachToProcess_1.AttachPicker(attachItemsProvider);
    var disposable = vscode.commands.registerCommand('extension.pickNativeProcess', function () { return attacher.ShowAttachEntries(); });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
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
//# sourceMappingURL=extension.js.map