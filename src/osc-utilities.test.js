//
// This file was used for TDD and as such probably has limited utility as
// actual unit tests.
//
import osc from '../src/osc-utilities.coffee';

const assert = require("assert");

// Basic string tests.

const testString = (str, expected_len) => ({
  str,
  len : expected_len
});

const testData = [
  testString("abc", 4),
  testString("abcd", 8),
  testString("abcde", 8),
  testString("abcdef", 8),
  testString("abcdefg", 8)
];

test('basic strings length', function() {
  testData.forEach((data) => {
    const oscstr = osc.toOscString(data.str);
    assert.strictEqual(oscstr.length, data.len);
  });
});


const testStringRoundTrip = function(str, strict) {
  const oscstr = osc.toOscString(str);
  const str2 = osc.splitOscString(oscstr, strict).string;
  assert.strictEqual(str, str2);
};

test('basic strings round trip', function() {
  testData.forEach((data) => testStringRoundTrip(data.str));
});


test('non strings fail toOscString', function() {
  assert.throws(() => osc.toOscString(7));
});


test('strings with null characters don\'t fail toOscString by default', function() {
  assert.notEqual(osc.toOscString("\u0000"), null);
});


test('strings with null characters fail toOscString in strict mode', function() {
  assert.throws(() => osc.toOscString("\u0000", true));
});


test('osc buffers with no null characters fail splitOscString in strict mode', function() {
  assert.throws(() => osc.splitOscString(new Buffer("abc"), true));
});


test('osc buffers with non-null characters after a null character fail fromOscString in strict mode', function() {
  assert.throws(() => osc.fromOscString(new Buffer("abc\u0000abcd"), true));
});


test('basic strings pass fromOscString in strict mode', function() {
  testData.forEach((data) => testStringRoundTrip(data.str, true));
});


test('osc buffers with non-four length fail in strict mode', function() {
  assert.throws(() => osc.fromOscString(new Buffer("abcd\u0000\u0000"), true));
});

test('splitOscString throws when passed a non-buffer', function() {
  assert.throws(() => osc.splitOscString("test"));
});

test('splitOscString of an osc-string matches the string', function() {
  const split = osc.splitOscString(osc.toOscString("testing it"));
  assert.strictEqual(split.string, "testing it");
  assert.strictEqual(split.rest.length, 0);
});


test('splitOscString works with an over-allocated buffer', function() {
  const buffer = osc.toOscString("testing it");
  const overallocated = new Buffer(16);
  buffer.copy(overallocated);
  const split = osc.splitOscString(overallocated);
  assert.strictEqual(split.string, "testing it");
  assert.strictEqual(split.rest.length, 4);
});


test('splitOscString works with just a string by default', function() {
  const split = osc.splitOscString((new Buffer("testing it")));
  assert.strictEqual(split.string, "testing it");
  assert.strictEqual(split.rest.length, 0);
});


test('splitOscString strict fails for just a string', function() {
  assert.throws(() => osc.splitOscString((new Buffer("testing it")), true));
});


test('splitOscString strict fails for string with not enough padding', function() {
  assert.throws(() => osc.splitOscString((new Buffer("testing \u0000\u0000")), true));
});


test('splitOscString strict succeeds for strings with valid padding', function() {
  const split = osc.splitOscString((new Buffer("testing it\u0000\u0000aaaa")), true);
  assert.strictEqual(split.string, "testing it");
  assert.strictEqual(split.rest.length, 4);
});


test('splitOscString strict fails for string with invalid padding', function() {
  assert.throws(() => osc.splitOscString((new Buffer("testing it\u0000aaaaa")), true));
});

test('concat throws when passed a single buffer', function() {
  assert.throws(() => osc.concat(new Buffer("test")));
});

test('concat throws when passed an array of non-buffers', function() {
  assert.throws(() => osc.concat(["bleh"]));
});

test('toIntegerBuffer throws when passed a non-number', function() {
  assert.throws(() => osc.toIntegerBuffer("abcdefg"));
});

