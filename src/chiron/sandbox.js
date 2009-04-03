
var base = require('./base');
var optioned = require('./optioned');

/*** AbstractLoader
*/
exports.AbstractLoader = base.type([optioned.Optioned], function (self, supr) {
    var factories = base.dict();

    /**** option factories
    */
    self.option('factories', function (_factories) {
        factories = base.dict(_factories);
    });

    /**** resolve
        returns a canonical id for a given id from an optional base id.
        Not implemented in `AbstractLoader`.
    */
    self.resolve = function (id, baseId) {
        throw new Error("'resolve' is not implemented by " + self.repr());
    };

    /**** fetch
        returns the text of a module for a given canonical id.
        Not implemented in `AbstractLoader`.
    */
    self.fetch = function (id) {
        throw new Error("'fetch' is not implemented by " + self.repr());
    };

    /**** evaluate
        returns a module factory function for a given module text
        and optionally the corresponding module idnetifier (to assist
        debugging).
    */
    self.evaluate = function (text, id) {
        if (require.loader)
            return require.loader.evaluate(text, id);
        else
            return new Function("require", "exports", "sys", text);
    };

    /**** load
        returns a module factory for the given canonical module
        identifier.
    */
    self.load = function (id) {
        if (!factories.has(id))
            self.reload(id);
        return factories.get(id);
    };

    /**** reload
        forces a module factory function to be reconstructed by 
        fetching and evaluating the module again.  Called by
        load when the module has not yet been memoized.  Returns
        nothing.
    */
    self.reload = function (id) {
        factories.set(id, self.evaluate(self.fetch(id), id));
    };

    /**** clear
        purges the factory memo.
    */
    self.clear = function () {
        factories.clear();
    };

});

/*** FileLoader
*/
exports.FileLoader = base.type([exports.AbstractLoader], function (self, supr) {
    var File = require('file').File;
    var stamps = base.Dict();
    var path = [];
    var extensions = ["", ".js"];
    var debug;

    /**** option paths
    */
    self.option('paths', function (_paths) {
        paths = base.array(_paths);
    });

    /**** option extensions
    */
    self.option('extensions', function (_extensions) {
        extensions = base.array(_extensions);
    });

    /**** options debug
    */
    self.option('debug', function (_debug) {
        debug = base.bool(_debug);
    });

    /**** resolve
    */
    self.resolve = function (id, baseId) {
        // nominally canonicalize.  really ought to be normalize
        if (typeof id != "string")
            throw new Error("module id '" + id + "' is not a String");
        if (id.charAt(0) == ".") {
            id = File.dirname(baseId) + "/" + id;
        }
        return self.normalize(id);
    };

    /**** normalize
    */
    self.normalize = function (id) {
        // todo: deprecate {platform} in favor of using sys.platform expressly
        id = id.replace("{platform}", "platforms/" + sys.platform);
        id = File.canonicalize(id);
        return id;
    };

    /**** fetch
    */
    self.fetch = function (id) {
        return File.read(self.find(id));
    };

    /**** load
    */
    self.load = function (id) {
        var fileName = self.find(id);
        if (stamps.has(id) && stamps.get(id).getTime() < File.mtime(fileName).getTime())
            self.reload(id);
        return supr.load(id);
    };

    /**** reload
    */
    self.reload = function (id) {
        if (debug && stamps.has(id))
            base.print('reloaded ' + id, 'module');
        stamps.set(id, File.mtime(self.find(id)));
        supr.reload(id);
    };

    /**** find
    */
    self.find = function (id) {
        try {
            return base.eachIter(paths, function (path) {
                return base.eachIter(extensions, function (extension) {
                    var fileName = File.join(path, id + extension);
                    if (File.exists(fileName))
                        return fileName;
                });
            }).sum().to(require('./boost').dropWhile(base.no)).next();
        } catch (exception) {
            if (base.isInstance(exception, base.StopIteration)) {
                throw new Error("module error: couldn't find \"" + id + '"');
            } else {
                throw exception;
            }
        }
    };

    /**** getPaths
    */
    self.getPaths = function () {
        return base.array(paths);
    };

    /**** getExtensions
    */
    self.getExtensions = function () {
        return base.array(extensions);
    };

});

/*** PrefixLoader
*/
exports.PrefixLoader = base.type(function (self, supr) {
    var prefix, loader;

    /**** init
    */
    self.init = function (_prefix, _loader, options) {
        supr.init(options);
        loader = _loader;
        prefix = _prefix;
    };

    /**** resolve
    */
    self.resolve = function (id, baseId) {
        return loader.resolve(id, baseId);
    };

    /**** evaluate
    */
    self.evaluate = function (text, canonicalId) {
        return loader.evaluate(text, prefix + canonicalId);
    };

    /**** fetch
    */
    self.fetch = function (canonicalId) {
        return loader.fetch(prefix + canonicalId);
    };

    /**** load
    */
    self.load = function (canonicalId) {
        return loader.load(prefix + canonicalId);
    };

});

