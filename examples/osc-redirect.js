var inport, osc, outport, sock, udp;

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

console.log("OSC redirecter running at http://localhost:" + inport);

console.log("redirecting messages to http://localhost:" + outport);

//~verbatim:examples[2]~
//### A simple OSC redirecter
sock = udp.createSocket("udp4", function(msg, rinfo) {
    var redirected;
    try {
        redirected = osc.applyAddressTransform(msg, function(address) {
            return "/redirect" + address;
        });
        return sock.send(redirected, 0, redirected.length, outport, "localhost");
    } catch (error) {
        return console.log("error redirecting: " + error);
    }
});

sock.bind(inport);