test('splitInteger fails when sent a buffer that\'s too small', function() {
  assert.throws(() => osc.splitInteger(new Buffer(3, "Int32")));
});

test('splitOscArgument fails when given a bogus type', function() {
  assert.throws(() => osc.splitOscArgument(new Buffer(8, "bogus")));
});

test('fromOscMessage with no type string works', function() {
  const translate = osc.fromOscMessage(osc.toOscString("/stuff"));
  assert.strictEqual(translate.address, "/stuff");
  assert.deepEqual(translate.args, []);
});

test('fromOscMessage with type string and no args works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",");
  const oscmessage = new Buffer(oscaddr.length + osctype.length);
  oscaddr.copy(oscmessage);
  osctype.copy(oscmessage, oscaddr.length);
  const translate = osc.fromOscMessage(oscmessage);
  assert.strictEqual(translate != null ? translate.address : undefined, "/stuff");
  assert.deepEqual(translate != null ? translate.args : undefined, []);
});

test('fromOscMessage with string argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",s");
  const oscarg = osc.toOscString("argu");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype, oscarg]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "string");
  assert.strictEqual(translate.args[0].value, "argu");
});

test('fromOscMessage with true argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",T");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "true");
  assert.strictEqual(translate.args[0].value, true);
});

test('fromOscMessage with false argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",F");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "false");
  assert.strictEqual(translate.args[0].value, false);
});

test('fromOscMessage with null argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",N");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "null");
  assert.strictEqual(translate.args[0].value, null);
});

test('fromOscMessage with bang argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",I");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "bang");
  assert.strictEqual(translate.args[0].value, "bang");
});

test('fromOscMessage with blob argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",b");
  const oscarg = osc.concat([(osc.toIntegerBuffer(4)), new Buffer("argu")]);
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype, oscarg]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "blob");
  assert.strictEqual(translate.args[0].value.toString("utf8"), "argu");
});

test('fromOscMessage with integer argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",i");
  const oscarg = osc.toIntegerBuffer(888);
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype, oscarg]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "integer");
  assert.strictEqual(translate.args[0].value, 888);
});

test('fromOscMessage with timetag argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",t");
  const timetag = [8888, 9999];
  const oscarg = osc.toTimetagBuffer(timetag);
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype, oscarg]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "timetag");
  assert.deepEqual(translate.args[0].value, timetag);
});

test('fromOscMessage with mismatched array doesn\'t throw', function() {
  const oscaddr = osc.toOscString("/stuff");
  assert.doesNotThrow((() => osc.fromOscMessage(osc.concat(
    [oscaddr, osc.toOscString(",[")])))
  );
  assert.doesNotThrow((() => osc.fromOscMessage(osc.concat(
    [oscaddr, osc.toOscString(",[")])))
  );
});

test('fromOscMessage with mismatched array throws in strict', function() {
  const oscaddr = osc.toOscString("/stuff");
  assert.throws((() => osc.fromOscMessage((osc.concat(
    [oscaddr, osc.toOscString(",[")])), true))
  );
  assert.throws((() => osc.fromOscMessage((osc.concat(
    [oscaddr, osc.toOscString(",]")])), true))
  );
});

test('fromOscMessage with empty array argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",[]");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "array");
  assert.deepEqual(translate.args[0].value.length, 0);
  assert.deepEqual(translate.args[0].value, []);
});

test('fromOscMessage with bang array argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",[I]");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "array");
  assert.deepEqual(translate.args[0].value.length, 1);
  assert.deepEqual(translate.args[0].value[0].type, "bang");
  assert.deepEqual(translate.args[0].value[0].value, "bang");
});

test('fromOscMessage with string array argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",[s]");
  const oscarg = osc.toOscString("argu");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype, oscarg]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "array");
  assert.deepEqual(translate.args[0].value.length, 1);
  assert.deepEqual(translate.args[0].value[0].type, "string");
  assert.deepEqual(translate.args[0].value[0].value, "argu");
});