/*** SecureLoaderMixin
*/
exports.SecureLoaderMixin = base.type(function (self, supr) {

    /**** resolve
    */
    self.resolve = function (id, baseId) {
        if (typeof id != "string")
            throw new Error("module id '" + id + "' is not a String");

        var idParts = id.split('/');
        if (idParts[0] == "." || idParts[0] == "..") {
            if (!baseId) {
                throw new Error(
                    'module ' + base.repr(id) + ' is relative, so it cannot ' +
                    'be used as a main module ID.'
                );
            }
            var baseIdParts = baseId.split('/');
            baseIdParts.pop();
            idParts.shift();
            idParts = baseIdParts.concat(idParts);
        }

        /* validate the path and parts, prevent traversing out of the tree */
        var parts = [];
        for (var i = 0; i < idParts.length; i++) {
            var part = idParts[i];
            if (part == ".") {
            } else if (part == "..") {
                if (parts.length == 0) {
                    throw new Error(
                        id + ' is an illegal module identifier ' +
                        '(traverses up, beyond the root)'
                    );
                }
                parts.pop();
            } else {
                if (!/^\w+$/.test(part)) {
                    throw new Error(
                        id + ' is an illegal module identifier ' + 
                        '(contains non-letter module name component)'
                    );
                }
                parts.push(part);
            }
        }

        return supr.resolve(id, baseId);
    };
    
    /**** evaluate
    */
    self.evaluate = function (text, id) {
        return exports.evaluate(text, id);
    };

});

/*** Sandbox
*/
exports.Sandbox = base.type(function (self, supr) {
    var loader,
        modules,
        sandboxEnvironment,
        debug,
        main,
        debugDepth = 0;

    /**** init
    */
    self.init = function (options) {
        supr.init(options);
        options = base.dict(options);
        loader = options.get('loader');
        modules = base.dict(options.get('modules', undefined));
        sandboxEnvironment = base.freeze(base.object(options.get('sys', undefined)));
        debug = options.get('debug', false);
    };

    /**** invoke
    */
    self.invoke = function (id, baseId, force) {
        if (base.no(baseId))
            main = id;

        id = loader.resolve(id, baseId);

        if (!modules.has(id) || force) {

            if (debug) {
                debugDepth++;
                sys.print(base.mul('+', debugDepth) + ' ' + id, 'module');
            }

            try {
                var exports = {};
                modules.set(id, exports);
                if (force)
                    loader.reload(id);
                var factory = loader.load(id);
                var require = Require(id);
                factory.call(base.freeze({}), require, exports, sandboxEnvironment);
            } catch (exception) {
                modules.del(id);
                throw exception;
            }

            if (debug) {
                sys.print(base.mul('-', debugDepth) + ' ' + id, 'module');
                debugDepth--;
            }

        }
        return modules.get(id);
    };

    /**** force
    */
    self.force = function (id, baseId) {
        return self(id, baseId, true);
    };

    /**** clear
        purges the module memo.
    */
    self.clear = function () {
        modules.clear();
    };

    var Require = function (baseId) {
        var require = function (id, force) {
            try {
                return self(id, baseId, force);
            } catch (exception) {
                if (exception.message)
                    exception.message += ' in ' + baseId;
                throw exception;
            }
        };
        require.force = function (id) {
            return require(id, true);
        };
        require.id = baseId;
        require.loader = loader;
        require.main = main;
        return base.freeze(require);
    };

});

/*** evaluate
*/

if (sys.platform == 'rhino') {

    var context = new Packages.org.mozilla.javascript.Context();
    var global = context.initStandardObjects(null, true); // sealed!
    delete global.Packages; // strange and wonderful that this is presently permitted
    seal(global);

    exports.evaluate = function (text, id) {
        // verify that the script is a program by compiling it as such
        context.compileString(text, id, 1, null);
        // return a module factory function instead though.
        return context.compileFunction(
            global,
            "function(require,exports,sys){"+text+"}",
            id,
            1,
            null
        );
    };

} else {

    base.print("Secure module loading is not available for your platform.", "warn");

    if (sys.evalGlobal) {
        exports.evaluate = sys.evalGlobal;
    } else {
        exports.evaluate = function () {
            return eval(arguments[0]);
        };
    };

}

/*** sandbox
    invoke a module in a fresh module system.
    accepts the name of the main module to enter initially,
    a system (that is coerced to an object),
    and options (that are coerced to a dictionary).

    options:

    - loader: an alternate loader object, that must
      implement `resolve` and `load`.  By default,
      attempts to use `require.loader`.  If no loader
      is available, throws an error.
    - debug: turns on debugging messages in the sandbox
    - prefix: indicates that you would like to create
      

*/
exports.sandbox = function (main, sys, options) {
    sys = base.freeze(base.object(sys));
    options = base.dict(options);
    var prefix = options.get('prefix', undefined);
    var loader = options.get('loader', require.loader);
    var debug = options.get('debug', false);
    if (!loader) throw new Error(
        "sandbox cannot operate without a loader, either explicitly " + 
        "provided as an option, or implicitly provided by the current " +
        "sandbox's 'loader' object."
    );
    if (prefix)
        loader = exports.PrefixLoader(prefix, loader);
    var sandbox = exports.Sandbox({
        loader: loader,
        sys: sys,
        debug: debug
    });
    return sandbox(main);
};

