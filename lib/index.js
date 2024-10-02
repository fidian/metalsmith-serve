"use strict";

const serveHandlerPromise = import('@fidian/serve-handler');
const http = require("http");
var path = require("path");

// See serve-handler for option descriptions, especially headers and redirects.
var defaults = {
    port: 8080,
    host: "localhost",
    listDirectories: false,
    headers: {},
    redirects: []
};

var serve = function (options) {
    var server;
    var sockets = {};

    var f = function (files, metalsmith, done) {
        if (server) {
            done();
            return;
        }

        var docRoot = options.document_root
            ? path.resolve(options.document_root)
            : metalsmith.destination();
        console.log(docRoot);

        server = true; // Temporary value
        serveHandlerPromise.then((serveHandler) => {
            server = http.createServer((req, res) => 
                serveHandler.default(req, res, {
                    public: docRoot,
                    redirects: options.redirects,
                    headers: options.headers,
                    directoryListing: options.listDirectories
                })
            );
            server.on("error", function (err) {
                if (err.code == "EADDRINUSE") {
                    log(
                        "Address " +
                            options.host +
                            ":" +
                            options.port +
                            " already in use"
                    );
                    throw err;
                }
            });

            var nextSocketId = 0;
            server.on("connection", function (socket) {
                // Add a newly connected socket
                var socketId = nextSocketId++;
                sockets[socketId] = socket;

                // Remove the socket when it closes
                socket.on("close", function () {
                    delete sockets[socketId];
                });

                socket.setTimeout(2000);
            });

            server.listen(options.port, options.host);

            log(
                "serving " +
                    docRoot +
                    " at http://" +
                    options.host +
                    ":" +
                    options.port
            );
            done();
        });
    };

    f.shutdown = function (done) {
        // destroy all open sockets
        for (var socketId in sockets) {
            sockets[socketId].destroy();
            delete sockets[socketId];
        }

        server.close(function () {
            done();
        });
    };

    f.sockets = sockets;
    f.defaults = defaults;

    return f;
};

function formatNumber(num) {
    return num < 10 ? "0" + num : num;
}

function log(message, timestamp) {
    var tag = "[metalsmith-serve]";
    var date = new Date();
    var tstamp =
        formatNumber(date.getHours()) +
        ":" +
        formatNumber(date.getMinutes()) +
        ":" +
        formatNumber(date.getSeconds());
    console.log(tag + (timestamp ? " " + tstamp : "") + " " + message);
}

var plugin = function (options) {
    if (typeof options !== "object") {
        options = defaults;
    }

    Object.keys(defaults).forEach(function (key) {
        if (!options[key]) {
            options[key] = defaults[key];
        }
    });

    return serve(options);
};

module.exports = plugin;