test('fromOscMessage with nested array argument works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",[[I]]");
  const translate = osc.fromOscMessage(osc.concat([oscaddr, osctype]));
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "array");
  assert.deepEqual(translate.args[0].value.length, 1);
  assert.deepEqual(translate.args[0].value[0].type, "array");
  assert.deepEqual(translate.args[0].value[0].value.length, 1);
  assert.deepEqual(translate.args[0].value[0].value[0].type, "bang");
  assert.deepEqual(translate.args[0].value[0].value[0].value, "bang");
});

test('fromOscMessage with multiple args works', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString(",sbi");
  const oscargs = [
        (osc.toOscString("argu")),
        (osc.concat([(osc.toIntegerBuffer(4)), new Buffer("argu")])),
        (osc.toIntegerBuffer(888))
  ];

  const oscbuffer = osc.concat([oscaddr, osctype, (osc.concat(oscargs))]);
  const translate = osc.fromOscMessage(oscbuffer);
  assert.strictEqual(translate.address, "/stuff");
  assert.strictEqual(translate.args[0].type, "string");
  assert.strictEqual(translate.args[0].value, "argu");
});

test('fromOscMessage strict fails if type string has no comma', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString("fake");
  assert.throws(() => osc.fromOscMessage((osc.concat([oscaddr, osctype])), true));
});

test('fromOscMessage non-strict works if type string has no comma', function() {
  const oscaddr = osc.toOscString("/stuff");
  const osctype = osc.toOscString("fake");
  const message = osc.fromOscMessage((osc.concat([oscaddr, osctype])));
  assert.strictEqual(message.address, "/stuff");
  assert.strictEqual(message.args.length, 0);
});

test('fromOscMessage strict fails if type address doesn\'t begin with /', function() {
  const oscaddr = osc.toOscString("stuff");
  const osctype = osc.toOscString(",");
  assert.throws(() => osc.fromOscMessage((osc.concat([oscaddr, osctype])), true));
});

test('fromOscBundle works with no messages', function() {
  const oscbundle = osc.toOscString("#bundle");
  const timetag = [0, 0];
  const osctimetag = osc.toTimetagBuffer(timetag);
  const buffer = osc.concat([oscbundle, osctimetag]);
  const translate = osc.fromOscBundle(buffer);
  assert.deepEqual(translate.timetag, timetag);
  assert.deepEqual(translate.elements, []);
});

test('fromOscBundle works with single message', function() {
  const oscbundle = osc.toOscString("#bundle");
  const timetag = [0, 0];
  const osctimetag = osc.toTimetagBuffer(timetag);
  const oscaddr = osc.toOscString("/addr");
  const osctype = osc.toOscString(",");
  const oscmessage = osc.concat([oscaddr, osctype]);
  const osclen = osc.toIntegerBuffer(oscmessage.length);
  const buffer = osc.concat([oscbundle, osctimetag, osclen, oscmessage]);
  const translate = osc.fromOscBundle(buffer);
  assert.deepEqual(translate.timetag, timetag);
  assert.strictEqual(translate.elements.length, 1);
  assert.strictEqual(translate.elements[0].address, "/addr");
});

test('fromOscBundle works with multiple messages', function() {
  const oscbundle = osc.toOscString("#bundle");
  const timetag = [0, 0];
  const osctimetag = osc.toTimetagBuffer(timetag);
  const oscaddr1 = osc.toOscString("/addr");
  const osctype1 = osc.toOscString(",");
  const oscmessage1 = osc.concat([oscaddr1, osctype1]);
  const osclen1 = osc.toIntegerBuffer(oscmessage1.length);
  const oscaddr2 = osc.toOscString("/addr2");
  const osctype2 = osc.toOscString(",");
  const oscmessage2 = osc.concat([oscaddr2, osctype2]);
  const osclen2 = osc.toIntegerBuffer(oscmessage2.length);
  const buffer = osc.concat([oscbundle, osctimetag, osclen1, oscmessage1, osclen2, oscmessage2]);
  const translate = osc.fromOscBundle(buffer);
  assert.deepEqual(translate.timetag, timetag);
  assert.strictEqual(translate.elements.length, 2);
  assert.strictEqual(translate.elements[0].address, "/addr");
  assert.strictEqual(translate.elements[1].address, "/addr2");
});

