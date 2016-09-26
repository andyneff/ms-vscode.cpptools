"use strict";
var os = require('os');
var util = require('./common');
var linuxDistribution_1 = require('./linuxDistribution');
var PlatformInformation = (function () {
    function PlatformInformation(platform, architecture, distribution) {
        this.platform = platform;
        this.architecture = architecture;
        this.distribution = distribution;
    }
    PlatformInformation.GetPlatformInformation = function () {
        var platform = os.platform();
        var architecturePromise;
        var distributionPromise = Promise.resolve(null);
        switch (platform) {
            case "win32":
                architecturePromise = PlatformInformation.GetWindowsArchitecture();
                break;
            case "linux":
                architecturePromise = PlatformInformation.GetUnixArchitecture();
                distributionPromise = linuxDistribution_1.LinuxDistribution.GetDistroInformation();
                break;
            case "darwin":
                architecturePromise = PlatformInformation.GetUnixArchitecture();
                break;
        }
        return Promise.all([architecturePromise, distributionPromise])
            .then(function (_a) {
            var arch = _a[0], distro = _a[1];
            return new PlatformInformation(platform, arch, distro);
        });
    };
    PlatformInformation.GetWindowsArchitecture = function () {
        return util.execChildProcess('wmic os get osarchitecture', util.getExtensionPath())
            .then(function (architecture) {
            if (architecture) {
                var archArray = architecture.split(os.EOL);
                if (archArray.length >= 2) {
                    return archArray[1].trim();
                }
            }
            return null;
        });
    };
    PlatformInformation.GetUnixArchitecture = function () {
        return util.execChildProcess('uname -m', util.getExtensionPath())
            .then(function (architecture) {
            if (architecture) {
                return architecture.trim();
            }
            return null;
        });
    };
    return PlatformInformation;
}());
exports.PlatformInformation = PlatformInformation;
//# sourceMappingURL=platform.js.map