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
    AttachPicker.prototype.DockerGdb = function (launchConfig) {
        if (!("miDockerName" in launchConfig)){
            vscode.window.showErrorMessage('miDockerName is not specified in launch.json');
            return;
        }

        var filename = "./tmp_" + launchConfig.miDockerName;
        fs.writeFileSync(filename, "#!/usr/bin/env bash\ndocker exec -it " + launchConfig.miDockerName + " gdb\nrm $0\n");
        fs.chmodSync(filename, '0755');

        return path.resolve(filename);
    };
    return AttachPicker;
}());
exports.AttachPicker = AttachPicker;
//# sourceMappingURL=attachToProcess.js.map