test('fromOscBundle works with nested bundles', function() {
  const oscbundle = osc.toOscString("#bundle");
  const timetag = [0, 0];
  const osctimetag = osc.toTimetagBuffer(timetag);
  const oscaddr1 = osc.toOscString("/addr");
  const osctype1 = osc.toOscString(",");
  const oscmessage1 = osc.concat([oscaddr1, osctype1]);
  const osclen1 = osc.toIntegerBuffer(oscmessage1.length);
  const oscbundle2 = osc.toOscString("#bundle");
  const timetag2 = [0, 0];
  const osctimetag2 = osc.toTimetagBuffer(timetag2);
  const oscmessage2 = osc.concat([oscbundle2, osctimetag2]);
  const osclen2 = osc.toIntegerBuffer(oscmessage2.length);
  const buffer = osc.concat([oscbundle, osctimetag, osclen1, oscmessage1, osclen2, oscmessage2]);
  const translate = osc.fromOscBundle(buffer);
  assert.deepEqual(translate.timetag, timetag);
  assert.strictEqual(translate.elements.length, 2);
  assert.strictEqual(translate.elements[0].address, "/addr");
  assert.deepEqual(translate.elements[1].timetag, timetag2);
});

test('fromOscBundle works with non-understood messages', function() {
  const oscbundle = osc.toOscString("#bundle");
  const timetag = [0, 0];
  const osctimetag = osc.toTimetagBuffer(timetag);
  const oscaddr1 = osc.toOscString("/addr");
  const osctype1 = osc.toOscString(",");
  const oscmessage1 = osc.concat([oscaddr1, osctype1]);
  const osclen1 = osc.toIntegerBuffer(oscmessage1.length);
  const oscaddr2 = osc.toOscString("/addr2");
  const osctype2 = osc.toOscString(",α");
  const oscmessage2 = osc.concat([oscaddr2, osctype2]);
  const osclen2 = osc.toIntegerBuffer(oscmessage2.length);
  const buffer = osc.concat([oscbundle, osctimetag, osclen1, oscmessage1, osclen2, oscmessage2]);
  const translate = osc.fromOscBundle(buffer);
  assert.deepEqual(translate.timetag, timetag);
  assert.strictEqual(translate.elements.length, 1);
  assert.strictEqual(translate.elements[0].address, "/addr");
});

test('fromOscBundle fails with bad bundle ID', function() {
  const oscbundle = osc.toOscString("#blunder");
  assert.throws(() => osc.fromOscBundle(oscbundle));
});

test('fromOscBundle fails with ridiculous sizes', function() {
  const timetag = [0, 0];
  const oscbundle = osc.concat([
    osc.toOscString("#bundle"),
    osc.toTimetagBuffer(timetag),
    osc.toIntegerBuffer(999999)
  ]);
  assert.throws(() => osc.fromOscBundle(oscbundle));
});

const roundTripMessage = function(args) {
  const oscMessage = {
    address : "/addr",
    args
  };
  const roundTrip = osc.fromOscMessage(osc.toOscMessage(oscMessage), true);
  assert.strictEqual(roundTrip.address, "/addr");
  assert.strictEqual(roundTrip.args.length, args.length);
  for (let i = 0; i < args.length; i += 1) {
    var comp = args[i].value != null ? args[i].value : args[i];
    if (args[i].type != null) {
      assert.strictEqual(roundTrip.args[i].type, args[i].type)
    }
    if (Buffer.isBuffer(comp)) {
      for (let j = 0; j < comp.length; j += 1) {
        assert.deepEqual(roundTrip.args[i].value[j], comp[j]);
      }
    } else {
      assert.deepEqual(roundTrip.args[i].value, comp);
    }
  }
};

