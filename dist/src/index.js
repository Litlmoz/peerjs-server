"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const socket_io_1 = require("socket.io");
const config_1 = __importDefault(require("./config"));
const instance_1 = require("./instance");
function RoomServer(server) {
    const app = express_1.default();
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: ["http://localhost:3000", "https://web-player.vercel.app", "https://web-player-git-modularize-usepeerstate.litlmoz.vercel.app"],
            methods: ["GET", "POST"],
            allowedHeaders: ["origin", "x-requested-with", "content-type"]
        }
    });
    io.on("connection", socket => {
        socket.on("join-room", (roomId, userId) => {
            console.log(`join-room: ${roomId} ${userId}`);
            if (!roomId || !userId) {
                return;
            }
            socket.join(roomId);
            socket.to(roomId).broadcast.emit("user-connected", userId);
            socket.on("disconnect", () => {
                socket.to(roomId).broadcast.emit("user-disconnected", userId);
            });
        });
    });
    return app;
}
function ExpressPeerServer(server, options) {
    const app = express_1.default();
    const newOptions = Object.assign(Object.assign({}, config_1.default), options);
    if (newOptions.proxied) {
        app.set("trust proxy", newOptions.proxied === "false" ? false : !!newOptions.proxied);
    }
    app.on("mount", () => {
        if (!server) {
            throw new Error("Server is not passed to constructor - " +
                "can't start PeerServer");
        }
        instance_1.createInstance({ app, server, options: newOptions });
    });
    const roomServer = RoomServer(server);
    app.use(roomServer);
    return app;
}
exports.ExpressPeerServer = ExpressPeerServer;
function PeerServer(options = {}, callback) {
    const app = express_1.default();
    let newOptions = Object.assign(Object.assign({}, config_1.default), options);
    const port = newOptions.port;
    const host = newOptions.host;
    let server;
    const { ssl } = newOptions, restOptions = __rest(newOptions, ["ssl"]);
    if (ssl && ssl.key && ssl.cert) {
        server = https_1.default.createServer(ssl, app);
        newOptions = restOptions;
    }
    else {
        server = http_1.default.createServer(app);
    }
    app.use(function (_, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    const peerjs = ExpressPeerServer(server, newOptions);
    app.use(peerjs);
    server.listen(port, host, () => callback === null || callback === void 0 ? void 0 : callback(server));
    return peerjs;
}
exports.PeerServer = PeerServer;
