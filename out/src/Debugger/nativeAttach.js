"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var common_1 = require('../common');
var os = require('os');
var Process = (function () {
    function Process(name, pid, commandLine) {
        this.name = name;
        this.pid = pid;
        this.commandLine = commandLine;
    }
    Process.prototype.toAttachItem = function () {
        return {
            label: this.name,
            description: this.pid,
            detail: this.commandLine,
            id: this.pid
        };
    };
    return Process;
}());
var Docker = (function () {
    function Docker(id, name, image, labels) {
        this.name = name + "["+id+"]";
        this.id = id;
        this.image = image
        this.labels = labels;
    }
    Docker.prototype.toAttachItem = function () {
        return {
            label: this.name,
            description: this.labels,
            detail: this.image,
            id: this.id
        };
    };
    return Docker;
}());
var NativeAttachItemsProviderFactory = (function () {
    function NativeAttachItemsProviderFactory() {
    }
    NativeAttachItemsProviderFactory.Get = function () {
        if (os.platform() === 'win32') {
            return new WmicAttachItemsProvider();
        }
        else {
            return new PsAttachItemsProvider();
        }
    };
    return NativeAttachItemsProviderFactory;
}());
exports.NativeAttachItemsProviderFactory = NativeAttachItemsProviderFactory;
var NativeAttachItemsProvider = (function () {
    function NativeAttachItemsProvider() {
    }
    NativeAttachItemsProvider.prototype.getAttachItems = function () {
        return this.getInternalProcessEntries().then(function (processEntries) {
            processEntries.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    NativeAttachItemsProvider.prototype.getDockerItems = function () {
        return this.getDockerEntries().then(function (processEntries) {
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    NativeAttachItemsProvider.prototype.getDockerAttachItems = function (dockerName) {
        return this.getDockerProcessEntries(dockerName).then(function (processEntries) {
            processEntries.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    NativeAttachItemsProvider.prototype.getRemoteAttachItems = function (adddress) {
        return this.getRemoteProcessEntries(adddress).then(function (processEntries) {
            processEntries.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    return NativeAttachItemsProvider;
}());
var PsAttachItemsProvider = (function (_super) {
    __extends(PsAttachItemsProvider, _super);
    function PsAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(PsAttachItemsProvider, "secondColumnCharacters", {
        get: function () { return 50; },
        enumerable: true,
        configurable: true
    });
    PsAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var _this = this;
        var commColumnTitle = Array(PsAttachItemsProvider.secondColumnCharacters).join("a");
        var psCommand = ("ps -axww -o pid=,comm=" + commColumnTitle + ",args=") + (os.platform() === 'darwin' ? ' -c' : '');
        return common_1.execChildProcess(psCommand, null).then(function (processes) {
            return _this.parseProcessFromPs(processes);
        });
    };
    PsAttachItemsProvider.prototype.getDockerEntries = function () {
        var _this = this;
        var psCommand = ("docker ps --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Labels}}'");
        return common_1.execChildProcess(psCommand, null).then(function (dockers) {
            return _this.parseDockersFromPs(dockers);
        });
    };
    PsAttachItemsProvider.prototype.getDockerProcessName = function (launchConfig) {
        if (!("miDockerName" in launchConfig && "dockerProcessId" in launchConfig)){
            vscode.window.showErrorMessage('miDockerName or dockerProcessId is not specified in launch.json');
            return;
        }

        var psCommand = ("docker exec "+launchConfig.miDockerName+" ps -o comm= "+launchConfig.dockerProcessId);
        return common_1.execChildProcess(psCommand, null).then(function (processName) {
            return processName.trim();
        });
    };
    PsAttachItemsProvider.prototype.parseDockersFromPs = function (processes) {
        var lines = processes.split(os.EOL);
        var dockerEntries = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            var docker_1 = this.parseDockerLineFromPs(line);
            dockerEntries.push(docker_1);
        }
        return dockerEntries;
    };
    PsAttachItemsProvider.prototype.parseDockerLineFromPs = function (line) {
        var dockerEntry = line.split('\t');
        dockerEntry.push(dockerEntry.splice(3).join('\t'));
        //Combine all entries after 4. I'm not sure if labels can have tabs or not
        dockerEntry = dockerEntry.map(function(v){return v.trim();});
        return new Docker(dockerEntry[0], dockerEntry[1], dockerEntry[2], dockerEntry[3]);
    };
    PsAttachItemsProvider.prototype.getRemoteProcessEntries = function (address) {
        var _this = this;
        var psCommand = "gdb -q -ex 'target extended-remote "+address+"' "
        psCommand += "-ex 'python import tempfile; tmp=tempfile.NamedTemporaryFile(); gdb.execute(\"set logging file \"+tmp.name)' "
        psCommand += "-ex 'set logging on' "
        psCommand += "-ex 'info os processes' "
        psCommand += "-ex 'set logging off' "
        psCommand += "-ex 'python pids = open(tmp.name, \"r\").readlines()[1:]; [print(\"%s %"+PsAttachItemsProvider.secondColumnCharacters+"s %s\" % tuple(pid.split(None, 2))) for pid in pids]' "
        psCommand += "-ex q"
        return common_1.execChildProcess(psCommand, null).then(function (processes) {
            return _this.parseProcessFromPs(processes.split("\nDone logging")[1]);
        });
    };
    PsAttachItemsProvider.prototype.getDockerProcessEntries = function (dockerName) {
        var _this = this;
        PsAttachItemsProvider.secondColumnCharacters

        var commColumnTitle = Array(PsAttachItemsProvider.secondColumnCharacters).join("a");
        var psCommand = ("docker exec "+dockerName+" ps -axww -o pid=,comm=" + commColumnTitle + ",args=");
        return common_1.execChildProcess(psCommand, null).then(function (processes) {
            return _this.parseProcessFromPs(processes);
        });
    };
    PsAttachItemsProvider.prototype.parseProcessFromPs = function (processes) {
        var lines = processes.split(os.EOL);
        var processEntries = [];
        for (var i = 1; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            var process_1 = this.parseLineFromPs(line);
            processEntries.push(process_1);
        }
        return processEntries;
    };
    PsAttachItemsProvider.prototype.parseLineFromPs = function (line) {
        var psEntry = new RegExp("^\\s*([0-9]+)\\s+(.{" + (PsAttachItemsProvider.secondColumnCharacters - 1) + "})\\s+(.*)$");
        var matches = psEntry.exec(line);
        if (matches && matches.length === 4) {
            var pid = matches[1].trim();
            var executable = matches[2].trim();
            var cmdline = matches[3].trim();
            return new Process(executable, pid, cmdline);
        }
    };
    return PsAttachItemsProvider;
}(NativeAttachItemsProvider));
exports.PsAttachItemsProvider = PsAttachItemsProvider;
var WmicAttachItemsProvider = (function (_super) {
    __extends(WmicAttachItemsProvider, _super);
    function WmicAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(WmicAttachItemsProvider, "wmicNameTitle", {
        get: function () { return 'Name'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WmicAttachItemsProvider, "wmicCommandLineTitle", {
        get: function () { return 'CommandLine'; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(WmicAttachItemsProvider, "wmicPidTitle", {
        get: function () { return 'ProcessId'; },
        enumerable: true,
        configurable: true
    });
    WmicAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var _this = this;
        var wmicCommand = 'wmic process get Name,ProcessId,CommandLine /FORMAT:list';
        return common_1.execChildProcess(wmicCommand, null).then(function (processes) {
            return _this.parseProcessFromWmic(processes);
        });
    };
    WmicAttachItemsProvider.prototype.parseProcessFromWmic = function (processes) {
        var lines = processes.split(os.EOL);
        var currentProcess = new Process(null, null, null);
        var processEntries = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            this.parseLineFromWmic(line, currentProcess);
            if (line.lastIndexOf(WmicAttachItemsProvider.wmicPidTitle, 0) === 0) {
                processEntries.push(currentProcess);
                currentProcess = new Process(null, null, null);
            }
        }
        return processEntries;
    };
    WmicAttachItemsProvider.prototype.parseLineFromWmic = function (line, process) {
        var splitter = line.indexOf('=');
        if (splitter >= 0) {
            var key = line.slice(0, line.indexOf('=')).trim();
            var value = line.slice(line.indexOf('=') + 1).trim();
            if (key === WmicAttachItemsProvider.wmicNameTitle) {
                process.name = value;
            }
            else if (key === WmicAttachItemsProvider.wmicPidTitle) {
                process.pid = value;
            }
            else if (key === WmicAttachItemsProvider.wmicCommandLineTitle) {
                var extendedLengthPath = '\\??\\';
                if (value.lastIndexOf(extendedLengthPath, 0) === 0) {
                    value = value.slice(extendedLengthPath.length);
                }
                process.commandLine = value;
            }
        }
    };
    return WmicAttachItemsProvider;
}(NativeAttachItemsProvider));
exports.WmicAttachItemsProvider = WmicAttachItemsProvider;
//# sourceMappingURL=nativeAttach.js.map