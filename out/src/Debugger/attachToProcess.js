"use strict";
var vscode = require('vscode');
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
        console.log("The file was saved!");
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
    return AttachPicker;
}());
exports.AttachPicker = AttachPicker;
//# sourceMappingURL=attachToProcess.js.map