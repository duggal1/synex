"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.DockerService = void 0;
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
var dockerode_1 = require("dockerode");
var fs_extra_1 = require("fs-extra");
var path_1 = require("path");
var logger_1 = require("@/lib/logger");
var redis_1 = require("@/lib/redis");
var DockerService = /** @class */ (function () {
    function DockerService() {
        this.buildTimeout = 600000; // 10 minutes
        this.defaultConfig = {
            memory: 1024 * 1024 * 1024,
            cpus: 1,
            restartPolicy: 'always',
            healthcheck: {
                interval: 30000,
                timeout: 10000,
                retries: 3
            }
        };
        this.docker = new dockerode_1["default"]();
    }
    DockerService.prototype.createContainer = function (options) {
        return __awaiter(this, void 0, Promise, function () {
            var container, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.docker.createContainer(__assign(__assign({ Image: options.image, name: options.name }, options.config), { HostConfig: {
                                    Memory: options.config.Memory,
                                    NanoCpus: options.config.NanoCpus,
                                    NetworkMode: options.config.NetworkMode,
                                    RestartPolicy: {
                                        Name: 'always'
                                    }
                                } }))];
                    case 1:
                        container = _a.sent();
                        logger_1.logger.info('Container created successfully', {
                            name: options.name,
                            image: options.image
                        });
                        return [2 /*return*/, container];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.error('Failed to create container:', error_1);
                        throw new Error("Failed to create container: " + (error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DockerService.prototype.getContainer = function (containerId) {
        return this.docker.getContainer(containerId);
    };
    DockerService.prototype.buildImage = function (projectId, buildPath, envVars) {
        return __awaiter(this, void 0, Promise, function () {
            var imageName, dockerfile, buildContext_1, buildOptions_1, stream, images, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        imageName = "project-" + projectId + ":latest";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, fs_extra_1["default"].pathExists(buildPath)];
                    case 2:
                        if (!(_a.sent())) {
                            throw new Error("Build path does not exist: " + buildPath);
                        }
                        dockerfile = this.generateNextjsDockerfile(envVars);
                        return [4 /*yield*/, fs_extra_1["default"].writeFile(path_1["default"].join(buildPath, 'Dockerfile'), dockerfile)];
                    case 3:
                        _a.sent();
                        buildContext_1 = {
                            context: buildPath,
                            src: ['Dockerfile', '.']
                        };
                        buildOptions_1 = {
                            dockerfile: 'Dockerfile',
                            t: imageName,
                            buildargs: envVars,
                            pull: "true"
                        };
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                _this.docker.buildImage(buildContext_1, buildOptions_1, function (err, response) {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve(response);
                                });
                            })];
                    case 4:
                        stream = _a.sent();
                        return [4 /*yield*/, this.followBuildProgress(stream)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.docker.listImages({
                                filters: { reference: [imageName] }
                            })];
                    case 6:
                        images = _a.sent();
                        if (images.length === 0) {
                            throw new Error('Image build completed but image not found');
                        }
                        return [4 /*yield*/, redis_1.redis.set("docker:build:" + projectId, imageName, '86400' // 24 hours
                            )];
                    case 7:
                        _a.sent();
                        return [2 /*return*/, imageName];
                    case 8:
                        error_2 = _a.sent();
                        logger_1.logger.error('Docker build failed:', {
                            projectId: projectId,
                            error: error_2 instanceof Error ? error_2.message : 'Unknown error'
                        });
                        throw new Error("Docker build failed: " + (error_2 instanceof Error ? error_2.message : 'Unknown error'));
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    DockerService.prototype.runContainer = function (imageName, projectId, port, config) {
        if (config === void 0) { config = {}; }
        return __awaiter(this, void 0, Promise, function () {
            var containerConfig, existingContainer, createOptions, container, healthy, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        containerConfig = __assign(__assign({}, this.defaultConfig), config);
                        return [4 /*yield*/, this.findContainer(projectId)];
                    case 1:
                        existingContainer = _a.sent();
                        if (!existingContainer) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.stopAndRemoveContainer(existingContainer)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        createOptions = {
                            Image: imageName,
                            name: "project-" + projectId,
                            ExposedPorts: {
                                '3000/tcp': {}
                            },
                            Healthcheck: {
                                Test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
                                Interval: containerConfig.healthcheck.interval * 1000000,
                                Timeout: containerConfig.healthcheck.timeout * 1000000,
                                Retries: containerConfig.healthcheck.retries
                            },
                            HostConfig: {
                                PortBindings: {
                                    '3000/tcp': [{ HostPort: port.toString() }]
                                },
                                RestartPolicy: {
                                    Name: containerConfig.restartPolicy
                                },
                                Memory: containerConfig.memory,
                                NanoCpus: containerConfig.cpus * 1000000000
                            },
                            Env: [
                                'NODE_ENV=production',
                                "PROJECT_ID=" + projectId
                            ]
                        };
                        return [4 /*yield*/, this.docker.createContainer(createOptions)];
                    case 4:
                        container = _a.sent();
                        return [4 /*yield*/, container.start()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.waitForHealthCheck(container)];
                    case 6:
                        healthy = _a.sent();
                        if (!!healthy) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.stopAndRemoveContainer(container)];
                    case 7:
                        _a.sent();
                        throw new Error('Container failed health check');
                    case 8: return [2 /*return*/, container.id];
                    case 9:
                        error_3 = _a.sent();
                        logger_1.logger.error('Container start failed:', {
                            projectId: projectId,
                            error: error_3 instanceof Error ? error_3.message : 'Unknown error'
                        });
                        throw new Error("Container start failed: " + (error_3 instanceof Error ? error_3.message : 'Unknown error'));
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    DockerService.prototype.followBuildProgress = function (stream) {
        return __awaiter(this, void 0, Promise, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!stream || !_this.docker.modem.followProgress) {
                            reject(new Error('Invalid stream or Docker modem'));
                            return;
                        }
                        _this.docker.modem.followProgress(stream, function (err, result) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        }, function (event) {
                            if (event.error) {
                                logger_1.logger.error('Build progress error:', event.error);
                            }
                            else if (event.stream) {
                                logger_1.logger.debug(event.stream.trim());
                            }
                        });
                    })];
            });
        });
    };
    DockerService.prototype.findContainer = function (projectId) {
        return __awaiter(this, void 0, Promise, function () {
            var containers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.docker.listContainers({
                            all: true,
                            filters: {
                                name: ["project-" + projectId]
                            }
                        })];
                    case 1:
                        containers = _a.sent();
                        return [2 /*return*/, containers.length > 0
                                ? this.docker.getContainer(containers[0].Id)
                                : null];
                }
            });
        });
    };
    DockerService.prototype.stopAndRemoveContainer = function (container) {
        return __awaiter(this, void 0, Promise, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, container.stop()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, container.remove()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        logger_1.logger.error('Failed to stop/remove container:', error_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DockerService.prototype.waitForHealthCheck = function (container) {
        var _a, _b;
        return __awaiter(this, void 0, Promise, function () {
            var i, info;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(i < 30)) return [3 /*break*/, 5];
                        return [4 /*yield*/, container.inspect()];
                    case 2:
                        info = _c.sent();
                        if (((_b = (_a = info.State) === null || _a === void 0 ? void 0 : _a.Health) === null || _b === void 0 ? void 0 : _b.Status) === 'healthy') {
                            return [2 /*return*/, true];
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, false];
                }
            });
        });
    };
    DockerService.prototype.generateNextjsDockerfile = function (envVars) {
        return "\nFROM node:18-alpine AS builder\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm ci --only=production\n\nCOPY . .\n\n" + Object.entries(envVars)
            .map(function (_a) {
            var key = _a[0], value = _a[1];
            return "ENV " + key + "=\"" + value.replace(/"/g, '\\"') + "\"";
        })
            .join('\n') + "\n\nRUN npm run build\n\nFROM node:18-alpine AS runner\nWORKDIR /app\n\nCOPY --from=builder /app/package*.json ./\nRUN npm ci --only=production\n\nCOPY --from=builder /app/.next ./.next\nCOPY --from=builder /app/public ./public\nCOPY --from=builder /app/next.config.js ./\n\nENV NODE_ENV=production\nENV NEXT_TELEMETRY_DISABLED=1\n\nRUN apk add --no-cache curl\nHEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\\n  CMD curl -f http://localhost:3000/health || exit 1\n\nEXPOSE 3000\nCMD [\"npm\", \"start\"]";
    };
    DockerService.prototype.startContainer = function (containerNameOrId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var container, info, isHealthy, error_5;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 7, , 8]);
                        container = this.docker.getContainer(containerNameOrId);
                        // Start the container
                        return [4 /*yield*/, container.start()];
                    case 1:
                        // Start the container
                        _d.sent();
                        return [4 /*yield*/, container.inspect()];
                    case 2:
                        info = _d.sent();
                        if (((_a = info.State) === null || _a === void 0 ? void 0 : _a.Status) !== 'running') {
                            throw new Error("Container failed to start. Status: " + ((_b = info.State) === null || _b === void 0 ? void 0 : _b.Status));
                        }
                        return [4 /*yield*/, this.waitForHealthCheck(container)];
                    case 3:
                        isHealthy = _d.sent();
                        if (!!isHealthy) return [3 /*break*/, 5];
                        logger_1.logger.error('Container health check failed', { containerNameOrId: containerNameOrId });
                        return [4 /*yield*/, this.stopAndRemoveContainer(container)];
                    case 4:
                        _d.sent();
                        throw new Error('Container failed health check');
                    case 5: 
                    // Setup container networking
                    return [4 /*yield*/, this.setupContainerNetworking(container)];
                    case 6:
                        // Setup container networking
                        _d.sent();
                        // Monitor container logs
                        this.monitorContainerLogs(container);
                        logger_1.logger.info('Container started successfully', {
                            containerId: info.Id,
                            name: info.Name,
                            status: (_c = info.State) === null || _c === void 0 ? void 0 : _c.Status
                        });
                        return [2 /*return*/, info.Id];
                    case 7:
                        error_5 = _d.sent();
                        logger_1.logger.error('Failed to start container:', {
                            containerNameOrId: containerNameOrId,
                            error: error_5 instanceof Error ? error_5.message : 'Unknown error'
                        });
                        throw new Error("Failed to start container: " + (error_5 instanceof Error ? error_5.message : 'Unknown error'));
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    DockerService.prototype.setupContainerNetworking = function (container) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var info, networkMode, network, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, container.inspect()];
                    case 1:
                        info = _b.sent();
                        networkMode = (_a = info.HostConfig) === null || _a === void 0 ? void 0 : _a.NetworkMode;
                        if (!(networkMode !== 'security-network')) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.docker.getNetwork('security-network')];
                    case 2:
                        network = _b.sent();
                        return [4 /*yield*/, network.connect({
                                Container: container.id,
                                EndpointConfig: {
                                    IPAMConfig: {
                                        IPv4Address: '' // Auto-assign IP
                                    }
                                }
                            })];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_6 = _b.sent();
                        logger_1.logger.error('Failed to setup container networking:', error_6);
                        throw error_6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    DockerService.prototype.monitorContainerLogs = function (container) {
        var logOptions = {
            follow: true,
            stdout: true,
            stderr: true,
            timestamps: true
        };
        container.logs(__assign(__assign({}, logOptions), { follow: true }))
            .then(function (stream) {
            if (stream instanceof Buffer) {
                logger_1.logger.debug('Container log:', {
                    containerId: container.id,
                    log: stream.toString('utf8').trim()
                });
                return;
            }
            stream.on('data', function (chunk) {
                var log = chunk.toString('utf8').trim();
                logger_1.logger.debug('Container log:', {
                    containerId: container.id,
                    log: log
                });
            });
            stream.on('error', function (error) {
                logger_1.logger.error('Container log stream error:', {
                    containerId: container.id,
                    error: error.message
                });
            });
        })["catch"](function (error) {
            logger_1.logger.error('Failed to attach container logs:', {
                containerId: container.id,
                error: error.message
            });
        });
    };
    return DockerService;
}());
exports.DockerService = DockerService;