test('toOscArgument fails when given bogus type', function() {
  assert.throws(() => osc.toOscArgument("bleh", "bogus"));
});

// we tested fromOsc* manually, so just use roundtrip testing for toOsc*
test('toOscMessage with no args works', function() {
  roundTripMessage([]);
});

test('toOscMessage strict with null argument throws', function() {
  assert.throws(() => osc.toOscMessage({address : "/addr", args : [null]}, true));
});

test('toOscMessage with string argument works', function() {
  roundTripMessage(["strr"]);
});

test('toOscMessage with empty array argument works', function() {
  roundTripMessage([[]]);
});

test('toOscMessage with array value works', function() {
  roundTripMessage([{value:[]}]);
});

test('toOscMessage with string array argument works', function() {
  roundTripMessage([[{type:"string", value:"hello"},
                   {type:"string", value:"goodbye"}]]);
});

test('toOscMessage with multi-type array argument works', function() {
  roundTripMessage([[{type:"string", value:"hello"},
                   {type:"integer", value:7}]]);
});

test('toOscMessage with nested array argument works', function() {
  roundTripMessage([[{type:"array", value:[{type:"string", value:"hello"}]}]]);
});

const buffeq = function(buff, exp_buff) {
  assert.strictEqual(buff.length, exp_buff.length);
  for (let i = 0; i < exp_buff.length; i += 1) {
    assert.equal(buff[i], exp_buff[i]);
  }
};

test('toOscMessage with bad layout works', function() {
  const oscMessage = {
    address : "/addr",
    args : [
      "strr"
    ]
  };
  const roundTrip = osc.fromOscMessage((osc.toOscMessage(oscMessage)), true);
  assert.strictEqual(roundTrip.address, "/addr");
  assert.strictEqual(roundTrip.args.length, 1);
  assert.strictEqual(roundTrip.args[0].value, "strr");
});

test('toOscMessage with single numeric argument works', function() {
  const oscMessage = {
    address : "/addr",
    args : 13
  };
  const roundTrip = osc.fromOscMessage((osc.toOscMessage(oscMessage)));
  assert.strictEqual(roundTrip.address, "/addr");
  assert.strictEqual(roundTrip.args.length, 1);
  assert.strictEqual(roundTrip.args[0].value, 13);
  assert.strictEqual(roundTrip.args[0].type, "float");
});

test('toOscMessage with args shortcut works', function() {
  const oscMessage = {
    address : "/addr",
    args : 13
  };
  const roundTrip = osc.fromOscMessage((osc.toOscMessage(oscMessage)));
  assert.strictEqual(roundTrip.address, "/addr");
  assert.strictEqual(roundTrip.args.length, 1);
  assert.strictEqual(roundTrip.args[0].value, 13);
  assert.strictEqual(roundTrip.args[0].type, "float");
});

test('toOscMessage with single blob argument works', function() {
  const buff = new Buffer(18);
  const oscMessage = {
    address : "/addr",
    args : buff
  };
  const roundTrip = osc.fromOscMessage((osc.toOscMessage(oscMessage)));
  assert.strictEqual(roundTrip.address, "/addr");
  assert.strictEqual(roundTrip.args.length, 1);
  buffeq(roundTrip.args[0].value, buff);
  assert.strictEqual(roundTrip.args[0].type, "blob");
});

test('toOscMessage with single string argument works', function() {
  const oscMessage = {
    address : "/addr",
    args : "strr"
  };
  const roundTrip = osc.fromOscMessage((osc.toOscMessage(oscMessage)));
  assert.strictEqual(roundTrip.address, "/addr");
  assert.strictEqual(roundTrip.args.length, 1);
  assert.strictEqual(roundTrip.args[0].value, "strr");
  assert.strictEqual(roundTrip.args[0].type, "string");
});

test('toOscMessage with integer argument works', function() {
  roundTripMessage([8]);
});

