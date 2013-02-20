var float_to_int, inport, osc, outport, sock, udp;

osc = require('osc-min');

udp = require("dgram");

if (process.argv[2] != null) {
    inport = parseInt(process.argv[2]);
} else {
    inport = 41234;
}

if (process.argv[3] != null) {
    outport = parseInt(process.argv[3]);
} else {
    outport = 41235;
}

float_to_int = function(message) {
    var arg, _i, _len, _ref;
    _ref = message.args;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        if (arg.type === "float") {
            arg.type = "integer";
        }
    }
    return message;
};

sock = udp.createSocket("udp4", function(msg, rinfo) {
    var edited;
    try {
        edited = osc.applyMessageTransform(msg, function(message) {
            return float_to_int(message);
        });
        return sock.send(edited, 0, edited.length, outport, "localhost");
    } catch (error) {
        return console.log("error redirecting: " + error);
    }
});

sock.bind(inport);

console.log("OSC redirecter running at http://localhost:" + inport);

console.log("translating messages to http://localhost:" + outport);
