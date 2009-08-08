
system.print('Secured.');

try {
    a = 10;
    system.print('FAIL cannot write free variables');
} catch (exception) {
    system.print('PASS cannot write free variables');
}

try {
    this.a = 10;
    system.print('FAIL cannot write to this');
} catch (exception) {
    system.print('PASS cannot write to this');
}

try {
    (function () {return this})().a = 10;
    system.print('FAIL cannot write to global');
} catch (exception) {
    system.print('PASS cannot write to global');
}

try {
    require.loader = 10;
    system.print('FAIL cannot write to require');
} catch (exception) {
    system.print('PASS cannot write to require');
}

try {
    require.loader.load = 10;
    system.print('FAIL cannot write to loader');
} catch (exception) {
    system.print('PASS cannot write to loader');
}

try {
    system.a = 10;
    system.print('FAIL cannot write system attributes');
} catch (exception) {
    system.print('PASS cannot write system attributes');
}

system.print((require.loader.setPaths == undefined ? 'PASS' : 'FAIL') + ' loader.require.setPaths does not exist');

try {
    var context = new Packages.org.mozilla.javascript.Context();
    system.print('FAIL Java Packages classes are shut out');
} catch (exception) {
    system.print('PASS Java Packages classes are shut out');
}

try {
    var context = new org.mozilla.javascript.Context();
    system.print('FAIL Packages org classes are shut out');
} catch (exception) {
    system.print('PASS Packages org classes are shut out');
}

system.print((typeof Packages == 'undefined' ? 'PASS' : 'FAIL') + ' java Packages does not exist');
system.print((typeof java == 'undefined' ? 'PASS' : 'FAIL') + ' java java does not exist');
system.print((typeof org == 'undefined' ? 'PASS' : 'FAIL') + ' java org does not exist');
system.print((typeof net == 'undefined' ? 'PASS' : 'FAIL') + ' java net does not exist');
system.print((typeof com == 'undefined' ? 'PASS' : 'FAIL') + ' java com does not exist');

try {
    require('../sandbox/secured.js');
    system.print('FAIL cannot require .. past top');
} catch (exception) {
    system.print('PASS cannot require .. past top');
}

/*
try {
    var base = require('chiron/base');
    system.print('PASS can require modules');
} catch (exception) {
    system.print('FAIL can require modules');
    throw exception;
}

if (base.dir(system).eq(["print"])) {
    system.print("PASS system has been attenuated to only include 'print'");
} else {
    system.print("FAIL system has been attenuated to only include 'print'");
}

*/
