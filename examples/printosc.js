var inport, osc, sock, udp;

osc = require('osc-min');

udp = require("dgram");

if (process.argv[2] != null) {
    inport = parseInt(process.argv[2]);
} else {
    inport = 41234;
}

console.log("OSC listener running at http://localhost:" + inport);

//~verbatim:examples[0]~
//### A simple OSC printer
sock = udp.createSocket("udp4", function(msg, rinfo) {
    try {
        return console.log(osc.fromBuffer(msg));
    } catch (error) {
        return console.log("invalid OSC packet");
    }
});

sock.bind(inport);
