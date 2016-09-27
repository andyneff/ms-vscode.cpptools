"use strict";
var vscode = require('vscode');
var fs = require('fs');
var path = require('path');

var AttachPicker = (function () {
    function AttachPicker(attachItemsProvider) {
        this.attachItemsProvider = attachItemsProvider;
    }
    AttachPicker.prototype.ShowAttachEntries = function () {
        return this.attachItemsProvider.getAttachItems()
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenProcess) {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    };
    AttachPicker.prototype.ShowDockerAttachEntries = function (launchConfig) {
        if (!("miDockerName" in launchConfig)){
            vscode.window.showErrorMessage('miDockerName is not specified in launch.json');
            return;
        }

        return this.attachItemsProvider.getDockerAttachItems(launchConfig.miDockerName)
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenProcess) {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    };
    AttachPicker.prototype.ShowRemoteAttachEntries = function (launchConfig) {
        if (!("miRemoteServerAddress" in launchConfig)){
            vscode.window.showErrorMessage('miRemoteServerAddress is not specified in launch.json');
            return;
        }

        return this.attachItemsProvider.getRemoteAttachItems(launchConfig.miRemoteServerAddress)
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenProcess) {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    };
    AttachPicker.prototype.MakeGdbScript = function (launchConfig) {
        if (!("miRemoteServerAddress" in launchConfig)){
            vscode.window.showErrorMessage('miRemoteServerAddress is not specified in launch.json');
            return;
        }

        var filename = path.resolve(vscode.extensions.all.find(o => o.id == "ms-vscode.cpptools").extensionPath, 
                                    "gdb_" + launchConfig.miRemoteServerAddress.replace(':','_'));
        fs.writeFileSync(filename, "#!/usr/bin/env bash\ntouch /tmp/wtf\ngdb -ex 'target extended-remote "+launchConfig.miRemoteServerAddress+"' \"${@}\"\nrm $0\n");
        fs.chmodSync(filename, '0755');

        return filename;
    };
    AttachPicker.prototype.DockerGdb = function (launchConfig) {
        if (!("miDockerName" in launchConfig)){
            vscode.window.showErrorMessage('miDockerName is not specified in launch.json');
            return;
        }

        var filename = path.resolve(vscode.extensions.all.find(o => o.id == "ms-vscode.cpptools").extensionPath, 
                                    "tmp_" + launchConfig.miDockerName);
        fs.writeFileSync(filename, "#!/usr/bin/env bash\ndocker exec -it " + launchConfig.miDockerName + " gdb \"${@}\"\nrm $0\n");
        fs.chmodSync(filename, '0755');

        return filename;
    };
    return AttachPicker;
}());
exports.AttachPicker = AttachPicker;
//# sourceMappingURL=attachToProcess.js.map