test('toOscMessage with buffer argument works', function() {
  // buffer will have random contents, but that's okay.
  roundTripMessage([new Buffer(16)]);
});

test('toOscMessage strict with type true and value false throws', function() {
  assert.throws(() => osc.toOscMessage({address: "/addr/", args: {type : "true", value : false}}, true));
});

test('toOscMessage strict with type false with value true throws', function() {
  assert.throws(() => osc.toOscMessage({address: "/addr/", args: {type : "false", value : true}}, true));
});

test('toOscMessage with type true works', function() {
  const roundTrip = osc.fromOscMessage(osc.toOscMessage({address: "/addr", args : true}));
  assert.strictEqual(roundTrip.args.length, 1);
  assert.strictEqual(roundTrip.args[0].value, true);
  assert.strictEqual(roundTrip.args[0].type, "true");
});

test('toOscMessage with type false works', function() {
  const roundTrip = osc.fromOscMessage(osc.toOscMessage({address: "/addr", args : false}));
  assert.strictEqual(roundTrip.args.length, 1);
  assert.strictEqual(roundTrip.args[0].value, false);
  assert.strictEqual(roundTrip.args[0].type, "false");
});

test('toOscMessage with type bang argument works', function() {
  const roundTrip = osc.fromOscMessage(osc.toOscMessage({address: "/addr", args : {type:"bang"}}));
  assert.strictEqual(roundTrip.args.length, 1);
  assert.strictEqual(roundTrip.args[0].value, "bang");
  assert.strictEqual(roundTrip.args[0].type, "bang");
});

test('toOscMessage with type timetag argument works', function() {
  roundTripMessage([{type: "timetag", value: [8888, 9999]}]);
});

test('toOscMessage with type double argument works', function() {
  roundTripMessage([{type: "double", value: 8888}]);
});

test('toOscMessage strict with type null with value true throws', function() {
  assert.throws(() => osc.toOscMessage({address: "/addr/", args: {type : "null", value : true}}, true));
});

test('toOscMessage with type null works', function() {
  const roundTrip = osc.fromOscMessage(osc.toOscMessage({address: "/addr", args : null}));
  assert.strictEqual(roundTrip.args.length, 1);
  assert.strictEqual(roundTrip.args[0].value, null);
  assert.strictEqual(roundTrip.args[0].type, "null");
});

test('toOscMessage with float argument works', function() {
  roundTripMessage([{value : 6, type : "float"}]);
});

test('toOscMessage just a string works', function() {
  const message = osc.fromOscMessage(osc.toOscMessage("bleh"));
  assert.strictEqual(message.address, "bleh");
  assert.strictEqual(message.args.length, 0);
});

test('toOscMessage with multiple args works', function() {
  roundTripMessage(["str", 7, (new Buffer(30)), 6]);
});

test('toOscMessage with integer argument works', function() {
  roundTripMessage([{value : 7, type: "integer"}]);
});

test('toOscMessage fails with no address', function() {
  assert.throws(() => osc.toOscMessage({args : []}));
});

const toOscMessageThrowsHelper = arg => assert.throws(() => osc.toOscMessage({
  address : "/addr",
  args : [arg]
}));

test('toOscMessage fails when string type is specified but wrong', function() {
  toOscMessageThrowsHelper({
  value : 7,
  type : "string"
});
});

test('toOscMessage fails when integer type is specified but wrong', function() {
  toOscMessageThrowsHelper({
    value : "blah blah",
    type : "integer"
  });
});

test('toOscMessage fails when float type is specified but wrong', function() {
  toOscMessageThrowsHelper({
    value : "blah blah",
    type : "float"
  });
});

test('toOscMessage fails when timetag type is specified but wrong', function() {
  toOscMessageThrowsHelper({
    value : "blah blah",
    type : "timetag"
  });
});

test('toOscMessage fails when double type is specified but wrong', function() {
  toOscMessageThrowsHelper({
    value : "blah blah",
    type : "double"
  });
});

