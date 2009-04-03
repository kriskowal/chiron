
sys.print('Secured.');

try {
    sys.a = 10;
    sys.print('FAIL cannot write sys attributes');
} catch (exception) {
    sys.print('PASS cannot write sys attributes');
}

try {
    a = 10;
    sys.print('FAIL cannot write free variables');
} catch (exception) {
    sys.print('PASS cannot write free variables');
}

try {
    this.a = 10;
    sys.print('FAIL cannot write to this');
} catch (exception) {
    sys.print('PASS cannot write to this');
}

try {
    (function () {return this})().a = 10;
    sys.print('FAIL cannot write to global');
} catch (exception) {
    sys.print('PASS cannot write to global');
}

try {
    require.loader = 10;
    sys.print('FAIL cannot write to require');
} catch (exception) {
    sys.print('PASS cannot write to require');
}

try {
    require.loader.load = 10;
    sys.print('FAIL cannot write to loader');
} catch (exception) {
    sys.print('PASS cannot write to loader');
}

try {
    var base = require('chiron/base');
    sys.print('PASS can require modules');
} catch (exception) {
    sys.print('FAIL can require modules');
    throw exception;
}

if (base.dir(sys).eq(["print"])) {
    sys.print("PASS sys has been attenuated to only include 'print'");
} else {
    sys.print("FAIL sys has been attenuated to only include 'print'");
}

