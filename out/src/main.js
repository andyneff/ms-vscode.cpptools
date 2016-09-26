"use strict";
var C_Cpp = require('./LanguageServer/C_Cpp');
var DebuggerExtension = require('./Debugger/extension');
var Telemetry = require('./telemetry');
function activate(context) {
    Telemetry.activate(context);
    C_Cpp.activate(context);
    DebuggerExtension.activate(context);
}
exports.activate = activate;
function deactivate() {
    DebuggerExtension.deactivate();
    C_Cpp.deactivate();
    Telemetry.deactivate();
}
exports.deactivate = deactivate;
//# sourceMappingURL=main.js.map