test('toOscMessage fails when blob type is specified but wrong', function() {
  toOscMessageThrowsHelper({
    value : "blah blah",
    type : "blob"
  });
});

test('toOscMessage fails argument is a random type', function() {
  toOscMessageThrowsHelper({
    random_field : 42,
    "is pretty random" : 888
  });
});

const roundTripBundle = function(elems) {
  const oscMessage = {
    timetag : [0, 0],
    elements : elems
  };
  const roundTrip = osc.fromOscBundle(osc.toOscBundle(oscMessage), true);
  assert.deepEqual(roundTrip.timetag, [0, 0]);
  const length = typeof elems === "object" ? elems.length : 1;
  assert.strictEqual(roundTrip.elements.length, length);
  for (let i = 0; i < length; i += 1) {
    if (typeof elems === "object") {
      assert.deepEqual(roundTrip.elements[i].timetag, elems[i].timetag);
      assert.strictEqual(roundTrip.elements[i].address, elems[i].address);
    } else {
      assert.strictEqual(roundTrip.elements[i].address, elems);
    }
  }
};

test('toOscBundle with no elements works', function() {
  roundTripBundle([]);
});

test('toOscBundle with just a string works', function() {
  roundTripBundle("/address");
});

test('toOscBundle with just a number fails', function() {
  assert.throws(() => roundTripBundle(78));
});

test('toOscBundle with one message works', function() {
  roundTripBundle([{address : "/addr"}]);
});

test('toOscBundle with nested bundles works', function() {
  roundTripBundle([{address : "/addr"}, {timetag : [8888, 9999]}]);
});

test('toOscBundle with bogus packets works', function() {
  const roundTrip = osc.fromOscBundle(osc.toOscBundle({
    timetag : [0, 0],
    elements : [{timetag : [0, 0]}, {maddress : "/addr"}]
  }));
  assert.strictEqual(roundTrip.elements.length, 1);
  assert.deepEqual(roundTrip.elements[0].timetag, [0, 0]);
});

test('toOscBundle strict fails without timetags', function() {
  assert.throws(() => osc.toOscBundle({elements :[]}, true));
});

test('identity applyTransform works with single message', function() {
  const testBuffer = osc.toOscString("/message");
  assert.strictEqual((osc.applyTransform(testBuffer, a => a)), testBuffer);
});

test('nullary applyTransform works with single message', function() {
  const testBuffer = osc.toOscString("/message");
  assert.strictEqual((osc.applyTransform(testBuffer, a => new Buffer(0))).length, 0);
});

test('toOscPacket works when explicitly set to bundle', function() {
  const roundTrip = osc.fromOscBundle(osc.toOscPacket({timetag: 0, oscType:"bundle", elements :[]}, true));
  assert.strictEqual(roundTrip.elements.length, 0);
});

test('toOscPacket works when explicitly set to message', function() {
  const roundTrip = osc.fromOscPacket(osc.toOscPacket({address: "/bleh", oscType:"message", args :[]}, true));
  assert.strictEqual(roundTrip.args.length, 0);
  assert.strictEqual(roundTrip.address, "/bleh");
});

test('identity applyTransform works with a simple bundle', function() {
  const base = {
    timetag : [0, 0],
    elements : [
      {address : "test1"},
      {address : "test2"}
    ]
  };
  const transformed = osc.fromOscPacket(osc.applyTransform(osc.toOscPacket(base), a => a));

  assert.deepEqual(transformed.timetag, [0, 0]);
  assert.strictEqual(transformed.elements.length, base.elements.length);
  for (let i = 0; i < base.elements.length; i += 1) {
    assert.equal(transformed.elements[i].timetag, base.elements[i].timetag);
    assert.strictEqual(transformed.elements[i].address, base.elements[i].address);
  }
});

test('applyMessageTranformerToBundle fails on bundle without tag', function() {
  const func = osc.applyMessageTranformerToBundle((a => a));
  assert.throws(() => func(osc.concat([osc.toOscString("#grundle", osc.toIntegerBuffer(0, "Int64"))])));
});

