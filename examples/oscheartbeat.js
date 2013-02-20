var dgram, osc, outport, sendHeartbeat, udp;

osc = require('osc-min');

dgram = require("dgram");

udp = dgram.createSocket("udp4");

if (process.argv[2] != null) {
    outport = parseInt(process.argv[2]);
} else {
    outport = 41234;
}

console.log("sending heartbeat messages to http://localhost:" + outport);

//~verbatim:examples[1]~
//### Send a bunch of args every two seconds
sendHeartbeat = function() {
    var buf;
    buf = osc.toBuffer({
        address: "/heartbeat",
        args: [
            12, "sttttring", new Buffer("beat"), {
                type: "integer",
                value: 7
            }
        ]
    });
    return udp.send(buf, 0, buf.length, outport, "localhost");
};

setInterval(sendHeartbeat, 2000);