test('addressTransform works with identity', function() {
  const testBuffer = osc.concat([
    osc.toOscString("/message"),
    new Buffer("gobblegobblewillsnever\u0000parse blah lbha")
  ]);
  const transformed = osc.applyTransform(testBuffer, osc.addressTransform(a => a));
  for (let i = 0; i < testBuffer.length; i += 1) {
    assert.equal(transformed[i], testBuffer[i]);
  }
});


test('addressTransform works with bundles', function() {
  const base = {
    timetag : [0, 0],
    elements : [
      {address : "test1"},
      {address : "test2"}
    ]
  };
  const transformed = osc.fromOscPacket((osc.applyTransform((osc.toOscPacket(base)), osc.addressTransform(a => "/prelude/" + a))));

  assert.deepEqual(transformed.timetag, [0, 0]);
  assert.strictEqual(transformed.elements.length, base.elements.length);
  for (let i = 0; i > base.elements.length; i += 1) {
    assert.equal(transformed.elements[i].timetag, base.elements[i].timetag);
    assert.strictEqual(transformed.elements[i].address, "/prelude/" + base.elements[i].address);
  }
});

test('messageTransform works with identity function for single message', function() {
  const message = {
    address: "/addr",
    args: []
  };
  const buff = osc.toOscPacket(message);
  buffeq((osc.applyTransform(buff, osc.messageTransform(a => a))), buff);
});


test('messageTransform works with bundles', function() {
  const message = {
    timetag : [0, 0],
    elements : [
      {address : "test1"},
      {address : "test2"}
    ]
  };
  const buff = osc.toOscPacket(message);
  buffeq((osc.applyTransform(buff, osc.messageTransform(a => a))), buff);
});

test('toTimetagBuffer works with a delta number', function() {
  const delta = 1.2345;
  osc.toTimetagBuffer(delta);
});

// assert dates are equal to within floating point conversion error
const assertDatesEqual = function (date1, date2) {
  assert(Math.abs(date1.getTime() - date2.getTime()) <= 1, '' + date1 + ' != ' + date2);
};

test('toTimetagBuffer works with a Date', function() {
  const date = new Date();
  osc.toTimetagBuffer(date);
});

test('toTimetagBuffer works with a timetag array', function() {
  const timetag = [1000, 10001];
  osc.toTimetagBuffer(timetag);
});

test('toTimetagBuffer throws with invalid', function() {
  assert.throws(() => osc.toTimetagBuffer("some bullshit"));
});

test('deltaTimetag makes array from a delta', function() {
  const delta = 1.2345;
  osc.deltaTimetag(delta);
});

test('timetagToDate converts timetag to a Date', function() {
  const date = new Date();
  const timetag = osc.dateToTimetag(date);
  const date2 = osc.timetagToDate(timetag);
  assertDatesEqual(date, date2);
});

test('timestampToTimetag converts a unix time to ntp array', function() {
  const date = new Date();
  const timetag = osc.timestampToTimetag(date.getTime() / 1000);
  const date2 = osc.timetagToDate(timetag);
  assertDatesEqual(date, date2);
});

test('dateToTimetag converts date to ntp array', function() {
  const date = new Date();
  const timetag = osc.dateToTimetag(date);
  const date2 = osc.timetagToDate(timetag);
  assertDatesEqual(date, date2);
});

test('timestamp <-> timeTag round trip', function() {
  const now = (new Date()).getTime() / 1000;
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  assert(near(osc.timetagToTimestamp(osc.timestampToTimetag(now)), now));
});

test('splitTimetag returns timetag from a buffer', function() {
  const timetag = [1000, 1001];
  const rest = "the rest";
  const buf = osc.concat([
    osc.toTimetagBuffer(timetag),
    new Buffer(rest)
  ]);
  const {timetag: timetag2, rest: rest2} = osc.splitTimetag(buf);
  assert.deepEqual(timetag2, timetag);
});
