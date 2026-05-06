var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var dexie = {exports: {}};

/*
 * Dexie.js - a minimalistic wrapper for IndexedDB
 * ===============================================
 *
 * By David Fahlander, david.fahlander@gmail.com
 *
 * Version 4.4.2, Tue Mar 31 2026
 *
 * https://dexie.org
 *
 * Apache License Version 2.0, January 2004, http://www.apache.org/licenses/
 */

(function (module, exports$1) {
	(function (global, factory) {
	  module.exports = factory() ;
	})(commonjsGlobal, (function () {
	  var extendStatics = function(d, b) {
	    extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
	    return extendStatics(d, b);
	  };
	  function __extends(d, b) {
	    if (typeof b !== "function" && b !== null)
	        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	    extendStatics(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	  }
	  var __assign = function() {
	    __assign = Object.assign || function __assign(t) {
	        for (var s, i = 1, n = arguments.length; i < n; i++) {
	            s = arguments[i];
	            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
	        }
	        return t;
	    };
	    return __assign.apply(this, arguments);
	  };
	  function __spreadArray(to, from, pack) {
	    for (var i = 0, l = from.length, ar; i < l; i++) {
	        if (ar || !(i in from)) {
	            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
	            ar[i] = from[i];
	        }
	    }
	    return to.concat(ar || Array.prototype.slice.call(from));
	  }
	  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
	    var e = new Error(message);
	    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
	  };

	  var _global = typeof globalThis !== 'undefined'
	      ? globalThis
	      : typeof self !== 'undefined'
	          ? self
	          : typeof window !== 'undefined'
	              ? window
	              : commonjsGlobal;

	  var keys = Object.keys;
	  var isArray = Array.isArray;
	  if (typeof Promise !== 'undefined' && !_global.Promise) {
	      _global.Promise = Promise;
	  }
	  function extend(obj, extension) {
	      if (typeof extension !== 'object')
	          return obj;
	      keys(extension).forEach(function (key) {
	          obj[key] = extension[key];
	      });
	      return obj;
	  }
	  var getProto = Object.getPrototypeOf;
	  var _hasOwn = {}.hasOwnProperty;
	  function hasOwn(obj, prop) {
	      return _hasOwn.call(obj, prop);
	  }
	  function props(proto, extension) {
	      if (typeof extension === 'function')
	          extension = extension(getProto(proto));
	      (typeof Reflect === 'undefined' ? keys : Reflect.ownKeys)(extension).forEach(function (key) {
	          setProp(proto, key, extension[key]);
	      });
	  }
	  var defineProperty = Object.defineProperty;
	  function setProp(obj, prop, functionOrGetSet, options) {
	      defineProperty(obj, prop, extend(functionOrGetSet &&
	          hasOwn(functionOrGetSet, 'get') &&
	          typeof functionOrGetSet.get === 'function'
	          ? {
	              get: functionOrGetSet.get,
	              set: functionOrGetSet.set,
	              configurable: true,
	          }
	          : { value: functionOrGetSet, configurable: true, writable: true }, options));
	  }
	  function derive(Child) {
	      return {
	          from: function (Parent) {
	              Child.prototype = Object.create(Parent.prototype);
	              setProp(Child.prototype, 'constructor', Child);
	              return {
	                  extend: props.bind(null, Child.prototype),
	              };
	          },
	      };
	  }
	  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	  function getPropertyDescriptor(obj, prop) {
	      var pd = getOwnPropertyDescriptor(obj, prop);
	      var proto;
	      return pd || ((proto = getProto(obj)) && getPropertyDescriptor(proto, prop));
	  }
	  var _slice = [].slice;
	  function slice(args, start, end) {
	      return _slice.call(args, start, end);
	  }
	  function override(origFunc, overridedFactory) {
	      return overridedFactory(origFunc);
	  }
	  function assert(b) {
	      if (!b)
	          throw new Error('Assertion Failed');
	  }
	  function asap$1(fn) {
	      if (_global.setImmediate)
	          setImmediate(fn);
	      else
	          setTimeout(fn, 0);
	  }
	  function arrayToObject(array, extractor) {
	      return array.reduce(function (result, item, i) {
	          var nameAndValue = extractor(item, i);
	          if (nameAndValue)
	              result[nameAndValue[0]] = nameAndValue[1];
	          return result;
	      }, {});
	  }
	  function getByKeyPath(obj, keyPath) {
	      if (typeof keyPath === 'string' && hasOwn(obj, keyPath))
	          return obj[keyPath];
	      if (!keyPath)
	          return obj;
	      if (typeof keyPath !== 'string') {
	          var rv = [];
	          for (var i = 0, l = keyPath.length; i < l; ++i) {
	              var val = getByKeyPath(obj, keyPath[i]);
	              rv.push(val);
	          }
	          return rv;
	      }
	      var period = keyPath.indexOf('.');
	      if (period !== -1) {
	          var innerObj = obj[keyPath.substr(0, period)];
	          return innerObj == null
	              ? undefined
	              : getByKeyPath(innerObj, keyPath.substr(period + 1));
	      }
	      return undefined;
	  }
	  function setByKeyPath(obj, keyPath, value) {
	      if (!obj || keyPath === undefined)
	          return;
	      if ('isFrozen' in Object && Object.isFrozen(obj))
	          return;
	      if (typeof keyPath !== 'string' && 'length' in keyPath) {
	          assert(typeof value !== 'string' && 'length' in value);
	          for (var i = 0, l = keyPath.length; i < l; ++i) {
	              setByKeyPath(obj, keyPath[i], value[i]);
	          }
	      }
	      else {
	          var period = keyPath.indexOf('.');
	          if (period !== -1) {
	              var currentKeyPath = keyPath.substr(0, period);
	              var remainingKeyPath = keyPath.substr(period + 1);
	              if (remainingKeyPath === '')
	                  if (value === undefined) {
	                      if (isArray(obj) && !isNaN(parseInt(currentKeyPath)))
	                          obj.splice(currentKeyPath, 1);
	                      else
	                          delete obj[currentKeyPath];
	                  }
	                  else
	                      obj[currentKeyPath] = value;
	              else {
	                  var innerObj = obj[currentKeyPath];
	                  if (!innerObj || !hasOwn(obj, currentKeyPath))
	                      innerObj = obj[currentKeyPath] = {};
	                  setByKeyPath(innerObj, remainingKeyPath, value);
	              }
	          }
	          else {
	              if (value === undefined) {
	                  if (isArray(obj) && !isNaN(parseInt(keyPath)))
	                      obj.splice(keyPath, 1);
	                  else
	                      delete obj[keyPath];
	              }
	              else
	                  obj[keyPath] = value;
	          }
	      }
	  }
	  function delByKeyPath(obj, keyPath) {
	      if (typeof keyPath === 'string')
	          setByKeyPath(obj, keyPath, undefined);
	      else if ('length' in keyPath)
	          [].map.call(keyPath, function (kp) {
	              setByKeyPath(obj, kp, undefined);
	          });
	  }
	  function shallowClone(obj) {
	      var rv = {};
	      for (var m in obj) {
	          if (hasOwn(obj, m))
	              rv[m] = obj[m];
	      }
	      return rv;
	  }
	  var concat = [].concat;
	  function flatten(a) {
	      return concat.apply([], a);
	  }
	  var intrinsicTypeNames = 'BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey'
	      .split(',')
	      .concat(flatten([8, 16, 32, 64].map(function (num) {
	      return ['Int', 'Uint', 'Float'].map(function (t) { return t + num + 'Array'; });
	  })))
	      .filter(function (t) { return _global[t]; });
	  var intrinsicTypes = new Set(intrinsicTypeNames.map(function (t) { return _global[t]; }));
	  function cloneSimpleObjectTree(o) {
	      var rv = {};
	      for (var k in o)
	          if (hasOwn(o, k)) {
	              var v = o[k];
	              rv[k] =
	                  !v || typeof v !== 'object' || intrinsicTypes.has(v.constructor)
	                      ? v
	                      : cloneSimpleObjectTree(v);
	          }
	      return rv;
	  }
	  var circularRefs = null;
	  function deepClone(any) {
	      circularRefs = new WeakMap();
	      var rv = innerDeepClone(any);
	      circularRefs = null;
	      return rv;
	  }
	  function innerDeepClone(x) {
	      if (!x || typeof x !== 'object')
	          return x;
	      var rv = circularRefs.get(x);
	      if (rv)
	          return rv;
	      if (isArray(x)) {
	          rv = [];
	          circularRefs.set(x, rv);
	          for (var i = 0, l = x.length; i < l; ++i) {
	              rv.push(innerDeepClone(x[i]));
	          }
	      }
	      else if (intrinsicTypes.has(x.constructor)) {
	          rv = x;
	      }
	      else {
	          var proto = getProto(x);
	          rv = proto === Object.prototype ? {} : Object.create(proto);
	          circularRefs.set(x, rv);
	          for (var prop in x) {
	              if (hasOwn(x, prop)) {
	                  rv[prop] = innerDeepClone(x[prop]);
	              }
	          }
	      }
	      return rv;
	  }
	  var toString = {}.toString;
	  function toStringTag(o) {
	      return toString.call(o).slice(8, -1);
	  }
	  var iteratorSymbol = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
	  var getIteratorOf = typeof iteratorSymbol === 'symbol'
	      ? function (x) {
	          var i;
	          return x != null && (i = x[iteratorSymbol]) && i.apply(x);
	      }
	      : function () {
	          return null;
	      };
	  function delArrayItem(a, x) {
	      var i = a.indexOf(x);
	      if (i >= 0)
	          a.splice(i, 1);
	      return i >= 0;
	  }
	  var NO_CHAR_ARRAY = {};
	  function getArrayOf(arrayLike) {
	      var i, a, x, it;
	      if (arguments.length === 1) {
	          if (isArray(arrayLike))
	              return arrayLike.slice();
	          if (this === NO_CHAR_ARRAY && typeof arrayLike === 'string')
	              return [arrayLike];
	          if ((it = getIteratorOf(arrayLike))) {
	              a = [];
	              while (((x = it.next()), !x.done))
	                  a.push(x.value);
	              return a;
	          }
	          if (arrayLike == null)
	              return [arrayLike];
	          i = arrayLike.length;
	          if (typeof i === 'number') {
	              a = new Array(i);
	              while (i--)
	                  a[i] = arrayLike[i];
	              return a;
	          }
	          return [arrayLike];
	      }
	      i = arguments.length;
	      a = new Array(i);
	      while (i--)
	          a[i] = arguments[i];
	      return a;
	  }
	  var isAsyncFunction = typeof Symbol !== 'undefined'
	      ? function (fn) { return fn[Symbol.toStringTag] === 'AsyncFunction'; }
	      : function () { return false; };

	  var dexieErrorNames = [
	      'Modify',
	      'Bulk',
	      'OpenFailed',
	      'VersionChange',
	      'Schema',
	      'Upgrade',
	      'InvalidTable',
	      'MissingAPI',
	      'NoSuchDatabase',
	      'InvalidArgument',
	      'SubTransaction',
	      'Unsupported',
	      'Internal',
	      'DatabaseClosed',
	      'PrematureCommit',
	      'ForeignAwait',
	  ];
	  var idbDomErrorNames = [
	      'Unknown',
	      'Constraint',
	      'Data',
	      'TransactionInactive',
	      'ReadOnly',
	      'Version',
	      'NotFound',
	      'InvalidState',
	      'InvalidAccess',
	      'Abort',
	      'Timeout',
	      'QuotaExceeded',
	      'Syntax',
	      'DataClone',
	  ];
	  var errorList = dexieErrorNames.concat(idbDomErrorNames);
	  var defaultTexts = {
	      VersionChanged: 'Database version changed by other database connection',
	      DatabaseClosed: 'Database has been closed',
	      Abort: 'Transaction aborted',
	      TransactionInactive: 'Transaction has already completed or failed',
	      MissingAPI: 'IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb',
	  };
	  function DexieError(name, msg) {
	      this.name = name;
	      this.message = msg;
	  }
	  derive(DexieError)
	      .from(Error)
	      .extend({
	      toString: function () {
	          return this.name + ': ' + this.message;
	      },
	  });
	  function getMultiErrorMessage(msg, failures) {
	      return (msg +
	          '. Errors: ' +
	          Object.keys(failures)
	              .map(function (key) { return failures[key].toString(); })
	              .filter(function (v, i, s) { return s.indexOf(v) === i; })
	              .join('\n'));
	  }
	  function ModifyError(msg, failures, successCount, failedKeys) {
	      this.failures = failures;
	      this.failedKeys = failedKeys;
	      this.successCount = successCount;
	      this.message = getMultiErrorMessage(msg, failures);
	  }
	  derive(ModifyError).from(DexieError);
	  function BulkError(msg, failures) {
	      this.name = 'BulkError';
	      this.failures = Object.keys(failures).map(function (pos) { return failures[pos]; });
	      this.failuresByPos = failures;
	      this.message = getMultiErrorMessage(msg, this.failures);
	  }
	  derive(BulkError).from(DexieError);
	  var errnames = errorList.reduce(function (obj, name) { return ((obj[name] = name + 'Error'), obj); }, {});
	  var BaseException = DexieError;
	  var exceptions = errorList.reduce(function (obj, name) {
	      var fullName = name + 'Error';
	      function DexieError(msgOrInner, inner) {
	          this.name = fullName;
	          if (!msgOrInner) {
	              this.message = defaultTexts[name] || fullName;
	              this.inner = null;
	          }
	          else if (typeof msgOrInner === 'string') {
	              this.message = "".concat(msgOrInner).concat(!inner ? '' : '\n ' + inner);
	              this.inner = inner || null;
	          }
	          else if (typeof msgOrInner === 'object') {
	              this.message = "".concat(msgOrInner.name, " ").concat(msgOrInner.message);
	              this.inner = msgOrInner;
	          }
	      }
	      derive(DexieError).from(BaseException);
	      obj[name] = DexieError;
	      return obj;
	  }, {});
	  exceptions.Syntax = SyntaxError;
	  exceptions.Type = TypeError;
	  exceptions.Range = RangeError;
	  var exceptionMap = idbDomErrorNames.reduce(function (obj, name) {
	      obj[name + 'Error'] = exceptions[name];
	      return obj;
	  }, {});
	  function mapError(domError, message) {
	      if (!domError ||
	          domError instanceof DexieError ||
	          domError instanceof TypeError ||
	          domError instanceof SyntaxError ||
	          !domError.name ||
	          !exceptionMap[domError.name])
	          return domError;
	      var rv = new exceptionMap[domError.name](message || domError.message, domError);
	      if ('stack' in domError) {
	          setProp(rv, 'stack', {
	              get: function () {
	                  return this.inner.stack;
	              },
	          });
	      }
	      return rv;
	  }
	  var fullNameExceptions = errorList.reduce(function (obj, name) {
	      if (['Syntax', 'Type', 'Range'].indexOf(name) === -1)
	          obj[name + 'Error'] = exceptions[name];
	      return obj;
	  }, {});
	  fullNameExceptions.ModifyError = ModifyError;
	  fullNameExceptions.DexieError = DexieError;
	  fullNameExceptions.BulkError = BulkError;

	  function nop() { }
	  function mirror(val) {
	      return val;
	  }
	  function pureFunctionChain(f1, f2) {
	      if (f1 == null || f1 === mirror)
	          return f2;
	      return function (val) {
	          return f2(f1(val));
	      };
	  }
	  function callBoth(on1, on2) {
	      return function () {
	          on1.apply(this, arguments);
	          on2.apply(this, arguments);
	      };
	  }
	  function hookCreatingChain(f1, f2) {
	      if (f1 === nop)
	          return f2;
	      return function () {
	          var res = f1.apply(this, arguments);
	          if (res !== undefined)
	              arguments[0] = res;
	          var onsuccess = this.onsuccess,
	          onerror = this.onerror;
	          this.onsuccess = null;
	          this.onerror = null;
	          var res2 = f2.apply(this, arguments);
	          if (onsuccess)
	              this.onsuccess = this.onsuccess
	                  ? callBoth(onsuccess, this.onsuccess)
	                  : onsuccess;
	          if (onerror)
	              this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
	          return res2 !== undefined ? res2 : res;
	      };
	  }
	  function hookDeletingChain(f1, f2) {
	      if (f1 === nop)
	          return f2;
	      return function () {
	          f1.apply(this, arguments);
	          var onsuccess = this.onsuccess,
	          onerror = this.onerror;
	          this.onsuccess = this.onerror = null;
	          f2.apply(this, arguments);
	          if (onsuccess)
	              this.onsuccess = this.onsuccess
	                  ? callBoth(onsuccess, this.onsuccess)
	                  : onsuccess;
	          if (onerror)
	              this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
	      };
	  }
	  function hookUpdatingChain(f1, f2) {
	      if (f1 === nop)
	          return f2;
	      return function (modifications) {
	          var res = f1.apply(this, arguments);
	          extend(modifications, res);
	          var onsuccess = this.onsuccess,
	          onerror = this.onerror;
	          this.onsuccess = null;
	          this.onerror = null;
	          var res2 = f2.apply(this, arguments);
	          if (onsuccess)
	              this.onsuccess = this.onsuccess
	                  ? callBoth(onsuccess, this.onsuccess)
	                  : onsuccess;
	          if (onerror)
	              this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
	          return res === undefined
	              ? res2 === undefined
	                  ? undefined
	                  : res2
	              : extend(res, res2);
	      };
	  }
	  function reverseStoppableEventChain(f1, f2) {
	      if (f1 === nop)
	          return f2;
	      return function () {
	          if (f2.apply(this, arguments) === false)
	              return false;
	          return f1.apply(this, arguments);
	      };
	  }
	  function promisableChain(f1, f2) {
	      if (f1 === nop)
	          return f2;
	      return function () {
	          var res = f1.apply(this, arguments);
	          if (res && typeof res.then === 'function') {
	              var thiz = this, i = arguments.length, args = new Array(i);
	              while (i--)
	                  args[i] = arguments[i];
	              return res.then(function () {
	                  return f2.apply(thiz, args);
	              });
	          }
	          return f2.apply(this, arguments);
	      };
	  }

	  var debug = typeof location !== 'undefined' &&
	      /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
	  function setDebug(value, filter) {
	      debug = value;
	  }

	  var INTERNAL = {};
	  var ZONE_ECHO_LIMIT = 100, _a$1 = typeof Promise === 'undefined'
	      ? []
	      : (function () {
	          var globalP = Promise.resolve();
	          if (typeof crypto === 'undefined' || !crypto.subtle)
	              return [globalP, getProto(globalP), globalP];
	          var nativeP = crypto.subtle.digest('SHA-512', new Uint8Array([0]));
	          return [nativeP, getProto(nativeP), globalP];
	      })(), resolvedNativePromise = _a$1[0], nativePromiseProto = _a$1[1], resolvedGlobalPromise = _a$1[2], nativePromiseThen = nativePromiseProto && nativePromiseProto.then;
	  var NativePromise = resolvedNativePromise && resolvedNativePromise.constructor;
	  var patchGlobalPromise = !!resolvedGlobalPromise;
	  function schedulePhysicalTick() {
	      queueMicrotask(physicalTick);
	  }
	  var asap = function (callback, args) {
	      microtickQueue.push([callback, args]);
	      if (needsNewPhysicalTick) {
	          schedulePhysicalTick();
	          needsNewPhysicalTick = false;
	      }
	  };
	  var isOutsideMicroTick = true,
	  needsNewPhysicalTick = true,
	  unhandledErrors = [],
	  rejectingErrors = [],
	  rejectionMapper = mirror;
	  var globalPSD = {
	      id: 'global',
	      global: true,
	      ref: 0,
	      unhandleds: [],
	      onunhandled: nop,
	      pgp: false,
	      env: {},
	      finalize: nop,
	  };
	  var PSD = globalPSD;
	  var microtickQueue = [];
	  var numScheduledCalls = 0;
	  var tickFinalizers = [];
	  function DexiePromise(fn) {
	      if (typeof this !== 'object')
	          throw new TypeError('Promises must be constructed via new');
	      this._listeners = [];
	      this._lib = false;
	      var psd = (this._PSD = PSD);
	      if (typeof fn !== 'function') {
	          if (fn !== INTERNAL)
	              throw new TypeError('Not a function');
	          this._state = arguments[1];
	          this._value = arguments[2];
	          if (this._state === false)
	              handleRejection(this, this._value);
	          return;
	      }
	      this._state = null;
	      this._value = null;
	      ++psd.ref;
	      executePromiseTask(this, fn);
	  }
	  var thenProp = {
	      get: function () {
	          var psd = PSD, microTaskId = totalEchoes;
	          function then(onFulfilled, onRejected) {
	              var _this = this;
	              var possibleAwait = !psd.global && (psd !== PSD || microTaskId !== totalEchoes);
	              var cleanup = possibleAwait && !decrementExpectedAwaits();
	              var rv = new DexiePromise(function (resolve, reject) {
	                  propagateToListener(_this, new Listener(nativeAwaitCompatibleWrap(onFulfilled, psd, possibleAwait, cleanup), nativeAwaitCompatibleWrap(onRejected, psd, possibleAwait, cleanup), resolve, reject, psd));
	              });
	              if (this._consoleTask)
	                  rv._consoleTask = this._consoleTask;
	              return rv;
	          }
	          then.prototype = INTERNAL;
	          return then;
	      },
	      set: function (value) {
	          setProp(this, 'then', value && value.prototype === INTERNAL
	              ? thenProp
	              : {
	                  get: function () {
	                      return value;
	                  },
	                  set: thenProp.set,
	              });
	      },
	  };
	  props(DexiePromise.prototype, {
	      then: thenProp,
	      _then: function (onFulfilled, onRejected) {
	          propagateToListener(this, new Listener(null, null, onFulfilled, onRejected, PSD));
	      },
	      catch: function (onRejected) {
	          if (arguments.length === 1)
	              return this.then(null, onRejected);
	          var type = arguments[0], handler = arguments[1];
	          return typeof type === 'function'
	              ? this.then(null, function (err) {
	                  return err instanceof type ? handler(err) : PromiseReject(err);
	              })
	              : this.then(null, function (err) {
	                  return err && err.name === type ? handler(err) : PromiseReject(err);
	              });
	      },
	      finally: function (onFinally) {
	          return this.then(function (value) {
	              return DexiePromise.resolve(onFinally()).then(function () { return value; });
	          }, function (err) {
	              return DexiePromise.resolve(onFinally()).then(function () { return PromiseReject(err); });
	          });
	      },
	      timeout: function (ms, msg) {
	          var _this = this;
	          return ms < Infinity
	              ? new DexiePromise(function (resolve, reject) {
	                  var handle = setTimeout(function () { return reject(new exceptions.Timeout(msg)); }, ms);
	                  _this.then(resolve, reject).finally(clearTimeout.bind(null, handle));
	              })
	              : this;
	      },
	  });
	  if (typeof Symbol !== 'undefined' && Symbol.toStringTag)
	      setProp(DexiePromise.prototype, Symbol.toStringTag, 'Dexie.Promise');
	  globalPSD.env = snapShot();
	  function Listener(onFulfilled, onRejected, resolve, reject, zone) {
	      this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
	      this.onRejected = typeof onRejected === 'function' ? onRejected : null;
	      this.resolve = resolve;
	      this.reject = reject;
	      this.psd = zone;
	  }
	  props(DexiePromise, {
	      all: function () {
	          var values = getArrayOf
	              .apply(null, arguments)
	              .map(onPossibleParallellAsync);
	          return new DexiePromise(function (resolve, reject) {
	              if (values.length === 0)
	                  resolve([]);
	              var remaining = values.length;
	              values.forEach(function (a, i) {
	                  return DexiePromise.resolve(a).then(function (x) {
	                      values[i] = x;
	                      if (!--remaining)
	                          resolve(values);
	                  }, reject);
	              });
	          });
	      },
	      resolve: function (value) {
	          if (value instanceof DexiePromise)
	              return value;
	          if (value && typeof value.then === 'function')
	              return new DexiePromise(function (resolve, reject) {
	                  value.then(resolve, reject);
	              });
	          var rv = new DexiePromise(INTERNAL, true, value);
	          return rv;
	      },
	      reject: PromiseReject,
	      race: function () {
	          var values = getArrayOf
	              .apply(null, arguments)
	              .map(onPossibleParallellAsync);
	          return new DexiePromise(function (resolve, reject) {
	              values.map(function (value) { return DexiePromise.resolve(value).then(resolve, reject); });
	          });
	      },
	      PSD: {
	          get: function () { return PSD; },
	          set: function (value) { return (PSD = value); },
	      },
	      totalEchoes: { get: function () { return totalEchoes; } },
	      newPSD: newScope,
	      usePSD: usePSD,
	      scheduler: {
	          get: function () { return asap; },
	          set: function (value) {
	              asap = value;
	          },
	      },
	      rejectionMapper: {
	          get: function () { return rejectionMapper; },
	          set: function (value) {
	              rejectionMapper = value;
	          },
	      },
	      follow: function (fn, zoneProps) {
	          return new DexiePromise(function (resolve, reject) {
	              return newScope(function (resolve, reject) {
	                  var psd = PSD;
	                  psd.unhandleds = [];
	                  psd.onunhandled = reject;
	                  psd.finalize = callBoth(function () {
	                      var _this = this;
	                      run_at_end_of_this_or_next_physical_tick(function () {
	                          _this.unhandleds.length === 0
	                              ? resolve()
	                              : reject(_this.unhandleds[0]);
	                      });
	                  }, psd.finalize);
	                  fn();
	              }, zoneProps, resolve, reject);
	          });
	      },
	  });
	  if (NativePromise) {
	      if (NativePromise.allSettled)
	          setProp(DexiePromise, 'allSettled', function () {
	              var possiblePromises = getArrayOf
	                  .apply(null, arguments)
	                  .map(onPossibleParallellAsync);
	              return new DexiePromise(function (resolve) {
	                  if (possiblePromises.length === 0)
	                      resolve([]);
	                  var remaining = possiblePromises.length;
	                  var results = new Array(remaining);
	                  possiblePromises.forEach(function (p, i) {
	                      return DexiePromise.resolve(p)
	                          .then(function (value) { return (results[i] = { status: 'fulfilled', value: value }); }, function (reason) { return (results[i] = { status: 'rejected', reason: reason }); })
	                          .then(function () { return --remaining || resolve(results); });
	                  });
	              });
	          });
	      if (NativePromise.any && typeof AggregateError !== 'undefined')
	          setProp(DexiePromise, 'any', function () {
	              var possiblePromises = getArrayOf
	                  .apply(null, arguments)
	                  .map(onPossibleParallellAsync);
	              return new DexiePromise(function (resolve, reject) {
	                  if (possiblePromises.length === 0)
	                      reject(new AggregateError([]));
	                  var remaining = possiblePromises.length;
	                  var failures = new Array(remaining);
	                  possiblePromises.forEach(function (p, i) {
	                      return DexiePromise.resolve(p).then(function (value) { return resolve(value); }, function (failure) {
	                          failures[i] = failure;
	                          if (!--remaining)
	                              reject(new AggregateError(failures));
	                      });
	                  });
	              });
	          });
	      if (NativePromise.withResolvers)
	          DexiePromise.withResolvers = NativePromise.withResolvers;
	  }
	  function executePromiseTask(promise, fn) {
	      try {
	          fn(function (value) {
	              if (promise._state !== null)
	                  return;
	              if (value === promise)
	                  throw new TypeError('A promise cannot be resolved with itself.');
	              var shouldExecuteTick = promise._lib && beginMicroTickScope();
	              if (value && typeof value.then === 'function') {
	                  executePromiseTask(promise, function (resolve, reject) {
	                      value instanceof DexiePromise
	                          ? value._then(resolve, reject)
	                          : value.then(resolve, reject);
	                  });
	              }
	              else {
	                  promise._state = true;
	                  promise._value = value;
	                  propagateAllListeners(promise);
	              }
	              if (shouldExecuteTick)
	                  endMicroTickScope();
	          }, handleRejection.bind(null, promise));
	      }
	      catch (ex) {
	          handleRejection(promise, ex);
	      }
	  }
	  function handleRejection(promise, reason) {
	      rejectingErrors.push(reason);
	      if (promise._state !== null)
	          return;
	      var shouldExecuteTick = promise._lib && beginMicroTickScope();
	      reason = rejectionMapper(reason);
	      promise._state = false;
	      promise._value = reason;
	      addPossiblyUnhandledError(promise);
	      propagateAllListeners(promise);
	      if (shouldExecuteTick)
	          endMicroTickScope();
	  }
	  function propagateAllListeners(promise) {
	      var listeners = promise._listeners;
	      promise._listeners = [];
	      for (var i = 0, len = listeners.length; i < len; ++i) {
	          propagateToListener(promise, listeners[i]);
	      }
	      var psd = promise._PSD;
	      --psd.ref || psd.finalize();
	      if (numScheduledCalls === 0) {
	          ++numScheduledCalls;
	          asap(function () {
	              if (--numScheduledCalls === 0)
	                  finalizePhysicalTick();
	          }, []);
	      }
	  }
	  function propagateToListener(promise, listener) {
	      if (promise._state === null) {
	          promise._listeners.push(listener);
	          return;
	      }
	      var cb = promise._state ? listener.onFulfilled : listener.onRejected;
	      if (cb === null) {
	          return (promise._state ? listener.resolve : listener.reject)(promise._value);
	      }
	      ++listener.psd.ref;
	      ++numScheduledCalls;
	      asap(callListener, [cb, promise, listener]);
	  }
	  function callListener(cb, promise, listener) {
	      try {
	          var ret, value = promise._value;
	          if (!promise._state && rejectingErrors.length)
	              rejectingErrors = [];
	          ret =
	              debug && promise._consoleTask
	                  ? promise._consoleTask.run(function () { return cb(value); })
	                  : cb(value);
	          if (!promise._state && rejectingErrors.indexOf(value) === -1) {
	              markErrorAsHandled(promise);
	          }
	          listener.resolve(ret);
	      }
	      catch (e) {
	          listener.reject(e);
	      }
	      finally {
	          if (--numScheduledCalls === 0)
	              finalizePhysicalTick();
	          --listener.psd.ref || listener.psd.finalize();
	      }
	  }
	  function physicalTick() {
	      usePSD(globalPSD, function () {
	          beginMicroTickScope() && endMicroTickScope();
	      });
	  }
	  function beginMicroTickScope() {
	      var wasRootExec = isOutsideMicroTick;
	      isOutsideMicroTick = false;
	      needsNewPhysicalTick = false;
	      return wasRootExec;
	  }
	  function endMicroTickScope() {
	      var callbacks, i, l;
	      do {
	          while (microtickQueue.length > 0) {
	              callbacks = microtickQueue;
	              microtickQueue = [];
	              l = callbacks.length;
	              for (i = 0; i < l; ++i) {
	                  var item = callbacks[i];
	                  item[0].apply(null, item[1]);
	              }
	          }
	      } while (microtickQueue.length > 0);
	      isOutsideMicroTick = true;
	      needsNewPhysicalTick = true;
	  }
	  function finalizePhysicalTick() {
	      var unhandledErrs = unhandledErrors;
	      unhandledErrors = [];
	      unhandledErrs.forEach(function (p) {
	          p._PSD.onunhandled.call(null, p._value, p);
	      });
	      var finalizers = tickFinalizers.slice(0);
	      var i = finalizers.length;
	      while (i)
	          finalizers[--i]();
	  }
	  function run_at_end_of_this_or_next_physical_tick(fn) {
	      function finalizer() {
	          fn();
	          tickFinalizers.splice(tickFinalizers.indexOf(finalizer), 1);
	      }
	      tickFinalizers.push(finalizer);
	      ++numScheduledCalls;
	      asap(function () {
	          if (--numScheduledCalls === 0)
	              finalizePhysicalTick();
	      }, []);
	  }
	  function addPossiblyUnhandledError(promise) {
	      if (!unhandledErrors.some(function (p) { return p._value === promise._value; }))
	          unhandledErrors.push(promise);
	  }
	  function markErrorAsHandled(promise) {
	      var i = unhandledErrors.length;
	      while (i)
	          if (unhandledErrors[--i]._value === promise._value) {
	              unhandledErrors.splice(i, 1);
	              return;
	          }
	  }
	  function PromiseReject(reason) {
	      return new DexiePromise(INTERNAL, false, reason);
	  }
	  function wrap(fn, errorCatcher) {
	      var psd = PSD;
	      return function () {
	          var wasRootExec = beginMicroTickScope(), outerScope = PSD;
	          try {
	              switchToZone(psd, true);
	              return fn.apply(this, arguments);
	          }
	          catch (e) {
	              errorCatcher && errorCatcher(e);
	          }
	          finally {
	              switchToZone(outerScope, false);
	              if (wasRootExec)
	                  endMicroTickScope();
	          }
	      };
	  }
	  var task = { awaits: 0, echoes: 0, id: 0 };
	  var taskCounter = 0;
	  var zoneStack = [];
	  var zoneEchoes = 0;
	  var totalEchoes = 0;
	  var zone_id_counter = 0;
	  function newScope(fn, props, a1, a2) {
	      var parent = PSD, psd = Object.create(parent);
	      psd.parent = parent;
	      psd.ref = 0;
	      psd.global = false;
	      psd.id = ++zone_id_counter;
	      globalPSD.env;
	      psd.env = patchGlobalPromise
	          ? {
	              Promise: DexiePromise,
	              PromiseProp: {
	                  value: DexiePromise,
	                  configurable: true,
	                  writable: true,
	              },
	              all: DexiePromise.all,
	              race: DexiePromise.race,
	              allSettled: DexiePromise.allSettled,
	              any: DexiePromise.any,
	              resolve: DexiePromise.resolve,
	              reject: DexiePromise.reject,
	          }
	          : {};
	      if (props)
	          extend(psd, props);
	      ++parent.ref;
	      psd.finalize = function () {
	          --this.parent.ref || this.parent.finalize();
	      };
	      var rv = usePSD(psd, fn, a1, a2);
	      if (psd.ref === 0)
	          psd.finalize();
	      return rv;
	  }
	  function incrementExpectedAwaits() {
	      if (!task.id)
	          task.id = ++taskCounter;
	      ++task.awaits;
	      task.echoes += ZONE_ECHO_LIMIT;
	      return task.id;
	  }
	  function decrementExpectedAwaits() {
	      if (!task.awaits)
	          return false;
	      if (--task.awaits === 0)
	          task.id = 0;
	      task.echoes = task.awaits * ZONE_ECHO_LIMIT;
	      return true;
	  }
	  if (('' + nativePromiseThen).indexOf('[native code]') === -1) {
	      incrementExpectedAwaits = decrementExpectedAwaits = nop;
	  }
	  function onPossibleParallellAsync(possiblePromise) {
	      if (task.echoes &&
	          possiblePromise &&
	          possiblePromise.constructor === NativePromise) {
	          incrementExpectedAwaits();
	          return possiblePromise.then(function (x) {
	              decrementExpectedAwaits();
	              return x;
	          }, function (e) {
	              decrementExpectedAwaits();
	              return rejection(e);
	          });
	      }
	      return possiblePromise;
	  }
	  function zoneEnterEcho(targetZone) {
	      ++totalEchoes;
	      if (!task.echoes || --task.echoes === 0) {
	          task.echoes = task.awaits = task.id = 0;
	      }
	      zoneStack.push(PSD);
	      switchToZone(targetZone, true);
	  }
	  function zoneLeaveEcho() {
	      var zone = zoneStack[zoneStack.length - 1];
	      zoneStack.pop();
	      switchToZone(zone, false);
	  }
	  function switchToZone(targetZone, bEnteringZone) {
	      var currentZone = PSD;
	      if (bEnteringZone
	          ? task.echoes && (!zoneEchoes++ || targetZone !== PSD)
	          : zoneEchoes && (!--zoneEchoes || targetZone !== PSD)) {
	          queueMicrotask(bEnteringZone ? zoneEnterEcho.bind(null, targetZone) : zoneLeaveEcho);
	      }
	      if (targetZone === PSD)
	          return;
	      PSD = targetZone;
	      if (currentZone === globalPSD)
	          globalPSD.env = snapShot();
	      if (patchGlobalPromise) {
	          var GlobalPromise = globalPSD.env.Promise;
	          var targetEnv = targetZone.env;
	          if (currentZone.global || targetZone.global) {
	              Object.defineProperty(_global, 'Promise', targetEnv.PromiseProp);
	              GlobalPromise.all = targetEnv.all;
	              GlobalPromise.race = targetEnv.race;
	              GlobalPromise.resolve = targetEnv.resolve;
	              GlobalPromise.reject = targetEnv.reject;
	              if (targetEnv.allSettled)
	                  GlobalPromise.allSettled = targetEnv.allSettled;
	              if (targetEnv.any)
	                  GlobalPromise.any = targetEnv.any;
	          }
	      }
	  }
	  function snapShot() {
	      var GlobalPromise = _global.Promise;
	      return patchGlobalPromise
	          ? {
	              Promise: GlobalPromise,
	              PromiseProp: Object.getOwnPropertyDescriptor(_global, 'Promise'),
	              all: GlobalPromise.all,
	              race: GlobalPromise.race,
	              allSettled: GlobalPromise.allSettled,
	              any: GlobalPromise.any,
	              resolve: GlobalPromise.resolve,
	              reject: GlobalPromise.reject,
	          }
	          : {};
	  }
	  function usePSD(psd, fn, a1, a2, a3) {
	      var outerScope = PSD;
	      try {
	          switchToZone(psd, true);
	          return fn(a1, a2, a3);
	      }
	      finally {
	          switchToZone(outerScope, false);
	      }
	  }
	  function nativeAwaitCompatibleWrap(fn, zone, possibleAwait, cleanup) {
	      return typeof fn !== 'function'
	          ? fn
	          : function () {
	              var outerZone = PSD;
	              if (possibleAwait)
	                  incrementExpectedAwaits();
	              switchToZone(zone, true);
	              try {
	                  return fn.apply(this, arguments);
	              }
	              finally {
	                  switchToZone(outerZone, false);
	                  if (cleanup)
	                      queueMicrotask(decrementExpectedAwaits);
	              }
	          };
	  }
	  function execInGlobalContext(cb) {
	      if (Promise === NativePromise && task.echoes === 0) {
	          if (zoneEchoes === 0) {
	              cb();
	          }
	          else {
	              enqueueNativeMicroTask(cb);
	          }
	      }
	      else {
	          setTimeout(cb, 0);
	      }
	  }
	  var rejection = DexiePromise.reject;

	  function tempTransaction(db, mode, storeNames, fn) {
	      if (!db.idbdb || (!db._state.openComplete && !PSD.letThrough && !db._vip)) {
	          if (db._state.openComplete) {
	              return rejection(new exceptions.DatabaseClosed(db._state.dbOpenError));
	          }
	          if (!db._state.isBeingOpened) {
	              if (!db._state.autoOpen)
	                  return rejection(new exceptions.DatabaseClosed());
	              db.open().catch(nop);
	          }
	          return db._state.dbReadyPromise.then(function () {
	              return tempTransaction(db, mode, storeNames, fn);
	          });
	      }
	      else {
	          var trans = db._createTransaction(mode, storeNames, db._dbSchema);
	          try {
	              trans.create();
	              db._state.PR1398_maxLoop = 3;
	          }
	          catch (ex) {
	              if (ex.name === errnames.InvalidState &&
	                  db.isOpen() &&
	                  --db._state.PR1398_maxLoop > 0) {
	                  console.warn('Dexie: Need to reopen db');
	                  db.close({ disableAutoOpen: false });
	                  return db.open().then(function () { return tempTransaction(db, mode, storeNames, fn); });
	              }
	              return rejection(ex);
	          }
	          return trans
	              ._promise(mode, function (resolve, reject) {
	              return newScope(function () {
	                  PSD.trans = trans;
	                  return fn(resolve, reject, trans);
	              });
	          })
	              .then(function (result) {
	              if (mode === 'readwrite')
	                  try {
	                      trans.idbtrans.commit();
	                  }
	                  catch (_a) { }
	              return mode === 'readonly'
	                  ? result
	                  : trans._completion.then(function () { return result; });
	          });
	      }
	  }

	  var DEXIE_VERSION = '4.4.2';
	  var maxString = String.fromCharCode(65535);
	  var minKey = -Infinity;
	  var INVALID_KEY_ARGUMENT = 'Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.';
	  var STRING_EXPECTED = 'String expected.';
	  var DEFAULT_MAX_CONNECTIONS = 1000;
	  var DBNAMES_DB = '__dbnames';
	  var READONLY = 'readonly';
	  var READWRITE = 'readwrite';

	  function combine(filter1, filter2) {
	      return filter1
	          ? filter2
	              ? function () {
	                  return (filter1.apply(this, arguments) && filter2.apply(this, arguments));
	              }
	              : filter1
	          : filter2;
	  }

	  var AnyRange = {
	      type: 3 ,
	      lower: -Infinity,
	      lowerOpen: false,
	      upper: [[]],
	      upperOpen: false,
	  };

	  function workaroundForUndefinedPrimKey(keyPath) {
	      return typeof keyPath === 'string' && !/\./.test(keyPath)
	          ? function (obj) {
	              if (obj[keyPath] === undefined && keyPath in obj) {
	                  obj = deepClone(obj);
	                  delete obj[keyPath];
	              }
	              return obj;
	          }
	          : function (obj) { return obj; };
	  }

	  function Entity() {
	      throw exceptions.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
	  }

	  function cmp(a, b) {
	      try {
	          var ta = type(a);
	          var tb = type(b);
	          if (ta !== tb) {
	              if (ta === 'Array')
	                  return 1;
	              if (tb === 'Array')
	                  return -1;
	              if (ta === 'binary')
	                  return 1;
	              if (tb === 'binary')
	                  return -1;
	              if (ta === 'string')
	                  return 1;
	              if (tb === 'string')
	                  return -1;
	              if (ta === 'Date')
	                  return 1;
	              if (tb !== 'Date')
	                  return NaN;
	              return -1;
	          }
	          switch (ta) {
	              case 'number':
	              case 'Date':
	              case 'string':
	                  return a > b ? 1 : a < b ? -1 : 0;
	              case 'binary': {
	                  return compareUint8Arrays(getUint8Array(a), getUint8Array(b));
	              }
	              case 'Array':
	                  return compareArrays(a, b);
	          }
	      }
	      catch (_a) { }
	      return NaN;
	  }
	  function compareArrays(a, b) {
	      var al = a.length;
	      var bl = b.length;
	      var l = al < bl ? al : bl;
	      for (var i = 0; i < l; ++i) {
	          var res = cmp(a[i], b[i]);
	          if (res !== 0)
	              return res;
	      }
	      return al === bl ? 0 : al < bl ? -1 : 1;
	  }
	  function compareUint8Arrays(a, b) {
	      var al = a.length;
	      var bl = b.length;
	      var l = al < bl ? al : bl;
	      for (var i = 0; i < l; ++i) {
	          if (a[i] !== b[i])
	              return a[i] < b[i] ? -1 : 1;
	      }
	      return al === bl ? 0 : al < bl ? -1 : 1;
	  }
	  function type(x) {
	      var t = typeof x;
	      if (t !== 'object')
	          return t;
	      if (ArrayBuffer.isView(x))
	          return 'binary';
	      var tsTag = toStringTag(x);
	      return tsTag === 'ArrayBuffer' ? 'binary' : tsTag;
	  }
	  function getUint8Array(a) {
	      if (a instanceof Uint8Array)
	          return a;
	      if (ArrayBuffer.isView(a))
	          return new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
	      return new Uint8Array(a);
	  }

	  function builtInDeletionTrigger(table, keys, res) {
	      var yProps = table.schema.yProps;
	      if (!yProps)
	          return res;
	      if (keys && res.numFailures > 0)
	          keys = keys.filter(function (_, i) { return !res.failures[i]; });
	      return Promise.all(yProps.map(function (_a) {
	          var updatesTable = _a.updatesTable;
	          return keys
	              ? table.db.table(updatesTable).where('k').anyOf(keys).delete()
	              : table.db.table(updatesTable).clear();
	      })).then(function () { return res; });
	  }

	  var PropModification =  (function () {
	      function PropModification(spec) {
	          this['@@propmod'] = spec;
	      }
	      PropModification.prototype.execute = function (value) {
	          var _a;
	          var spec = this['@@propmod'];
	          if (spec.add !== undefined) {
	              var term = spec.add;
	              if (isArray(term)) {
	                  return __spreadArray(__spreadArray([], (isArray(value) ? value : []), true), term).sort();
	              }
	              if (typeof term === 'number')
	                  return (Number(value) || 0) + term;
	              if (typeof term === 'bigint') {
	                  try {
	                      return BigInt(value) + term;
	                  }
	                  catch (_b) {
	                      return BigInt(0) + term;
	                  }
	              }
	              throw new TypeError("Invalid term ".concat(term));
	          }
	          if (spec.remove !== undefined) {
	              var subtrahend_1 = spec.remove;
	              if (isArray(subtrahend_1)) {
	                  return isArray(value)
	                      ? value.filter(function (item) { return !subtrahend_1.includes(item); }).sort()
	                      : [];
	              }
	              if (typeof subtrahend_1 === 'number')
	                  return Number(value) - subtrahend_1;
	              if (typeof subtrahend_1 === 'bigint') {
	                  try {
	                      return BigInt(value) - subtrahend_1;
	                  }
	                  catch (_c) {
	                      return BigInt(0) - subtrahend_1;
	                  }
	              }
	              throw new TypeError("Invalid subtrahend ".concat(subtrahend_1));
	          }
	          var prefixToReplace = (_a = spec.replacePrefix) === null || _a === void 0 ? void 0 : _a[0];
	          if (prefixToReplace &&
	              typeof value === 'string' &&
	              value.startsWith(prefixToReplace)) {
	              return spec.replacePrefix[1] + value.substring(prefixToReplace.length);
	          }
	          return value;
	      };
	      return PropModification;
	  }());

	  function applyUpdateSpec(obj, changes) {
	      var keyPaths = keys(changes);
	      var numKeys = keyPaths.length;
	      var anythingModified = false;
	      for (var i = 0; i < numKeys; ++i) {
	          var keyPath = keyPaths[i];
	          var value = changes[keyPath];
	          var origValue = getByKeyPath(obj, keyPath);
	          if (value instanceof PropModification) {
	              setByKeyPath(obj, keyPath, value.execute(origValue));
	              anythingModified = true;
	          }
	          else if (origValue !== value) {
	              setByKeyPath(obj, keyPath, value);
	              anythingModified = true;
	          }
	      }
	      return anythingModified;
	  }

	  var Table =  (function () {
	      function Table() {
	      }
	      Table.prototype._trans = function (mode, fn, writeLocked) {
	          var trans = this._tx || PSD.trans;
	          var tableName = this.name;
	          var task = debug &&
	              typeof console !== 'undefined' &&
	              console.createTask &&
	              console.createTask("Dexie: ".concat(mode === 'readonly' ? 'read' : 'write', " ").concat(this.name));
	          function checkTableInTransaction(resolve, reject, trans) {
	              if (!trans.schema[tableName])
	                  throw new exceptions.NotFound('Table ' + tableName + ' not part of transaction');
	              return fn(trans.idbtrans, trans);
	          }
	          var wasRootExec = beginMicroTickScope();
	          try {
	              var p = trans && trans.db._novip === this.db._novip
	                  ? trans === PSD.trans
	                      ? trans._promise(mode, checkTableInTransaction, writeLocked)
	                      : newScope(function () {
	                          return trans._promise(mode, checkTableInTransaction, writeLocked);
	                      }, { trans: trans, transless: PSD.transless || PSD })
	                  : tempTransaction(this.db, mode, [this.name], checkTableInTransaction);
	              if (task) {
	                  p._consoleTask = task;
	                  p = p.catch(function (err) {
	                      console.trace(err);
	                      return rejection(err);
	                  });
	              }
	              return p;
	          }
	          finally {
	              if (wasRootExec)
	                  endMicroTickScope();
	          }
	      };
	      Table.prototype.get = function (keyOrCrit, cb) {
	          var _this = this;
	          if (keyOrCrit && keyOrCrit.constructor === Object)
	              return this.where(keyOrCrit).first(cb);
	          if (keyOrCrit == null)
	              return rejection(new exceptions.Type("Invalid argument to Table.get()"));
	          return this._trans('readonly', function (trans) {
	              return _this.core
	                  .get({ trans: trans, key: keyOrCrit })
	                  .then(function (res) { return _this.hook.reading.fire(res); });
	          }).then(cb);
	      };
	      Table.prototype.where = function (indexOrCrit) {
	          if (typeof indexOrCrit === 'string')
	              return new this.db.WhereClause(this, indexOrCrit);
	          if (isArray(indexOrCrit))
	              return new this.db.WhereClause(this, "[".concat(indexOrCrit.join('+'), "]"));
	          var keyPaths = keys(indexOrCrit);
	          if (keyPaths.length === 1)
	              return this.where(keyPaths[0]).equals(indexOrCrit[keyPaths[0]]);
	          var compoundIndex = this.schema.indexes
	              .concat(this.schema.primKey)
	              .filter(function (ix) {
	              if (ix.compound &&
	                  keyPaths.every(function (keyPath) { return ix.keyPath.indexOf(keyPath) >= 0; })) {
	                  for (var i = 0; i < keyPaths.length; ++i) {
	                      if (keyPaths.indexOf(ix.keyPath[i]) === -1)
	                          return false;
	                  }
	                  return true;
	              }
	              return false;
	          })
	              .sort(function (a, b) { return a.keyPath.length - b.keyPath.length; })[0];
	          if (compoundIndex && this.db._maxKey !== maxString) {
	              var keyPathsInValidOrder = compoundIndex.keyPath.slice(0, keyPaths.length);
	              return this.where(keyPathsInValidOrder).equals(keyPathsInValidOrder.map(function (kp) { return indexOrCrit[kp]; }));
	          }
	          if (!compoundIndex && debug)
	              console.warn("The query ".concat(JSON.stringify(indexOrCrit), " on ").concat(this.name, " would benefit from a ") +
	                  "compound index [".concat(keyPaths.join('+'), "]"));
	          var idxByName = this.schema.idxByName;
	          function equals(a, b) {
	              return cmp(a, b) === 0;
	          }
	          var _a = keyPaths.reduce(function (_a, keyPath) {
	              var prevIndex = _a[0], prevFilterFn = _a[1];
	              var index = idxByName[keyPath];
	              var value = indexOrCrit[keyPath];
	              return [
	                  prevIndex || index,
	                  prevIndex || !index
	                      ? combine(prevFilterFn, index && index.multi
	                          ? function (x) {
	                              var prop = getByKeyPath(x, keyPath);
	                              return (isArray(prop) &&
	                                  prop.some(function (item) { return equals(value, item); }));
	                          }
	                          : function (x) { return equals(value, getByKeyPath(x, keyPath)); })
	                      : prevFilterFn,
	              ];
	          }, [null, null]), idx = _a[0], filterFunction = _a[1];
	          return idx
	              ? this.where(idx.name)
	                  .equals(indexOrCrit[idx.keyPath])
	                  .filter(filterFunction)
	              : compoundIndex
	                  ? this.filter(filterFunction)
	                  : this.where(keyPaths).equals('');
	      };
	      Table.prototype.filter = function (filterFunction) {
	          return this.toCollection().and(filterFunction);
	      };
	      Table.prototype.count = function (thenShortcut) {
	          return this.toCollection().count(thenShortcut);
	      };
	      Table.prototype.offset = function (offset) {
	          return this.toCollection().offset(offset);
	      };
	      Table.prototype.limit = function (numRows) {
	          return this.toCollection().limit(numRows);
	      };
	      Table.prototype.each = function (callback) {
	          return this.toCollection().each(callback);
	      };
	      Table.prototype.toArray = function (thenShortcut) {
	          return this.toCollection().toArray(thenShortcut);
	      };
	      Table.prototype.toCollection = function () {
	          return new this.db.Collection(new this.db.WhereClause(this));
	      };
	      Table.prototype.orderBy = function (index) {
	          return new this.db.Collection(new this.db.WhereClause(this, isArray(index) ? "[".concat(index.join('+'), "]") : index));
	      };
	      Table.prototype.reverse = function () {
	          return this.toCollection().reverse();
	      };
	      Table.prototype.mapToClass = function (constructor) {
	          var _a = this, db = _a.db, tableName = _a.name;
	          this.schema.mappedClass = constructor;
	          if (constructor.prototype instanceof Entity) {
	              constructor =  (function (_super) {
	                  __extends(class_1, _super);
	                  function class_1() {
	                      return _super !== null && _super.apply(this, arguments) || this;
	                  }
	                  Object.defineProperty(class_1.prototype, "db", {
	                      get: function () {
	                          return db;
	                      },
	                      enumerable: false,
	                      configurable: true
	                  });
	                  class_1.prototype.table = function () {
	                      return tableName;
	                  };
	                  return class_1;
	              }(constructor));
	          }
	          var inheritedProps = new Set();
	          for (var proto = constructor.prototype; proto; proto = getProto(proto)) {
	              Object.getOwnPropertyNames(proto).forEach(function (propName) {
	                  return inheritedProps.add(propName);
	              });
	          }
	          var readHook = function (obj) {
	              if (!obj)
	                  return obj;
	              var res = Object.create(constructor.prototype);
	              for (var m in obj)
	                  if (!inheritedProps.has(m))
	                      try {
	                          res[m] = obj[m];
	                      }
	                      catch (_) { }
	              return res;
	          };
	          if (this.schema.readHook) {
	              this.hook.reading.unsubscribe(this.schema.readHook);
	          }
	          this.schema.readHook = readHook;
	          this.hook('reading', readHook);
	          return constructor;
	      };
	      Table.prototype.defineClass = function () {
	          function Class(content) {
	              extend(this, content);
	          }
	          return this.mapToClass(Class);
	      };
	      Table.prototype.add = function (obj, key) {
	          var _this = this;
	          var _a = this.schema.primKey, auto = _a.auto, keyPath = _a.keyPath;
	          var objToAdd = obj;
	          if (keyPath && auto) {
	              objToAdd = workaroundForUndefinedPrimKey(keyPath)(obj);
	          }
	          return this._trans('readwrite', function (trans) {
	              return _this.core.mutate({
	                  trans: trans,
	                  type: 'add',
	                  keys: key != null ? [key] : null,
	                  values: [objToAdd],
	              });
	          })
	              .then(function (res) {
	              return res.numFailures ? DexiePromise.reject(res.failures[0]) : res.lastResult;
	          })
	              .then(function (lastResult) {
	              if (keyPath) {
	                  try {
	                      setByKeyPath(obj, keyPath, lastResult);
	                  }
	                  catch (_) { }
	              }
	              return lastResult;
	          });
	      };
	      Table.prototype.upsert = function (key, modifications) {
	          var _this = this;
	          var keyPath = this.schema.primKey.keyPath;
	          return this._trans('readwrite', function (trans) {
	              return _this.core.get({ trans: trans, key: key }).then(function (existing) {
	                  var obj = existing !== null && existing !== void 0 ? existing : {};
	                  applyUpdateSpec(obj, modifications);
	                  if (keyPath)
	                      setByKeyPath(obj, keyPath, key);
	                  return _this.core
	                      .mutate({
	                      trans: trans,
	                      type: 'put',
	                      values: [obj],
	                      keys: [key],
	                      upsert: true,
	                      updates: { keys: [key], changeSpecs: [modifications] },
	                  })
	                      .then(function (res) {
	                      return res.numFailures ? DexiePromise.reject(res.failures[0]) : !!existing;
	                  });
	              });
	          });
	      };
	      Table.prototype.update = function (keyOrObject, modifications) {
	          if (typeof keyOrObject === 'object' && !isArray(keyOrObject)) {
	              var key = getByKeyPath(keyOrObject, this.schema.primKey.keyPath);
	              if (key === undefined)
	                  return rejection(new exceptions.InvalidArgument('Given object does not contain its primary key'));
	              return this.where(':id').equals(key).modify(modifications);
	          }
	          else {
	              return this.where(':id').equals(keyOrObject).modify(modifications);
	          }
	      };
	      Table.prototype.put = function (obj, key) {
	          var _this = this;
	          var _a = this.schema.primKey, auto = _a.auto, keyPath = _a.keyPath;
	          var objToAdd = obj;
	          if (keyPath && auto) {
	              objToAdd = workaroundForUndefinedPrimKey(keyPath)(obj);
	          }
	          return this._trans('readwrite', function (trans) {
	              return _this.core.mutate({
	                  trans: trans,
	                  type: 'put',
	                  values: [objToAdd],
	                  keys: key != null ? [key] : null,
	              });
	          })
	              .then(function (res) {
	              return res.numFailures ? DexiePromise.reject(res.failures[0]) : res.lastResult;
	          })
	              .then(function (lastResult) {
	              if (keyPath) {
	                  try {
	                      setByKeyPath(obj, keyPath, lastResult);
	                  }
	                  catch (_) { }
	              }
	              return lastResult;
	          });
	      };
	      Table.prototype.delete = function (key) {
	          var _this = this;
	          return this._trans('readwrite', function (trans) {
	              return _this.core
	                  .mutate({ trans: trans, type: 'delete', keys: [key] })
	                  .then(function (res) { return builtInDeletionTrigger(_this, [key], res); })
	                  .then(function (res) {
	                  return res.numFailures ? DexiePromise.reject(res.failures[0]) : undefined;
	              });
	          });
	      };
	      Table.prototype.clear = function () {
	          var _this = this;
	          return this._trans('readwrite', function (trans) {
	              return _this.core
	                  .mutate({ trans: trans, type: 'deleteRange', range: AnyRange })
	                  .then(function (res) { return builtInDeletionTrigger(_this, null, res); });
	          }).then(function (res) {
	              return res.numFailures ? DexiePromise.reject(res.failures[0]) : undefined;
	          });
	      };
	      Table.prototype.bulkGet = function (keys) {
	          var _this = this;
	          return this._trans('readonly', function (trans) {
	              return _this.core
	                  .getMany({
	                  keys: keys,
	                  trans: trans,
	              })
	                  .then(function (result) { return result.map(function (res) { return _this.hook.reading.fire(res); }); });
	          });
	      };
	      Table.prototype.bulkAdd = function (objects, keysOrOptions, options) {
	          var _this = this;
	          var keys = Array.isArray(keysOrOptions) ? keysOrOptions : undefined;
	          options =
	              options || (keys ? undefined : keysOrOptions);
	          var wantResults = options ? options.allKeys : undefined;
	          return this._trans('readwrite', function (trans) {
	              var _a = _this.schema.primKey, auto = _a.auto, keyPath = _a.keyPath;
	              if (keyPath && keys)
	                  throw new exceptions.InvalidArgument('bulkAdd(): keys argument invalid on tables with inbound keys');
	              if (keys && keys.length !== objects.length)
	                  throw new exceptions.InvalidArgument('Arguments objects and keys must have the same length');
	              var numObjects = objects.length;
	              var objectsToAdd = keyPath && auto
	                  ? objects.map(workaroundForUndefinedPrimKey(keyPath))
	                  : objects;
	              return _this.core
	                  .mutate({
	                  trans: trans,
	                  type: 'add',
	                  keys: keys,
	                  values: objectsToAdd,
	                  wantResults: wantResults,
	              })
	                  .then(function (_a) {
	                  var numFailures = _a.numFailures, results = _a.results, lastResult = _a.lastResult, failures = _a.failures;
	                  var result = wantResults ? results : lastResult;
	                  if (numFailures === 0)
	                      return result;
	                  throw new BulkError("".concat(_this.name, ".bulkAdd(): ").concat(numFailures, " of ").concat(numObjects, " operations failed"), failures);
	              });
	          });
	      };
	      Table.prototype.bulkPut = function (objects, keysOrOptions, options) {
	          var _this = this;
	          var keys = Array.isArray(keysOrOptions) ? keysOrOptions : undefined;
	          options =
	              options || (keys ? undefined : keysOrOptions);
	          var wantResults = options ? options.allKeys : undefined;
	          return this._trans('readwrite', function (trans) {
	              var _a = _this.schema.primKey, auto = _a.auto, keyPath = _a.keyPath;
	              if (keyPath && keys)
	                  throw new exceptions.InvalidArgument('bulkPut(): keys argument invalid on tables with inbound keys');
	              if (keys && keys.length !== objects.length)
	                  throw new exceptions.InvalidArgument('Arguments objects and keys must have the same length');
	              var numObjects = objects.length;
	              var objectsToPut = keyPath && auto
	                  ? objects.map(workaroundForUndefinedPrimKey(keyPath))
	                  : objects;
	              return _this.core
	                  .mutate({
	                  trans: trans,
	                  type: 'put',
	                  keys: keys,
	                  values: objectsToPut,
	                  wantResults: wantResults,
	              })
	                  .then(function (_a) {
	                  var numFailures = _a.numFailures, results = _a.results, lastResult = _a.lastResult, failures = _a.failures;
	                  var result = wantResults ? results : lastResult;
	                  if (numFailures === 0)
	                      return result;
	                  throw new BulkError("".concat(_this.name, ".bulkPut(): ").concat(numFailures, " of ").concat(numObjects, " operations failed"), failures);
	              });
	          });
	      };
	      Table.prototype.bulkUpdate = function (keysAndChanges) {
	          var _this = this;
	          var coreTable = this.core;
	          var keys = keysAndChanges.map(function (entry) { return entry.key; });
	          var changeSpecs = keysAndChanges.map(function (entry) { return entry.changes; });
	          var offsetMap = [];
	          return this._trans('readwrite', function (trans) {
	              return coreTable.getMany({ trans: trans, keys: keys, cache: 'clone' }).then(function (objs) {
	                  var resultKeys = [];
	                  var resultObjs = [];
	                  keysAndChanges.forEach(function (_a, idx) {
	                      var key = _a.key, changes = _a.changes;
	                      var obj = objs[idx];
	                      if (obj) {
	                          for (var _i = 0, _b = Object.keys(changes); _i < _b.length; _i++) {
	                              var keyPath = _b[_i];
	                              var value = changes[keyPath];
	                              if (keyPath === _this.schema.primKey.keyPath) {
	                                  if (cmp(value, key) !== 0) {
	                                      throw new exceptions.Constraint("Cannot update primary key in bulkUpdate()");
	                                  }
	                              }
	                              else {
	                                  setByKeyPath(obj, keyPath, value);
	                              }
	                          }
	                          offsetMap.push(idx);
	                          resultKeys.push(key);
	                          resultObjs.push(obj);
	                      }
	                  });
	                  var numEntries = resultKeys.length;
	                  return coreTable
	                      .mutate({
	                      trans: trans,
	                      type: 'put',
	                      keys: resultKeys,
	                      values: resultObjs,
	                      updates: {
	                          keys: keys,
	                          changeSpecs: changeSpecs,
	                      },
	                  })
	                      .then(function (_a) {
	                      var numFailures = _a.numFailures, failures = _a.failures;
	                      if (numFailures === 0)
	                          return numEntries;
	                      for (var _i = 0, _b = Object.keys(failures); _i < _b.length; _i++) {
	                          var offset = _b[_i];
	                          var mappedOffset = offsetMap[Number(offset)];
	                          if (mappedOffset != null) {
	                              var failure = failures[offset];
	                              delete failures[offset];
	                              failures[mappedOffset] = failure;
	                          }
	                      }
	                      throw new BulkError("".concat(_this.name, ".bulkUpdate(): ").concat(numFailures, " of ").concat(numEntries, " operations failed"), failures);
	                  });
	              });
	          });
	      };
	      Table.prototype.bulkDelete = function (keys) {
	          var _this = this;
	          var numKeys = keys.length;
	          return this._trans('readwrite', function (trans) {
	              return _this.core
	                  .mutate({ trans: trans, type: 'delete', keys: keys })
	                  .then(function (res) { return builtInDeletionTrigger(_this, keys, res); });
	          }).then(function (_a) {
	              var numFailures = _a.numFailures, lastResult = _a.lastResult, failures = _a.failures;
	              if (numFailures === 0)
	                  return lastResult;
	              throw new BulkError("".concat(_this.name, ".bulkDelete(): ").concat(numFailures, " of ").concat(numKeys, " operations failed"), failures);
	          });
	      };
	      return Table;
	  }());

	  function Events(ctx) {
	      var evs = {};
	      var rv = function (eventName, subscriber) {
	          if (subscriber) {
	              var i = arguments.length, args = new Array(i - 1);
	              while (--i)
	                  args[i - 1] = arguments[i];
	              evs[eventName].subscribe.apply(null, args);
	              return ctx;
	          }
	          else if (typeof eventName === 'string') {
	              return evs[eventName];
	          }
	      };
	      rv.addEventType = add;
	      for (var i = 1, l = arguments.length; i < l; ++i) {
	          add(arguments[i]);
	      }
	      return rv;
	      function add(eventName, chainFunction, defaultFunction) {
	          if (typeof eventName === 'object')
	              return addConfiguredEvents(eventName);
	          if (!chainFunction)
	              chainFunction = reverseStoppableEventChain;
	          if (!defaultFunction)
	              defaultFunction = nop;
	          var context = {
	              subscribers: [],
	              fire: defaultFunction,
	              subscribe: function (cb) {
	                  if (context.subscribers.indexOf(cb) === -1) {
	                      context.subscribers.push(cb);
	                      context.fire = chainFunction(context.fire, cb);
	                  }
	              },
	              unsubscribe: function (cb) {
	                  context.subscribers = context.subscribers.filter(function (fn) {
	                      return fn !== cb;
	                  });
	                  context.fire = context.subscribers.reduce(chainFunction, defaultFunction);
	              },
	          };
	          evs[eventName] = rv[eventName] = context;
	          return context;
	      }
	      function addConfiguredEvents(cfg) {
	          keys(cfg).forEach(function (eventName) {
	              var args = cfg[eventName];
	              if (isArray(args)) {
	                  add(eventName, cfg[eventName][0], cfg[eventName][1]);
	              }
	              else if (args === 'asap') {
	                  var context = add(eventName, mirror, function fire() {
	                      var i = arguments.length, args = new Array(i);
	                      while (i--)
	                          args[i] = arguments[i];
	                      context.subscribers.forEach(function (fn) {
	                          asap$1(function fireEvent() {
	                              fn.apply(null, args);
	                          });
	                      });
	                  });
	              }
	              else
	                  throw new exceptions.InvalidArgument('Invalid event config');
	          });
	      }
	  }

	  function makeClassConstructor(prototype, constructor) {
	      derive(constructor).from({ prototype: prototype });
	      return constructor;
	  }

	  function createTableConstructor(db) {
	      return makeClassConstructor(Table.prototype, function Table(name, tableSchema, trans) {
	          this.db = db;
	          this._tx = trans;
	          this.name = name;
	          this.schema = tableSchema;
	          this.hook = db._allTables[name]
	              ? db._allTables[name].hook
	              : Events(null, {
	                  creating: [hookCreatingChain, nop],
	                  reading: [pureFunctionChain, mirror],
	                  updating: [hookUpdatingChain, nop],
	                  deleting: [hookDeletingChain, nop],
	              });
	      });
	  }

	  function isPlainKeyRange(ctx, ignoreLimitFilter) {
	      return (!(ctx.filter || ctx.algorithm || ctx.or) &&
	          (ignoreLimitFilter ? ctx.justLimit : !ctx.replayFilter));
	  }
	  function addFilter(ctx, fn) {
	      ctx.filter = combine(ctx.filter, fn);
	  }
	  function addReplayFilter(ctx, factory, isLimitFilter) {
	      var curr = ctx.replayFilter;
	      ctx.replayFilter = curr ? function () { return combine(curr(), factory()); } : factory;
	      ctx.justLimit = isLimitFilter && !curr;
	  }
	  function addMatchFilter(ctx, fn) {
	      ctx.isMatch = combine(ctx.isMatch, fn);
	  }
	  function getIndexOrStore(ctx, coreSchema) {
	      if (ctx.isPrimKey)
	          return coreSchema.primaryKey;
	      var index = coreSchema.getIndexByKeyPath(ctx.index);
	      if (!index)
	          throw new exceptions.Schema('KeyPath ' +
	              ctx.index +
	              ' on object store ' +
	              coreSchema.name +
	              ' is not indexed');
	      return index;
	  }
	  function openCursor(ctx, coreTable, trans) {
	      var index = getIndexOrStore(ctx, coreTable.schema);
	      return coreTable.openCursor({
	          trans: trans,
	          values: !ctx.keysOnly,
	          reverse: ctx.dir === 'prev',
	          unique: !!ctx.unique,
	          query: {
	              index: index,
	              range: ctx.range,
	          },
	      });
	  }
	  function iter(ctx, fn, coreTrans, coreTable) {
	      var filter = ctx.replayFilter
	          ? combine(ctx.filter, ctx.replayFilter())
	          : ctx.filter;
	      if (!ctx.or) {
	          return iterate(openCursor(ctx, coreTable, coreTrans), combine(ctx.algorithm, filter), fn, !ctx.keysOnly && ctx.valueMapper);
	      }
	      else {
	          var set_1 = {};
	          var union = function (item, cursor, advance) {
	              if (!filter ||
	                  filter(cursor, advance, function (result) { return cursor.stop(result); }, function (err) { return cursor.fail(err); })) {
	                  var primaryKey = cursor.primaryKey;
	                  var key = '' + primaryKey;
	                  if (key === '[object ArrayBuffer]')
	                      key = '' + new Uint8Array(primaryKey);
	                  if (!hasOwn(set_1, key)) {
	                      set_1[key] = true;
	                      fn(item, cursor, advance);
	                  }
	              }
	          };
	          return Promise.all([
	              ctx.or._iterate(union, coreTrans),
	              iterate(openCursor(ctx, coreTable, coreTrans), ctx.algorithm, union, !ctx.keysOnly && ctx.valueMapper),
	          ]);
	      }
	  }
	  function iterate(cursorPromise, filter, fn, valueMapper) {
	      var mappedFn = valueMapper ? function (x, c, a) { return fn(valueMapper(x), c, a); } : fn;
	      var wrappedFn = wrap(mappedFn);
	      return cursorPromise.then(function (cursor) {
	          if (cursor) {
	              return cursor.start(function () {
	                  var c = function () { return cursor.continue(); };
	                  if (!filter ||
	                      filter(cursor, function (advancer) { return (c = advancer); }, function (val) {
	                          cursor.stop(val);
	                          c = nop;
	                      }, function (e) {
	                          cursor.fail(e);
	                          c = nop;
	                      }))
	                      wrappedFn(cursor.value, cursor, function (advancer) { return (c = advancer); });
	                  c();
	              });
	          }
	      });
	  }

	  var Collection =  (function () {
	      function Collection() {
	      }
	      Collection.prototype._read = function (fn, cb) {
	          var ctx = this._ctx;
	          return ctx.error
	              ? ctx.table._trans(null, rejection.bind(null, ctx.error))
	              : ctx.table._trans('readonly', fn).then(cb);
	      };
	      Collection.prototype._write = function (fn) {
	          var ctx = this._ctx;
	          return ctx.error
	              ? ctx.table._trans(null, rejection.bind(null, ctx.error))
	              : ctx.table._trans('readwrite', fn, 'locked');
	      };
	      Collection.prototype._addAlgorithm = function (fn) {
	          var ctx = this._ctx;
	          ctx.algorithm = combine(ctx.algorithm, fn);
	      };
	      Collection.prototype._iterate = function (fn, coreTrans) {
	          return iter(this._ctx, fn, coreTrans, this._ctx.table.core);
	      };
	      Collection.prototype.clone = function (props) {
	          var rv = Object.create(this.constructor.prototype), ctx = Object.create(this._ctx);
	          if (props)
	              extend(ctx, props);
	          rv._ctx = ctx;
	          return rv;
	      };
	      Collection.prototype.raw = function () {
	          this._ctx.valueMapper = null;
	          return this;
	      };
	      Collection.prototype.each = function (fn) {
	          var ctx = this._ctx;
	          return this._read(function (trans) { return iter(ctx, fn, trans, ctx.table.core); });
	      };
	      Collection.prototype.count = function (cb) {
	          var _this = this;
	          return this._read(function (trans) {
	              var ctx = _this._ctx;
	              var coreTable = ctx.table.core;
	              if (isPlainKeyRange(ctx, true)) {
	                  return coreTable
	                      .count({
	                      trans: trans,
	                      query: {
	                          index: getIndexOrStore(ctx, coreTable.schema),
	                          range: ctx.range,
	                      },
	                  })
	                      .then(function (count) { return Math.min(count, ctx.limit); });
	              }
	              else {
	                  var count = 0;
	                  return iter(ctx, function () {
	                      ++count;
	                      return false;
	                  }, trans, coreTable).then(function () { return count; });
	              }
	          }).then(cb);
	      };
	      Collection.prototype.sortBy = function (keyPath, cb) {
	          var parts = keyPath.split('.').reverse(), lastPart = parts[0], lastIndex = parts.length - 1;
	          function getval(obj, i) {
	              if (i)
	                  return getval(obj[parts[i]], i - 1);
	              return obj[lastPart];
	          }
	          var order = this._ctx.dir === 'next' ? 1 : -1;
	          function sorter(a, b) {
	              var aVal = getval(a, lastIndex), bVal = getval(b, lastIndex);
	              return cmp(aVal, bVal) * order;
	          }
	          return this.toArray(function (a) {
	              return a.sort(sorter);
	          }).then(cb);
	      };
	      Collection.prototype.toArray = function (cb) {
	          var _this = this;
	          return this._read(function (trans) {
	              var ctx = _this._ctx;
	              if (isPlainKeyRange(ctx, true) && ctx.limit > 0) {
	                  var valueMapper_1 = ctx.valueMapper;
	                  var index = getIndexOrStore(ctx, ctx.table.core.schema);
	                  return ctx.table.core
	                      .query({
	                      trans: trans,
	                      limit: ctx.limit,
	                      values: true,
	                      direction: ctx.dir === 'prev' ? 'prev' : undefined,
	                      query: {
	                          index: index,
	                          range: ctx.range,
	                      },
	                  })
	                      .then(function (_a) {
	                      var result = _a.result;
	                      return valueMapper_1 ? result.map(valueMapper_1) : result;
	                  });
	              }
	              else {
	                  var a_1 = [];
	                  return iter(ctx, function (item) { return a_1.push(item); }, trans, ctx.table.core).then(function () { return a_1; });
	              }
	          }, cb);
	      };
	      Collection.prototype.offset = function (offset) {
	          var ctx = this._ctx;
	          if (offset <= 0)
	              return this;
	          ctx.offset += offset;
	          if (isPlainKeyRange(ctx)) {
	              addReplayFilter(ctx, function () {
	                  var offsetLeft = offset;
	                  return function (cursor, advance) {
	                      if (offsetLeft === 0)
	                          return true;
	                      if (offsetLeft === 1) {
	                          --offsetLeft;
	                          return false;
	                      }
	                      advance(function () {
	                          cursor.advance(offsetLeft);
	                          offsetLeft = 0;
	                      });
	                      return false;
	                  };
	              });
	          }
	          else {
	              addReplayFilter(ctx, function () {
	                  var offsetLeft = offset;
	                  return function () { return --offsetLeft < 0; };
	              });
	          }
	          return this;
	      };
	      Collection.prototype.limit = function (numRows) {
	          this._ctx.limit = Math.min(this._ctx.limit, numRows);
	          addReplayFilter(this._ctx, function () {
	              var rowsLeft = numRows;
	              return function (cursor, advance, resolve) {
	                  if (--rowsLeft <= 0)
	                      advance(resolve);
	                  return rowsLeft >= 0;
	              };
	          }, true);
	          return this;
	      };
	      Collection.prototype.until = function (filterFunction, bIncludeStopEntry) {
	          addFilter(this._ctx, function (cursor, advance, resolve) {
	              if (filterFunction(cursor.value)) {
	                  advance(resolve);
	                  return bIncludeStopEntry;
	              }
	              else {
	                  return true;
	              }
	          });
	          return this;
	      };
	      Collection.prototype.first = function (cb) {
	          return this.limit(1)
	              .toArray(function (a) {
	              return a[0];
	          })
	              .then(cb);
	      };
	      Collection.prototype.last = function (cb) {
	          return this.reverse().first(cb);
	      };
	      Collection.prototype.filter = function (filterFunction) {
	          addFilter(this._ctx, function (cursor) {
	              return filterFunction(cursor.value);
	          });
	          addMatchFilter(this._ctx, filterFunction);
	          return this;
	      };
	      Collection.prototype.and = function (filter) {
	          return this.filter(filter);
	      };
	      Collection.prototype.or = function (indexName) {
	          return new this.db.WhereClause(this._ctx.table, indexName, this);
	      };
	      Collection.prototype.reverse = function () {
	          this._ctx.dir = this._ctx.dir === 'prev' ? 'next' : 'prev';
	          if (this._ondirectionchange)
	              this._ondirectionchange(this._ctx.dir);
	          return this;
	      };
	      Collection.prototype.desc = function () {
	          return this.reverse();
	      };
	      Collection.prototype.eachKey = function (cb) {
	          var ctx = this._ctx;
	          ctx.keysOnly = !ctx.isMatch;
	          return this.each(function (val, cursor) {
	              cb(cursor.key, cursor);
	          });
	      };
	      Collection.prototype.eachUniqueKey = function (cb) {
	          this._ctx.unique = 'unique';
	          return this.eachKey(cb);
	      };
	      Collection.prototype.eachPrimaryKey = function (cb) {
	          var ctx = this._ctx;
	          ctx.keysOnly = !ctx.isMatch;
	          return this.each(function (val, cursor) {
	              cb(cursor.primaryKey, cursor);
	          });
	      };
	      Collection.prototype.keys = function (cb) {
	          var ctx = this._ctx;
	          ctx.keysOnly = !ctx.isMatch;
	          var a = [];
	          return this.each(function (item, cursor) {
	              a.push(cursor.key);
	          })
	              .then(function () {
	              return a;
	          })
	              .then(cb);
	      };
	      Collection.prototype.primaryKeys = function (cb) {
	          var ctx = this._ctx;
	          if (isPlainKeyRange(ctx, true) && ctx.limit > 0) {
	              return this._read(function (trans) {
	                  var index = getIndexOrStore(ctx, ctx.table.core.schema);
	                  return ctx.table.core.query({
	                      trans: trans,
	                      values: false,
	                      limit: ctx.limit,
	                      direction: ctx.dir === 'prev' ? 'prev' : undefined,
	                      query: {
	                          index: index,
	                          range: ctx.range,
	                      },
	                  });
	              })
	                  .then(function (_a) {
	                  var result = _a.result;
	                  return result;
	              })
	                  .then(cb);
	          }
	          ctx.keysOnly = !ctx.isMatch;
	          var a = [];
	          return this.each(function (item, cursor) {
	              a.push(cursor.primaryKey);
	          })
	              .then(function () {
	              return a;
	          })
	              .then(cb);
	      };
	      Collection.prototype.uniqueKeys = function (cb) {
	          this._ctx.unique = 'unique';
	          return this.keys(cb);
	      };
	      Collection.prototype.firstKey = function (cb) {
	          return this.limit(1)
	              .keys(function (a) {
	              return a[0];
	          })
	              .then(cb);
	      };
	      Collection.prototype.lastKey = function (cb) {
	          return this.reverse().firstKey(cb);
	      };
	      Collection.prototype.distinct = function () {
	          var ctx = this._ctx, idx = ctx.index && ctx.table.schema.idxByName[ctx.index];
	          if (!idx || !idx.multi)
	              return this;
	          var set = {};
	          addFilter(this._ctx, function (cursor) {
	              var strKey = cursor.primaryKey.toString();
	              var found = hasOwn(set, strKey);
	              set[strKey] = true;
	              return !found;
	          });
	          return this;
	      };
	      Collection.prototype.modify = function (changes) {
	          var _this = this;
	          var ctx = this._ctx;
	          return this._write(function (trans) {
	              var modifyer;
	              if (typeof changes === 'function') {
	                  modifyer = changes;
	              }
	              else {
	                  modifyer = function (item) { return applyUpdateSpec(item, changes); };
	              }
	              var coreTable = ctx.table.core;
	              var _a = coreTable.schema.primaryKey, outbound = _a.outbound, extractKey = _a.extractKey;
	              var limit = 200;
	              var modifyChunkSize = _this.db._options.modifyChunkSize;
	              if (modifyChunkSize) {
	                  if (typeof modifyChunkSize == 'object') {
	                      limit =
	                          modifyChunkSize[coreTable.name] || modifyChunkSize['*'] || 200;
	                  }
	                  else {
	                      limit = modifyChunkSize;
	                  }
	              }
	              var totalFailures = [];
	              var successCount = 0;
	              var failedKeys = [];
	              var applyMutateResult = function (expectedCount, res) {
	                  var failures = res.failures, numFailures = res.numFailures;
	                  successCount += expectedCount - numFailures;
	                  for (var _i = 0, _a = keys(failures); _i < _a.length; _i++) {
	                      var pos = _a[_i];
	                      totalFailures.push(failures[pos]);
	                  }
	              };
	              var isUnconditionalDelete = changes === deleteCallback;
	              return _this.clone()
	                  .primaryKeys()
	                  .then(function (keys) {
	                  var criteria = isPlainKeyRange(ctx) &&
	                      ctx.limit === Infinity &&
	                      (typeof changes !== 'function' || isUnconditionalDelete) && {
	                      index: ctx.index,
	                      range: ctx.range,
	                  };
	                  var nextChunk = function (offset) {
	                      var count = Math.min(limit, keys.length - offset);
	                      var keysInChunk = keys.slice(offset, offset + count);
	                      return (isUnconditionalDelete
	                          ? Promise.resolve([])
	                          : coreTable.getMany({
	                              trans: trans,
	                              keys: keysInChunk,
	                              cache: 'immutable',
	                          })).then(function (values) {
	                          var addValues = [];
	                          var putValues = [];
	                          var putKeys = outbound ? [] : null;
	                          var deleteKeys = isUnconditionalDelete ? keysInChunk : [];
	                          if (!isUnconditionalDelete)
	                              for (var i = 0; i < count; ++i) {
	                                  var origValue = values[i];
	                                  var ctx_1 = {
	                                      value: deepClone(origValue),
	                                      primKey: keys[offset + i],
	                                  };
	                                  if (modifyer.call(ctx_1, ctx_1.value, ctx_1) !== false) {
	                                      if (ctx_1.value == null) {
	                                          deleteKeys.push(keys[offset + i]);
	                                      }
	                                      else if (!outbound &&
	                                          cmp(extractKey(origValue), extractKey(ctx_1.value)) !== 0) {
	                                          deleteKeys.push(keys[offset + i]);
	                                          addValues.push(ctx_1.value);
	                                      }
	                                      else {
	                                          putValues.push(ctx_1.value);
	                                          if (outbound)
	                                              putKeys.push(keys[offset + i]);
	                                      }
	                                  }
	                              }
	                          return Promise.resolve(addValues.length > 0 &&
	                              coreTable
	                                  .mutate({ trans: trans, type: 'add', values: addValues })
	                                  .then(function (res) {
	                                  for (var pos in res.failures) {
	                                      deleteKeys.splice(parseInt(pos), 1);
	                                  }
	                                  applyMutateResult(addValues.length, res);
	                              }))
	                              .then(function () {
	                              return (putValues.length > 0 ||
	                                  (criteria && typeof changes === 'object')) &&
	                                  coreTable
	                                      .mutate({
	                                      trans: trans,
	                                      type: 'put',
	                                      keys: putKeys,
	                                      values: putValues,
	                                      criteria: criteria,
	                                      changeSpec: typeof changes !== 'function' && changes,
	                                      isAdditionalChunk: offset > 0,
	                                  })
	                                      .then(function (res) { return applyMutateResult(putValues.length, res); });
	                          })
	                              .then(function () {
	                              return (deleteKeys.length > 0 ||
	                                  (criteria && isUnconditionalDelete)) &&
	                                  coreTable
	                                      .mutate({
	                                      trans: trans,
	                                      type: 'delete',
	                                      keys: deleteKeys,
	                                      criteria: criteria,
	                                      isAdditionalChunk: offset > 0,
	                                  })
	                                      .then(function (res) {
	                                      return builtInDeletionTrigger(ctx.table, deleteKeys, res);
	                                  })
	                                      .then(function (res) { return applyMutateResult(deleteKeys.length, res); });
	                          })
	                              .then(function () {
	                              return (keys.length > offset + count && nextChunk(offset + limit));
	                          });
	                      });
	                  };
	                  return nextChunk(0).then(function () {
	                      if (totalFailures.length > 0)
	                          throw new ModifyError('Error modifying one or more objects', totalFailures, successCount, failedKeys);
	                      return keys.length;
	                  });
	              });
	          });
	      };
	      Collection.prototype.delete = function () {
	          var ctx = this._ctx, range = ctx.range;
	          if (isPlainKeyRange(ctx) &&
	              !ctx.table.schema.yProps &&
	              (ctx.isPrimKey || range.type === 3 ))
	           {
	              return this._write(function (trans) {
	                  var primaryKey = ctx.table.core.schema.primaryKey;
	                  var coreRange = range;
	                  return ctx.table.core
	                      .count({ trans: trans, query: { index: primaryKey, range: coreRange } })
	                      .then(function (count) {
	                      return ctx.table.core
	                          .mutate({ trans: trans, type: 'deleteRange', range: coreRange })
	                          .then(function (_a) {
	                          var failures = _a.failures, numFailures = _a.numFailures;
	                          if (numFailures)
	                              throw new ModifyError('Could not delete some values', Object.keys(failures).map(function (pos) { return failures[pos]; }), count - numFailures);
	                          return count - numFailures;
	                      });
	                  });
	              });
	          }
	          return this.modify(deleteCallback);
	      };
	      return Collection;
	  }());
	  var deleteCallback = function (value, ctx) { return (ctx.value = null); };

	  function createCollectionConstructor(db) {
	      return makeClassConstructor(Collection.prototype, function Collection(whereClause, keyRangeGenerator) {
	          this.db = db;
	          var keyRange = AnyRange, error = null;
	          if (keyRangeGenerator)
	              try {
	                  keyRange = keyRangeGenerator();
	              }
	              catch (ex) {
	                  error = ex;
	              }
	          var whereCtx = whereClause._ctx;
	          var table = whereCtx.table;
	          var readingHook = table.hook.reading.fire;
	          this._ctx = {
	              table: table,
	              index: whereCtx.index,
	              isPrimKey: !whereCtx.index ||
	                  (table.schema.primKey.keyPath &&
	                      whereCtx.index === table.schema.primKey.name),
	              range: keyRange,
	              keysOnly: false,
	              dir: 'next',
	              unique: '',
	              algorithm: null,
	              filter: null,
	              replayFilter: null,
	              justLimit: true,
	              isMatch: null,
	              offset: 0,
	              limit: Infinity,
	              error: error,
	              or: whereCtx.or,
	              valueMapper: readingHook !== mirror ? readingHook : null,
	          };
	      });
	  }

	  function simpleCompare(a, b) {
	      return a < b ? -1 : a === b ? 0 : 1;
	  }
	  function simpleCompareReverse(a, b) {
	      return a > b ? -1 : a === b ? 0 : 1;
	  }

	  function fail(collectionOrWhereClause, err, T) {
	      var collection = collectionOrWhereClause instanceof WhereClause
	          ? new collectionOrWhereClause.Collection(collectionOrWhereClause)
	          : collectionOrWhereClause;
	      collection._ctx.error = T ? new T(err) : new TypeError(err);
	      return collection;
	  }
	  function emptyCollection(whereClause) {
	      return new whereClause.Collection(whereClause, function () { return rangeEqual(''); }).limit(0);
	  }
	  function upperFactory(dir) {
	      return dir === 'next'
	          ? function (s) { return s.toUpperCase(); }
	          : function (s) { return s.toLowerCase(); };
	  }
	  function lowerFactory(dir) {
	      return dir === 'next'
	          ? function (s) { return s.toLowerCase(); }
	          : function (s) { return s.toUpperCase(); };
	  }
	  function nextCasing(key, lowerKey, upperNeedle, lowerNeedle, cmp, dir) {
	      var length = Math.min(key.length, lowerNeedle.length);
	      var llp = -1;
	      for (var i = 0; i < length; ++i) {
	          var lwrKeyChar = lowerKey[i];
	          if (lwrKeyChar !== lowerNeedle[i]) {
	              if (cmp(key[i], upperNeedle[i]) < 0)
	                  return key.substr(0, i) + upperNeedle[i] + upperNeedle.substr(i + 1);
	              if (cmp(key[i], lowerNeedle[i]) < 0)
	                  return key.substr(0, i) + lowerNeedle[i] + upperNeedle.substr(i + 1);
	              if (llp >= 0)
	                  return key.substr(0, llp) + lowerKey[llp] + upperNeedle.substr(llp + 1);
	              return null;
	          }
	          if (cmp(key[i], lwrKeyChar) < 0)
	              llp = i;
	      }
	      if (length < lowerNeedle.length && dir === 'next')
	          return key + upperNeedle.substr(key.length);
	      if (length < key.length && dir === 'prev')
	          return key.substr(0, upperNeedle.length);
	      return llp < 0
	          ? null
	          : key.substr(0, llp) + lowerNeedle[llp] + upperNeedle.substr(llp + 1);
	  }
	  function addIgnoreCaseAlgorithm(whereClause, match, needles, suffix) {
	      var upper, lower, compare, upperNeedles, lowerNeedles, direction, nextKeySuffix, needlesLen = needles.length;
	      if (!needles.every(function (s) { return typeof s === 'string'; })) {
	          return fail(whereClause, STRING_EXPECTED);
	      }
	      function initDirection(dir) {
	          upper = upperFactory(dir);
	          lower = lowerFactory(dir);
	          compare = dir === 'next' ? simpleCompare : simpleCompareReverse;
	          var needleBounds = needles
	              .map(function (needle) {
	              return { lower: lower(needle), upper: upper(needle) };
	          })
	              .sort(function (a, b) {
	              return compare(a.lower, b.lower);
	          });
	          upperNeedles = needleBounds.map(function (nb) {
	              return nb.upper;
	          });
	          lowerNeedles = needleBounds.map(function (nb) {
	              return nb.lower;
	          });
	          direction = dir;
	          nextKeySuffix = dir === 'next' ? '' : suffix;
	      }
	      initDirection('next');
	      var c = new whereClause.Collection(whereClause, function () {
	          return createRange(upperNeedles[0], lowerNeedles[needlesLen - 1] + suffix);
	      });
	      c._ondirectionchange = function (direction) {
	          initDirection(direction);
	      };
	      var firstPossibleNeedle = 0;
	      c._addAlgorithm(function (cursor, advance, resolve) {
	          var key = cursor.key;
	          if (typeof key !== 'string')
	              return false;
	          var lowerKey = lower(key);
	          if (match(lowerKey, lowerNeedles, firstPossibleNeedle)) {
	              return true;
	          }
	          else {
	              var lowestPossibleCasing = null;
	              for (var i = firstPossibleNeedle; i < needlesLen; ++i) {
	                  var casing = nextCasing(key, lowerKey, upperNeedles[i], lowerNeedles[i], compare, direction);
	                  if (casing === null && lowestPossibleCasing === null)
	                      firstPossibleNeedle = i + 1;
	                  else if (lowestPossibleCasing === null ||
	                      compare(lowestPossibleCasing, casing) > 0) {
	                      lowestPossibleCasing = casing;
	                  }
	              }
	              if (lowestPossibleCasing !== null) {
	                  advance(function () {
	                      cursor.continue(lowestPossibleCasing + nextKeySuffix);
	                  });
	              }
	              else {
	                  advance(resolve);
	              }
	              return false;
	          }
	      });
	      return c;
	  }
	  function createRange(lower, upper, lowerOpen, upperOpen) {
	      return {
	          type: 2 ,
	          lower: lower,
	          upper: upper,
	          lowerOpen: lowerOpen,
	          upperOpen: upperOpen,
	      };
	  }
	  function rangeEqual(value) {
	      return {
	          type: 1 ,
	          lower: value,
	          upper: value,
	      };
	  }

	  var WhereClause =  (function () {
	      function WhereClause() {
	      }
	      Object.defineProperty(WhereClause.prototype, "Collection", {
	          get: function () {
	              return this._ctx.table.db.Collection;
	          },
	          enumerable: false,
	          configurable: true
	      });
	      WhereClause.prototype.between = function (lower, upper, includeLower, includeUpper) {
	          includeLower = includeLower !== false;
	          includeUpper = includeUpper === true;
	          try {
	              if (this._cmp(lower, upper) > 0 ||
	                  (this._cmp(lower, upper) === 0 &&
	                      (includeLower || includeUpper) &&
	                      !(includeLower && includeUpper)))
	                  return emptyCollection(this);
	              return new this.Collection(this, function () {
	                  return createRange(lower, upper, !includeLower, !includeUpper);
	              });
	          }
	          catch (e) {
	              return fail(this, INVALID_KEY_ARGUMENT);
	          }
	      };
	      WhereClause.prototype.equals = function (value) {
	          if (value == null)
	              return fail(this, INVALID_KEY_ARGUMENT);
	          return new this.Collection(this, function () { return rangeEqual(value); });
	      };
	      WhereClause.prototype.above = function (value) {
	          if (value == null)
	              return fail(this, INVALID_KEY_ARGUMENT);
	          return new this.Collection(this, function () { return createRange(value, undefined, true); });
	      };
	      WhereClause.prototype.aboveOrEqual = function (value) {
	          if (value == null)
	              return fail(this, INVALID_KEY_ARGUMENT);
	          return new this.Collection(this, function () {
	              return createRange(value, undefined, false);
	          });
	      };
	      WhereClause.prototype.below = function (value) {
	          if (value == null)
	              return fail(this, INVALID_KEY_ARGUMENT);
	          return new this.Collection(this, function () {
	              return createRange(undefined, value, false, true);
	          });
	      };
	      WhereClause.prototype.belowOrEqual = function (value) {
	          if (value == null)
	              return fail(this, INVALID_KEY_ARGUMENT);
	          return new this.Collection(this, function () { return createRange(undefined, value); });
	      };
	      WhereClause.prototype.startsWith = function (str) {
	          if (typeof str !== 'string')
	              return fail(this, STRING_EXPECTED);
	          return this.between(str, str + maxString, true, true);
	      };
	      WhereClause.prototype.startsWithIgnoreCase = function (str) {
	          if (str === '')
	              return this.startsWith(str);
	          return addIgnoreCaseAlgorithm(this, function (x, a) { return x.indexOf(a[0]) === 0; }, [str], maxString);
	      };
	      WhereClause.prototype.equalsIgnoreCase = function (str) {
	          return addIgnoreCaseAlgorithm(this, function (x, a) { return x === a[0]; }, [str], '');
	      };
	      WhereClause.prototype.anyOfIgnoreCase = function () {
	          var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
	          if (set.length === 0)
	              return emptyCollection(this);
	          return addIgnoreCaseAlgorithm(this, function (x, a) { return a.indexOf(x) !== -1; }, set, '');
	      };
	      WhereClause.prototype.startsWithAnyOfIgnoreCase = function () {
	          var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
	          if (set.length === 0)
	              return emptyCollection(this);
	          return addIgnoreCaseAlgorithm(this, function (x, a) { return a.some(function (n) { return x.indexOf(n) === 0; }); }, set, maxString);
	      };
	      WhereClause.prototype.anyOf = function () {
	          var _this = this;
	          var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
	          var compare = this._cmp;
	          try {
	              set.sort(compare);
	          }
	          catch (e) {
	              return fail(this, INVALID_KEY_ARGUMENT);
	          }
	          if (set.length === 0)
	              return emptyCollection(this);
	          var c = new this.Collection(this, function () {
	              return createRange(set[0], set[set.length - 1]);
	          });
	          c._ondirectionchange = function (direction) {
	              compare = direction === 'next' ? _this._ascending : _this._descending;
	              set.sort(compare);
	          };
	          var i = 0;
	          c._addAlgorithm(function (cursor, advance, resolve) {
	              var key = cursor.key;
	              while (compare(key, set[i]) > 0) {
	                  ++i;
	                  if (i === set.length) {
	                      advance(resolve);
	                      return false;
	                  }
	              }
	              if (compare(key, set[i]) === 0) {
	                  return true;
	              }
	              else {
	                  advance(function () {
	                      cursor.continue(set[i]);
	                  });
	                  return false;
	              }
	          });
	          return c;
	      };
	      WhereClause.prototype.notEqual = function (value) {
	          return this.inAnyRange([
	              [minKey, value],
	              [value, this.db._maxKey],
	          ], { includeLowers: false, includeUppers: false });
	      };
	      WhereClause.prototype.noneOf = function () {
	          var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
	          if (set.length === 0)
	              return new this.Collection(this);
	          try {
	              set.sort(this._ascending);
	          }
	          catch (e) {
	              return fail(this, INVALID_KEY_ARGUMENT);
	          }
	          var ranges = set.reduce(function (res, val) {
	              return res ? res.concat([[res[res.length - 1][1], val]]) : [[minKey, val]];
	          }, null);
	          ranges.push([set[set.length - 1], this.db._maxKey]);
	          return this.inAnyRange(ranges, {
	              includeLowers: false,
	              includeUppers: false,
	          });
	      };
	      WhereClause.prototype.inAnyRange = function (ranges, options) {
	          var _this = this;
	          var cmp = this._cmp, ascending = this._ascending, descending = this._descending, min = this._min, max = this._max;
	          if (ranges.length === 0)
	              return emptyCollection(this);
	          if (!ranges.every(function (range) {
	              return range[0] !== undefined &&
	                  range[1] !== undefined &&
	                  ascending(range[0], range[1]) <= 0;
	          })) {
	              return fail(this, 'First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower', exceptions.InvalidArgument);
	          }
	          var includeLowers = !options || options.includeLowers !== false;
	          var includeUppers = options && options.includeUppers === true;
	          function addRange(ranges, newRange) {
	              var i = 0, l = ranges.length;
	              for (; i < l; ++i) {
	                  var range = ranges[i];
	                  if (cmp(newRange[0], range[1]) < 0 && cmp(newRange[1], range[0]) > 0) {
	                      range[0] = min(range[0], newRange[0]);
	                      range[1] = max(range[1], newRange[1]);
	                      break;
	                  }
	              }
	              if (i === l)
	                  ranges.push(newRange);
	              return ranges;
	          }
	          var sortDirection = ascending;
	          function rangeSorter(a, b) {
	              return sortDirection(a[0], b[0]);
	          }
	          var set;
	          try {
	              set = ranges.reduce(addRange, []);
	              set.sort(rangeSorter);
	          }
	          catch (ex) {
	              return fail(this, INVALID_KEY_ARGUMENT);
	          }
	          var rangePos = 0;
	          var keyIsBeyondCurrentEntry = includeUppers
	              ? function (key) { return ascending(key, set[rangePos][1]) > 0; }
	              : function (key) { return ascending(key, set[rangePos][1]) >= 0; };
	          var keyIsBeforeCurrentEntry = includeLowers
	              ? function (key) { return descending(key, set[rangePos][0]) > 0; }
	              : function (key) { return descending(key, set[rangePos][0]) >= 0; };
	          function keyWithinCurrentRange(key) {
	              return !keyIsBeyondCurrentEntry(key) && !keyIsBeforeCurrentEntry(key);
	          }
	          var checkKey = keyIsBeyondCurrentEntry;
	          var c = new this.Collection(this, function () {
	              return createRange(set[0][0], set[set.length - 1][1], !includeLowers, !includeUppers);
	          });
	          c._ondirectionchange = function (direction) {
	              if (direction === 'next') {
	                  checkKey = keyIsBeyondCurrentEntry;
	                  sortDirection = ascending;
	              }
	              else {
	                  checkKey = keyIsBeforeCurrentEntry;
	                  sortDirection = descending;
	              }
	              set.sort(rangeSorter);
	          };
	          c._addAlgorithm(function (cursor, advance, resolve) {
	              var key = cursor.key;
	              while (checkKey(key)) {
	                  ++rangePos;
	                  if (rangePos === set.length) {
	                      advance(resolve);
	                      return false;
	                  }
	              }
	              if (keyWithinCurrentRange(key)) {
	                  return true;
	              }
	              else if (_this._cmp(key, set[rangePos][1]) === 0 ||
	                  _this._cmp(key, set[rangePos][0]) === 0) {
	                  return false;
	              }
	              else {
	                  advance(function () {
	                      if (sortDirection === ascending)
	                          cursor.continue(set[rangePos][0]);
	                      else
	                          cursor.continue(set[rangePos][1]);
	                  });
	                  return false;
	              }
	          });
	          return c;
	      };
	      WhereClause.prototype.startsWithAnyOf = function () {
	          var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
	          if (!set.every(function (s) { return typeof s === 'string'; })) {
	              return fail(this, 'startsWithAnyOf() only works with strings');
	          }
	          if (set.length === 0)
	              return emptyCollection(this);
	          return this.inAnyRange(set.map(function (str) { return [str, str + maxString]; }));
	      };
	      return WhereClause;
	  }());

	  function createWhereClauseConstructor(db) {
	      return makeClassConstructor(WhereClause.prototype, function WhereClause(table, index, orCollection) {
	          this.db = db;
	          this._ctx = {
	              table: table,
	              index: index === ':id' ? null : index,
	              or: orCollection,
	          };
	          this._cmp = this._ascending = cmp;
	          this._descending = function (a, b) { return cmp(b, a); };
	          this._max = function (a, b) { return (cmp(a, b) > 0 ? a : b); };
	          this._min = function (a, b) { return (cmp(a, b) < 0 ? a : b); };
	          this._IDBKeyRange = db._deps.IDBKeyRange;
	          if (!this._IDBKeyRange)
	              throw new exceptions.MissingAPI();
	      });
	  }

	  function eventRejectHandler(reject) {
	      return wrap(function (event) {
	          preventDefault(event);
	          reject(event.target.error);
	          return false;
	      });
	  }
	  function preventDefault(event) {
	      if (event.stopPropagation)
	          event.stopPropagation();
	      if (event.preventDefault)
	          event.preventDefault();
	  }

	  var DEXIE_STORAGE_MUTATED_EVENT_NAME = 'storagemutated';
	  var STORAGE_MUTATED_DOM_EVENT_NAME = 'x-storagemutated-1';
	  var globalEvents = Events(null, DEXIE_STORAGE_MUTATED_EVENT_NAME);

	  var Transaction =  (function () {
	      function Transaction() {
	      }
	      Transaction.prototype._lock = function () {
	          assert(!PSD.global);
	          ++this._reculock;
	          if (this._reculock === 1 && !PSD.global)
	              PSD.lockOwnerFor = this;
	          return this;
	      };
	      Transaction.prototype._unlock = function () {
	          assert(!PSD.global);
	          if (--this._reculock === 0) {
	              if (!PSD.global)
	                  PSD.lockOwnerFor = null;
	              while (this._blockedFuncs.length > 0 && !this._locked()) {
	                  var fnAndPSD = this._blockedFuncs.shift();
	                  try {
	                      usePSD(fnAndPSD[1], fnAndPSD[0]);
	                  }
	                  catch (e) { }
	              }
	          }
	          return this;
	      };
	      Transaction.prototype._locked = function () {
	          return this._reculock && PSD.lockOwnerFor !== this;
	      };
	      Transaction.prototype.create = function (idbtrans) {
	          var _this = this;
	          if (!this.mode)
	              return this;
	          var idbdb = this.db.idbdb;
	          var dbOpenError = this.db._state.dbOpenError;
	          assert(!this.idbtrans);
	          if (!idbtrans && !idbdb) {
	              switch (dbOpenError && dbOpenError.name) {
	                  case 'DatabaseClosedError':
	                      throw new exceptions.DatabaseClosed(dbOpenError);
	                  case 'MissingAPIError':
	                      throw new exceptions.MissingAPI(dbOpenError.message, dbOpenError);
	                  default:
	                      throw new exceptions.OpenFailed(dbOpenError);
	              }
	          }
	          if (!this.active)
	              throw new exceptions.TransactionInactive();
	          assert(this._completion._state === null);
	          idbtrans = this.idbtrans =
	              idbtrans ||
	                  (this.db.core
	                      ? this.db.core.transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })
	                      : idbdb.transaction(this.storeNames, this.mode, {
	                          durability: this.chromeTransactionDurability,
	                      }));
	          idbtrans.onerror = wrap(function (ev) {
	              preventDefault(ev);
	              _this._reject(idbtrans.error);
	          });
	          idbtrans.onabort = wrap(function (ev) {
	              preventDefault(ev);
	              _this.active && _this._reject(new exceptions.Abort(idbtrans.error));
	              _this.active = false;
	              _this.on('abort').fire(ev);
	          });
	          idbtrans.oncomplete = wrap(function () {
	              _this.active = false;
	              _this._resolve();
	              if ('mutatedParts' in idbtrans) {
	                  globalEvents.storagemutated.fire(idbtrans['mutatedParts']);
	              }
	          });
	          return this;
	      };
	      Transaction.prototype._promise = function (mode, fn, bWriteLock) {
	          var _this = this;
	          if (mode === 'readwrite' && this.mode !== 'readwrite')
	              return rejection(new exceptions.ReadOnly('Transaction is readonly'));
	          if (!this.active)
	              return rejection(new exceptions.TransactionInactive());
	          if (this._locked()) {
	              return new DexiePromise(function (resolve, reject) {
	                  _this._blockedFuncs.push([
	                      function () {
	                          _this._promise(mode, fn, bWriteLock).then(resolve, reject);
	                      },
	                      PSD,
	                  ]);
	              });
	          }
	          else if (bWriteLock) {
	              return newScope(function () {
	                  var p = new DexiePromise(function (resolve, reject) {
	                      _this._lock();
	                      var rv = fn(resolve, reject, _this);
	                      if (rv && rv.then)
	                          rv.then(resolve, reject);
	                  });
	                  p.finally(function () { return _this._unlock(); });
	                  p._lib = true;
	                  return p;
	              });
	          }
	          else {
	              var p = new DexiePromise(function (resolve, reject) {
	                  var rv = fn(resolve, reject, _this);
	                  if (rv && rv.then)
	                      rv.then(resolve, reject);
	              });
	              p._lib = true;
	              return p;
	          }
	      };
	      Transaction.prototype._root = function () {
	          return this.parent ? this.parent._root() : this;
	      };
	      Transaction.prototype.waitFor = function (promiseLike) {
	          var root = this._root();
	          var promise = DexiePromise.resolve(promiseLike);
	          if (root._waitingFor) {
	              root._waitingFor = root._waitingFor.then(function () { return promise; });
	          }
	          else {
	              root._waitingFor = promise;
	              root._waitingQueue = [];
	              var store = root.idbtrans.objectStore(root.storeNames[0]);
	              (function spin() {
	                  ++root._spinCount;
	                  while (root._waitingQueue.length)
	                      root._waitingQueue.shift()();
	                  if (root._waitingFor)
	                      store.get(-Infinity).onsuccess = spin;
	              })();
	          }
	          var currentWaitPromise = root._waitingFor;
	          return new DexiePromise(function (resolve, reject) {
	              promise
	                  .then(function (res) { return root._waitingQueue.push(wrap(resolve.bind(null, res))); }, function (err) { return root._waitingQueue.push(wrap(reject.bind(null, err))); })
	                  .finally(function () {
	                  if (root._waitingFor === currentWaitPromise) {
	                      root._waitingFor = null;
	                  }
	              });
	          });
	      };
	      Transaction.prototype.abort = function () {
	          if (this.active) {
	              this.active = false;
	              if (this.idbtrans)
	                  this.idbtrans.abort();
	              this._reject(new exceptions.Abort());
	          }
	      };
	      Transaction.prototype.table = function (tableName) {
	          var memoizedTables = this._memoizedTables || (this._memoizedTables = {});
	          if (hasOwn(memoizedTables, tableName))
	              return memoizedTables[tableName];
	          var tableSchema = this.schema[tableName];
	          if (!tableSchema) {
	              throw new exceptions.NotFound('Table ' + tableName + ' not part of transaction');
	          }
	          var transactionBoundTable = new this.db.Table(tableName, tableSchema, this);
	          transactionBoundTable.core = this.db.core.table(tableName);
	          memoizedTables[tableName] = transactionBoundTable;
	          return transactionBoundTable;
	      };
	      return Transaction;
	  }());

	  function createTransactionConstructor(db) {
	      return makeClassConstructor(Transaction.prototype, function Transaction(mode, storeNames, dbschema, chromeTransactionDurability, parent) {
	          var _this = this;
	          if (mode !== 'readonly')
	              storeNames.forEach(function (storeName) {
	                  var _a;
	                  var yProps = (_a = dbschema[storeName]) === null || _a === void 0 ? void 0 : _a.yProps;
	                  if (yProps)
	                      storeNames = storeNames.concat(yProps.map(function (p) { return p.updatesTable; }));
	              });
	          this.db = db;
	          this.mode = mode;
	          this.storeNames = storeNames;
	          this.schema = dbschema;
	          this.chromeTransactionDurability = chromeTransactionDurability;
	          this.idbtrans = null;
	          this.on = Events(this, 'complete', 'error', 'abort');
	          this.parent = parent || null;
	          this.active = true;
	          this._reculock = 0;
	          this._blockedFuncs = [];
	          this._resolve = null;
	          this._reject = null;
	          this._waitingFor = null;
	          this._waitingQueue = null;
	          this._spinCount = 0;
	          this._completion = new DexiePromise(function (resolve, reject) {
	              _this._resolve = resolve;
	              _this._reject = reject;
	          });
	          this._completion.then(function () {
	              _this.active = false;
	              _this.on.complete.fire();
	          }, function (e) {
	              var wasActive = _this.active;
	              _this.active = false;
	              _this.on.error.fire(e);
	              _this.parent
	                  ? _this.parent._reject(e)
	                  : wasActive && _this.idbtrans && _this.idbtrans.abort();
	              return rejection(e);
	          });
	      });
	  }

	  function createIndexSpec(name, keyPath, unique, multi, auto, compound, isPrimKey, type) {
	      return {
	          name: name,
	          keyPath: keyPath,
	          unique: unique,
	          multi: multi,
	          auto: auto,
	          compound: compound,
	          src: (unique && !isPrimKey ? '&' : '') +
	              (multi ? '*' : '') +
	              (auto ? '++' : '') +
	              nameFromKeyPath(keyPath),
	          type: type,
	      };
	  }
	  function nameFromKeyPath(keyPath) {
	      return typeof keyPath === 'string'
	          ? keyPath
	          : keyPath
	              ? '[' + [].join.call(keyPath, '+') + ']'
	              : '';
	  }

	  function createTableSchema(name, primKey, indexes) {
	      return {
	          name: name,
	          primKey: primKey,
	          indexes: indexes,
	          mappedClass: null,
	          idxByName: arrayToObject(indexes, function (index) { return [index.name, index]; }),
	      };
	  }

	  function safariMultiStoreFix(storeNames) {
	      return storeNames.length === 1 ? storeNames[0] : storeNames;
	  }
	  var getMaxKey = function (IdbKeyRange) {
	      try {
	          IdbKeyRange.only([[]]);
	          getMaxKey = function () { return [[]]; };
	          return [[]];
	      }
	      catch (e) {
	          getMaxKey = function () { return maxString; };
	          return maxString;
	      }
	  };

	  function getKeyExtractor(keyPath) {
	      if (keyPath == null) {
	          return function () { return undefined; };
	      }
	      else if (typeof keyPath === 'string') {
	          return getSinglePathKeyExtractor(keyPath);
	      }
	      else {
	          return function (obj) { return getByKeyPath(obj, keyPath); };
	      }
	  }
	  function getSinglePathKeyExtractor(keyPath) {
	      var split = keyPath.split('.');
	      if (split.length === 1) {
	          return function (obj) { return obj[keyPath]; };
	      }
	      else {
	          return function (obj) { return getByKeyPath(obj, keyPath); };
	      }
	  }

	  function arrayify(arrayLike) {
	      return [].slice.call(arrayLike);
	  }
	  var _id_counter = 0;
	  function getKeyPathAlias(keyPath) {
	      return keyPath == null
	          ? ':id'
	          : typeof keyPath === 'string'
	              ? keyPath
	              : "[".concat(keyPath.join('+'), "]");
	  }
	  function createDBCore(db, IdbKeyRange, tmpTrans) {
	      function extractSchema(db, trans) {
	          var tables = arrayify(db.objectStoreNames);
	          var tempStore = tables.length > 0 ? trans.objectStore(tables[0]) : {};
	          return {
	              schema: {
	                  name: db.name,
	                  tables: tables
	                      .map(function (table) { return trans.objectStore(table); })
	                      .map(function (store) {
	                      var keyPath = store.keyPath, autoIncrement = store.autoIncrement;
	                      var compound = isArray(keyPath);
	                      var outbound = keyPath == null;
	                      var indexByKeyPath = {};
	                      var result = {
	                          name: store.name,
	                          primaryKey: {
	                              name: null,
	                              isPrimaryKey: true,
	                              outbound: outbound,
	                              compound: compound,
	                              keyPath: keyPath,
	                              autoIncrement: autoIncrement,
	                              unique: true,
	                              extractKey: getKeyExtractor(keyPath),
	                          },
	                          indexes: arrayify(store.indexNames)
	                              .map(function (indexName) { return store.index(indexName); })
	                              .map(function (index) {
	                              var name = index.name, unique = index.unique, multiEntry = index.multiEntry, keyPath = index.keyPath;
	                              var compound = isArray(keyPath);
	                              var result = {
	                                  name: name,
	                                  compound: compound,
	                                  keyPath: keyPath,
	                                  unique: unique,
	                                  multiEntry: multiEntry,
	                                  extractKey: getKeyExtractor(keyPath),
	                              };
	                              indexByKeyPath[getKeyPathAlias(keyPath)] = result;
	                              return result;
	                          }),
	                          getIndexByKeyPath: function (keyPath) {
	                              return indexByKeyPath[getKeyPathAlias(keyPath)];
	                          },
	                      };
	                      indexByKeyPath[':id'] = result.primaryKey;
	                      if (keyPath != null) {
	                          indexByKeyPath[getKeyPathAlias(keyPath)] = result.primaryKey;
	                      }
	                      return result;
	                  }),
	              },
	              hasGetAll: tables.length > 0 &&
	                  'getAll' in tempStore &&
	                  !(typeof navigator !== 'undefined' &&
	                      /Safari/.test(navigator.userAgent) &&
	                      !/(Chrome\/|Edge\/)/.test(navigator.userAgent) &&
	                      [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604),
	              hasIdb3Features: 'getAllRecords' in tempStore,
	          };
	      }
	      function makeIDBKeyRange(range) {
	          if (range.type === 3 )
	              return null;
	          if (range.type === 4 )
	              throw new Error('Cannot convert never type to IDBKeyRange');
	          var lower = range.lower, upper = range.upper, lowerOpen = range.lowerOpen, upperOpen = range.upperOpen;
	          var idbRange = lower === undefined
	              ? upper === undefined
	                  ? null
	                  : IdbKeyRange.upperBound(upper, !!upperOpen)
	              : upper === undefined
	                  ? IdbKeyRange.lowerBound(lower, !!lowerOpen)
	                  : IdbKeyRange.bound(lower, upper, !!lowerOpen, !!upperOpen);
	          return idbRange;
	      }
	      function createDbCoreTable(tableSchema) {
	          var tableName = tableSchema.name;
	          function mutate(_a) {
	              var trans = _a.trans, type = _a.type, keys = _a.keys, values = _a.values, range = _a.range;
	              return new Promise(function (resolve, reject) {
	                  resolve = wrap(resolve);
	                  var store = trans.objectStore(tableName);
	                  var outbound = store.keyPath == null;
	                  var isAddOrPut = type === 'put' || type === 'add';
	                  if (!isAddOrPut && type !== 'delete' && type !== 'deleteRange')
	                      throw new Error('Invalid operation type: ' + type);
	                  var length = (keys || values || { length: 1 }).length;
	                  if (keys && values && keys.length !== values.length) {
	                      throw new Error('Given keys array must have same length as given values array.');
	                  }
	                  if (length === 0)
	                      return resolve({
	                          numFailures: 0,
	                          failures: {},
	                          results: [],
	                          lastResult: undefined,
	                      });
	                  var req;
	                  var reqs = [];
	                  var failures = [];
	                  var numFailures = 0;
	                  var errorHandler = function (event) {
	                      ++numFailures;
	                      preventDefault(event);
	                  };
	                  if (type === 'deleteRange') {
	                      if (range.type === 4 )
	                          return resolve({
	                              numFailures: numFailures,
	                              failures: failures,
	                              results: [],
	                              lastResult: undefined,
	                          });
	                      if (range.type === 3 )
	                          reqs.push((req = store.clear()));
	                      else
	                          reqs.push((req = store.delete(makeIDBKeyRange(range))));
	                  }
	                  else {
	                      var _a = isAddOrPut
	                          ? outbound
	                              ? [values, keys]
	                              : [values, null]
	                          : [keys, null], args1 = _a[0], args2 = _a[1];
	                      if (isAddOrPut) {
	                          for (var i = 0; i < length; ++i) {
	                              reqs.push((req = (args2 && args2[i] !== undefined
	                                  ? store[type](args1[i], args2[i])
	                                  : store[type](args1[i]))));
	                              req.onerror = errorHandler;
	                          }
	                      }
	                      else {
	                          for (var i = 0; i < length; ++i) {
	                              reqs.push((req = store[type](args1[i])));
	                              req.onerror = errorHandler;
	                          }
	                      }
	                  }
	                  var done = function (event) {
	                      var lastResult = event.target.result;
	                      reqs.forEach(function (req, i) { return req.error != null && (failures[i] = req.error); });
	                      resolve({
	                          numFailures: numFailures,
	                          failures: failures,
	                          results: type === 'delete' ? keys : reqs.map(function (req) { return req.result; }),
	                          lastResult: lastResult,
	                      });
	                  };
	                  req.onerror = function (event) {
	                      errorHandler(event);
	                      done(event);
	                  };
	                  req.onsuccess = done;
	              });
	          }
	          function openCursor(_a) {
	              var trans = _a.trans, values = _a.values, query = _a.query, reverse = _a.reverse, unique = _a.unique;
	              return new Promise(function (resolve, reject) {
	                  resolve = wrap(resolve);
	                  var index = query.index, range = query.range;
	                  var store = trans.objectStore(tableName);
	                  var source = index.isPrimaryKey ? store : store.index(index.name);
	                  var direction = reverse
	                      ? unique
	                          ? 'prevunique'
	                          : 'prev'
	                      : unique
	                          ? 'nextunique'
	                          : 'next';
	                  var req = values || !('openKeyCursor' in source)
	                      ? source.openCursor(makeIDBKeyRange(range), direction)
	                      : source.openKeyCursor(makeIDBKeyRange(range), direction);
	                  req.onerror = eventRejectHandler(reject);
	                  req.onsuccess = wrap(function (ev) {
	                      var cursor = req.result;
	                      if (!cursor) {
	                          resolve(null);
	                          return;
	                      }
	                      cursor.___id = ++_id_counter;
	                      cursor.done = false;
	                      var _cursorContinue = cursor.continue.bind(cursor);
	                      var _cursorContinuePrimaryKey = cursor.continuePrimaryKey;
	                      if (_cursorContinuePrimaryKey)
	                          _cursorContinuePrimaryKey = _cursorContinuePrimaryKey.bind(cursor);
	                      var _cursorAdvance = cursor.advance.bind(cursor);
	                      var doThrowCursorIsNotStarted = function () {
	                          throw new Error('Cursor not started');
	                      };
	                      var doThrowCursorIsStopped = function () {
	                          throw new Error('Cursor not stopped');
	                      };
	                      cursor.trans = trans;
	                      cursor.stop =
	                          cursor.continue =
	                              cursor.continuePrimaryKey =
	                                  cursor.advance =
	                                      doThrowCursorIsNotStarted;
	                      cursor.fail = wrap(reject);
	                      cursor.next = function () {
	                          var _this = this;
	                          var gotOne = 1;
	                          return this.start(function () {
	                              return gotOne-- ? _this.continue() : _this.stop();
	                          }).then(function () { return _this; });
	                      };
	                      cursor.start = function (callback) {
	                          var iterationPromise = new Promise(function (resolveIteration, rejectIteration) {
	                              resolveIteration = wrap(resolveIteration);
	                              req.onerror = eventRejectHandler(rejectIteration);
	                              cursor.fail = rejectIteration;
	                              cursor.stop = function (value) {
	                                  cursor.stop =
	                                      cursor.continue =
	                                          cursor.continuePrimaryKey =
	                                              cursor.advance =
	                                                  doThrowCursorIsStopped;
	                                  resolveIteration(value);
	                              };
	                          });
	                          var guardedCallback = function () {
	                              if (req.result) {
	                                  try {
	                                      callback();
	                                  }
	                                  catch (err) {
	                                      cursor.fail(err);
	                                  }
	                              }
	                              else {
	                                  cursor.done = true;
	                                  cursor.start = function () {
	                                      throw new Error('Cursor behind last entry');
	                                  };
	                                  cursor.stop();
	                              }
	                          };
	                          req.onsuccess = wrap(function (ev) {
	                              req.onsuccess = guardedCallback;
	                              guardedCallback();
	                          });
	                          cursor.continue = _cursorContinue;
	                          cursor.continuePrimaryKey = _cursorContinuePrimaryKey;
	                          cursor.advance = _cursorAdvance;
	                          guardedCallback();
	                          return iterationPromise;
	                      };
	                      resolve(cursor);
	                  }, reject);
	              });
	          }
	          function query(hasGetAll, hasIdb3Features) {
	              return function (request) {
	                  return new Promise(function (resolve, reject) {
	                      var _a;
	                      resolve = wrap(resolve);
	                      var trans = request.trans, values = request.values, limit = request.limit, query = request.query;
	                      var direction = (_a = request.direction) !== null && _a !== void 0 ? _a : 'next';
	                      var nonInfinitLimit = limit === Infinity ? undefined : limit;
	                      var index = query.index, range = query.range;
	                      var store = trans.objectStore(tableName);
	                      var source = index.isPrimaryKey ? store : store.index(index.name);
	                      var idbKeyRange = makeIDBKeyRange(range);
	                      if (limit === 0)
	                          return resolve({ result: [] });
	                      if (hasIdb3Features) {
	                          var options = {
	                              query: idbKeyRange,
	                              count: nonInfinitLimit,
	                              direction: direction,
	                          };
	                          var req = values
	                              ? source.getAll(options)
	                              : source.getAllKeys(options);
	                          req.onsuccess = function (event) { return resolve({ result: event.target.result }); };
	                          req.onerror = eventRejectHandler(reject);
	                      }
	                      else if (hasGetAll && direction === 'next') {
	                          var req = values
	                              ? source.getAll(idbKeyRange, nonInfinitLimit)
	                              : source.getAllKeys(idbKeyRange, nonInfinitLimit);
	                          req.onsuccess = function (event) {
	                              return resolve({ result: event.target.result });
	                          };
	                          req.onerror = eventRejectHandler(reject);
	                      }
	                      else {
	                          var count_1 = 0;
	                          var req_1 = values || !('openKeyCursor' in source)
	                              ? source.openCursor(idbKeyRange, direction)
	                              : source.openKeyCursor(idbKeyRange, direction);
	                          var result_1 = [];
	                          req_1.onsuccess = function () {
	                              var cursor = req_1.result;
	                              if (!cursor)
	                                  return resolve({ result: result_1 });
	                              result_1.push(values ? cursor.value : cursor.primaryKey);
	                              if (++count_1 === limit)
	                                  return resolve({ result: result_1 });
	                              cursor.continue();
	                          };
	                          req_1.onerror = eventRejectHandler(reject);
	                      }
	                  });
	              };
	          }
	          return {
	              name: tableName,
	              schema: tableSchema,
	              mutate: mutate,
	              getMany: function (_a) {
	                  var trans = _a.trans, keys = _a.keys;
	                  return new Promise(function (resolve, reject) {
	                      resolve = wrap(resolve);
	                      var store = trans.objectStore(tableName);
	                      var length = keys.length;
	                      var result = new Array(length);
	                      var keyCount = 0;
	                      var callbackCount = 0;
	                      var req;
	                      var successHandler = function (event) {
	                          var req = event.target;
	                          if ((result[req._pos] = req.result) != null)
	                              ;
	                          if (++callbackCount === keyCount)
	                              resolve(result);
	                      };
	                      var errorHandler = eventRejectHandler(reject);
	                      for (var i = 0; i < length; ++i) {
	                          var key = keys[i];
	                          if (key != null) {
	                              req = store.get(keys[i]);
	                              req._pos = i;
	                              req.onsuccess = successHandler;
	                              req.onerror = errorHandler;
	                              ++keyCount;
	                          }
	                      }
	                      if (keyCount === 0)
	                          resolve(result);
	                  });
	              },
	              get: function (_a) {
	                  var trans = _a.trans, key = _a.key;
	                  return new Promise(function (resolve, reject) {
	                      resolve = wrap(resolve);
	                      var store = trans.objectStore(tableName);
	                      var req = store.get(key);
	                      req.onsuccess = function (event) { return resolve(event.target.result); };
	                      req.onerror = eventRejectHandler(reject);
	                  });
	              },
	              query: query(hasGetAll, hasIdb3Features),
	              openCursor: openCursor,
	              count: function (_a) {
	                  var query = _a.query, trans = _a.trans;
	                  var index = query.index, range = query.range;
	                  return new Promise(function (resolve, reject) {
	                      var store = trans.objectStore(tableName);
	                      var source = index.isPrimaryKey ? store : store.index(index.name);
	                      var idbKeyRange = makeIDBKeyRange(range);
	                      var req = idbKeyRange ? source.count(idbKeyRange) : source.count();
	                      req.onsuccess = wrap(function (ev) {
	                          return resolve(ev.target.result);
	                      });
	                      req.onerror = eventRejectHandler(reject);
	                  });
	              },
	          };
	      }
	      var _a = extractSchema(db, tmpTrans), schema = _a.schema, hasGetAll = _a.hasGetAll, hasIdb3Features = _a.hasIdb3Features;
	      var tables = schema.tables.map(function (tableSchema) {
	          return createDbCoreTable(tableSchema);
	      });
	      var tableMap = {};
	      tables.forEach(function (table) { return (tableMap[table.name] = table); });
	      return {
	          stack: 'dbcore',
	          transaction: db.transaction.bind(db),
	          table: function (name) {
	              var result = tableMap[name];
	              if (!result)
	                  throw new Error("Table '".concat(name, "' not found"));
	              return tableMap[name];
	          },
	          MIN_KEY: -Infinity,
	          MAX_KEY: getMaxKey(IdbKeyRange),
	          schema: schema,
	      };
	  }

	  function createMiddlewareStack(stackImpl, middlewares) {
	      return middlewares.reduce(function (down, _a) {
	          var create = _a.create;
	          return (__assign(__assign({}, down), create(down)));
	      }, stackImpl);
	  }
	  function createMiddlewareStacks(middlewares, idbdb, _a, tmpTrans) {
	      var IDBKeyRange = _a.IDBKeyRange; _a.indexedDB;
	      var dbcore = createMiddlewareStack(createDBCore(idbdb, IDBKeyRange, tmpTrans), middlewares.dbcore);
	      return {
	          dbcore: dbcore,
	      };
	  }
	  function generateMiddlewareStacks(db, tmpTrans) {
	      var idbdb = tmpTrans.db;
	      var stacks = createMiddlewareStacks(db._middlewares, idbdb, db._deps, tmpTrans);
	      db.core = stacks.dbcore;
	      db.tables.forEach(function (table) {
	          var tableName = table.name;
	          if (db.core.schema.tables.some(function (tbl) { return tbl.name === tableName; })) {
	              table.core = db.core.table(tableName);
	              if (db[tableName] instanceof db.Table) {
	                  db[tableName].core = table.core;
	              }
	          }
	      });
	  }

	  function setApiOnPlace(db, objs, tableNames, dbschema) {
	      tableNames.forEach(function (tableName) {
	          var schema = dbschema[tableName];
	          objs.forEach(function (obj) {
	              var propDesc = getPropertyDescriptor(obj, tableName);
	              if (!propDesc || ('value' in propDesc && propDesc.value === undefined)) {
	                  if (obj === db.Transaction.prototype || obj instanceof db.Transaction) {
	                      setProp(obj, tableName, {
	                          get: function () {
	                              return this.table(tableName);
	                          },
	                          set: function (value) {
	                              defineProperty(this, tableName, {
	                                  value: value,
	                                  writable: true,
	                                  configurable: true,
	                                  enumerable: true,
	                              });
	                          },
	                      });
	                  }
	                  else {
	                      obj[tableName] = new db.Table(tableName, schema);
	                  }
	              }
	          });
	      });
	  }
	  function removeTablesApi(db, objs) {
	      objs.forEach(function (obj) {
	          for (var key in obj) {
	              if (obj[key] instanceof db.Table)
	                  delete obj[key];
	          }
	      });
	  }
	  function lowerVersionFirst(a, b) {
	      return a._cfg.version - b._cfg.version;
	  }
	  function runUpgraders(db, oldVersion, idbUpgradeTrans, reject) {
	      var globalSchema = db._dbSchema;
	      if (idbUpgradeTrans.objectStoreNames.contains('$meta') &&
	          !globalSchema.$meta) {
	          globalSchema.$meta = createTableSchema('$meta', parseIndexSyntax('')[0], []);
	          db._storeNames.push('$meta');
	      }
	      var trans = db._createTransaction('readwrite', db._storeNames, globalSchema);
	      trans.create(idbUpgradeTrans);
	      trans._completion.catch(reject);
	      var rejectTransaction = trans._reject.bind(trans);
	      var transless = PSD.transless || PSD;
	      newScope(function () {
	          PSD.trans = trans;
	          PSD.transless = transless;
	          if (oldVersion === 0) {
	              keys(globalSchema).forEach(function (tableName) {
	                  createTable(idbUpgradeTrans, tableName, globalSchema[tableName].primKey, globalSchema[tableName].indexes);
	              });
	              generateMiddlewareStacks(db, idbUpgradeTrans);
	              DexiePromise.follow(function () { return db.on.populate.fire(trans); }).catch(rejectTransaction);
	          }
	          else {
	              generateMiddlewareStacks(db, idbUpgradeTrans);
	              return getExistingVersion(db, trans, oldVersion)
	                  .then(function (oldVersion) {
	                  return updateTablesAndIndexes(db, oldVersion, trans, idbUpgradeTrans);
	              })
	                  .catch(rejectTransaction);
	          }
	      });
	  }
	  function patchCurrentVersion(db, idbUpgradeTrans) {
	      createMissingTables(db._dbSchema, idbUpgradeTrans);
	      if (idbUpgradeTrans.db.version % 10 === 0 &&
	          !idbUpgradeTrans.objectStoreNames.contains('$meta')) {
	          idbUpgradeTrans.db
	              .createObjectStore('$meta')
	              .add(Math.ceil(idbUpgradeTrans.db.version / 10 - 1), 'version');
	      }
	      var globalSchema = buildGlobalSchema(db, db.idbdb, idbUpgradeTrans);
	      adjustToExistingIndexNames(db, db._dbSchema, idbUpgradeTrans);
	      var diff = getSchemaDiff(globalSchema, db._dbSchema);
	      var _loop_1 = function (tableChange) {
	          if (tableChange.change.length || tableChange.recreate) {
	              console.warn("Unable to patch indexes of table ".concat(tableChange.name, " because it has changes on the type of index or primary key."));
	              return { value: void 0 };
	          }
	          var store = idbUpgradeTrans.objectStore(tableChange.name);
	          tableChange.add.forEach(function (idx) {
	              if (debug)
	                  console.debug("Dexie upgrade patch: Creating missing index ".concat(tableChange.name, ".").concat(idx.src));
	              addIndex(store, idx);
	          });
	      };
	      for (var _i = 0, _a = diff.change; _i < _a.length; _i++) {
	          var tableChange = _a[_i];
	          var state_1 = _loop_1(tableChange);
	          if (typeof state_1 === "object")
	              return state_1.value;
	      }
	  }
	  function getExistingVersion(db, trans, oldVersion) {
	      if (trans.storeNames.includes('$meta')) {
	          return trans
	              .table('$meta')
	              .get('version')
	              .then(function (metaVersion) {
	              return metaVersion != null ? metaVersion : oldVersion;
	          });
	      }
	      else {
	          return DexiePromise.resolve(oldVersion);
	      }
	  }
	  function updateTablesAndIndexes(db, oldVersion, trans, idbUpgradeTrans) {
	      var queue = [];
	      var versions = db._versions;
	      var globalSchema = (db._dbSchema = buildGlobalSchema(db, db.idbdb, idbUpgradeTrans));
	      var versToRun = versions.filter(function (v) { return v._cfg.version >= oldVersion; });
	      if (versToRun.length === 0) {
	          return DexiePromise.resolve();
	      }
	      versToRun.forEach(function (version) {
	          queue.push(function () {
	              var oldSchema = globalSchema;
	              var newSchema = version._cfg.dbschema;
	              adjustToExistingIndexNames(db, oldSchema, idbUpgradeTrans);
	              adjustToExistingIndexNames(db, newSchema, idbUpgradeTrans);
	              globalSchema = db._dbSchema = newSchema;
	              var diff = getSchemaDiff(oldSchema, newSchema);
	              diff.add.forEach(function (tuple) {
	                  createTable(idbUpgradeTrans, tuple[0], tuple[1].primKey, tuple[1].indexes);
	              });
	              diff.change.forEach(function (change) {
	                  if (change.recreate) {
	                      throw new exceptions.Upgrade('Not yet support for changing primary key');
	                  }
	                  else {
	                      var store_1 = idbUpgradeTrans.objectStore(change.name);
	                      change.add.forEach(function (idx) { return addIndex(store_1, idx); });
	                      change.change.forEach(function (idx) {
	                          store_1.deleteIndex(idx.name);
	                          addIndex(store_1, idx);
	                      });
	                      change.del.forEach(function (idxName) { return store_1.deleteIndex(idxName); });
	                  }
	              });
	              var contentUpgrade = version._cfg.contentUpgrade;
	              if (contentUpgrade && version._cfg.version > oldVersion) {
	                  generateMiddlewareStacks(db, idbUpgradeTrans);
	                  trans._memoizedTables = {};
	                  var upgradeSchema_1 = shallowClone(newSchema);
	                  diff.del.forEach(function (table) {
	                      upgradeSchema_1[table] = oldSchema[table];
	                  });
	                  removeTablesApi(db, [db.Transaction.prototype]);
	                  setApiOnPlace(db, [db.Transaction.prototype], keys(upgradeSchema_1), upgradeSchema_1);
	                  trans.schema = upgradeSchema_1;
	                  var contentUpgradeIsAsync_1 = isAsyncFunction(contentUpgrade);
	                  if (contentUpgradeIsAsync_1) {
	                      incrementExpectedAwaits();
	                  }
	                  var returnValue_1;
	                  var promiseFollowed = DexiePromise.follow(function () {
	                      returnValue_1 = contentUpgrade(trans);
	                      if (returnValue_1) {
	                          if (contentUpgradeIsAsync_1) {
	                              var decrementor = decrementExpectedAwaits.bind(null, null);
	                              returnValue_1.then(decrementor, decrementor);
	                          }
	                      }
	                  });
	                  return returnValue_1 && typeof returnValue_1.then === 'function'
	                      ? DexiePromise.resolve(returnValue_1)
	                      : promiseFollowed.then(function () { return returnValue_1; });
	              }
	          });
	          queue.push(function (idbtrans) {
	              var newSchema = version._cfg.dbschema;
	              deleteRemovedTables(newSchema, idbtrans);
	              removeTablesApi(db, [db.Transaction.prototype]);
	              setApiOnPlace(db, [db.Transaction.prototype], db._storeNames, db._dbSchema);
	              trans.schema = db._dbSchema;
	          });
	          queue.push(function (idbtrans) {
	              if (db.idbdb.objectStoreNames.contains('$meta')) {
	                  if (Math.ceil(db.idbdb.version / 10) === version._cfg.version) {
	                      db.idbdb.deleteObjectStore('$meta');
	                      delete db._dbSchema.$meta;
	                      db._storeNames = db._storeNames.filter(function (name) { return name !== '$meta'; });
	                  }
	                  else {
	                      idbtrans.objectStore('$meta').put(version._cfg.version, 'version');
	                  }
	              }
	          });
	      });
	      function runQueue() {
	          return queue.length
	              ? DexiePromise.resolve(queue.shift()(trans.idbtrans)).then(runQueue)
	              : DexiePromise.resolve();
	      }
	      return runQueue().then(function () {
	          createMissingTables(globalSchema, idbUpgradeTrans);
	      });
	  }
	  function getSchemaDiff(oldSchema, newSchema) {
	      var diff = {
	          del: [],
	          add: [],
	          change: [],
	      };
	      var table;
	      for (table in oldSchema) {
	          if (!newSchema[table])
	              diff.del.push(table);
	      }
	      for (table in newSchema) {
	          var oldDef = oldSchema[table], newDef = newSchema[table];
	          if (!oldDef) {
	              diff.add.push([table, newDef]);
	          }
	          else {
	              var change = {
	                  name: table,
	                  def: newDef,
	                  recreate: false,
	                  del: [],
	                  add: [],
	                  change: [],
	              };
	              if (
	              '' + (oldDef.primKey.keyPath || '') !==
	                  '' + (newDef.primKey.keyPath || '') ||
	                  oldDef.primKey.auto !== newDef.primKey.auto) {
	                  change.recreate = true;
	                  diff.change.push(change);
	              }
	              else {
	                  var oldIndexes = oldDef.idxByName;
	                  var newIndexes = newDef.idxByName;
	                  var idxName = void 0;
	                  for (idxName in oldIndexes) {
	                      if (!newIndexes[idxName])
	                          change.del.push(idxName);
	                  }
	                  for (idxName in newIndexes) {
	                      var oldIdx = oldIndexes[idxName], newIdx = newIndexes[idxName];
	                      if (!oldIdx)
	                          change.add.push(newIdx);
	                      else if (oldIdx.src !== newIdx.src)
	                          change.change.push(newIdx);
	                  }
	                  if (change.del.length > 0 ||
	                      change.add.length > 0 ||
	                      change.change.length > 0) {
	                      diff.change.push(change);
	                  }
	              }
	          }
	      }
	      return diff;
	  }
	  function createTable(idbtrans, tableName, primKey, indexes) {
	      var store = idbtrans.db.createObjectStore(tableName, primKey.keyPath
	          ? { keyPath: primKey.keyPath, autoIncrement: primKey.auto }
	          : { autoIncrement: primKey.auto });
	      indexes.forEach(function (idx) { return addIndex(store, idx); });
	      return store;
	  }
	  function createMissingTables(newSchema, idbtrans) {
	      keys(newSchema).forEach(function (tableName) {
	          if (!idbtrans.db.objectStoreNames.contains(tableName)) {
	              if (debug)
	                  console.debug('Dexie: Creating missing table', tableName);
	              createTable(idbtrans, tableName, newSchema[tableName].primKey, newSchema[tableName].indexes);
	          }
	      });
	  }
	  function deleteRemovedTables(newSchema, idbtrans) {
	      [].slice
	          .call(idbtrans.db.objectStoreNames)
	          .forEach(function (storeName) {
	          return newSchema[storeName] == null && idbtrans.db.deleteObjectStore(storeName);
	      });
	  }
	  function addIndex(store, idx) {
	      store.createIndex(idx.name, idx.keyPath, {
	          unique: idx.unique,
	          multiEntry: idx.multi,
	      });
	  }
	  function buildGlobalSchema(db, idbdb, tmpTrans) {
	      var globalSchema = {};
	      var dbStoreNames = slice(idbdb.objectStoreNames, 0);
	      dbStoreNames.forEach(function (storeName) {
	          var store = tmpTrans.objectStore(storeName);
	          var keyPath = store.keyPath;
	          var primKey = createIndexSpec(nameFromKeyPath(keyPath), keyPath || '', true, false, !!store.autoIncrement, keyPath && typeof keyPath !== 'string', true);
	          var indexes = [];
	          for (var j = 0; j < store.indexNames.length; ++j) {
	              var idbindex = store.index(store.indexNames[j]);
	              keyPath = idbindex.keyPath;
	              var index = createIndexSpec(idbindex.name, keyPath, !!idbindex.unique, !!idbindex.multiEntry, false, keyPath && typeof keyPath !== 'string', false);
	              indexes.push(index);
	          }
	          globalSchema[storeName] = createTableSchema(storeName, primKey, indexes);
	      });
	      return globalSchema;
	  }
	  function readGlobalSchema(db, idbdb, tmpTrans) {
	      db.verno = idbdb.version / 10;
	      var globalSchema = (db._dbSchema = buildGlobalSchema(db, idbdb, tmpTrans));
	      db._storeNames = slice(idbdb.objectStoreNames, 0);
	      setApiOnPlace(db, [db._allTables], keys(globalSchema), globalSchema);
	  }
	  function verifyInstalledSchema(db, tmpTrans) {
	      var installedSchema = buildGlobalSchema(db, db.idbdb, tmpTrans);
	      var diff = getSchemaDiff(installedSchema, db._dbSchema);
	      return !(diff.add.length ||
	          diff.change.some(function (ch) { return ch.add.length || ch.change.length; }));
	  }
	  function adjustToExistingIndexNames(db, schema, idbtrans) {
	      var storeNames = idbtrans.db.objectStoreNames;
	      for (var i = 0; i < storeNames.length; ++i) {
	          var storeName = storeNames[i];
	          var store = idbtrans.objectStore(storeName);
	          db._hasGetAll = 'getAll' in store;
	          for (var j = 0; j < store.indexNames.length; ++j) {
	              var indexName = store.indexNames[j];
	              var keyPath = store.index(indexName).keyPath;
	              var dexieName = typeof keyPath === 'string'
	                  ? keyPath
	                  : '[' + slice(keyPath).join('+') + ']';
	              if (schema[storeName]) {
	                  var indexSpec = schema[storeName].idxByName[dexieName];
	                  if (indexSpec) {
	                      indexSpec.name = indexName;
	                      delete schema[storeName].idxByName[dexieName];
	                      schema[storeName].idxByName[indexName] = indexSpec;
	                  }
	              }
	          }
	      }
	      if (typeof navigator !== 'undefined' &&
	          /Safari/.test(navigator.userAgent) &&
	          !/(Chrome\/|Edge\/)/.test(navigator.userAgent) &&
	          _global.WorkerGlobalScope &&
	          _global instanceof _global.WorkerGlobalScope &&
	          [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604) {
	          db._hasGetAll = false;
	      }
	  }
	  function parseIndexSyntax(primKeyAndIndexes) {
	      return primKeyAndIndexes.split(',').map(function (index, indexNum) {
	          var _a;
	          var typeSplit = index.split(':');
	          var type = (_a = typeSplit[1]) === null || _a === void 0 ? void 0 : _a.trim();
	          index = typeSplit[0].trim();
	          var name = index.replace(/([&*]|\+\+)/g, '');
	          var keyPath = /^\[/.test(name)
	              ? name.match(/^\[(.*)\]$/)[1].split('+')
	              : name;
	          return createIndexSpec(name, keyPath || null, /\&/.test(index), /\*/.test(index), /\+\+/.test(index), isArray(keyPath), indexNum === 0, type);
	      });
	  }

	  var Version =  (function () {
	      function Version() {
	      }
	      Version.prototype._createTableSchema = function (name, primKey, indexes) {
	          return createTableSchema(name, primKey, indexes);
	      };
	      Version.prototype._parseIndexSyntax = function (primKeyAndIndexes) {
	          return parseIndexSyntax(primKeyAndIndexes);
	      };
	      Version.prototype._parseStoresSpec = function (stores, outSchema) {
	          var _this = this;
	          keys(stores).forEach(function (tableName) {
	              if (stores[tableName] !== null) {
	                  var indexes = _this._parseIndexSyntax(stores[tableName]);
	                  var primKey = indexes.shift();
	                  if (!primKey) {
	                      throw new exceptions.Schema('Invalid schema for table ' + tableName + ': ' + stores[tableName]);
	                  }
	                  primKey.unique = true;
	                  if (primKey.multi)
	                      throw new exceptions.Schema('Primary key cannot be multiEntry*');
	                  indexes.forEach(function (idx) {
	                      if (idx.auto)
	                          throw new exceptions.Schema('Only primary key can be marked as autoIncrement (++)');
	                      if (!idx.keyPath)
	                          throw new exceptions.Schema('Index must have a name and cannot be an empty string');
	                  });
	                  var tblSchema = _this._createTableSchema(tableName, primKey, indexes);
	                  outSchema[tableName] = tblSchema;
	              }
	          });
	      };
	      Version.prototype.stores = function (stores) {
	          var db = this.db;
	          this._cfg.storesSource = this._cfg.storesSource
	              ? extend(this._cfg.storesSource, stores)
	              : stores;
	          var versions = db._versions;
	          var storesSpec = {};
	          var dbschema = {};
	          versions.forEach(function (version) {
	              extend(storesSpec, version._cfg.storesSource);
	              dbschema = version._cfg.dbschema = {};
	              version._parseStoresSpec(storesSpec, dbschema);
	          });
	          db._dbSchema = dbschema;
	          removeTablesApi(db, [db._allTables, db, db.Transaction.prototype]);
	          setApiOnPlace(db, [db._allTables, db, db.Transaction.prototype, this._cfg.tables], keys(dbschema), dbschema);
	          db._storeNames = keys(dbschema);
	          return this;
	      };
	      Version.prototype.upgrade = function (upgradeFunction) {
	          this._cfg.contentUpgrade = promisableChain(this._cfg.contentUpgrade || nop, upgradeFunction);
	          return this;
	      };
	      return Version;
	  }());

	  function createVersionConstructor(db) {
	      return makeClassConstructor(Version.prototype, function Version(versionNumber) {
	          this.db = db;
	          this._cfg = {
	              version: versionNumber,
	              storesSource: null,
	              dbschema: {},
	              tables: {},
	              contentUpgrade: null,
	          };
	      });
	  }

	  var connections = createConnectionsManager();
	  function createConnectionsManager() {
	      if (typeof FinalizationRegistry !== 'undefined' &&
	          typeof WeakRef !== 'undefined') {
	          var _refs_1 = new Set();
	          var _registry_1 = new FinalizationRegistry(function (ref) {
	              _refs_1.delete(ref);
	          });
	          var toArray = function () {
	              return Array.from(_refs_1)
	                  .map(function (ref) { return ref.deref(); })
	                  .filter(function (db) { return db !== undefined; });
	          };
	          var add = function (db) {
	              var ref = new WeakRef(db._novip);
	              _refs_1.add(ref);
	              _registry_1.register(db._novip, ref, ref);
	              if (_refs_1.size > db._options.maxConnections) {
	                  var oldestRef = _refs_1.values().next().value;
	                  _refs_1.delete(oldestRef);
	                  _registry_1.unregister(oldestRef);
	              }
	          };
	          var remove = function (db) {
	              if (!db)
	                  return;
	              var iterator = _refs_1.values();
	              var result = iterator.next();
	              while (!result.done) {
	                  var ref = result.value;
	                  if (ref.deref() === db._novip) {
	                      _refs_1.delete(ref);
	                      _registry_1.unregister(ref);
	                      return;
	                  }
	                  result = iterator.next();
	              }
	          };
	          return { toArray: toArray, add: add, remove: remove };
	      }
	      else {
	          var connections_1 = [];
	          var toArray = function () { return connections_1; };
	          var add = function (db) {
	              connections_1.push(db._novip);
	          };
	          var remove = function (db) {
	              if (!db)
	                  return;
	              var index = connections_1.indexOf(db._novip);
	              if (index !== -1) {
	                  connections_1.splice(index, 1);
	              }
	          };
	          return { toArray: toArray, add: add, remove: remove };
	      }
	  }

	  function getDbNamesTable(indexedDB, IDBKeyRange) {
	      var dbNamesDB = indexedDB['_dbNamesDB'];
	      if (!dbNamesDB) {
	          dbNamesDB = indexedDB['_dbNamesDB'] = new Dexie$1(DBNAMES_DB, {
	              addons: [],
	              indexedDB: indexedDB,
	              IDBKeyRange: IDBKeyRange,
	          });
	          dbNamesDB.version(1).stores({ dbnames: 'name' });
	      }
	      return dbNamesDB.table('dbnames');
	  }
	  function hasDatabasesNative(indexedDB) {
	      return indexedDB && typeof indexedDB.databases === 'function';
	  }
	  function getDatabaseNames(_a) {
	      var indexedDB = _a.indexedDB, IDBKeyRange = _a.IDBKeyRange;
	      return hasDatabasesNative(indexedDB)
	          ? Promise.resolve(indexedDB.databases()).then(function (infos) {
	              return infos
	                  .map(function (info) { return info.name; })
	                  .filter(function (name) { return name !== DBNAMES_DB; });
	          })
	          : getDbNamesTable(indexedDB, IDBKeyRange).toCollection().primaryKeys();
	  }
	  function _onDatabaseCreated(_a, name) {
	      var indexedDB = _a.indexedDB, IDBKeyRange = _a.IDBKeyRange;
	      !hasDatabasesNative(indexedDB) &&
	          name !== DBNAMES_DB &&
	          getDbNamesTable(indexedDB, IDBKeyRange).put({ name: name }).catch(nop);
	  }
	  function _onDatabaseDeleted(_a, name) {
	      var indexedDB = _a.indexedDB, IDBKeyRange = _a.IDBKeyRange;
	      !hasDatabasesNative(indexedDB) &&
	          name !== DBNAMES_DB &&
	          getDbNamesTable(indexedDB, IDBKeyRange).delete(name).catch(nop);
	  }

	  function vip(fn) {
	      return newScope(function () {
	          PSD.letThrough = true;
	          return fn();
	      });
	  }

	  function idbReady() {
	      var isSafari = !navigator.userAgentData &&
	          /Safari\//.test(navigator.userAgent) &&
	          !/Chrom(e|ium)\//.test(navigator.userAgent);
	      if (!isSafari || !indexedDB.databases)
	          return Promise.resolve();
	      var intervalId;
	      return new Promise(function (resolve) {
	          var tryIdb = function () { return indexedDB.databases().finally(resolve); };
	          intervalId = setInterval(tryIdb, 100);
	          tryIdb();
	      }).finally(function () { return clearInterval(intervalId); });
	  }

	  var _a;
	  function isEmptyRange(node) {
	      return !('from' in node);
	  }
	  var RangeSet = function (fromOrTree, to) {
	      if (this) {
	          extend(this, arguments.length
	              ? { d: 1, from: fromOrTree, to: arguments.length > 1 ? to : fromOrTree }
	              : { d: 0 });
	      }
	      else {
	          var rv = new RangeSet();
	          if (fromOrTree && 'd' in fromOrTree) {
	              extend(rv, fromOrTree);
	          }
	          return rv;
	      }
	  };
	  props(RangeSet.prototype, (_a = {
	          add: function (rangeSet) {
	              mergeRanges(this, rangeSet);
	              return this;
	          },
	          addKey: function (key) {
	              addRange(this, key, key);
	              return this;
	          },
	          addKeys: function (keys) {
	              var _this = this;
	              keys.forEach(function (key) { return addRange(_this, key, key); });
	              return this;
	          },
	          hasKey: function (key) {
	              var node = getRangeSetIterator(this).next(key).value;
	              return node && cmp(node.from, key) <= 0 && cmp(node.to, key) >= 0;
	          }
	      },
	      _a[iteratorSymbol] = function () {
	          return getRangeSetIterator(this);
	      },
	      _a));
	  function addRange(target, from, to) {
	      var diff = cmp(from, to);
	      if (isNaN(diff))
	          return;
	      if (diff > 0)
	          throw RangeError();
	      if (isEmptyRange(target))
	          return extend(target, { from: from, to: to, d: 1 });
	      var left = target.l;
	      var right = target.r;
	      if (cmp(to, target.from) < 0) {
	          left
	              ? addRange(left, from, to)
	              : (target.l = { from: from, to: to, d: 1, l: null, r: null });
	          return rebalance(target);
	      }
	      if (cmp(from, target.to) > 0) {
	          right
	              ? addRange(right, from, to)
	              : (target.r = { from: from, to: to, d: 1, l: null, r: null });
	          return rebalance(target);
	      }
	      if (cmp(from, target.from) < 0) {
	          target.from = from;
	          target.l = null;
	          target.d = right ? right.d + 1 : 1;
	      }
	      if (cmp(to, target.to) > 0) {
	          target.to = to;
	          target.r = null;
	          target.d = target.l ? target.l.d + 1 : 1;
	      }
	      var rightWasCutOff = !target.r;
	      if (left && !target.l) {
	          mergeRanges(target, left);
	      }
	      if (right && rightWasCutOff) {
	          mergeRanges(target, right);
	      }
	  }
	  function mergeRanges(target, newSet) {
	      function _addRangeSet(target, _a) {
	          var from = _a.from, to = _a.to, l = _a.l, r = _a.r;
	          addRange(target, from, to);
	          if (l)
	              _addRangeSet(target, l);
	          if (r)
	              _addRangeSet(target, r);
	      }
	      if (!isEmptyRange(newSet))
	          _addRangeSet(target, newSet);
	  }
	  function rangesOverlap(rangeSet1, rangeSet2) {
	      var i1 = getRangeSetIterator(rangeSet2);
	      var nextResult1 = i1.next();
	      if (nextResult1.done)
	          return false;
	      var a = nextResult1.value;
	      var i2 = getRangeSetIterator(rangeSet1);
	      var nextResult2 = i2.next(a.from);
	      var b = nextResult2.value;
	      while (!nextResult1.done && !nextResult2.done) {
	          if (cmp(b.from, a.to) <= 0 && cmp(b.to, a.from) >= 0)
	              return true;
	          cmp(a.from, b.from) < 0
	              ? (a = (nextResult1 = i1.next(b.from)).value)
	              : (b = (nextResult2 = i2.next(a.from)).value);
	      }
	      return false;
	  }
	  function getRangeSetIterator(node) {
	      var state = isEmptyRange(node)
	          ? null
	          : { s: 0, n: node };
	      return {
	          next: function (key) {
	              var keyProvided = arguments.length > 0;
	              while (state) {
	                  switch (state.s) {
	                      case 0:
	                          state.s = 1;
	                          if (keyProvided) {
	                              while (state.n.l && cmp(key, state.n.from) < 0)
	                                  state = { up: state, n: state.n.l, s: 1 };
	                          }
	                          else {
	                              while (state.n.l)
	                                  state = { up: state, n: state.n.l, s: 1 };
	                          }
	                      case 1:
	                          state.s = 2;
	                          if (!keyProvided || cmp(key, state.n.to) <= 0)
	                              return { value: state.n, done: false };
	                      case 2:
	                          if (state.n.r) {
	                              state.s = 3;
	                              state = { up: state, n: state.n.r, s: 0 };
	                              continue;
	                          }
	                      case 3:
	                          state = state.up;
	                  }
	              }
	              return { done: true };
	          },
	      };
	  }
	  function rebalance(target) {
	      var _a, _b;
	      var diff = (((_a = target.r) === null || _a === void 0 ? void 0 : _a.d) || 0) - (((_b = target.l) === null || _b === void 0 ? void 0 : _b.d) || 0);
	      var r = diff > 1 ? 'r' : diff < -1 ? 'l' : '';
	      if (r) {
	          var l = r === 'r' ? 'l' : 'r';
	          var rootClone = __assign({}, target);
	          var oldRootRight = target[r];
	          target.from = oldRootRight.from;
	          target.to = oldRootRight.to;
	          target[r] = oldRootRight[r];
	          rootClone[r] = oldRootRight[l];
	          target[l] = rootClone;
	          rootClone.d = computeDepth(rootClone);
	      }
	      target.d = computeDepth(target);
	  }
	  function computeDepth(_a) {
	      var r = _a.r, l = _a.l;
	      return (r ? (l ? Math.max(r.d, l.d) : r.d) : l ? l.d : 0) + 1;
	  }

	  function extendObservabilitySet(target, newSet) {
	      keys(newSet).forEach(function (part) {
	          if (target[part])
	              mergeRanges(target[part], newSet[part]);
	          else
	              target[part] = cloneSimpleObjectTree(newSet[part]);
	      });
	      return target;
	  }

	  function obsSetsOverlap(os1, os2) {
	      return (os1.all ||
	          os2.all ||
	          Object.keys(os1).some(function (key) { return os2[key] && rangesOverlap(os2[key], os1[key]); }));
	  }

	  var cache = {};

	  var unsignaledParts = {};
	  var isTaskEnqueued = false;
	  function signalSubscribersLazily(part, optimistic) {
	      extendObservabilitySet(unsignaledParts, part);
	      if (!isTaskEnqueued) {
	          isTaskEnqueued = true;
	          setTimeout(function () {
	              isTaskEnqueued = false;
	              var parts = unsignaledParts;
	              unsignaledParts = {};
	              signalSubscribersNow(parts, false);
	          }, 0);
	      }
	  }
	  function signalSubscribersNow(updatedParts, deleteAffectedCacheEntries) {
	      if (deleteAffectedCacheEntries === void 0) { deleteAffectedCacheEntries = false; }
	      var queriesToSignal = new Set();
	      if (updatedParts.all) {
	          for (var _i = 0, _a = Object.values(cache); _i < _a.length; _i++) {
	              var tblCache = _a[_i];
	              collectTableSubscribers(tblCache, updatedParts, queriesToSignal, deleteAffectedCacheEntries);
	          }
	      }
	      else {
	          for (var key in updatedParts) {
	              var parts = /^idb\:\/\/(.*)\/(.*)\//.exec(key);
	              if (parts) {
	                  var dbName = parts[1], tableName = parts[2];
	                  var tblCache = cache["idb://".concat(dbName, "/").concat(tableName)];
	                  if (tblCache)
	                      collectTableSubscribers(tblCache, updatedParts, queriesToSignal, deleteAffectedCacheEntries);
	              }
	          }
	      }
	      queriesToSignal.forEach(function (requery) { return requery(); });
	  }
	  function collectTableSubscribers(tblCache, updatedParts, outQueriesToSignal, deleteAffectedCacheEntries) {
	      var updatedEntryLists = [];
	      for (var _i = 0, _a = Object.entries(tblCache.queries.query); _i < _a.length; _i++) {
	          var _b = _a[_i], indexName = _b[0], entries = _b[1];
	          var filteredEntries = [];
	          for (var _c = 0, entries_1 = entries; _c < entries_1.length; _c++) {
	              var entry = entries_1[_c];
	              if (obsSetsOverlap(updatedParts, entry.obsSet)) {
	                  entry.subscribers.forEach(function (requery) { return outQueriesToSignal.add(requery); });
	              }
	              else if (deleteAffectedCacheEntries) {
	                  filteredEntries.push(entry);
	              }
	          }
	          if (deleteAffectedCacheEntries)
	              updatedEntryLists.push([indexName, filteredEntries]);
	      }
	      if (deleteAffectedCacheEntries) {
	          for (var _d = 0, updatedEntryLists_1 = updatedEntryLists; _d < updatedEntryLists_1.length; _d++) {
	              var _e = updatedEntryLists_1[_d], indexName = _e[0], filteredEntries = _e[1];
	              tblCache.queries.query[indexName] = filteredEntries;
	          }
	      }
	  }

	  function dexieOpen(db) {
	      var state = db._state;
	      var indexedDB = db._deps.indexedDB;
	      if (state.isBeingOpened || db.idbdb)
	          return state.dbReadyPromise.then(function () {
	              return state.dbOpenError ? rejection(state.dbOpenError) : db;
	          });
	      state.isBeingOpened = true;
	      state.dbOpenError = null;
	      state.openComplete = false;
	      var openCanceller = state.openCanceller;
	      var nativeVerToOpen = Math.round(db.verno * 10);
	      var schemaPatchMode = false;
	      function throwIfCancelled() {
	          if (state.openCanceller !== openCanceller)
	              throw new exceptions.DatabaseClosed('db.open() was cancelled');
	      }
	      var resolveDbReady = state.dbReadyResolve,
	      upgradeTransaction = null, wasCreated = false;
	      var tryOpenDB = function () {
	          return new DexiePromise(function (resolve, reject) {
	              throwIfCancelled();
	              if (!indexedDB)
	                  throw new exceptions.MissingAPI();
	              var dbName = db.name;
	              var req = state.autoSchema || !nativeVerToOpen
	                  ? indexedDB.open(dbName)
	                  : indexedDB.open(dbName, nativeVerToOpen);
	              if (!req)
	                  throw new exceptions.MissingAPI();
	              req.onerror = eventRejectHandler(reject);
	              req.onblocked = wrap(db._fireOnBlocked);
	              req.onupgradeneeded = wrap(function (e) {
	                  upgradeTransaction = req.transaction;
	                  if (state.autoSchema && !db._options.allowEmptyDB) {
	                      req.onerror = preventDefault;
	                      upgradeTransaction.abort();
	                      req.result.close();
	                      var delreq = indexedDB.deleteDatabase(dbName);
	                      delreq.onsuccess = delreq.onerror = wrap(function () {
	                          reject(new exceptions.NoSuchDatabase("Database ".concat(dbName, " doesnt exist")));
	                      });
	                  }
	                  else {
	                      upgradeTransaction.onerror = eventRejectHandler(reject);
	                      var oldVer = e.oldVersion > Math.pow(2, 62) ? 0 : e.oldVersion;
	                      wasCreated = oldVer < 1;
	                      db.idbdb = req.result;
	                      if (schemaPatchMode) {
	                          patchCurrentVersion(db, upgradeTransaction);
	                      }
	                      runUpgraders(db, oldVer / 10, upgradeTransaction, reject);
	                  }
	              }, reject);
	              req.onsuccess = wrap(function () {
	                  upgradeTransaction = null;
	                  var idbdb = (db.idbdb = req.result);
	                  var objectStoreNames = slice(idbdb.objectStoreNames);
	                  if (objectStoreNames.length > 0)
	                      try {
	                          var tmpTrans = idbdb.transaction(safariMultiStoreFix(objectStoreNames), 'readonly');
	                          if (state.autoSchema)
	                              readGlobalSchema(db, idbdb, tmpTrans);
	                          else {
	                              adjustToExistingIndexNames(db, db._dbSchema, tmpTrans);
	                              if (!verifyInstalledSchema(db, tmpTrans) && !schemaPatchMode) {
	                                  console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this.");
	                                  idbdb.close();
	                                  nativeVerToOpen = idbdb.version + 1;
	                                  schemaPatchMode = true;
	                                  return resolve(tryOpenDB());
	                              }
	                          }
	                          generateMiddlewareStacks(db, tmpTrans);
	                      }
	                      catch (e) {
	                      }
	                  connections.add(db);
	                  idbdb.onversionchange = wrap(function (ev) {
	                      state.vcFired = true;
	                      db.on('versionchange').fire(ev);
	                  });
	                  idbdb.onclose = wrap(function () {
	                      db.close({ disableAutoOpen: false });
	                  });
	                  if (wasCreated)
	                      _onDatabaseCreated(db._deps, dbName);
	                  resolve();
	              }, reject);
	          }).catch(function (err) {
	              switch (err === null || err === void 0 ? void 0 : err.name) {
	                  case 'UnknownError':
	                      if (state.PR1398_maxLoop > 0) {
	                          state.PR1398_maxLoop--;
	                          console.warn('Dexie: Workaround for Chrome UnknownError on open()');
	                          return tryOpenDB();
	                      }
	                      break;
	                  case 'VersionError':
	                      if (nativeVerToOpen > 0) {
	                          nativeVerToOpen = 0;
	                          return tryOpenDB();
	                      }
	                      break;
	              }
	              return DexiePromise.reject(err);
	          });
	      };
	      return DexiePromise.race([
	          openCanceller,
	          (typeof navigator === 'undefined'
	              ? DexiePromise.resolve()
	              : idbReady()).then(tryOpenDB),
	      ])
	          .then(function () {
	          throwIfCancelled();
	          state.onReadyBeingFired = [];
	          return DexiePromise.resolve(vip(function () { return db.on.ready.fire(db.vip); })).then(function fireRemainders() {
	              if (state.onReadyBeingFired.length > 0) {
	                  var remainders_1 = state.onReadyBeingFired.reduce(promisableChain, nop);
	                  state.onReadyBeingFired = [];
	                  return DexiePromise.resolve(vip(function () { return remainders_1(db.vip); })).then(fireRemainders);
	              }
	          });
	      })
	          .finally(function () {
	          if (state.openCanceller === openCanceller) {
	              state.onReadyBeingFired = null;
	              state.isBeingOpened = false;
	          }
	      })
	          .catch(function (err) {
	          state.dbOpenError = err;
	          try {
	              upgradeTransaction && upgradeTransaction.abort();
	          }
	          catch (_a) { }
	          if (openCanceller === state.openCanceller) {
	              db._close();
	          }
	          return rejection(err);
	      })
	          .finally(function () {
	          state.openComplete = true;
	          resolveDbReady();
	      })
	          .then(function () {
	          if (wasCreated) {
	              var everything_1 = {};
	              db.tables.forEach(function (table) {
	                  table.schema.indexes.forEach(function (idx) {
	                      if (idx.name)
	                          everything_1["idb://".concat(db.name, "/").concat(table.name, "/").concat(idx.name)] =
	                              new RangeSet(-Infinity, [[[]]]);
	                  });
	                  everything_1["idb://".concat(db.name, "/").concat(table.name, "/")] = everything_1["idb://".concat(db.name, "/").concat(table.name, "/:dels")] = new RangeSet(-Infinity, [[[]]]);
	              });
	              globalEvents(DEXIE_STORAGE_MUTATED_EVENT_NAME).fire(everything_1);
	              signalSubscribersNow(everything_1, true);
	          }
	          return db;
	      });
	  }

	  function awaitIterator(iterator) {
	      var callNext = function (result) { return iterator.next(result); }, doThrow = function (error) { return iterator.throw(error); }, onSuccess = step(callNext), onError = step(doThrow);
	      function step(getNext) {
	          return function (val) {
	              var next = getNext(val), value = next.value;
	              return next.done
	                  ? value
	                  : !value || typeof value.then !== 'function'
	                      ? isArray(value)
	                          ? Promise.all(value).then(onSuccess, onError)
	                          : onSuccess(value)
	                      : value.then(onSuccess, onError);
	          };
	      }
	      return step(callNext)();
	  }

	  function extractTransactionArgs(mode, _tableArgs_, scopeFunc) {
	      var i = arguments.length;
	      if (i < 2)
	          throw new exceptions.InvalidArgument('Too few arguments');
	      var args = new Array(i - 1);
	      while (--i)
	          args[i - 1] = arguments[i];
	      scopeFunc = args.pop();
	      var tables = flatten(args);
	      return [mode, tables, scopeFunc];
	  }
	  function enterTransactionScope(db, mode, storeNames, parentTransaction, scopeFunc) {
	      return DexiePromise.resolve().then(function () {
	          var transless = PSD.transless || PSD;
	          var trans = db._createTransaction(mode, storeNames, db._dbSchema, parentTransaction);
	          trans.explicit = true;
	          var zoneProps = {
	              trans: trans,
	              transless: transless,
	          };
	          if (parentTransaction) {
	              trans.idbtrans = parentTransaction.idbtrans;
	          }
	          else {
	              try {
	                  trans.create();
	                  trans.idbtrans._explicit = true;
	                  db._state.PR1398_maxLoop = 3;
	              }
	              catch (ex) {
	                  if (ex.name === errnames.InvalidState &&
	                      db.isOpen() &&
	                      --db._state.PR1398_maxLoop > 0) {
	                      console.warn('Dexie: Need to reopen db');
	                      db.close({ disableAutoOpen: false });
	                      return db
	                          .open()
	                          .then(function () {
	                          return enterTransactionScope(db, mode, storeNames, null, scopeFunc);
	                      });
	                  }
	                  return rejection(ex);
	              }
	          }
	          var scopeFuncIsAsync = isAsyncFunction(scopeFunc);
	          if (scopeFuncIsAsync) {
	              incrementExpectedAwaits();
	          }
	          var returnValue;
	          var promiseFollowed = DexiePromise.follow(function () {
	              returnValue = scopeFunc.call(trans, trans);
	              if (returnValue) {
	                  if (scopeFuncIsAsync) {
	                      var decrementor = decrementExpectedAwaits.bind(null, null);
	                      returnValue.then(decrementor, decrementor);
	                  }
	                  else if (typeof returnValue.next === 'function' &&
	                      typeof returnValue.throw === 'function') {
	                      returnValue = awaitIterator(returnValue);
	                  }
	              }
	          }, zoneProps);
	          return (returnValue && typeof returnValue.then === 'function'
	              ?
	                  DexiePromise.resolve(returnValue).then(function (x) {
	                      return trans.active
	                          ? x
	                          : rejection(new exceptions.PrematureCommit('Transaction committed too early. See http://bit.ly/2kdckMn'));
	                  })
	              :
	                  promiseFollowed.then(function () { return returnValue; }))
	              .then(function (x) {
	              if (parentTransaction)
	                  trans._resolve();
	              return trans._completion.then(function () { return x; });
	          })
	              .catch(function (e) {
	              trans._reject(e);
	              return rejection(e);
	          });
	      });
	  }

	  function pad(a, value, count) {
	      var result = isArray(a) ? a.slice() : [a];
	      for (var i = 0; i < count; ++i)
	          result.push(value);
	      return result;
	  }
	  function createVirtualIndexMiddleware(down) {
	      return __assign(__assign({}, down), { table: function (tableName) {
	              var table = down.table(tableName);
	              var schema = table.schema;
	              var indexLookup = {};
	              var allVirtualIndexes = [];
	              function addVirtualIndexes(keyPath, keyTail, lowLevelIndex) {
	                  var keyPathAlias = getKeyPathAlias(keyPath);
	                  var indexList = (indexLookup[keyPathAlias] =
	                      indexLookup[keyPathAlias] || []);
	                  var keyLength = keyPath == null
	                      ? 0
	                      : typeof keyPath === 'string'
	                          ? 1
	                          : keyPath.length;
	                  var isVirtual = keyTail > 0;
	                  var virtualIndex = __assign(__assign({}, lowLevelIndex), { name: isVirtual
	                          ? "".concat(keyPathAlias, "(virtual-from:").concat(lowLevelIndex.name, ")")
	                          : lowLevelIndex.name, lowLevelIndex: lowLevelIndex, isVirtual: isVirtual, keyTail: keyTail, keyLength: keyLength, extractKey: getKeyExtractor(keyPath), unique: !isVirtual && lowLevelIndex.unique });
	                  indexList.push(virtualIndex);
	                  if (!virtualIndex.isPrimaryKey) {
	                      allVirtualIndexes.push(virtualIndex);
	                  }
	                  if (keyLength > 1) {
	                      var virtualKeyPath = keyLength === 2
	                          ? keyPath[0]
	                          : keyPath.slice(0, keyLength - 1);
	                      addVirtualIndexes(virtualKeyPath, keyTail + 1, lowLevelIndex);
	                  }
	                  indexList.sort(function (a, b) { return a.keyTail - b.keyTail; });
	                  return virtualIndex;
	              }
	              var primaryKey = addVirtualIndexes(schema.primaryKey.keyPath, 0, schema.primaryKey);
	              indexLookup[':id'] = [primaryKey];
	              for (var _i = 0, _a = schema.indexes; _i < _a.length; _i++) {
	                  var index = _a[_i];
	                  addVirtualIndexes(index.keyPath, 0, index);
	              }
	              function findBestIndex(keyPath) {
	                  var result = indexLookup[getKeyPathAlias(keyPath)];
	                  return result && result[0];
	              }
	              function translateRange(range, keyTail) {
	                  return {
	                      type: range.type === 1
	                          ? 2
	                          : range.type,
	                      lower: pad(range.lower, range.lowerOpen ? down.MAX_KEY : down.MIN_KEY, keyTail),
	                      lowerOpen: true,
	                      upper: pad(range.upper, range.upperOpen ? down.MIN_KEY : down.MAX_KEY, keyTail),
	                      upperOpen: true,
	                  };
	              }
	              function translateRequest(req) {
	                  var index = req.query.index;
	                  return index.isVirtual
	                      ? __assign(__assign({}, req), { query: {
	                              index: index.lowLevelIndex,
	                              range: translateRange(req.query.range, index.keyTail),
	                          } }) : req;
	              }
	              var result = __assign(__assign({}, table), { schema: __assign(__assign({}, schema), { primaryKey: primaryKey, indexes: allVirtualIndexes, getIndexByKeyPath: findBestIndex }), count: function (req) {
	                      return table.count(translateRequest(req));
	                  }, query: function (req) {
	                      return table.query(translateRequest(req));
	                  }, openCursor: function (req) {
	                      var _a = req.query
	                          .index, keyTail = _a.keyTail, isVirtual = _a.isVirtual, keyLength = _a.keyLength;
	                      if (!isVirtual)
	                          return table.openCursor(req);
	                      function createVirtualCursor(cursor) {
	                          function _continue(key) {
	                              key != null
	                                  ? cursor.continue(pad(key, req.reverse ? down.MAX_KEY : down.MIN_KEY, keyTail))
	                                  : req.unique
	                                      ? cursor.continue(cursor.key
	                                          .slice(0, keyLength)
	                                          .concat(req.reverse ? down.MIN_KEY : down.MAX_KEY, keyTail))
	                                      : cursor.continue();
	                          }
	                          var virtualCursor = Object.create(cursor, {
	                              continue: { value: _continue },
	                              continuePrimaryKey: {
	                                  value: function (key, primaryKey) {
	                                      cursor.continuePrimaryKey(pad(key, down.MAX_KEY, keyTail), primaryKey);
	                                  },
	                              },
	                              primaryKey: {
	                                  get: function () {
	                                      return cursor.primaryKey;
	                                  },
	                              },
	                              key: {
	                                  get: function () {
	                                      var key = cursor.key;
	                                      return keyLength === 1
	                                          ? key[0]
	                                          : key.slice(0, keyLength);
	                                  },
	                              },
	                              value: {
	                                  get: function () {
	                                      return cursor.value;
	                                  },
	                              },
	                          });
	                          return virtualCursor;
	                      }
	                      return table
	                          .openCursor(translateRequest(req))
	                          .then(function (cursor) { return cursor && createVirtualCursor(cursor); });
	                  } });
	              return result;
	          } });
	  }
	  var virtualIndexMiddleware = {
	      stack: 'dbcore',
	      name: 'VirtualIndexMiddleware',
	      level: 1,
	      create: createVirtualIndexMiddleware,
	  };

	  function getObjectDiff(a, b, rv, prfx) {
	      rv = rv || {};
	      prfx = prfx || '';
	      keys(a).forEach(function (prop) {
	          if (!hasOwn(b, prop)) {
	              rv[prfx + prop] = undefined;
	          }
	          else {
	              var ap = a[prop], bp = b[prop];
	              if (typeof ap === 'object' && typeof bp === 'object' && ap && bp) {
	                  var apTypeName = toStringTag(ap);
	                  var bpTypeName = toStringTag(bp);
	                  if (apTypeName !== bpTypeName) {
	                      rv[prfx + prop] = b[prop];
	                  }
	                  else if (apTypeName === 'Object') {
	                      getObjectDiff(ap, bp, rv, prfx + prop + '.');
	                  }
	                  else if (ap !== bp) {
	                      rv[prfx + prop] = b[prop];
	                  }
	              }
	              else if (ap !== bp)
	                  rv[prfx + prop] = b[prop];
	          }
	      });
	      keys(b).forEach(function (prop) {
	          if (!hasOwn(a, prop)) {
	              rv[prfx + prop] = b[prop];
	          }
	      });
	      return rv;
	  }

	  function getEffectiveKeys(primaryKey, req) {
	      if (req.type === 'delete')
	          return req.keys;
	      return req.keys || req.values.map(primaryKey.extractKey);
	  }

	  var hooksMiddleware = {
	      stack: 'dbcore',
	      name: 'HooksMiddleware',
	      level: 2,
	      create: function (downCore) {
	          return (__assign(__assign({}, downCore), { table: function (tableName) {
	                  var downTable = downCore.table(tableName);
	                  var primaryKey = downTable.schema.primaryKey;
	                  var tableMiddleware = __assign(__assign({}, downTable), { mutate: function (req) {
	                          var dxTrans = PSD.trans;
	                          var _a = dxTrans.table(tableName).hook, deleting = _a.deleting, creating = _a.creating, updating = _a.updating;
	                          switch (req.type) {
	                              case 'add':
	                                  if (creating.fire === nop)
	                                      break;
	                                  return dxTrans._promise('readwrite', function () { return addPutOrDelete(req); }, true);
	                              case 'put':
	                                  if (creating.fire === nop && updating.fire === nop)
	                                      break;
	                                  return dxTrans._promise('readwrite', function () { return addPutOrDelete(req); }, true);
	                              case 'delete':
	                                  if (deleting.fire === nop)
	                                      break;
	                                  return dxTrans._promise('readwrite', function () { return addPutOrDelete(req); }, true);
	                              case 'deleteRange':
	                                  if (deleting.fire === nop)
	                                      break;
	                                  return dxTrans._promise('readwrite', function () { return deleteRange(req); }, true);
	                          }
	                          return downTable.mutate(req);
	                          function addPutOrDelete(req) {
	                              var dxTrans = PSD.trans;
	                              var keys = req.keys || getEffectiveKeys(primaryKey, req);
	                              if (!keys)
	                                  throw new Error('Keys missing');
	                              req =
	                                  req.type === 'add' || req.type === 'put'
	                                      ? __assign(__assign({}, req), { keys: keys }) : __assign({}, req);
	                              if (req.type !== 'delete')
	                                  req.values = __spreadArray([], req.values);
	                              if (req.keys)
	                                  req.keys = __spreadArray([], req.keys);
	                              return getExistingValues(downTable, req, keys).then(function (existingValues) {
	                                  var contexts = keys.map(function (key, i) {
	                                      var existingValue = existingValues[i];
	                                      var ctx = { onerror: null, onsuccess: null };
	                                      if (req.type === 'delete') {
	                                          deleting.fire.call(ctx, key, existingValue, dxTrans);
	                                      }
	                                      else if (req.type === 'add' ||
	                                          existingValue === undefined) {
	                                          var generatedPrimaryKey = creating.fire.call(ctx, key, req.values[i], dxTrans);
	                                          if (key == null && generatedPrimaryKey != null) {
	                                              key = generatedPrimaryKey;
	                                              req.keys[i] = key;
	                                              if (!primaryKey.outbound) {
	                                                  setByKeyPath(req.values[i], primaryKey.keyPath, key);
	                                              }
	                                          }
	                                      }
	                                      else {
	                                          var objectDiff = getObjectDiff(existingValue, req.values[i]);
	                                          var additionalChanges_1 = updating.fire.call(ctx, objectDiff, key, existingValue, dxTrans);
	                                          if (additionalChanges_1) {
	                                              var requestedValue_1 = req.values[i];
	                                              Object.keys(additionalChanges_1).forEach(function (keyPath) {
	                                                  if (hasOwn(requestedValue_1, keyPath)) {
	                                                      requestedValue_1[keyPath] =
	                                                          additionalChanges_1[keyPath];
	                                                  }
	                                                  else {
	                                                      setByKeyPath(requestedValue_1, keyPath, additionalChanges_1[keyPath]);
	                                                  }
	                                              });
	                                          }
	                                      }
	                                      return ctx;
	                                  });
	                                  return downTable
	                                      .mutate(req)
	                                      .then(function (_a) {
	                                      var failures = _a.failures, results = _a.results, numFailures = _a.numFailures, lastResult = _a.lastResult;
	                                      for (var i = 0; i < keys.length; ++i) {
	                                          var primKey = results ? results[i] : keys[i];
	                                          var ctx = contexts[i];
	                                          if (primKey == null) {
	                                              ctx.onerror && ctx.onerror(failures[i]);
	                                          }
	                                          else {
	                                              ctx.onsuccess &&
	                                                  ctx.onsuccess(req.type === 'put' && existingValues[i]
	                                                      ? req.values[i]
	                                                      : primKey
	                                                  );
	                                          }
	                                      }
	                                      return { failures: failures, results: results, numFailures: numFailures, lastResult: lastResult };
	                                  })
	                                      .catch(function (error) {
	                                      contexts.forEach(function (ctx) { return ctx.onerror && ctx.onerror(error); });
	                                      return Promise.reject(error);
	                                  });
	                              });
	                          }
	                          function deleteRange(req) {
	                              return deleteNextChunk(req.trans, req.range, 10000);
	                          }
	                          function deleteNextChunk(trans, range, limit) {
	                              return downTable
	                                  .query({
	                                  trans: trans,
	                                  values: false,
	                                  query: { index: primaryKey, range: range },
	                                  limit: limit,
	                              })
	                                  .then(function (_a) {
	                                  var result = _a.result;
	                                  return addPutOrDelete({
	                                      type: 'delete',
	                                      keys: result,
	                                      trans: trans,
	                                  }).then(function (res) {
	                                      if (res.numFailures > 0)
	                                          return Promise.reject(res.failures[0]);
	                                      if (result.length < limit) {
	                                          return {
	                                              failures: [],
	                                              numFailures: 0,
	                                              lastResult: undefined,
	                                          };
	                                      }
	                                      else {
	                                          return deleteNextChunk(trans, __assign(__assign({}, range), { lower: result[result.length - 1], lowerOpen: true }), limit);
	                                      }
	                                  });
	                              });
	                          }
	                      } });
	                  return tableMiddleware;
	              } }));
	      },
	  };
	  function getExistingValues(table, req, effectiveKeys) {
	      return req.type === 'add'
	          ? Promise.resolve([])
	          : table.getMany({
	              trans: req.trans,
	              keys: effectiveKeys,
	              cache: 'immutable',
	          });
	  }

	  function getFromTransactionCache(keys, cache, clone) {
	      try {
	          if (!cache)
	              return null;
	          if (cache.keys.length < keys.length)
	              return null;
	          var result = [];
	          for (var i = 0, j = 0; i < cache.keys.length && j < keys.length; ++i) {
	              if (cmp(cache.keys[i], keys[j]) !== 0)
	                  continue;
	              result.push(clone ? deepClone(cache.values[i]) : cache.values[i]);
	              ++j;
	          }
	          return result.length === keys.length ? result : null;
	      }
	      catch (_a) {
	          return null;
	      }
	  }
	  var cacheExistingValuesMiddleware = {
	      stack: 'dbcore',
	      level: -1,
	      create: function (core) {
	          return {
	              table: function (tableName) {
	                  var table = core.table(tableName);
	                  return __assign(__assign({}, table), { getMany: function (req) {
	                          if (!req.cache) {
	                              return table.getMany(req);
	                          }
	                          var cachedResult = getFromTransactionCache(req.keys, req.trans['_cache'], req.cache === 'clone');
	                          if (cachedResult) {
	                              return DexiePromise.resolve(cachedResult);
	                          }
	                          return table.getMany(req).then(function (res) {
	                              req.trans['_cache'] = {
	                                  keys: req.keys,
	                                  values: req.cache === 'clone' ? deepClone(res) : res,
	                              };
	                              return res;
	                          });
	                      }, mutate: function (req) {
	                          if (req.type !== 'add')
	                              req.trans['_cache'] = null;
	                          return table.mutate(req);
	                      } });
	              },
	          };
	      },
	  };

	  function isCachableContext(ctx, table) {
	      return (ctx.trans.mode === 'readonly' &&
	          !!ctx.subscr &&
	          !ctx.trans.explicit &&
	          ctx.trans.db._options.cache !== 'disabled' &&
	          !table.schema.primaryKey.outbound);
	  }

	  function isCachableRequest(type, req) {
	      switch (type) {
	          case 'query':
	              return req.values && !req.unique;
	          case 'get':
	              return false;
	          case 'getMany':
	              return false;
	          case 'count':
	              return false;
	          case 'openCursor':
	              return false;
	      }
	  }

	  var observabilityMiddleware = {
	      stack: 'dbcore',
	      level: 0,
	      name: 'Observability',
	      create: function (core) {
	          var dbName = core.schema.name;
	          var FULL_RANGE = new RangeSet(core.MIN_KEY, core.MAX_KEY);
	          return __assign(__assign({}, core), { transaction: function (stores, mode, options) {
	                  if (PSD.subscr && mode !== 'readonly') {
	                      throw new exceptions.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(PSD.querier));
	                  }
	                  return core.transaction(stores, mode, options);
	              }, table: function (tableName) {
	                  var table = core.table(tableName);
	                  var schema = table.schema;
	                  var primaryKey = schema.primaryKey, indexes = schema.indexes;
	                  var extractKey = primaryKey.extractKey, outbound = primaryKey.outbound;
	                  var indexesWithAutoIncPK = primaryKey.autoIncrement &&
	                      indexes.filter(function (index) {
	                          return index.compound &&
	                              index.keyPath.includes(primaryKey.keyPath);
	                      });
	                  var tableClone = __assign(__assign({}, table), { mutate: function (req) {
	                          var _a, _b;
	                          var trans = req.trans;
	                          var mutatedParts = req.mutatedParts || (req.mutatedParts = {});
	                          var getRangeSet = function (indexName) {
	                              var part = "idb://".concat(dbName, "/").concat(tableName, "/").concat(indexName);
	                              return (mutatedParts[part] ||
	                                  (mutatedParts[part] = new RangeSet()));
	                          };
	                          var pkRangeSet = getRangeSet('');
	                          var delsRangeSet = getRangeSet(':dels');
	                          var type = req.type;
	                          var _c = req.type === 'deleteRange'
	                              ? [req.range]
	                              : req.type === 'delete'
	                                  ? [req.keys]
	                                  : req.values.length < 50
	                                      ? [
	                                          getEffectiveKeys(primaryKey, req).filter(function (id) { return id; }),
	                                          req.values,
	                                      ]
	                                      : [], keys = _c[0], newObjs = _c[1];
	                          var oldCache = req.trans['_cache'];
	                          if (isArray(keys)) {
	                              pkRangeSet.addKeys(keys);
	                              var oldObjs = type === 'delete' || keys.length === newObjs.length
	                                  ? getFromTransactionCache(keys, oldCache)
	                                  : null;
	                              if (!oldObjs) {
	                                  delsRangeSet.addKeys(keys);
	                              }
	                              if (oldObjs || newObjs) {
	                                  trackAffectedIndexes(getRangeSet, schema, oldObjs, newObjs);
	                              }
	                          }
	                          else if (keys) {
	                              var range = {
	                                  from: (_a = keys.lower) !== null && _a !== void 0 ? _a : core.MIN_KEY,
	                                  to: (_b = keys.upper) !== null && _b !== void 0 ? _b : core.MAX_KEY,
	                              };
	                              delsRangeSet.add(range);
	                              pkRangeSet.add(range);
	                          }
	                          else {
	                              pkRangeSet.add(FULL_RANGE);
	                              delsRangeSet.add(FULL_RANGE);
	                              schema.indexes.forEach(function (idx) {
	                                  return getRangeSet(idx.name).add(FULL_RANGE);
	                              });
	                          }
	                          return table.mutate(req).then(function (res) {
	                              if (keys && (req.type === 'add' || req.type === 'put')) {
	                                  pkRangeSet.addKeys(res.results);
	                                  if (indexesWithAutoIncPK) {
	                                      indexesWithAutoIncPK.forEach(function (idx) {
	                                          var idxVals = req.values.map(function (v) { return idx.extractKey(v); });
	                                          var pkPos = idx.keyPath.findIndex(function (prop) { return prop === primaryKey.keyPath; });
	                                          for (var i = 0, len = res.results.length; i < len; ++i) {
	                                              idxVals[i][pkPos] = res.results[i];
	                                          }
	                                          getRangeSet(idx.name).addKeys(idxVals);
	                                      });
	                                  }
	                              }
	                              trans.mutatedParts = extendObservabilitySet(trans.mutatedParts || {}, mutatedParts);
	                              return res;
	                          });
	                      } });
	                  var getRange = function (_a) {
	                      var _b, _c;
	                      var _d = _a.query, index = _d.index, range = _d.range;
	                      return [
	                          index,
	                          new RangeSet((_b = range.lower) !== null && _b !== void 0 ? _b : core.MIN_KEY, (_c = range.upper) !== null && _c !== void 0 ? _c : core.MAX_KEY),
	                      ];
	                  };
	                  var readSubscribers = {
	                      get: function (req) { return [primaryKey, new RangeSet(req.key)]; },
	                      getMany: function (req) { return [primaryKey, new RangeSet().addKeys(req.keys)]; },
	                      count: getRange,
	                      query: getRange,
	                      openCursor: getRange,
	                  };
	                  keys(readSubscribers).forEach(function (method) {
	                      tableClone[method] = function (req) {
	                          var subscr = PSD.subscr;
	                          var isLiveQuery = !!subscr;
	                          var cachable = isCachableContext(PSD, table) &&
	                              isCachableRequest(method, req);
	                          var obsSet = cachable
	                              ? (req.obsSet = {})
	                              : subscr;
	                          if (isLiveQuery) {
	                              var getRangeSet = function (indexName) {
	                                  var part = "idb://".concat(dbName, "/").concat(tableName, "/").concat(indexName);
	                                  return (obsSet[part] ||
	                                      (obsSet[part] = new RangeSet()));
	                              };
	                              var pkRangeSet_1 = getRangeSet('');
	                              var delsRangeSet_1 = getRangeSet(':dels');
	                              var _a = readSubscribers[method](req), queriedIndex = _a[0], queriedRanges = _a[1];
	                              if (method === 'query' &&
	                                  queriedIndex.isPrimaryKey &&
	                                  !req.values) {
	                                  delsRangeSet_1.add(queriedRanges);
	                              }
	                              else {
	                                  getRangeSet(queriedIndex.name || '').add(queriedRanges);
	                              }
	                              if (!queriedIndex.isPrimaryKey) {
	                                  if (method === 'count') {
	                                      delsRangeSet_1.add(FULL_RANGE);
	                                  }
	                                  else {
	                                      var keysPromise_1 = method === 'query' &&
	                                          outbound &&
	                                          req.values &&
	                                          table.query(__assign(__assign({}, req), { values: false }));
	                                      return table[method].apply(this, arguments).then(function (res) {
	                                          if (method === 'query') {
	                                              if (outbound && req.values) {
	                                                  return keysPromise_1.then(function (_a) {
	                                                      var resultingKeys = _a.result;
	                                                      pkRangeSet_1.addKeys(resultingKeys);
	                                                      return res;
	                                                  });
	                                              }
	                                              var pKeys = req.values
	                                                  ? res.result.map(extractKey)
	                                                  : res.result;
	                                              if (req.values) {
	                                                  pkRangeSet_1.addKeys(pKeys);
	                                              }
	                                              else {
	                                                  delsRangeSet_1.addKeys(pKeys);
	                                              }
	                                          }
	                                          else if (method === 'openCursor') {
	                                              var cursor_1 = res;
	                                              var wantValues_1 = req
	                                                  .values;
	                                              return (cursor_1 &&
	                                                  Object.create(cursor_1, {
	                                                      key: {
	                                                          get: function () {
	                                                              delsRangeSet_1.addKey(cursor_1.primaryKey);
	                                                              return cursor_1.key;
	                                                          },
	                                                      },
	                                                      primaryKey: {
	                                                          get: function () {
	                                                              var pkey = cursor_1.primaryKey;
	                                                              delsRangeSet_1.addKey(pkey);
	                                                              return pkey;
	                                                          },
	                                                      },
	                                                      value: {
	                                                          get: function () {
	                                                              wantValues_1 &&
	                                                                  pkRangeSet_1.addKey(cursor_1.primaryKey);
	                                                              return cursor_1.value;
	                                                          },
	                                                      },
	                                                  }));
	                                          }
	                                          return res;
	                                      });
	                                  }
	                              }
	                          }
	                          return table[method].apply(this, arguments);
	                      };
	                  });
	                  return tableClone;
	              } });
	      },
	  };
	  function trackAffectedIndexes(getRangeSet, schema, oldObjs, newObjs) {
	      function addAffectedIndex(ix) {
	          var rangeSet = getRangeSet(ix.name || '');
	          function extractKey(obj) {
	              return obj != null ? ix.extractKey(obj) : null;
	          }
	          var addKeyOrKeys = function (key) {
	              return ix.multiEntry && isArray(key)
	                  ?
	                      key.forEach(function (key) { return rangeSet.addKey(key); })
	                  :
	                      rangeSet.addKey(key);
	          };
	          (oldObjs || newObjs).forEach(function (_, i) {
	              var oldKey = oldObjs && extractKey(oldObjs[i]);
	              var newKey = newObjs && extractKey(newObjs[i]);
	              if (cmp(oldKey, newKey) !== 0) {
	                  if (oldKey != null)
	                      addKeyOrKeys(oldKey);
	                  if (newKey != null)
	                      addKeyOrKeys(newKey);
	              }
	          });
	      }
	      schema.indexes.forEach(addAffectedIndex);
	  }

	  function adjustOptimisticFromFailures(tblCache, req, res) {
	      if (res.numFailures === 0)
	          return req;
	      if (req.type === 'deleteRange') {
	          return null;
	      }
	      var numBulkOps = req.keys
	          ? req.keys.length
	          : 'values' in req && req.values
	              ? req.values.length
	              : 1;
	      if (res.numFailures === numBulkOps) {
	          return null;
	      }
	      var clone = __assign({}, req);
	      if (isArray(clone.keys)) {
	          clone.keys = clone.keys.filter(function (_, i) { return !(i in res.failures); });
	      }
	      if ('values' in clone && isArray(clone.values)) {
	          clone.values = clone.values.filter(function (_, i) { return !(i in res.failures); });
	      }
	      return clone;
	  }

	  function isAboveLower(key, range) {
	      return range.lower === undefined
	          ? true
	          : range.lowerOpen
	              ? cmp(key, range.lower) > 0
	              : cmp(key, range.lower) >= 0;
	  }
	  function isBelowUpper(key, range) {
	      return range.upper === undefined
	          ? true
	          : range.upperOpen
	              ? cmp(key, range.upper) < 0
	              : cmp(key, range.upper) <= 0;
	  }
	  function isWithinRange(key, range) {
	      return isAboveLower(key, range) && isBelowUpper(key, range);
	  }

	  function applyOptimisticOps(result, req, ops, table, cacheEntry, immutable) {
	      if (!ops || ops.length === 0)
	          return result;
	      var index = req.query.index;
	      var multiEntry = index.multiEntry;
	      var queryRange = req.query.range;
	      var primaryKey = table.schema.primaryKey;
	      var extractPrimKey = primaryKey.extractKey;
	      var extractIndex = index.extractKey;
	      var extractLowLevelIndex = (index.lowLevelIndex || index).extractKey;
	      var finalResult = ops.reduce(function (result, op) {
	          var modifedResult = result;
	          var includedValues = [];
	          if (op.type === 'add' || op.type === 'put') {
	              var includedPKs = new RangeSet();
	              for (var i = op.values.length - 1; i >= 0; --i) {
	                  var value = op.values[i];
	                  var pk = extractPrimKey(value);
	                  if (includedPKs.hasKey(pk))
	                      continue;
	                  var key = extractIndex(value);
	                  if (multiEntry && isArray(key)
	                      ? key.some(function (k) { return isWithinRange(k, queryRange); })
	                      : isWithinRange(key, queryRange)) {
	                      includedPKs.addKey(pk);
	                      includedValues.push(value);
	                  }
	              }
	          }
	          switch (op.type) {
	              case 'add': {
	                  var existingKeys_1 = new RangeSet().addKeys(req.values ? result.map(function (v) { return extractPrimKey(v); }) : result);
	                  modifedResult = result.concat(req.values
	                      ? includedValues.filter(function (v) {
	                          var key = extractPrimKey(v);
	                          if (existingKeys_1.hasKey(key))
	                              return false;
	                          existingKeys_1.addKey(key);
	                          return true;
	                      })
	                      : includedValues
	                          .map(function (v) { return extractPrimKey(v); })
	                          .filter(function (k) {
	                          if (existingKeys_1.hasKey(k))
	                              return false;
	                          existingKeys_1.addKey(k);
	                          return true;
	                      }));
	                  break;
	              }
	              case 'put': {
	                  var keySet_1 = new RangeSet().addKeys(op.values.map(function (v) { return extractPrimKey(v); }));
	                  modifedResult = result
	                      .filter(
	                  function (item) { return !keySet_1.hasKey(req.values ? extractPrimKey(item) : item); })
	                      .concat(
	                  req.values
	                      ? includedValues
	                      : includedValues.map(function (v) { return extractPrimKey(v); }));
	                  break;
	              }
	              case 'delete':
	                  var keysToDelete_1 = new RangeSet().addKeys(op.keys);
	                  modifedResult = result.filter(function (item) {
	                      return !keysToDelete_1.hasKey(req.values ? extractPrimKey(item) : item);
	                  });
	                  break;
	              case 'deleteRange':
	                  var range_1 = op.range;
	                  modifedResult = result.filter(function (item) { return !isWithinRange(extractPrimKey(item), range_1); });
	                  break;
	          }
	          return modifedResult;
	      }, result);
	      if (finalResult === result)
	          return result;
	      var sorter = function (a, b) {
	          return cmp(extractLowLevelIndex(a), extractLowLevelIndex(b)) ||
	              cmp(extractPrimKey(a), extractPrimKey(b));
	      };
	      finalResult.sort(req.direction === 'prev' || req.direction === 'prevunique'
	          ? function (a, b) { return sorter(b, a); }
	          : sorter);
	      if (req.limit && req.limit < Infinity) {
	          if (finalResult.length > req.limit) {
	              finalResult.length = req.limit;
	          }
	          else if (result.length === req.limit && finalResult.length < req.limit) {
	              cacheEntry.dirty = true;
	          }
	      }
	      return immutable ? Object.freeze(finalResult) : finalResult;
	  }

	  function areRangesEqual(r1, r2) {
	      return (cmp(r1.lower, r2.lower) === 0 &&
	          cmp(r1.upper, r2.upper) === 0 &&
	          !!r1.lowerOpen === !!r2.lowerOpen &&
	          !!r1.upperOpen === !!r2.upperOpen);
	  }

	  function compareLowers(lower1, lower2, lowerOpen1, lowerOpen2) {
	      if (lower1 === undefined)
	          return lower2 !== undefined ? -1 : 0;
	      if (lower2 === undefined)
	          return 1;
	      var c = cmp(lower1, lower2);
	      if (c === 0) {
	          if (lowerOpen1 && lowerOpen2)
	              return 0;
	          if (lowerOpen1)
	              return 1;
	          if (lowerOpen2)
	              return -1;
	      }
	      return c;
	  }
	  function compareUppers(upper1, upper2, upperOpen1, upperOpen2) {
	      if (upper1 === undefined)
	          return upper2 !== undefined ? 1 : 0;
	      if (upper2 === undefined)
	          return -1;
	      var c = cmp(upper1, upper2);
	      if (c === 0) {
	          if (upperOpen1 && upperOpen2)
	              return 0;
	          if (upperOpen1)
	              return -1;
	          if (upperOpen2)
	              return 1;
	      }
	      return c;
	  }
	  function isSuperRange(r1, r2) {
	      return (compareLowers(r1.lower, r2.lower, r1.lowerOpen, r2.lowerOpen) <= 0 &&
	          compareUppers(r1.upper, r2.upper, r1.upperOpen, r2.upperOpen) >= 0);
	  }

	  function findCompatibleQuery(dbName, tableName, type, req) {
	      var _a;
	      var tblCache = cache["idb://".concat(dbName, "/").concat(tableName)];
	      if (!tblCache)
	          return [];
	      var queries = tblCache.queries[type];
	      if (!queries)
	          return [null, false, tblCache, null];
	      var indexName = req.query ? req.query.index.name : null;
	      var entries = queries[indexName || ''];
	      if (!entries)
	          return [null, false, tblCache, null];
	      switch (type) {
	          case 'query':
	              var reqDirection_1 = (_a = req.direction) !== null && _a !== void 0 ? _a : 'next';
	              var equalEntry = entries.find(function (entry) {
	                  var _a;
	                  return entry.req.limit === req.limit &&
	                      entry.req.values === req.values &&
	                      ((_a = entry.req.direction) !== null && _a !== void 0 ? _a : 'next') ===
	                          reqDirection_1 &&
	                      areRangesEqual(entry.req.query.range, req.query.range);
	              });
	              if (equalEntry)
	                  return [
	                      equalEntry,
	                      true,
	                      tblCache,
	                      entries,
	                  ];
	              var superEntry = entries.find(function (entry) {
	                  var _a;
	                  var limit = 'limit' in entry.req ? entry.req.limit : Infinity;
	                  return (limit >= req.limit &&
	                      ((_a = entry.req.direction) !== null && _a !== void 0 ? _a : 'next') ===
	                          reqDirection_1 &&
	                      (req.values ? entry.req.values : true) &&
	                      isSuperRange(entry.req.query.range, req.query.range));
	              });
	              return [superEntry, false, tblCache, entries];
	          case 'count':
	              var countQuery = entries.find(function (entry) {
	                  return areRangesEqual(entry.req.query.range, req.query.range);
	              });
	              return [countQuery, !!countQuery, tblCache, entries];
	      }
	  }

	  function subscribeToCacheEntry(cacheEntry, container, requery, signal) {
	      cacheEntry.subscribers.add(requery);
	      signal.addEventListener('abort', function () {
	          cacheEntry.subscribers.delete(requery);
	          if (cacheEntry.subscribers.size === 0) {
	              enqueForDeletion(cacheEntry, container);
	          }
	      });
	  }
	  function enqueForDeletion(cacheEntry, container) {
	      setTimeout(function () {
	          if (cacheEntry.subscribers.size === 0) {
	              delArrayItem(container, cacheEntry);
	          }
	      }, 3000);
	  }

	  var cacheMiddleware = {
	      stack: 'dbcore',
	      level: 0,
	      name: 'Cache',
	      create: function (core) {
	          var dbName = core.schema.name;
	          var coreMW = __assign(__assign({}, core), { transaction: function (stores, mode, options) {
	                  var idbtrans = core.transaction(stores, mode, options);
	                  if (mode === 'readwrite') {
	                      var ac_1 = new AbortController();
	                      var signal = ac_1.signal;
	                      var endTransaction = function (wasCommitted) { return function () {
	                          ac_1.abort();
	                          if (mode === 'readwrite') {
	                              var affectedSubscribers_1 = new Set();
	                              for (var _i = 0, stores_1 = stores; _i < stores_1.length; _i++) {
	                                  var storeName = stores_1[_i];
	                                  var tblCache = cache["idb://".concat(dbName, "/").concat(storeName)];
	                                  if (tblCache) {
	                                      var table = core.table(storeName);
	                                      var ops = tblCache.optimisticOps.filter(function (op) { return op.trans === idbtrans; });
	                                      if (idbtrans._explicit &&
	                                          wasCommitted &&
	                                          idbtrans.mutatedParts) {
	                                          for (var _a = 0, _b = Object.values(tblCache.queries.query); _a < _b.length; _a++) {
	                                              var entries = _b[_a];
	                                              for (var _c = 0, _d = entries.slice(); _c < _d.length; _c++) {
	                                                  var entry = _d[_c];
	                                                  if (obsSetsOverlap(entry.obsSet, idbtrans.mutatedParts)) {
	                                                      delArrayItem(entries, entry);
	                                                      entry.subscribers.forEach(function (requery) {
	                                                          return affectedSubscribers_1.add(requery);
	                                                      });
	                                                  }
	                                              }
	                                          }
	                                      }
	                                      else if (ops.length > 0) {
	                                          tblCache.optimisticOps = tblCache.optimisticOps.filter(function (op) { return op.trans !== idbtrans; });
	                                          for (var _e = 0, _f = Object.values(tblCache.queries.query); _e < _f.length; _e++) {
	                                              var entries = _f[_e];
	                                              for (var _g = 0, _h = entries.slice(); _g < _h.length; _g++) {
	                                                  var entry = _h[_g];
	                                                  if (entry.res != null &&
	                                                      idbtrans.mutatedParts
	  ) {
	                                                      if (wasCommitted && !entry.dirty) {
	                                                          var freezeResults = Object.isFrozen(entry.res);
	                                                          var modRes = applyOptimisticOps(entry.res, entry.req, ops, table, entry, freezeResults);
	                                                          if (entry.dirty) {
	                                                              delArrayItem(entries, entry);
	                                                              entry.subscribers.forEach(function (requery) {
	                                                                  return affectedSubscribers_1.add(requery);
	                                                              });
	                                                          }
	                                                          else if (modRes !== entry.res) {
	                                                              entry.res = modRes;
	                                                              entry.promise = DexiePromise.resolve({
	                                                                  result: modRes,
	                                                              });
	                                                          }
	                                                      }
	                                                      else {
	                                                          if (entry.dirty) {
	                                                              delArrayItem(entries, entry);
	                                                          }
	                                                          entry.subscribers.forEach(function (requery) {
	                                                              return affectedSubscribers_1.add(requery);
	                                                          });
	                                                      }
	                                                  }
	                                              }
	                                          }
	                                      }
	                                  }
	                              }
	                              affectedSubscribers_1.forEach(function (requery) { return requery(); });
	                          }
	                      }; };
	                      idbtrans.addEventListener('abort', endTransaction(false), {
	                          signal: signal,
	                      });
	                      idbtrans.addEventListener('error', endTransaction(false), {
	                          signal: signal,
	                      });
	                      idbtrans.addEventListener('complete', endTransaction(true), {
	                          signal: signal,
	                      });
	                  }
	                  return idbtrans;
	              }, table: function (tableName) {
	                  var downTable = core.table(tableName);
	                  var primKey = downTable.schema.primaryKey;
	                  var tableMW = __assign(__assign({}, downTable), { mutate: function (req) {
	                          var trans = PSD.trans;
	                          if (primKey.outbound ||
	                              trans.db._options.cache === 'disabled' ||
	                              trans.explicit ||
	                              trans.idbtrans.mode !== 'readwrite'
	                          ) {
	                              return downTable.mutate(req);
	                          }
	                          var tblCache = cache["idb://".concat(dbName, "/").concat(tableName)];
	                          if (!tblCache)
	                              return downTable.mutate(req);
	                          var promise = downTable.mutate(req);
	                          if ((req.type === 'add' || req.type === 'put') &&
	                              (req.values.length >= 50 ||
	                                  getEffectiveKeys(primKey, req).some(function (key) { return key == null; }))) {
	                              promise.then(function (res) {
	                                  var reqWithResolvedKeys = __assign(__assign({}, req), { values: req.values.map(function (value, i) {
	                                          var _a;
	                                          if (res.failures[i])
	                                              return value;
	                                          var valueWithKey = ((_a = primKey.keyPath) === null || _a === void 0 ? void 0 : _a.includes('.'))
	                                              ? deepClone(value)
	                                              : __assign({}, value);
	                                          setByKeyPath(valueWithKey, primKey.keyPath, res.results[i]);
	                                          return valueWithKey;
	                                      }) });
	                                  var adjustedReq = adjustOptimisticFromFailures(tblCache, reqWithResolvedKeys, res);
	                                  tblCache.optimisticOps.push(adjustedReq);
	                                  queueMicrotask(function () {
	                                      return req.mutatedParts &&
	                                          signalSubscribersLazily(req.mutatedParts);
	                                  });
	                              });
	                          }
	                          else {
	                              tblCache.optimisticOps.push(req);
	                              req.mutatedParts && signalSubscribersLazily(req.mutatedParts);
	                              promise.then(function (res) {
	                                  if (res.numFailures > 0) {
	                                      delArrayItem(tblCache.optimisticOps, req);
	                                      var adjustedReq = adjustOptimisticFromFailures(tblCache, req, res);
	                                      if (adjustedReq) {
	                                          tblCache.optimisticOps.push(adjustedReq);
	                                      }
	                                      req.mutatedParts && signalSubscribersLazily(req.mutatedParts);
	                                  }
	                              });
	                              promise.catch(function () {
	                                  delArrayItem(tblCache.optimisticOps, req);
	                                  req.mutatedParts && signalSubscribersLazily(req.mutatedParts);
	                              });
	                          }
	                          return promise;
	                      }, query: function (req) {
	                          var _a;
	                          if (!isCachableContext(PSD, downTable) ||
	                              !isCachableRequest('query', req))
	                              return downTable.query(req);
	                          var freezeResults = ((_a = PSD.trans) === null || _a === void 0 ? void 0 : _a.db._options.cache) ===
	                              'immutable';
	                          var _b = PSD, requery = _b.requery, signal = _b.signal;
	                          var _c = findCompatibleQuery(dbName, tableName, 'query', req), cacheEntry = _c[0], exactMatch = _c[1], tblCache = _c[2], container = _c[3];
	                          if (cacheEntry && exactMatch) {
	                              cacheEntry.obsSet = req.obsSet;
	                          }
	                          else {
	                              var promise = downTable
	                                  .query(req)
	                                  .then(function (res) {
	                                  var result = res.result;
	                                  if (cacheEntry)
	                                      cacheEntry.res = result;
	                                  if (freezeResults) {
	                                      for (var i = 0, l = result.length; i < l; ++i) {
	                                          Object.freeze(result[i]);
	                                      }
	                                      Object.freeze(result);
	                                  }
	                                  else {
	                                      res.result = deepClone(result);
	                                  }
	                                  return res;
	                              })
	                                  .catch(function (error) {
	                                  if (container && cacheEntry)
	                                      delArrayItem(container, cacheEntry);
	                                  return Promise.reject(error);
	                              });
	                              cacheEntry = {
	                                  obsSet: req.obsSet,
	                                  promise: promise,
	                                  subscribers: new Set(),
	                                  type: 'query',
	                                  req: req,
	                                  dirty: false,
	                              };
	                              if (container) {
	                                  container.push(cacheEntry);
	                              }
	                              else {
	                                  container = [cacheEntry];
	                                  if (!tblCache) {
	                                      tblCache = cache["idb://".concat(dbName, "/").concat(tableName)] = {
	                                          queries: {
	                                              query: {},
	                                              count: {},
	                                          },
	                                          objs: new Map(),
	                                          optimisticOps: [],
	                                          unsignaledParts: {},
	                                      };
	                                  }
	                                  tblCache.queries.query[req.query.index.name || ''] = container;
	                              }
	                          }
	                          subscribeToCacheEntry(cacheEntry, container, requery, signal);
	                          return cacheEntry.promise.then(function (res) {
	                              return {
	                                  result: applyOptimisticOps(res.result, req, tblCache === null || tblCache === void 0 ? void 0 : tblCache.optimisticOps, downTable, cacheEntry, freezeResults),
	                              };
	                          });
	                      } });
	                  return tableMW;
	              } });
	          return coreMW;
	      },
	  };

	  function vipify(target, vipDb) {
	      return new Proxy(target, {
	          get: function (target, prop, receiver) {
	              if (prop === 'db')
	                  return vipDb;
	              return Reflect.get(target, prop, receiver);
	          },
	      });
	  }

	  var Dexie$1 =  (function () {
	      function Dexie(name, options) {
	          var _this = this;
	          this._middlewares = {};
	          this.verno = 0;
	          var deps = Dexie.dependencies;
	          this._options = options = __assign({
	              addons: Dexie.addons, autoOpen: true,
	              indexedDB: deps.indexedDB, IDBKeyRange: deps.IDBKeyRange, cache: 'cloned', maxConnections: DEFAULT_MAX_CONNECTIONS }, options);
	          this._deps = {
	              indexedDB: options.indexedDB,
	              IDBKeyRange: options.IDBKeyRange,
	          };
	          var addons = options.addons;
	          this._dbSchema = {};
	          this._versions = [];
	          this._storeNames = [];
	          this._allTables = {};
	          this.idbdb = null;
	          this._novip = this;
	          var state = {
	              dbOpenError: null,
	              isBeingOpened: false,
	              onReadyBeingFired: null,
	              openComplete: false,
	              dbReadyResolve: nop,
	              dbReadyPromise: null,
	              cancelOpen: nop,
	              openCanceller: null,
	              autoSchema: true,
	              PR1398_maxLoop: 3,
	              autoOpen: options.autoOpen,
	          };
	          state.dbReadyPromise = new DexiePromise(function (resolve) {
	              state.dbReadyResolve = resolve;
	          });
	          state.openCanceller = new DexiePromise(function (_, reject) {
	              state.cancelOpen = reject;
	          });
	          this._state = state;
	          this.name = name;
	          this.on = Events(this, 'populate', 'blocked', 'versionchange', 'close', {
	              ready: [promisableChain, nop],
	          });
	          this.once = function (event, callback) {
	              var fn = function () {
	                  var args = [];
	                  for (var _i = 0; _i < arguments.length; _i++) {
	                      args[_i] = arguments[_i];
	                  }
	                  _this.on(event).unsubscribe(fn);
	                  callback.apply(_this, args);
	              };
	              return _this.on(event, fn);
	          };
	          this.on.ready.subscribe = override(this.on.ready.subscribe, function (subscribe) {
	              return function (subscriber, bSticky) {
	                  Dexie.vip(function () {
	                      var state = _this._state;
	                      if (state.openComplete) {
	                          if (!state.dbOpenError)
	                              DexiePromise.resolve().then(subscriber);
	                          if (bSticky)
	                              subscribe(subscriber);
	                      }
	                      else if (state.onReadyBeingFired) {
	                          state.onReadyBeingFired.push(subscriber);
	                          if (bSticky)
	                              subscribe(subscriber);
	                      }
	                      else {
	                          subscribe(subscriber);
	                          var db_1 = _this;
	                          if (!bSticky)
	                              subscribe(function unsubscribe() {
	                                  db_1.on.ready.unsubscribe(subscriber);
	                                  db_1.on.ready.unsubscribe(unsubscribe);
	                              });
	                      }
	                  });
	              };
	          });
	          this.Collection = createCollectionConstructor(this);
	          this.Table = createTableConstructor(this);
	          this.Transaction = createTransactionConstructor(this);
	          this.Version = createVersionConstructor(this);
	          this.WhereClause = createWhereClauseConstructor(this);
	          this.on('versionchange', function (ev) {
	              if (ev.newVersion > 0)
	                  console.warn("Another connection wants to upgrade database '".concat(_this.name, "'. Closing db now to resume the upgrade."));
	              else
	                  console.warn("Another connection wants to delete database '".concat(_this.name, "'. Closing db now to resume the delete request."));
	              _this.close({ disableAutoOpen: false });
	          });
	          this.on('blocked', function (ev) {
	              if (!ev.newVersion || ev.newVersion < ev.oldVersion)
	                  console.warn("Dexie.delete('".concat(_this.name, "') was blocked"));
	              else
	                  console.warn("Upgrade '".concat(_this.name, "' blocked by other connection holding version ").concat(ev.oldVersion / 10));
	          });
	          this._maxKey = getMaxKey(options.IDBKeyRange);
	          this._createTransaction = function (mode, storeNames, dbschema, parentTransaction) {
	              return new _this.Transaction(mode, storeNames, dbschema, _this._options.chromeTransactionDurability, parentTransaction);
	          };
	          this._fireOnBlocked = function (ev) {
	              _this.on('blocked').fire(ev);
	              connections
	                  .toArray()
	                  .filter(function (c) { return c.name === _this.name && c !== _this && !c._state.vcFired; })
	                  .map(function (c) { return c.on('versionchange').fire(ev); });
	          };
	          this.use(cacheExistingValuesMiddleware);
	          this.use(cacheMiddleware);
	          this.use(observabilityMiddleware);
	          this.use(virtualIndexMiddleware);
	          this.use(hooksMiddleware);
	          var vipDB = new Proxy(this, {
	              get: function (_, prop, receiver) {
	                  if (prop === '_vip')
	                      return true;
	                  if (prop === 'table')
	                      return function (tableName) { return vipify(_this.table(tableName), vipDB); };
	                  var rv = Reflect.get(_, prop, receiver);
	                  if (rv instanceof Table)
	                      return vipify(rv, vipDB);
	                  if (prop === 'tables')
	                      return rv.map(function (t) { return vipify(t, vipDB); });
	                  if (prop === '_createTransaction')
	                      return function () {
	                          var tx = rv.apply(this, arguments);
	                          return vipify(tx, vipDB);
	                      };
	                  return rv;
	              },
	          });
	          this.vip = vipDB;
	          addons.forEach(function (addon) { return addon(_this); });
	      }
	      Dexie.prototype.version = function (versionNumber) {
	          if (isNaN(versionNumber) || versionNumber < 0.1)
	              throw new exceptions.Type("Given version is not a positive number");
	          versionNumber = Math.round(versionNumber * 10) / 10;
	          if (this.idbdb || this._state.isBeingOpened)
	              throw new exceptions.Schema('Cannot add version when database is open');
	          this.verno = Math.max(this.verno, versionNumber);
	          var versions = this._versions;
	          var versionInstance = versions.filter(function (v) { return v._cfg.version === versionNumber; })[0];
	          if (versionInstance)
	              return versionInstance;
	          versionInstance = new this.Version(versionNumber);
	          versions.push(versionInstance);
	          versions.sort(lowerVersionFirst);
	          versionInstance.stores({});
	          this._state.autoSchema = false;
	          return versionInstance;
	      };
	      Dexie.prototype._whenReady = function (fn) {
	          var _this = this;
	          return this.idbdb &&
	              (this._state.openComplete || PSD.letThrough || this._vip)
	              ? fn()
	              : new DexiePromise(function (resolve, reject) {
	                  if (_this._state.openComplete) {
	                      return reject(new exceptions.DatabaseClosed(_this._state.dbOpenError));
	                  }
	                  if (!_this._state.isBeingOpened) {
	                      if (!_this._state.autoOpen) {
	                          reject(new exceptions.DatabaseClosed());
	                          return;
	                      }
	                      _this.open().catch(nop);
	                  }
	                  _this._state.dbReadyPromise.then(resolve, reject);
	              }).then(fn);
	      };
	      Dexie.prototype.use = function (_a) {
	          var stack = _a.stack, create = _a.create, level = _a.level, name = _a.name;
	          if (name)
	              this.unuse({ stack: stack, name: name });
	          var middlewares = this._middlewares[stack] || (this._middlewares[stack] = []);
	          middlewares.push({
	              stack: stack,
	              create: create,
	              level: level == null ? 10 : level,
	              name: name,
	          });
	          middlewares.sort(function (a, b) { return a.level - b.level; });
	          return this;
	      };
	      Dexie.prototype.unuse = function (_a) {
	          var stack = _a.stack, name = _a.name, create = _a.create;
	          if (stack && this._middlewares[stack]) {
	              this._middlewares[stack] = this._middlewares[stack].filter(function (mw) {
	                  return create
	                      ? mw.create !== create
	                      : name
	                          ? mw.name !== name
	                          : false;
	              });
	          }
	          return this;
	      };
	      Dexie.prototype.open = function () {
	          var _this = this;
	          return usePSD(globalPSD,
	          function () { return dexieOpen(_this); });
	      };
	      Dexie.prototype._close = function () {
	          this.on.close.fire(new CustomEvent('close'));
	          var state = this._state;
	          connections.remove(this);
	          if (this.idbdb) {
	              try {
	                  this.idbdb.close();
	              }
	              catch (e) { }
	              this.idbdb = null;
	          }
	          if (!state.isBeingOpened) {
	              state.dbReadyPromise = new DexiePromise(function (resolve) {
	                  state.dbReadyResolve = resolve;
	              });
	              state.openCanceller = new DexiePromise(function (_, reject) {
	                  state.cancelOpen = reject;
	              });
	          }
	      };
	      Dexie.prototype.close = function (_a) {
	          var _b = _a === void 0 ? { disableAutoOpen: true } : _a, disableAutoOpen = _b.disableAutoOpen;
	          var state = this._state;
	          if (disableAutoOpen) {
	              if (state.isBeingOpened) {
	                  state.cancelOpen(new exceptions.DatabaseClosed());
	              }
	              this._close();
	              state.autoOpen = false;
	              state.dbOpenError = new exceptions.DatabaseClosed();
	          }
	          else {
	              this._close();
	              state.autoOpen = this._options.autoOpen || state.isBeingOpened;
	              state.openComplete = false;
	              state.dbOpenError = null;
	          }
	      };
	      Dexie.prototype.delete = function (closeOptions) {
	          var _this = this;
	          if (closeOptions === void 0) { closeOptions = { disableAutoOpen: true }; }
	          var hasInvalidArguments = arguments.length > 0 && typeof arguments[0] !== 'object';
	          var state = this._state;
	          return new DexiePromise(function (resolve, reject) {
	              var doDelete = function () {
	                  _this.close(closeOptions);
	                  var req = _this._deps.indexedDB.deleteDatabase(_this.name);
	                  req.onsuccess = wrap(function () {
	                      _onDatabaseDeleted(_this._deps, _this.name);
	                      resolve();
	                  });
	                  req.onerror = eventRejectHandler(reject);
	                  req.onblocked = _this._fireOnBlocked;
	              };
	              if (hasInvalidArguments)
	                  throw new exceptions.InvalidArgument('Invalid closeOptions argument to db.delete()');
	              if (state.isBeingOpened) {
	                  state.dbReadyPromise.then(doDelete);
	              }
	              else {
	                  doDelete();
	              }
	          });
	      };
	      Dexie.prototype.backendDB = function () {
	          return this.idbdb;
	      };
	      Dexie.prototype.isOpen = function () {
	          return this.idbdb !== null;
	      };
	      Dexie.prototype.hasBeenClosed = function () {
	          var dbOpenError = this._state.dbOpenError;
	          return dbOpenError && dbOpenError.name === 'DatabaseClosed';
	      };
	      Dexie.prototype.hasFailed = function () {
	          return this._state.dbOpenError !== null;
	      };
	      Dexie.prototype.dynamicallyOpened = function () {
	          return this._state.autoSchema;
	      };
	      Object.defineProperty(Dexie.prototype, "tables", {
	          get: function () {
	              var _this = this;
	              return keys(this._allTables).map(function (name) { return _this._allTables[name]; });
	          },
	          enumerable: false,
	          configurable: true
	      });
	      Dexie.prototype.transaction = function () {
	          var args = extractTransactionArgs.apply(this, arguments);
	          return this._transaction.apply(this, args);
	      };
	      Dexie.prototype._transaction = function (mode, tables, scopeFunc) {
	          var _this = this;
	          var parentTransaction = PSD.trans;
	          if (!parentTransaction ||
	              parentTransaction.db !== this ||
	              mode.indexOf('!') !== -1)
	              parentTransaction = null;
	          var onlyIfCompatible = mode.indexOf('?') !== -1;
	          mode = mode.replace('!', '').replace('?', '');
	          var idbMode, storeNames;
	          try {
	              storeNames = tables.map(function (table) {
	                  var storeName = table instanceof _this.Table ? table.name : table;
	                  if (typeof storeName !== 'string')
	                      throw new TypeError('Invalid table argument to Dexie.transaction(). Only Table or String are allowed');
	                  return storeName;
	              });
	              if (mode == 'r' || mode === READONLY)
	                  idbMode = READONLY;
	              else if (mode == 'rw' || mode == READWRITE)
	                  idbMode = READWRITE;
	              else
	                  throw new exceptions.InvalidArgument('Invalid transaction mode: ' + mode);
	              if (parentTransaction) {
	                  if (parentTransaction.mode === READONLY && idbMode === READWRITE) {
	                      if (onlyIfCompatible) {
	                          parentTransaction = null;
	                      }
	                      else
	                          throw new exceptions.SubTransaction('Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY');
	                  }
	                  if (parentTransaction) {
	                      storeNames.forEach(function (storeName) {
	                          if (parentTransaction &&
	                              parentTransaction.storeNames.indexOf(storeName) === -1) {
	                              if (onlyIfCompatible) {
	                                  parentTransaction = null;
	                              }
	                              else
	                                  throw new exceptions.SubTransaction('Table ' + storeName + ' not included in parent transaction.');
	                          }
	                      });
	                  }
	                  if (onlyIfCompatible &&
	                      parentTransaction &&
	                      !parentTransaction.active) {
	                      parentTransaction = null;
	                  }
	              }
	          }
	          catch (e) {
	              return parentTransaction
	                  ? parentTransaction._promise(null, function (_, reject) {
	                      reject(e);
	                  })
	                  : rejection(e);
	          }
	          var enterTransaction = enterTransactionScope.bind(null, this, idbMode, storeNames, parentTransaction, scopeFunc);
	          return parentTransaction
	              ? parentTransaction._promise(idbMode, enterTransaction, 'lock')
	              : PSD.trans
	                  ?
	                      usePSD(PSD.transless, function () { return _this._whenReady(enterTransaction); })
	                  : this._whenReady(enterTransaction);
	      };
	      Dexie.prototype.table = function (tableName) {
	          if (!hasOwn(this._allTables, tableName)) {
	              throw new exceptions.InvalidTable("Table ".concat(tableName, " does not exist"));
	          }
	          return this._allTables[tableName];
	      };
	      return Dexie;
	  }());

	  var symbolObservable = typeof Symbol !== 'undefined' && 'observable' in Symbol
	      ? Symbol.observable
	      : '@@observable';
	  var Observable =  (function () {
	      function Observable(subscribe) {
	          this._subscribe = subscribe;
	      }
	      Observable.prototype.subscribe = function (x, error, complete) {
	          return this._subscribe(!x || typeof x === 'function' ? { next: x, error: error, complete: complete } : x);
	      };
	      Observable.prototype[symbolObservable] = function () {
	          return this;
	      };
	      return Observable;
	  }());

	  var domDeps;
	  try {
	      domDeps = {
	          indexedDB: _global.indexedDB ||
	              _global.mozIndexedDB ||
	              _global.webkitIndexedDB ||
	              _global.msIndexedDB,
	          IDBKeyRange: _global.IDBKeyRange || _global.webkitIDBKeyRange,
	      };
	  }
	  catch (e) {
	      domDeps = { indexedDB: null, IDBKeyRange: null };
	  }

	  function liveQuery(querier) {
	      var hasValue = false;
	      var currentValue;
	      var observable = new Observable(function (observer) {
	          var scopeFuncIsAsync = isAsyncFunction(querier);
	          function execute(ctx) {
	              var wasRootExec = beginMicroTickScope();
	              try {
	                  if (scopeFuncIsAsync) {
	                      incrementExpectedAwaits();
	                  }
	                  var rv = newScope(querier, ctx);
	                  if (scopeFuncIsAsync) {
	                      rv = rv.finally(decrementExpectedAwaits);
	                  }
	                  return rv;
	              }
	              finally {
	                  wasRootExec && endMicroTickScope();
	              }
	          }
	          var closed = false;
	          var abortController;
	          var accumMuts = {};
	          var currentObs = {};
	          var subscription = {
	              get closed() {
	                  return closed;
	              },
	              unsubscribe: function () {
	                  if (closed)
	                      return;
	                  closed = true;
	                  if (abortController)
	                      abortController.abort();
	                  if (startedListening)
	                      globalEvents.storagemutated.unsubscribe(mutationListener);
	              },
	          };
	          observer.start && observer.start(subscription);
	          var startedListening = false;
	          var doQuery = function () { return execInGlobalContext(_doQuery); };
	          function shouldNotify() {
	              return obsSetsOverlap(currentObs, accumMuts);
	          }
	          var mutationListener = function (parts) {
	              extendObservabilitySet(accumMuts, parts);
	              if (shouldNotify()) {
	                  doQuery();
	              }
	          };
	          var _doQuery = function () {
	              if (closed ||
	                  !domDeps.indexedDB)
	               {
	                  return;
	              }
	              accumMuts = {};
	              var subscr = {};
	              if (abortController)
	                  abortController.abort();
	              abortController = new AbortController();
	              var ctx = {
	                  subscr: subscr,
	                  signal: abortController.signal,
	                  requery: doQuery,
	                  querier: querier,
	                  trans: null,
	              };
	              var ret = execute(ctx);
	              if (!startedListening) {
	                  globalEvents(DEXIE_STORAGE_MUTATED_EVENT_NAME, mutationListener);
	                  startedListening = true;
	              }
	              Promise.resolve(ret).then(function (result) {
	                  hasValue = true;
	                  currentValue = result;
	                  if (closed || ctx.signal.aborted) {
	                      return;
	                  }
	                  if (shouldNotify()) {
	                      doQuery();
	                  }
	                  else {
	                      currentObs = subscr;
	                      if (shouldNotify()) {
	                          doQuery();
	                      }
	                      else {
	                          accumMuts = {};
	                          execInGlobalContext(function () { return !closed && observer.next && observer.next(result); });
	                      }
	                  }
	              }, function (err) {
	                  hasValue = false;
	                  if (!['DatabaseClosedError', 'AbortError'].includes(err === null || err === void 0 ? void 0 : err.name)) {
	                      if (!closed)
	                          execInGlobalContext(function () {
	                              if (closed)
	                                  return;
	                              observer.error && observer.error(err);
	                          });
	                  }
	              });
	          };
	          setTimeout(doQuery, 0);
	          return subscription;
	      });
	      observable.hasValue = function () { return hasValue; };
	      observable.getValue = function () { return currentValue; };
	      return observable;
	  }

	  var Dexie = Dexie$1;
	  props(Dexie, __assign(__assign({}, fullNameExceptions), {
	      delete: function (databaseName) {
	          var db = new Dexie(databaseName, { addons: [] });
	          return db.delete();
	      },
	      exists: function (name) {
	          return new Dexie(name, { addons: [] })
	              .open()
	              .then(function (db) {
	              db.close();
	              return true;
	          })
	              .catch('NoSuchDatabaseError', function () { return false; });
	      },
	      getDatabaseNames: function (cb) {
	          try {
	              return getDatabaseNames(Dexie.dependencies).then(cb);
	          }
	          catch (_a) {
	              return rejection(new exceptions.MissingAPI());
	          }
	      },
	      defineClass: function () {
	          function Class(content) {
	              extend(this, content);
	          }
	          return Class;
	      }, ignoreTransaction: function (scopeFunc) {
	          return PSD.trans
	              ? usePSD(PSD.transless || globalPSD, scopeFunc)
	              : scopeFunc();
	      }, vip: vip, async: function (generatorFn) {
	          return function () {
	              try {
	                  var rv = awaitIterator(generatorFn.apply(this, arguments));
	                  if (!rv || typeof rv.then !== 'function')
	                      return DexiePromise.resolve(rv);
	                  return rv;
	              }
	              catch (e) {
	                  return rejection(e);
	              }
	          };
	      }, spawn: function (generatorFn, args, thiz) {
	          try {
	              var rv = awaitIterator(generatorFn.apply(thiz, args || []));
	              if (!rv || typeof rv.then !== 'function')
	                  return DexiePromise.resolve(rv);
	              return rv;
	          }
	          catch (e) {
	              return rejection(e);
	          }
	      },
	      currentTransaction: {
	          get: function () { return PSD.trans || null; },
	      }, waitFor: function (promiseOrFunction, optionalTimeout) {
	          var promise = DexiePromise.resolve(typeof promiseOrFunction === 'function'
	              ? Dexie.ignoreTransaction(promiseOrFunction)
	              : promiseOrFunction).timeout(optionalTimeout || 60000);
	          return PSD.trans ? PSD.trans.waitFor(promise) : promise;
	      },
	      Promise: DexiePromise,
	      debug: {
	          get: function () { return debug; },
	          set: function (value) {
	              setDebug(value);
	          },
	      },
	      derive: derive, extend: extend, props: props, override: override,
	      Events: Events, on: globalEvents, liveQuery: liveQuery, extendObservabilitySet: extendObservabilitySet,
	      getByKeyPath: getByKeyPath, setByKeyPath: setByKeyPath, delByKeyPath: delByKeyPath, shallowClone: shallowClone, deepClone: deepClone, getObjectDiff: getObjectDiff, cmp: cmp, asap: asap$1,
	      minKey: minKey,
	      addons: [],
	      connections: {
	          get: connections.toArray,
	      },
	      errnames: errnames,
	      dependencies: domDeps, cache: cache,
	      semVer: DEXIE_VERSION, version: DEXIE_VERSION.split('.')
	          .map(function (n) { return parseInt(n); })
	          .reduce(function (p, c, i) { return p + c / Math.pow(10, i * 2); }) }));
	  Dexie.maxKey = getMaxKey(Dexie.dependencies.IDBKeyRange);

	  if (typeof dispatchEvent !== 'undefined' &&
	      typeof addEventListener !== 'undefined') {
	      globalEvents(DEXIE_STORAGE_MUTATED_EVENT_NAME, function (updatedParts) {
	          if (!propagatingLocally) {
	              var event_1;
	              event_1 = new CustomEvent(STORAGE_MUTATED_DOM_EVENT_NAME, {
	                  detail: updatedParts,
	              });
	              propagatingLocally = true;
	              dispatchEvent(event_1);
	              propagatingLocally = false;
	          }
	      });
	      addEventListener(STORAGE_MUTATED_DOM_EVENT_NAME, function (_a) {
	          var detail = _a.detail;
	          if (!propagatingLocally) {
	              propagateLocally(detail);
	          }
	      });
	  }
	  function propagateLocally(updateParts) {
	      var wasMe = propagatingLocally;
	      try {
	          propagatingLocally = true;
	          globalEvents.storagemutated.fire(updateParts);
	          signalSubscribersNow(updateParts, true);
	      }
	      finally {
	          propagatingLocally = wasMe;
	      }
	  }
	  var propagatingLocally = false;

	  var bc;
	  var createBC = function () { };
	  if (typeof BroadcastChannel !== 'undefined') {
	      createBC = function () {
	          bc = new BroadcastChannel(STORAGE_MUTATED_DOM_EVENT_NAME);
	          bc.onmessage = function (ev) { return ev.data && propagateLocally(ev.data); };
	      };
	      createBC();
	      if (typeof bc.unref === 'function') {
	          bc.unref();
	      }
	      globalEvents(DEXIE_STORAGE_MUTATED_EVENT_NAME, function (changedParts) {
	          if (!propagatingLocally) {
	              bc.postMessage(changedParts);
	          }
	      });
	  }

	  if (typeof addEventListener !== 'undefined') {
	      addEventListener('pagehide', function (event) {
	          if (!Dexie$1.disableBfCache && event.persisted) {
	              if (debug)
	                  console.debug('Dexie: handling persisted pagehide');
	              bc === null || bc === void 0 ? void 0 : bc.close();
	              for (var _i = 0, _a = connections.toArray(); _i < _a.length; _i++) {
	                  var db = _a[_i];
	                  db.close({ disableAutoOpen: false });
	              }
	          }
	      });
	      addEventListener('pageshow', function (event) {
	          if (!Dexie$1.disableBfCache && event.persisted) {
	              if (debug)
	                  console.debug('Dexie: handling persisted pageshow');
	              createBC();
	              propagateLocally({ all: new RangeSet(-Infinity, [[]]) });
	          }
	      });
	  }

	  function add(value) {
	      return new PropModification({ add: value });
	  }

	  function remove(value) {
	      return new PropModification({ remove: value });
	  }

	  function replacePrefix(a, b) {
	      return new PropModification({ replacePrefix: [a, b] });
	  }

	  DexiePromise.rejectionMapper = mapError;
	  setDebug(debug);

	  var namedExports = /*#__PURE__*/Object.freeze({
	    __proto__: null,
	    DEFAULT_MAX_CONNECTIONS: DEFAULT_MAX_CONNECTIONS,
	    Dexie: Dexie$1,
	    Entity: Entity,
	    PropModification: PropModification,
	    RangeSet: RangeSet,
	    add: add,
	    cmp: cmp,
	    default: Dexie$1,
	    liveQuery: liveQuery,
	    mergeRanges: mergeRanges,
	    rangesOverlap: rangesOverlap,
	    remove: remove,
	    replacePrefix: replacePrefix
	  });

	  __assign(Dexie$1, namedExports, { default: Dexie$1 });

	  return Dexie$1;

	}));
	
} (dexie));

var dexieExports = dexie.exports;
var _Dexie = /*@__PURE__*/getDefaultExportFromCjs(dexieExports);

// Making the module version consumable via require - to prohibit
// multiple occurrancies of the same module in the same app
// (dual package hazard, https://nodejs.org/api/packages.html#dual-package-hazard)
const DexieSymbol = Symbol.for("Dexie");
const Dexie = globalThis[DexieSymbol] || (globalThis[DexieSymbol] = _Dexie);
if (_Dexie.semVer !== Dexie.semVer) {
    throw new Error(`Two different versions of Dexie loaded in the same app: ${_Dexie.semVer} and ${Dexie.semVer}`);
}
const { liveQuery, mergeRanges, rangesOverlap, RangeSet, cmp: cmp$1, Entity,
    PropModification, replacePrefix, add, remove,
    DexieYProvider } = Dexie;

var re$2 = {exports: {}};

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0';

const MAX_LENGTH$1 = 256;
const MAX_SAFE_INTEGER$1 = Number.MAX_SAFE_INTEGER ||
/* istanbul ignore next */ 9007199254740991;

// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16;

// Max safe length for a build identifier. The max length minus 6 characters for
// the shortest version with a build 0.0.0+BUILD.
const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH$1 - 6;

const RELEASE_TYPES = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease',
];

var constants$1 = {
  MAX_LENGTH: MAX_LENGTH$1,
  MAX_SAFE_COMPONENT_LENGTH,
  MAX_SAFE_BUILD_LENGTH,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1,
  RELEASE_TYPES,
  SEMVER_SPEC_VERSION,
  FLAG_INCLUDE_PRERELEASE: 0b001,
  FLAG_LOOSE: 0b010,
};

const debug$1 = (
  typeof process === 'object' &&
  process.env &&
  process.env.NODE_DEBUG &&
  /\bsemver\b/i.test(process.env.NODE_DEBUG)
) ? (...args) => console.error('SEMVER', ...args)
  : () => {};

var debug_1 = debug$1;

(function (module, exports$1) {

	const {
	  MAX_SAFE_COMPONENT_LENGTH,
	  MAX_SAFE_BUILD_LENGTH,
	  MAX_LENGTH,
	} = constants$1;
	const debug = debug_1;
	exports$1 = module.exports = {};

	// The actual regexps go on exports.re
	const re = exports$1.re = [];
	const safeRe = exports$1.safeRe = [];
	const src = exports$1.src = [];
	const safeSrc = exports$1.safeSrc = [];
	const t = exports$1.t = {};
	let R = 0;

	const LETTERDASHNUMBER = '[a-zA-Z0-9-]';

	// Replace some greedy regex tokens to prevent regex dos issues. These regex are
	// used internally via the safeRe object since all inputs in this library get
	// normalized first to trim and collapse all extra whitespace. The original
	// regexes are exported for userland consumption and lower level usage. A
	// future breaking change could export the safer regex only with a note that
	// all input should have extra whitespace removed.
	const safeRegexReplacements = [
	  ['\\s', 1],
	  ['\\d', MAX_LENGTH],
	  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
	];

	const makeSafeRegex = (value) => {
	  for (const [token, max] of safeRegexReplacements) {
	    value = value
	      .split(`${token}*`).join(`${token}{0,${max}}`)
	      .split(`${token}+`).join(`${token}{1,${max}}`);
	  }
	  return value
	};

	const createToken = (name, value, isGlobal) => {
	  const safe = makeSafeRegex(value);
	  const index = R++;
	  debug(name, index, value);
	  t[name] = index;
	  src[index] = value;
	  safeSrc[index] = safe;
	  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
	  safeRe[index] = new RegExp(safe, isGlobal ? 'g' : undefined);
	};

	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.

	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.

	createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
	createToken('NUMERICIDENTIFIERLOOSE', '\\d+');

	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.

	createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);

	// ## Main Version
	// Three dot-separated numeric identifiers.

	createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
	                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
	                   `(${src[t.NUMERICIDENTIFIER]})`);

	createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
	                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
	                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.
	// Non-numeric identifiers include numeric identifiers but can be longer.
	// Therefore non-numeric identifiers must go first.

	createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NONNUMERICIDENTIFIER]
	}|${src[t.NUMERICIDENTIFIER]})`);

	createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NONNUMERICIDENTIFIER]
	}|${src[t.NUMERICIDENTIFIERLOOSE]})`);

	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.

	createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
	}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

	createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
	}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.

	createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);

	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.

	createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
	}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.

	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.

	createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
	}${src[t.PRERELEASE]}?${
	  src[t.BUILD]}?`);

	createToken('FULL', `^${src[t.FULLPLAIN]}$`);

	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
	}${src[t.PRERELEASELOOSE]}?${
	  src[t.BUILD]}?`);

	createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

	createToken('GTLT', '((?:<|>)?=?)');

	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

	createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:${src[t.PRERELEASE]})?${
	                     src[t.BUILD]}?` +
	                   `)?)?`);

	createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:${src[t.PRERELEASELOOSE]})?${
	                          src[t.BUILD]}?` +
	                        `)?)?`);

	createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
	createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

	// Coercion.
	// Extract anything that could conceivably be a part of a valid semver
	createToken('COERCEPLAIN', `${'(^|[^\\d])' +
	              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
	              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
	              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
	createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
	createToken('COERCEFULL', src[t.COERCEPLAIN] +
	              `(?:${src[t.PRERELEASE]})?` +
	              `(?:${src[t.BUILD]})?` +
	              `(?:$|[^\\d])`);
	createToken('COERCERTL', src[t.COERCE], true);
	createToken('COERCERTLFULL', src[t.COERCEFULL], true);

	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	createToken('LONETILDE', '(?:~>?)');

	createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
	exports$1.tildeTrimReplace = '$1~';

	createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
	createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	createToken('LONECARET', '(?:\\^)');

	createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
	exports$1.caretTrimReplace = '$1^';

	createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
	createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
	createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
	}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
	exports$1.comparatorTrimReplace = '$1$2$3';

	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
	                   `\\s+-\\s+` +
	                   `(${src[t.XRANGEPLAIN]})` +
	                   `\\s*$`);

	createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
	                        `\\s+-\\s+` +
	                        `(${src[t.XRANGEPLAINLOOSE]})` +
	                        `\\s*$`);

	// Star ranges basically just allow anything at all.
	createToken('STAR', '(<|>)?=?\\s*\\*');
	// >=0.0.0 is like a star
	createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
	createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$'); 
} (re$2, re$2.exports));

var reExports = re$2.exports;

// parse out just the options we care about
const looseOption = Object.freeze({ loose: true });
const emptyOpts = Object.freeze({ });
const parseOptions$1 = options => {
  if (!options) {
    return emptyOpts
  }

  if (typeof options !== 'object') {
    return looseOption
  }

  return options
};
var parseOptions_1 = parseOptions$1;

const numeric = /^[0-9]+$/;
const compareIdentifiers$1 = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b ? 0 : a < b ? -1 : 1
  }

  const anum = numeric.test(a);
  const bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
};

const rcompareIdentifiers = (a, b) => compareIdentifiers$1(b, a);

var identifiers$1 = {
  compareIdentifiers: compareIdentifiers$1,
  rcompareIdentifiers,
};

const debug = debug_1;
const { MAX_LENGTH, MAX_SAFE_INTEGER } = constants$1;
const { safeRe: re$1, t: t$1 } = reExports;

const parseOptions = parseOptions_1;
const { compareIdentifiers } = identifiers$1;
let SemVer$2 = class SemVer {
  constructor (version, options) {
    options = parseOptions(options);

    if (version instanceof SemVer) {
      if (version.loose === !!options.loose &&
        version.includePrerelease === !!options.includePrerelease) {
        return version
      } else {
        version = version.version;
      }
    } else if (typeof version !== 'string') {
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`)
    }

    if (version.length > MAX_LENGTH) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH} characters`
      )
    }

    debug('SemVer', version, options);
    this.options = options;
    this.loose = !!options.loose;
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease;

    const m = version.trim().match(options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL]);

    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    this.raw = version;

    // these are actually numbers
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];

    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError('Invalid major version')
    }

    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError('Invalid minor version')
    }

    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError('Invalid patch version')
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split('.').map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num
          }
        }
        return id
      });
    }

    this.build = m[5] ? m[5].split('.') : [];
    this.format();
  }

  format () {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join('.')}`;
    }
    return this.version
  }

  toString () {
    return this.version
  }

  compare (other) {
    debug('SemVer.compare', this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0
      }
      other = new SemVer(other, this.options);
    }

    if (other.version === this.version) {
      return 0
    }

    return this.compareMain(other) || this.comparePre(other)
  }

  compareMain (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    if (this.major < other.major) {
      return -1
    }
    if (this.major > other.major) {
      return 1
    }
    if (this.minor < other.minor) {
      return -1
    }
    if (this.minor > other.minor) {
      return 1
    }
    if (this.patch < other.patch) {
      return -1
    }
    if (this.patch > other.patch) {
      return 1
    }
    return 0
  }

  comparePre (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    // NOT having a prerelease is > having one
    if (this.prerelease.length && !other.prerelease.length) {
      return -1
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0
    }

    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  compareBuild (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug('build compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc (release, identifier, identifierBase) {
    if (release.startsWith('pre')) {
      if (!identifier && identifierBase === false) {
        throw new Error('invalid increment argument: identifier is empty')
      }
      // Avoid an invalid semver results
      if (identifier) {
        const match = `-${identifier}`.match(this.options.loose ? re$1[t$1.PRERELEASELOOSE] : re$1[t$1.PRERELEASE]);
        if (!match || match[1] !== identifier) {
          throw new Error(`invalid identifier: ${identifier}`)
        }
      }
    }

    switch (release) {
      case 'premajor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc('pre', identifier, identifierBase);
        break
      case 'preminor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc('pre', identifier, identifierBase);
        break
      case 'prepatch':
        // If this is already a prerelease, it will bump to the next version
        // drop any prereleases that might already exist, since they are not
        // relevant at this point.
        this.prerelease.length = 0;
        this.inc('patch', identifier, identifierBase);
        this.inc('pre', identifier, identifierBase);
        break
      // If the input is a non-prerelease version, this acts the same as
      // prepatch.
      case 'prerelease':
        if (this.prerelease.length === 0) {
          this.inc('patch', identifier, identifierBase);
        }
        this.inc('pre', identifier, identifierBase);
        break
      case 'release':
        if (this.prerelease.length === 0) {
          throw new Error(`version ${this.raw} is not a prerelease`)
        }
        this.prerelease.length = 0;
        break

      case 'major':
        // If this is a pre-major version, bump up to the same major version.
        // Otherwise increment major.
        // 1.0.0-5 bumps to 1.0.0
        // 1.1.0 bumps to 2.0.0
        if (
          this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0
        ) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break
      case 'minor':
        // If this is a pre-minor version, bump up to the same minor version.
        // Otherwise increment minor.
        // 1.2.0-5 bumps to 1.2.0
        // 1.2.1 bumps to 1.3.0
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break
      case 'patch':
        // If this is not a pre-release version, it will increment the patch.
        // If it is a pre-release it will bump up to the same patch version.
        // 1.2.0-5 patches to 1.2.0
        // 1.2.0 patches to 1.2.1
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break
      // This probably shouldn't be used publicly.
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre': {
        const base = Number(identifierBase) ? 1 : 0;

        if (this.prerelease.length === 0) {
          this.prerelease = [base];
        } else {
          let i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === 'number') {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            // didn't increment anything
            if (identifier === this.prerelease.join('.') && identifierBase === false) {
              throw new Error('invalid increment argument: identifier already exists')
            }
            this.prerelease.push(base);
          }
        }
        if (identifier) {
          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
          let prerelease = [identifier, base];
          if (identifierBase === false) {
            prerelease = [identifier];
          }
          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = prerelease;
            }
          } else {
            this.prerelease = prerelease;
          }
        }
        break
      }
      default:
        throw new Error(`invalid increment argument: ${release}`)
    }
    this.raw = this.format();
    if (this.build.length) {
      this.raw += `+${this.build.join('.')}`;
    }
    return this
  }
};

var semver$1 = SemVer$2;

const SemVer$1 = semver$1;
const parse$2 = (version, options, throwErrors = false) => {
  if (version instanceof SemVer$1) {
    return version
  }
  try {
    return new SemVer$1(version, options)
  } catch (er) {
    if (!throwErrors) {
      return null
    }
    throw er
  }
};

var parse_1 = parse$2;

const parse$1 = parse_1;
const valid$1 = (version, options) => {
  const v = parse$1(version, options);
  return v ? v.version : null
};
var valid_1 = valid$1;

const SemVer = semver$1;
const compare$6 = (a, b, loose) =>
  new SemVer(a, loose).compare(new SemVer(b, loose));

var compare_1 = compare$6;

const compare$5 = compare_1;
const gt$2 = (a, b, loose) => compare$5(a, b, loose) > 0;
var gt_1 = gt$2;

const compare$4 = compare_1;
const lt$1 = (a, b, loose) => compare$4(a, b, loose) < 0;
var lt_1 = lt$1;

const compare$3 = compare_1;
const eq$1 = (a, b, loose) => compare$3(a, b, loose) === 0;
var eq_1 = eq$1;

const compare$2 = compare_1;
const neq$1 = (a, b, loose) => compare$2(a, b, loose) !== 0;
var neq_1 = neq$1;

const compare$1 = compare_1;
const gte$1 = (a, b, loose) => compare$1(a, b, loose) >= 0;
var gte_1 = gte$1;

const compare = compare_1;
const lte$1 = (a, b, loose) => compare(a, b, loose) <= 0;
var lte_1 = lte$1;

const eq = eq_1;
const neq = neq_1;
const gt$1 = gt_1;
const gte = gte_1;
const lt = lt_1;
const lte = lte_1;

const cmp = (a, op, b, loose) => {
  switch (op) {
    case '===':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a === b

    case '!==':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a !== b

    case '':
    case '=':
    case '==':
      return eq(a, b, loose)

    case '!=':
      return neq(a, b, loose)

    case '>':
      return gt$1(a, b, loose)

    case '>=':
      return gte(a, b, loose)

    case '<':
      return lt(a, b, loose)

    case '<=':
      return lte(a, b, loose)

    default:
      throw new TypeError(`Invalid operator: ${op}`)
  }
};
var cmp_1 = cmp;

const { safeRe: re, t } = reExports;

var lrucache;
var hasRequiredLrucache;

function requireLrucache () {
	if (hasRequiredLrucache) return lrucache;
	hasRequiredLrucache = 1;

	class LRUCache {
	  constructor () {
	    this.max = 1000;
	    this.map = new Map();
	  }

	  get (key) {
	    const value = this.map.get(key);
	    if (value === undefined) {
	      return undefined
	    } else {
	      // Remove the key from the map and add it to the end
	      this.map.delete(key);
	      this.map.set(key, value);
	      return value
	    }
	  }

	  delete (key) {
	    return this.map.delete(key)
	  }

	  set (key, value) {
	    const deleted = this.delete(key);

	    if (!deleted && value !== undefined) {
	      // If cache is full, delete the least recently used item
	      if (this.map.size >= this.max) {
	        const firstKey = this.map.keys().next().value;
	        this.delete(firstKey);
	      }

	      this.map.set(key, value);
	    }

	    return this
	  }
	}

	lrucache = LRUCache;
	return lrucache;
}

var range;
var hasRequiredRange;

function requireRange () {
	if (hasRequiredRange) return range;
	hasRequiredRange = 1;

	const SPACE_CHARACTERS = /\s+/g;

	// hoisted class for cyclic dependency
	class Range {
	  constructor (range, options) {
	    options = parseOptions(options);

	    if (range instanceof Range) {
	      if (
	        range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease
	      ) {
	        return range
	      } else {
	        return new Range(range.raw, options)
	      }
	    }

	    if (range instanceof Comparator) {
	      // just put it in the set and return
	      this.raw = range.value;
	      this.set = [[range]];
	      this.formatted = undefined;
	      return this
	    }

	    this.options = options;
	    this.loose = !!options.loose;
	    this.includePrerelease = !!options.includePrerelease;

	    // First reduce all whitespace as much as possible so we do not have to rely
	    // on potentially slow regexes like \s*. This is then stored and used for
	    // future error messages as well.
	    this.raw = range.trim().replace(SPACE_CHARACTERS, ' ');

	    // First, split on ||
	    this.set = this.raw
	      .split('||')
	      // map the range to a 2d array of comparators
	      .map(r => this.parseRange(r.trim()))
	      // throw out any comparator lists that are empty
	      // this generally means that it was not a valid range, which is allowed
	      // in loose mode, but will still throw if the WHOLE range is invalid.
	      .filter(c => c.length);

	    if (!this.set.length) {
	      throw new TypeError(`Invalid SemVer Range: ${this.raw}`)
	    }

	    // if we have any that are not the null set, throw out null sets.
	    if (this.set.length > 1) {
	      // keep the first one, in case they're all null sets
	      const first = this.set[0];
	      this.set = this.set.filter(c => !isNullSet(c[0]));
	      if (this.set.length === 0) {
	        this.set = [first];
	      } else if (this.set.length > 1) {
	        // if we have any that are *, then the range is just *
	        for (const c of this.set) {
	          if (c.length === 1 && isAny(c[0])) {
	            this.set = [c];
	            break
	          }
	        }
	      }
	    }

	    this.formatted = undefined;
	  }

	  get range () {
	    if (this.formatted === undefined) {
	      this.formatted = '';
	      for (let i = 0; i < this.set.length; i++) {
	        if (i > 0) {
	          this.formatted += '||';
	        }
	        const comps = this.set[i];
	        for (let k = 0; k < comps.length; k++) {
	          if (k > 0) {
	            this.formatted += ' ';
	          }
	          this.formatted += comps[k].toString().trim();
	        }
	      }
	    }
	    return this.formatted
	  }

	  format () {
	    return this.range
	  }

	  toString () {
	    return this.range
	  }

	  parseRange (range) {
	    // memoize range parsing for performance.
	    // this is a very hot path, and fully deterministic.
	    const memoOpts =
	      (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) |
	      (this.options.loose && FLAG_LOOSE);
	    const memoKey = memoOpts + ':' + range;
	    const cached = cache.get(memoKey);
	    if (cached) {
	      return cached
	    }

	    const loose = this.options.loose;
	    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	    const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
	    range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
	    debug('hyphen replace', range);

	    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	    range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
	    debug('comparator trim', range);

	    // `~ 1.2.3` => `~1.2.3`
	    range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
	    debug('tilde trim', range);

	    // `^ 1.2.3` => `^1.2.3`
	    range = range.replace(re[t.CARETTRIM], caretTrimReplace);
	    debug('caret trim', range);

	    // At this point, the range is completely trimmed and
	    // ready to be split into comparators.

	    let rangeList = range
	      .split(' ')
	      .map(comp => parseComparator(comp, this.options))
	      .join(' ')
	      .split(/\s+/)
	      // >=0.0.0 is equivalent to *
	      .map(comp => replaceGTE0(comp, this.options));

	    if (loose) {
	      // in loose mode, throw out any that are not valid comparators
	      rangeList = rangeList.filter(comp => {
	        debug('loose invalid filter', comp, this.options);
	        return !!comp.match(re[t.COMPARATORLOOSE])
	      });
	    }
	    debug('range list', rangeList);

	    // if any comparators are the null set, then replace with JUST null set
	    // if more than one comparator, remove any * comparators
	    // also, don't include the same comparator more than once
	    const rangeMap = new Map();
	    const comparators = rangeList.map(comp => new Comparator(comp, this.options));
	    for (const comp of comparators) {
	      if (isNullSet(comp)) {
	        return [comp]
	      }
	      rangeMap.set(comp.value, comp);
	    }
	    if (rangeMap.size > 1 && rangeMap.has('')) {
	      rangeMap.delete('');
	    }

	    const result = [...rangeMap.values()];
	    cache.set(memoKey, result);
	    return result
	  }

	  intersects (range, options) {
	    if (!(range instanceof Range)) {
	      throw new TypeError('a Range is required')
	    }

	    return this.set.some((thisComparators) => {
	      return (
	        isSatisfiable(thisComparators, options) &&
	        range.set.some((rangeComparators) => {
	          return (
	            isSatisfiable(rangeComparators, options) &&
	            thisComparators.every((thisComparator) => {
	              return rangeComparators.every((rangeComparator) => {
	                return thisComparator.intersects(rangeComparator, options)
	              })
	            })
	          )
	        })
	      )
	    })
	  }

	  // if ANY of the sets match ALL of its comparators, then pass
	  test (version) {
	    if (!version) {
	      return false
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    for (let i = 0; i < this.set.length; i++) {
	      if (testSet(this.set[i], version, this.options)) {
	        return true
	      }
	    }
	    return false
	  }
	}

	range = Range;

	const LRU = requireLrucache();
	const cache = new LRU();

	const parseOptions = parseOptions_1;
	const Comparator = requireComparator();
	const debug = debug_1;
	const SemVer = semver$1;
	const {
	  safeRe: re,
	  t,
	  comparatorTrimReplace,
	  tildeTrimReplace,
	  caretTrimReplace,
	} = reExports;
	const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = constants$1;

	const isNullSet = c => c.value === '<0.0.0-0';
	const isAny = c => c.value === '';

	// take a set of comparators and determine whether there
	// exists a version which can satisfy it
	const isSatisfiable = (comparators, options) => {
	  let result = true;
	  const remainingComparators = comparators.slice();
	  let testComparator = remainingComparators.pop();

	  while (result && remainingComparators.length) {
	    result = remainingComparators.every((otherComparator) => {
	      return testComparator.intersects(otherComparator, options)
	    });

	    testComparator = remainingComparators.pop();
	  }

	  return result
	};

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	const parseComparator = (comp, options) => {
	  comp = comp.replace(re[t.BUILD], '');
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	};

	const isX = id => !id || id.toLowerCase() === 'x' || id === '*';

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
	// ~0.0.1 --> >=0.0.1 <0.1.0-0
	const replaceTildes = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceTilde(c, options))
	    .join(' ')
	};

	const replaceTilde = (comp, options) => {
	  const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('tilde', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0-0
	      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = `>=${M}.${m}.${p}-${pr
	      } <${M}.${+m + 1}.0-0`;
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0-0
	      ret = `>=${M}.${m}.${p
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	};

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
	// ^1.2.3 --> >=1.2.3 <2.0.0-0
	// ^1.2.0 --> >=1.2.0 <2.0.0-0
	// ^0.0.1 --> >=0.0.1 <0.0.2-0
	// ^0.1.0 --> >=0.1.0 <0.2.0-0
	const replaceCarets = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceCaret(c, options))
	    .join(' ')
	};

	const replaceCaret = (comp, options) => {
	  debug('caret', comp, options);
	  const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
	  const z = options.includePrerelease ? '-0' : '';
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('caret', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
	      } else {
	        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p}-${pr
	        } <${+M + 1}.0.0-0`;
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p
	        } <${+M + 1}.0.0-0`;
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	};

	const replaceXRanges = (comp, options) => {
	  debug('replaceXRanges', comp, options);
	  return comp
	    .split(/\s+/)
	    .map((c) => replaceXRange(c, options))
	    .join(' ')
	};

	const replaceXRange = (comp, options) => {
	  comp = comp.trim();
	  const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
	  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    const xM = isX(M);
	    const xm = xM || isX(m);
	    const xp = xm || isX(p);
	    const anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    // if we're including prereleases in the match, then we need
	    // to fix this to -0, the lowest possible prerelease value
	    pr = options.includePrerelease ? '-0' : '';

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0-0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      if (gtlt === '<') {
	        pr = '-0';
	      }

	      ret = `${gtlt + M}.${m}.${p}${pr}`;
	    } else if (xm) {
	      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
	    } else if (xp) {
	      ret = `>=${M}.${m}.0${pr
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	};

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	const replaceStars = (comp, options) => {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp
	    .trim()
	    .replace(re[t.STAR], '')
	};

	const replaceGTE0 = (comp, options) => {
	  debug('replaceGTE0', comp, options);
	  return comp
	    .trim()
	    .replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '')
	};

	// This function is passed to string.replace(re[t.HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
	// TODO build?
	const hyphenReplace = incPr => ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr) => {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
	  } else if (isX(fp)) {
	    from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
	  } else if (fpr) {
	    from = `>=${from}`;
	  } else {
	    from = `>=${from}${incPr ? '-0' : ''}`;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = `<${+tM + 1}.0.0-0`;
	  } else if (isX(tp)) {
	    to = `<${tM}.${+tm + 1}.0-0`;
	  } else if (tpr) {
	    to = `<=${tM}.${tm}.${tp}-${tpr}`;
	  } else if (incPr) {
	    to = `<${tM}.${tm}.${+tp + 1}-0`;
	  } else {
	    to = `<=${to}`;
	  }

	  return `${from} ${to}`.trim()
	};

	const testSet = (set, version, options) => {
	  for (let i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (let i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === Comparator.ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        const allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	};
	return range;
}

var comparator;
var hasRequiredComparator;

function requireComparator () {
	if (hasRequiredComparator) return comparator;
	hasRequiredComparator = 1;

	const ANY = Symbol('SemVer ANY');
	// hoisted class for cyclic dependency
	class Comparator {
	  static get ANY () {
	    return ANY
	  }

	  constructor (comp, options) {
	    options = parseOptions(options);

	    if (comp instanceof Comparator) {
	      if (comp.loose === !!options.loose) {
	        return comp
	      } else {
	        comp = comp.value;
	      }
	    }

	    comp = comp.trim().split(/\s+/).join(' ');
	    debug('comparator', comp, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    this.parse(comp);

	    if (this.semver === ANY) {
	      this.value = '';
	    } else {
	      this.value = this.operator + this.semver.version;
	    }

	    debug('comp', this);
	  }

	  parse (comp) {
	    const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
	    const m = comp.match(r);

	    if (!m) {
	      throw new TypeError(`Invalid comparator: ${comp}`)
	    }

	    this.operator = m[1] !== undefined ? m[1] : '';
	    if (this.operator === '=') {
	      this.operator = '';
	    }

	    // if it literally is just '>' or '' then allow anything.
	    if (!m[2]) {
	      this.semver = ANY;
	    } else {
	      this.semver = new SemVer(m[2], this.options.loose);
	    }
	  }

	  toString () {
	    return this.value
	  }

	  test (version) {
	    debug('Comparator.test', version, this.options.loose);

	    if (this.semver === ANY || version === ANY) {
	      return true
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    return cmp(version, this.operator, this.semver, this.options)
	  }

	  intersects (comp, options) {
	    if (!(comp instanceof Comparator)) {
	      throw new TypeError('a Comparator is required')
	    }

	    if (this.operator === '') {
	      if (this.value === '') {
	        return true
	      }
	      return new Range(comp.value, options).test(this.value)
	    } else if (comp.operator === '') {
	      if (comp.value === '') {
	        return true
	      }
	      return new Range(this.value, options).test(comp.semver)
	    }

	    options = parseOptions(options);

	    // Special cases where nothing can possibly be lower
	    if (options.includePrerelease &&
	      (this.value === '<0.0.0-0' || comp.value === '<0.0.0-0')) {
	      return false
	    }
	    if (!options.includePrerelease &&
	      (this.value.startsWith('<0.0.0') || comp.value.startsWith('<0.0.0'))) {
	      return false
	    }

	    // Same direction increasing (> or >=)
	    if (this.operator.startsWith('>') && comp.operator.startsWith('>')) {
	      return true
	    }
	    // Same direction decreasing (< or <=)
	    if (this.operator.startsWith('<') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // same SemVer and both sides are inclusive (<= or >=)
	    if (
	      (this.semver.version === comp.semver.version) &&
	      this.operator.includes('=') && comp.operator.includes('=')) {
	      return true
	    }
	    // opposite directions less than
	    if (cmp(this.semver, '<', comp.semver, options) &&
	      this.operator.startsWith('>') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // opposite directions greater than
	    if (cmp(this.semver, '>', comp.semver, options) &&
	      this.operator.startsWith('<') && comp.operator.startsWith('>')) {
	      return true
	    }
	    return false
	  }
	}

	comparator = Comparator;

	const parseOptions = parseOptions_1;
	const { safeRe: re, t } = reExports;
	const cmp = cmp_1;
	const debug = debug_1;
	const SemVer = semver$1;
	const Range = requireRange();
	return comparator;
}

requireRange();

requireRange();

requireRange();

requireRange();

requireRange();

requireRange();

const Comparator$1 = requireComparator();
const { ANY: ANY$1 } = Comparator$1;
requireRange();

requireRange();

requireRange();
const Comparator = requireComparator();
const { ANY } = Comparator;

[new Comparator('>=0.0.0-0')];
[new Comparator('>=0.0.0')];

// just pre-load all the stuff that index.js lazily exports
const internalRe = reExports;
const constants = constants$1;
const identifiers = identifiers$1;
const parse = parse_1;
const valid = valid_1;
const gt = gt_1;
requireComparator();
requireRange();
var semver = {
  parse,
  valid,
  gt,
  re: internalRe.re,
  src: internalRe.src,
  tokens: internalRe.t,
  SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: constants.RELEASE_TYPES,
  compareIdentifiers: identifiers.compareIdentifiers,
  rcompareIdentifiers: identifiers.rcompareIdentifiers,
};

// Helper for undefined values, like map for Option<T> in Rust.
// A better name for this is welcome.
const mapOption = (value, func) => {
    return value != undefined ? func(value) : undefined;
};
// Anything can be thrown as an error in raw JS (also the TS compiler can't type-check exceptions),
// so we allow it here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logWebStoreError = (error, errorContext) => {
    if (error instanceof Dexie.DexieError) {
        if (errorContext) {
            console.error(`${errorContext}: Indexdb error (${error.name}): ${error.message}`);
        }
        else {
            console.error(`Indexdb error: (${error.name}): ${error.message}`);
        }
        mapOption(error.stack, (stack) => {
            console.error(`Stacktrace: \n ${stack}`);
        });
        mapOption(error.inner, (innerException) => logWebStoreError(innerException));
    }
    else if (error instanceof Error) {
        console.error(`Unexpected error while accessing indexdb: ${error.toString()}`);
        mapOption(error.stack, (stack) => {
            console.error(`Stacktrace: ${stack}`);
        });
    }
    else {
        console.error(`Got an exception with a non-error value, as JSON: \n ${JSON.stringify(error)}. As String \n ${String(error)} `);
        console.trace();
    }
    throw error;
};
const uint8ArrayToBase64 = (bytes) => {
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    return btoa(binary);
};

const CLIENT_VERSION_SETTING_KEY = "clientVersion";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
// Since we can't have a pointer to a JS Object from rust, we'll
// use this instead to keep track of open DBs. A client can have
// a DB for mainnet, devnet, testnet or a custom one, so this should be ok.
const databaseRegistry = new Map();
/**
 * Get a database instance from the registry by its ID.
 * Throws if the database hasn't been opened yet.
 */
function getDatabase(dbId) {
    const db = databaseRegistry.get(dbId);
    if (!db) {
        throw new Error(`Database not found for id: ${dbId}. Call openDatabase first.`);
    }
    return db;
}
/**
 * Opens a database for the given network and registers it in the registry.
 * Returns the database ID (network name) which can be used to retrieve the database later.
 */
async function openDatabase(network, clientVersion) {
    const db = new MidenDatabase(network);
    const success = await db.open(clientVersion);
    /* v8 ignore next 3 — open() only returns false after logWebStoreError re-throws, so !success is unreachable */
    if (!success) {
        throw new Error(`Failed to open IndexedDB database: ${network}`);
    }
    databaseRegistry.set(network, db);
    return network;
}
var Table;
(function (Table) {
    Table["AccountCode"] = "accountCode";
    Table["LatestAccountStorage"] = "latestAccountStorage";
    Table["HistoricalAccountStorage"] = "historicalAccountStorage";
    Table["LatestAccountAssets"] = "latestAccountAssets";
    Table["HistoricalAccountAssets"] = "historicalAccountAssets";
    Table["LatestStorageMapEntries"] = "latestStorageMapEntries";
    Table["HistoricalStorageMapEntries"] = "historicalStorageMapEntries";
    Table["AccountAuth"] = "accountAuth";
    Table["AccountKeyMapping"] = "accountKeyMapping";
    Table["LatestAccountHeaders"] = "latestAccountHeaders";
    Table["HistoricalAccountHeaders"] = "historicalAccountHeaders";
    Table["Addresses"] = "addresses";
    Table["Transactions"] = "transactions";
    Table["TransactionScripts"] = "transactionScripts";
    Table["InputNotes"] = "inputNotes";
    Table["OutputNotes"] = "outputNotes";
    Table["NotesScripts"] = "notesScripts";
    Table["StateSync"] = "stateSync";
    Table["BlockHeaders"] = "blockHeaders";
    Table["PartialBlockchainNodes"] = "partialBlockchainNodes";
    Table["Tags"] = "tags";
    Table["ForeignAccountCode"] = "foreignAccountCode";
    Table["Settings"] = "settings";
})(Table || (Table = {}));
function indexes(...items) {
    return items.join(",");
}
/** V1 baseline schema. Extracted as a constant because once migrations are enabled, this must
 *  never be modified — all schema changes should go through new version blocks instead. */
const V1_STORES = {
    [Table.AccountCode]: indexes("root"),
    [Table.LatestAccountStorage]: indexes("[accountId+slotName]", "accountId"),
    [Table.HistoricalAccountStorage]: indexes("[accountId+replacedAtNonce+slotName]", "accountId", "[accountId+replacedAtNonce]"),
    [Table.LatestStorageMapEntries]: indexes("[accountId+slotName+key]", "accountId", "[accountId+slotName]"),
    [Table.HistoricalStorageMapEntries]: indexes("[accountId+replacedAtNonce+slotName+key]", "accountId", "[accountId+replacedAtNonce]"),
    [Table.LatestAccountAssets]: indexes("[accountId+vaultKey]", "accountId"),
    [Table.HistoricalAccountAssets]: indexes("[accountId+replacedAtNonce+vaultKey]", "accountId", "[accountId+replacedAtNonce]"),
    [Table.AccountAuth]: indexes("pubKeyCommitmentHex"),
    [Table.AccountKeyMapping]: indexes("[accountIdHex+pubKeyCommitmentHex]", "accountIdHex", "pubKeyCommitmentHex"),
    [Table.LatestAccountHeaders]: indexes("&id", "accountCommitment"),
    [Table.HistoricalAccountHeaders]: indexes("&accountCommitment", "id", "[id+replacedAtNonce]"),
    [Table.Addresses]: indexes("address", "id"),
    [Table.Transactions]: indexes("id", "statusVariant"),
    [Table.TransactionScripts]: indexes("scriptRoot"),
    [Table.InputNotes]: indexes("noteId", "nullifier", "stateDiscriminant", "[consumedBlockHeight+consumedTxOrder+noteId]"),
    [Table.OutputNotes]: indexes("noteId", "recipientDigest", "stateDiscriminant", "nullifier"),
    [Table.NotesScripts]: indexes("scriptRoot"),
    [Table.StateSync]: indexes("id"),
    [Table.BlockHeaders]: indexes("blockNum", "hasClientNotes"),
    [Table.PartialBlockchainNodes]: indexes("id"),
    [Table.Tags]: indexes("id++", "tag", "sourceNoteId", "sourceAccountId"),
    [Table.ForeignAccountCode]: indexes("accountId"),
    [Table.Settings]: indexes("key"),
};
class MidenDatabase {
    dexie;
    accountCodes;
    latestAccountStorages;
    historicalAccountStorages;
    latestStorageMapEntries;
    historicalStorageMapEntries;
    latestAccountAssets;
    historicalAccountAssets;
    accountAuths;
    accountKeyMappings;
    latestAccountHeaders;
    historicalAccountHeaders;
    addresses;
    transactions;
    transactionScripts;
    inputNotes;
    outputNotes;
    notesScripts;
    stateSync;
    blockHeaders;
    partialBlockchainNodes;
    tags;
    foreignAccountCode;
    settings;
    constructor(network) {
        this.dexie = new Dexie(network);
        // --- Schema versioning ---
        //
        // NOTE: The migration system is not currently in use. The Miden network
        // resets on every upgrade, so the database is nuked whenever the client
        // version changes (see ensureClientVersion). Once the network stabilizes
        // and data can be preserved across upgrades, the version-change nuke will
        // be removed and migrations will take over.
        //
        // v1 is the baseline schema. To add a migration:
        //   1. Add a .version(N+1).stores({...}).upgrade(tx => {...}) block below.
        //      Only list tables whose indexes changed; Dexie carries forward the rest.
        //   2. Update TypeScript interfaces and the Table enum if needed.
        //   3. Add a migration test in schema.test.ts.
        //   4. Run `pnpm build` and `pnpm test`.
        //
        // The version number is a simple incrementing integer, not the client semver.
        // Use a comment to note which client version introduced the change.
        //
        // Example — adding a `createdAt` field with an index to accounts:
        //
        //   // v2: Add createdAt to accounts (client v0.7.0)
        //   this.dexie.version(2).stores({
        //       accounts: indexes("&accountCommitment", "id", ..., "createdAt"),
        //   }).upgrade(tx => {
        //       return tx.table("accounts").toCollection().modify(account => {
        //           account.createdAt = 0;
        //       });
        //   });
        //
        // Tips:
        //   - Index-only changes: omit .upgrade(). Dexie creates indexes automatically.
        //   - New table: just include it in .stores(). It starts empty.
        //   - Remove a table: set it to null, e.g. `oldTable: null`.
        //   - Never modify a previous version block. Always add a new one.
        //
        // Note: The `populate` hook (below the version blocks) only fires on
        // first database creation, NOT during upgrades.
        //
        // To enable migrations (stop nuking the DB on version change):
        //   1. Remove the nuke logic in ensureClientVersion (close/delete/open).
        //      Just persist the new version instead.
        //   2. Freeze V1_STORES — never modify it again.
        //   3. Add version(2+) blocks below for all schema changes going forward.
        this.dexie.version(1).stores(V1_STORES);
        this.accountCodes = this.dexie.table(Table.AccountCode);
        this.latestAccountStorages = this.dexie.table(Table.LatestAccountStorage);
        this.historicalAccountStorages = this.dexie.table(Table.HistoricalAccountStorage);
        this.latestStorageMapEntries = this.dexie.table(Table.LatestStorageMapEntries);
        this.historicalStorageMapEntries = this.dexie.table(Table.HistoricalStorageMapEntries);
        this.latestAccountAssets = this.dexie.table(Table.LatestAccountAssets);
        this.historicalAccountAssets = this.dexie.table(Table.HistoricalAccountAssets);
        this.accountAuths = this.dexie.table(Table.AccountAuth);
        this.accountKeyMappings = this.dexie.table(Table.AccountKeyMapping);
        this.latestAccountHeaders = this.dexie.table(Table.LatestAccountHeaders);
        this.historicalAccountHeaders = this.dexie.table(Table.HistoricalAccountHeaders);
        this.addresses = this.dexie.table(Table.Addresses);
        this.transactions = this.dexie.table(Table.Transactions);
        this.transactionScripts = this.dexie.table(Table.TransactionScripts);
        this.inputNotes = this.dexie.table(Table.InputNotes);
        this.outputNotes = this.dexie.table(Table.OutputNotes);
        this.notesScripts = this.dexie.table(Table.NotesScripts);
        this.stateSync = this.dexie.table(Table.StateSync);
        this.blockHeaders = this.dexie.table(Table.BlockHeaders);
        this.partialBlockchainNodes = this.dexie.table(Table.PartialBlockchainNodes);
        this.tags = this.dexie.table(Table.Tags);
        this.foreignAccountCode = this.dexie.table(Table.ForeignAccountCode);
        this.settings = this.dexie.table(Table.Settings);
        this.dexie.on("populate", () => {
            this.stateSync
                .put({ id: 1, blockNum: 0 })
                /* v8 ignore next 2 — populate stateSync failure requires fake-indexeddb to simulate a write error, not modelable in unit tests */
                .catch((err) => logWebStoreError(err, "Failed to populate DB"));
        });
    }
    async open(clientVersion) {
        console.log(`Opening database ${this.dexie.name} for client version ${clientVersion}...`);
        try {
            await this.dexie.open();
            await this.ensureClientVersion(clientVersion);
            console.log("Database opened successfully");
            return true;
            /* v8 ignore next 4 — logWebStoreError always re-throws, so `return false` and this catch block are unreachable */
        }
        catch (err) {
            logWebStoreError(err, "Failed to open database");
            return false;
        }
    }
    async ensureClientVersion(clientVersion) {
        if (!clientVersion) {
            console.warn("openDatabase called without a client version; skipping version enforcement.");
            return;
        }
        const storedVersion = await this.getStoredClientVersion();
        if (!storedVersion) {
            await this.persistClientVersion(clientVersion);
            return;
        }
        if (storedVersion === clientVersion) {
            return;
        }
        const validCurrent = semver.valid(clientVersion);
        const validStored = semver.valid(storedVersion);
        if (validCurrent && validStored) {
            const parsedCurrent = semver.parse(validCurrent);
            const parsedStored = semver.parse(validStored);
            const sameMajorMinor = parsedCurrent?.major === parsedStored?.major &&
                parsedCurrent?.minor === parsedStored?.minor;
            if (sameMajorMinor || !semver.gt(clientVersion, storedVersion)) {
                await this.persistClientVersion(clientVersion);
                return;
            }
        }
        else {
            console.warn(`Failed to parse semver (${storedVersion} vs ${clientVersion}), forcing store reset.`);
        }
        console.warn(`IndexedDB client version mismatch (stored=${storedVersion}, expected=${clientVersion}). Resetting store.`);
        this.dexie.close();
        await this.dexie.delete();
        await this.dexie.open();
        await this.persistClientVersion(clientVersion);
    }
    async getStoredClientVersion() {
        const record = await this.settings.get(CLIENT_VERSION_SETTING_KEY);
        if (!record) {
            return null;
        }
        return textDecoder.decode(record.value);
    }
    async persistClientVersion(clientVersion) {
        await this.settings.put({
            key: CLIENT_VERSION_SETTING_KEY,
            value: textEncoder.encode(clientVersion),
        });
    }
}

function seedToBase64(seed) {
    return seed ? uint8ArrayToBase64(seed) : undefined;
}
async function getAccountIds(dbId) {
    try {
        const db = getDatabase(dbId);
        const records = await db.latestAccountHeaders.toArray();
        return records.map((entry) => entry.id);
    }
    catch (error) {
        logWebStoreError(error, "Error while fetching account IDs");
    }
    /* v8 ignore next 2 — logWebStoreError always re-throws, making this return unreachable */
    return [];
}
async function getAllAccountHeaders(dbId) {
    try {
        const db = getDatabase(dbId);
        const records = await db.latestAccountHeaders.toArray();
        const resultObject = records.map((record) => ({
            id: record.id,
            nonce: record.nonce,
            vaultRoot: record.vaultRoot,
            storageRoot: record.storageRoot || "",
            codeRoot: record.codeRoot || "",
            accountSeed: seedToBase64(record.accountSeed),
            locked: record.locked,
            committed: record.committed,
            accountCommitment: record.accountCommitment || "",
        }));
        return resultObject;
    }
    catch (error) {
        logWebStoreError(error, "Error while fetching account headers");
    }
}
async function getAccountHeader(dbId, accountId) {
    try {
        const db = getDatabase(dbId);
        const record = await db.latestAccountHeaders
            .where("id")
            .equals(accountId)
            .first();
        if (!record) {
            console.log("No account header record found for given ID.");
            return null;
        }
        return {
            id: record.id,
            nonce: record.nonce,
            vaultRoot: record.vaultRoot,
            storageRoot: record.storageRoot,
            codeRoot: record.codeRoot,
            accountSeed: seedToBase64(record.accountSeed),
            locked: record.locked,
        };
    }
    catch (error) {
        logWebStoreError(error, `Error while fetching account header for id: ${accountId}`);
    }
}
async function getAccountHeaderByCommitment(dbId, accountCommitment) {
    try {
        const db = getDatabase(dbId);
        const record = await db.historicalAccountHeaders
            .where("accountCommitment")
            .equals(accountCommitment)
            .first();
        if (!record) {
            return undefined;
        }
        return {
            id: record.id,
            nonce: record.nonce,
            vaultRoot: record.vaultRoot,
            storageRoot: record.storageRoot,
            codeRoot: record.codeRoot,
            accountSeed: seedToBase64(record.accountSeed),
            locked: record.locked,
        };
    }
    catch (error) {
        logWebStoreError(error, `Error fetching account header for commitment ${accountCommitment}`);
    }
}
async function getAccountCode(dbId, codeRoot) {
    try {
        const db = getDatabase(dbId);
        const allMatchingRecords = await db.accountCodes
            .where("root")
            .equals(codeRoot)
            .toArray();
        const codeRecord = allMatchingRecords[0];
        if (codeRecord === undefined) {
            console.log("No records found for given code root.");
            return null;
        }
        const codeBase64 = uint8ArrayToBase64(codeRecord.code);
        return {
            root: codeRecord.root,
            code: codeBase64,
        };
    }
    catch (error) {
        logWebStoreError(error, `Error fetching account code for root ${codeRoot}`);
    }
}
async function getAccountStorage(dbId, accountId, slotNames) {
    try {
        const db = getDatabase(dbId);
        let query = db.latestAccountStorages.where("accountId").equals(accountId);
        let allMatchingRecords;
        if (slotNames.length) {
            const nameSet = new Set(slotNames);
            allMatchingRecords = await query
                .and((record) => nameSet.has(record.slotName))
                .toArray();
        }
        else {
            allMatchingRecords = await query.toArray();
        }
        return allMatchingRecords.map((record) => ({
            slotName: record.slotName,
            slotValue: record.slotValue,
            slotType: record.slotType,
        }));
    }
    catch (error) {
        logWebStoreError(error, `Error fetching account storage for account ${accountId}`);
    }
}
async function getAccountStorageMaps(dbId, accountId) {
    try {
        const db = getDatabase(dbId);
        const allMatchingRecords = await db.latestStorageMapEntries
            .where("accountId")
            .equals(accountId)
            .toArray();
        return allMatchingRecords;
    }
    catch (error) {
        logWebStoreError(error, `Error fetching account storage maps for account ${accountId}`);
    }
}
async function getAccountVaultAssets(dbId, accountId, vaultKeys) {
    try {
        const db = getDatabase(dbId);
        let query = db.latestAccountAssets.where("accountId").equals(accountId);
        let records;
        if (vaultKeys.length) {
            const keySet = new Set(vaultKeys);
            records = await query
                .and((record) => keySet.has(record.vaultKey))
                .toArray();
        }
        else {
            records = await query.toArray();
        }
        return records.map((record) => ({
            vaultKey: record.vaultKey,
            asset: record.asset,
        }));
    }
    catch (error) {
        logWebStoreError(error, `Error fetching account vault for account ${accountId}`);
    }
}
async function getAccountAddresses(dbId, accountId) {
    try {
        const db = getDatabase(dbId);
        const allMatchingRecords = await db.addresses
            .where("id")
            .equals(accountId)
            .toArray();
        if (allMatchingRecords.length === 0) {
            console.log("No address records found for given account ID.");
            return [];
        }
        return allMatchingRecords;
    }
    catch (error) {
        logWebStoreError(error, `Error while fetching account addresses for id: ${accountId}`);
    }
}
async function upsertAccountCode(dbId, codeRoot, code) {
    try {
        const db = getDatabase(dbId);
        const data = {
            root: codeRoot,
            code,
        };
        await db.accountCodes.put(data);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting code with root: ${codeRoot}`);
    }
}
async function upsertAccountStorage(dbId, accountId, storageSlots) {
    try {
        const db = getDatabase(dbId);
        await db.latestAccountStorages
            .where("accountId")
            .equals(accountId)
            .delete();
        if (storageSlots.length === 0)
            return;
        const latestEntries = storageSlots.map((slot) => ({
            accountId,
            slotName: slot.slotName,
            slotValue: slot.slotValue,
            slotType: slot.slotType,
        }));
        await db.latestAccountStorages.bulkPut(latestEntries);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting storage slots`);
    }
}
async function upsertStorageMapEntries(dbId, accountId, entries) {
    try {
        const db = getDatabase(dbId);
        await db.latestStorageMapEntries
            .where("accountId")
            .equals(accountId)
            .delete();
        if (entries.length === 0)
            return;
        const latestEntries = entries.map((entry) => ({
            accountId,
            slotName: entry.slotName,
            key: entry.key,
            value: entry.value,
        }));
        await db.latestStorageMapEntries.bulkPut(latestEntries);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting storage map entries`);
    }
}
async function upsertVaultAssets(dbId, accountId, assets) {
    try {
        const db = getDatabase(dbId);
        await db.latestAccountAssets.where("accountId").equals(accountId).delete();
        if (assets.length === 0)
            return;
        const latestEntries = assets.map((asset) => ({
            accountId,
            vaultKey: asset.vaultKey,
            asset: asset.asset,
        }));
        await db.latestAccountAssets.bulkPut(latestEntries);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting assets`);
    }
}
async function applyTransactionDelta(dbId, accountId, nonce, updatedSlots, changedMapEntries, changedAssets, codeRoot, storageRoot, vaultRoot, committed, commitment) {
    try {
        const db = getDatabase(dbId);
        await db.dexie.transaction("rw", [
            db.latestAccountStorages,
            db.historicalAccountStorages,
            db.latestStorageMapEntries,
            db.historicalStorageMapEntries,
            db.latestAccountAssets,
            db.historicalAccountAssets,
            db.latestAccountHeaders,
            db.historicalAccountHeaders,
        ], async () => {
            // Apply storage delta: read old → archive → write new
            for (const slot of updatedSlots) {
                const oldSlot = await db.latestAccountStorages
                    .where("[accountId+slotName]")
                    .equals([accountId, slot.slotName])
                    .first();
                await db.historicalAccountStorages.put({
                    accountId,
                    replacedAtNonce: nonce,
                    slotName: slot.slotName,
                    oldSlotValue: oldSlot?.slotValue ?? null,
                    slotType: slot.slotType,
                });
                await db.latestAccountStorages.put({
                    accountId,
                    slotName: slot.slotName,
                    slotValue: slot.slotValue,
                    slotType: slot.slotType,
                });
            }
            // Process map entries: read old → archive → update latest
            for (const entry of changedMapEntries) {
                const oldEntry = await db.latestStorageMapEntries
                    .where("[accountId+slotName+key]")
                    .equals([accountId, entry.slotName, entry.key])
                    .first();
                await db.historicalStorageMapEntries.put({
                    accountId,
                    replacedAtNonce: nonce,
                    slotName: entry.slotName,
                    key: entry.key,
                    oldValue: oldEntry?.value ?? null,
                });
                // "" means removal
                if (entry.value === "") {
                    await db.latestStorageMapEntries
                        .where("[accountId+slotName+key]")
                        .equals([accountId, entry.slotName, entry.key])
                        .delete();
                }
                else {
                    await db.latestStorageMapEntries.put({
                        accountId,
                        slotName: entry.slotName,
                        key: entry.key,
                        value: entry.value,
                    });
                }
            }
            // Apply vault delta: read old → archive → update latest
            for (const entry of changedAssets) {
                const oldAsset = await db.latestAccountAssets
                    .where("[accountId+vaultKey]")
                    .equals([accountId, entry.vaultKey])
                    .first();
                await db.historicalAccountAssets.put({
                    accountId,
                    replacedAtNonce: nonce,
                    vaultKey: entry.vaultKey,
                    oldAsset: oldAsset?.asset ?? null,
                });
                // "" means removal
                if (entry.asset === "") {
                    await db.latestAccountAssets
                        .where("[accountId+vaultKey]")
                        .equals([accountId, entry.vaultKey])
                        .delete();
                }
                else {
                    await db.latestAccountAssets.put({
                        accountId,
                        vaultKey: entry.vaultKey,
                        asset: entry.asset,
                    });
                }
            }
            // Archive old header and write new header
            const oldHeader = await db.latestAccountHeaders
                .where("id")
                .equals(accountId)
                .first();
            if (oldHeader) {
                await db.historicalAccountHeaders.put({
                    id: accountId,
                    replacedAtNonce: nonce,
                    codeRoot: oldHeader.codeRoot,
                    storageRoot: oldHeader.storageRoot,
                    vaultRoot: oldHeader.vaultRoot,
                    nonce: oldHeader.nonce,
                    committed: oldHeader.committed,
                    accountSeed: oldHeader.accountSeed,
                    accountCommitment: oldHeader.accountCommitment,
                    locked: oldHeader.locked,
                });
            }
            await db.latestAccountHeaders.put({
                id: accountId,
                codeRoot,
                storageRoot,
                vaultRoot,
                nonce,
                committed,
                accountSeed: undefined,
                accountCommitment: commitment,
                locked: false,
            });
        });
    }
    catch (error) {
        logWebStoreError(error, `Error applying transaction delta`);
    }
}
async function archiveAndReplaceStorageSlots(db, accountId, nonce, newSlots) {
    const oldSlots = await db.latestAccountStorages
        .where("accountId")
        .equals(accountId)
        .toArray();
    // Archive every old slot
    for (const slot of oldSlots) {
        await db.historicalAccountStorages.put({
            accountId,
            replacedAtNonce: nonce,
            slotName: slot.slotName,
            oldSlotValue: slot.slotValue,
            slotType: slot.slotType,
        });
    }
    // Write NULL markers for genuinely new slots (no old value to archive)
    const oldSlotNames = new Set(oldSlots.map((s) => s.slotName));
    for (const slot of newSlots) {
        if (!oldSlotNames.has(slot.slotName)) {
            await db.historicalAccountStorages.put({
                accountId,
                replacedAtNonce: nonce,
                slotName: slot.slotName,
                oldSlotValue: null,
                slotType: slot.slotType,
            });
        }
    }
    // Replace latest
    await db.latestAccountStorages.where("accountId").equals(accountId).delete();
    if (newSlots.length > 0) {
        await db.latestAccountStorages.bulkPut(newSlots.map((slot) => ({
            accountId,
            slotName: slot.slotName,
            slotValue: slot.slotValue,
            slotType: slot.slotType,
        })));
    }
}
async function archiveAndReplaceMapEntries(db, accountId, nonce, newEntries) {
    const oldEntries = await db.latestStorageMapEntries
        .where("accountId")
        .equals(accountId)
        .toArray();
    for (const entry of oldEntries) {
        await db.historicalStorageMapEntries.put({
            accountId,
            replacedAtNonce: nonce,
            slotName: entry.slotName,
            key: entry.key,
            oldValue: entry.value,
        });
    }
    const oldKeys = new Set(oldEntries.map((e) => `${e.slotName}\0${e.key}`));
    for (const entry of newEntries) {
        if (!oldKeys.has(`${entry.slotName}\0${entry.key}`)) {
            await db.historicalStorageMapEntries.put({
                accountId,
                replacedAtNonce: nonce,
                slotName: entry.slotName,
                key: entry.key,
                oldValue: null,
            });
        }
    }
    await db.latestStorageMapEntries
        .where("accountId")
        .equals(accountId)
        .delete();
    if (newEntries.length > 0) {
        await db.latestStorageMapEntries.bulkPut(newEntries.map((entry) => ({
            accountId,
            slotName: entry.slotName,
            key: entry.key,
            value: entry.value,
        })));
    }
}
async function archiveAndReplaceVaultAssets(db, accountId, nonce, newAssets) {
    const oldAssets = await db.latestAccountAssets
        .where("accountId")
        .equals(accountId)
        .toArray();
    for (const asset of oldAssets) {
        await db.historicalAccountAssets.put({
            accountId,
            replacedAtNonce: nonce,
            vaultKey: asset.vaultKey,
            oldAsset: asset.asset,
        });
    }
    const oldKeys = new Set(oldAssets.map((a) => a.vaultKey));
    for (const asset of newAssets) {
        if (!oldKeys.has(asset.vaultKey)) {
            await db.historicalAccountAssets.put({
                accountId,
                replacedAtNonce: nonce,
                vaultKey: asset.vaultKey,
                oldAsset: null,
            });
        }
    }
    await db.latestAccountAssets.where("accountId").equals(accountId).delete();
    if (newAssets.length > 0) {
        await db.latestAccountAssets.bulkPut(newAssets.map((asset) => ({
            accountId,
            vaultKey: asset.vaultKey,
            asset: asset.asset,
        })));
    }
}
async function restoreSlotsFromHistorical(db, accountId, nonce) {
    const oldSlots = await db.historicalAccountStorages
        .where("[accountId+replacedAtNonce]")
        .equals([accountId, nonce])
        .toArray();
    for (const slot of oldSlots) {
        if (slot.oldSlotValue !== null) {
            await db.latestAccountStorages.put({
                accountId: slot.accountId,
                slotName: slot.slotName,
                slotValue: slot.oldSlotValue,
                slotType: slot.slotType,
            });
        }
        else {
            await db.latestAccountStorages
                .where("[accountId+slotName]")
                .equals([accountId, slot.slotName])
                .delete();
        }
    }
}
async function restoreMapEntriesFromHistorical(db, accountId, nonce) {
    const oldEntries = await db.historicalStorageMapEntries
        .where("[accountId+replacedAtNonce]")
        .equals([accountId, nonce])
        .toArray();
    for (const entry of oldEntries) {
        if (entry.oldValue !== null) {
            await db.latestStorageMapEntries.put({
                accountId: entry.accountId,
                slotName: entry.slotName,
                key: entry.key,
                value: entry.oldValue,
            });
        }
        else {
            await db.latestStorageMapEntries
                .where("[accountId+slotName+key]")
                .equals([accountId, entry.slotName, entry.key])
                .delete();
        }
    }
}
async function restoreAssetsFromHistorical(db, accountId, nonce) {
    const oldAssets = await db.historicalAccountAssets
        .where("[accountId+replacedAtNonce]")
        .equals([accountId, nonce])
        .toArray();
    for (const asset of oldAssets) {
        if (asset.oldAsset !== null) {
            await db.latestAccountAssets.put({
                accountId: asset.accountId,
                vaultKey: asset.vaultKey,
                asset: asset.oldAsset,
            });
        }
        else {
            await db.latestAccountAssets
                .where("[accountId+vaultKey]")
                .equals([accountId, asset.vaultKey])
                .delete();
        }
    }
}
/**
 * Replaces an account's full state (storage, map entries, vault assets, header)
 * with a new snapshot. Before overwriting, all current latest values are archived
 * to historical.
 */
async function applyFullAccountState(dbId, accountState) {
    try {
        const db = getDatabase(dbId);
        const { accountId, nonce, storageSlots, storageMapEntries, assets, codeRoot, storageRoot, vaultRoot, committed, accountCommitment, accountSeed, } = accountState;
        await db.dexie.transaction("rw", [
            db.latestAccountStorages,
            db.historicalAccountStorages,
            db.latestStorageMapEntries,
            db.historicalStorageMapEntries,
            db.latestAccountAssets,
            db.historicalAccountAssets,
            db.latestAccountHeaders,
            db.historicalAccountHeaders,
        ], async () => {
            // Archive: save current latest values to historical (so they can be
            // restored on undo), then replace latest with the new state.
            await archiveAndReplaceStorageSlots(db, accountId, nonce, storageSlots);
            await archiveAndReplaceMapEntries(db, accountId, nonce, storageMapEntries);
            await archiveAndReplaceVaultAssets(db, accountId, nonce, assets);
            // Archive old header and write new header
            const oldHeader = await db.latestAccountHeaders
                .where("id")
                .equals(accountId)
                .first();
            if (oldHeader) {
                await db.historicalAccountHeaders.put({
                    id: accountId,
                    replacedAtNonce: nonce,
                    codeRoot: oldHeader.codeRoot,
                    storageRoot: oldHeader.storageRoot,
                    vaultRoot: oldHeader.vaultRoot,
                    nonce: oldHeader.nonce,
                    committed: oldHeader.committed,
                    accountSeed: oldHeader.accountSeed,
                    accountCommitment: oldHeader.accountCommitment,
                    locked: oldHeader.locked,
                });
            }
            await db.latestAccountHeaders.put({
                id: accountId,
                codeRoot,
                storageRoot,
                vaultRoot,
                nonce,
                committed,
                accountSeed,
                accountCommitment,
                locked: false,
            });
        });
    }
    catch (error) {
        logWebStoreError(error, `Error applying full account state`);
    }
}
async function upsertAccountRecord(dbId, accountId, codeRoot, storageRoot, vaultRoot, nonce, committed, commitment, accountSeed) {
    try {
        const db = getDatabase(dbId);
        const data = {
            id: accountId,
            codeRoot,
            storageRoot,
            vaultRoot,
            nonce,
            committed,
            accountSeed,
            accountCommitment: commitment,
            locked: false,
        };
        await db.latestAccountHeaders.put(data);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting account: ${accountId}`);
    }
}
async function insertAccountAddress(dbId, accountId, address) {
    try {
        const db = getDatabase(dbId);
        const data = {
            id: accountId,
            address,
        };
        await db.addresses.put(data);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting address with value: ${String(address)} for the account ID ${accountId}`);
    }
}
async function removeAccountAddress(dbId, address) {
    try {
        const db = getDatabase(dbId);
        await db.addresses.where("address").equals(address).delete();
    }
    catch (error) {
        logWebStoreError(error, `Error removing address with value: ${String(address)}`);
    }
}
async function upsertForeignAccountCode(dbId, accountId, code, codeRoot) {
    try {
        const db = getDatabase(dbId);
        await upsertAccountCode(dbId, codeRoot, code);
        const data = {
            accountId,
            codeRoot,
        };
        await db.foreignAccountCode.put(data);
    }
    catch (error) {
        logWebStoreError(error, `Error upserting foreign account code for account: ${accountId}`);
    }
}
async function getForeignAccountCode(dbId, accountIds) {
    try {
        const db = getDatabase(dbId);
        const foreignAccounts = await db.foreignAccountCode
            .where("accountId")
            .anyOf(accountIds)
            .toArray();
        if (foreignAccounts.length === 0) {
            console.log("No records found for the given account IDs.");
            return null;
        }
        const codeRoots = foreignAccounts.map((account) => account.codeRoot);
        const accountCode = await db.accountCodes
            .where("root")
            .anyOf(codeRoots)
            .toArray();
        const processedCode = foreignAccounts
            .map((foreignAccount) => {
            const matchingCode = accountCode.find((code) => code.root === foreignAccount.codeRoot);
            if (matchingCode === undefined) {
                return undefined;
            }
            const codeBase64 = uint8ArrayToBase64(matchingCode.code);
            return {
                accountId: foreignAccount.accountId,
                code: codeBase64,
            };
        })
            .filter((matchingCode) => matchingCode !== undefined);
        return processedCode;
    }
    catch (error) {
        logWebStoreError(error, "Error fetching foreign account code");
    }
}
async function lockAccount(dbId, accountId) {
    try {
        const db = getDatabase(dbId);
        await db.latestAccountHeaders
            .where("id")
            .equals(accountId)
            .modify({ locked: true });
        // Also lock historical rows so that undo/rebuild preserves the lock.
        await db.historicalAccountHeaders
            .where("id")
            .equals(accountId)
            .modify({ locked: true });
    }
    catch (error) {
        logWebStoreError(error, `Error locking account: ${accountId}`);
    }
}
/**
 * Prunes historical account states for a single account up to the given nonce.
 *
 * Deletes all historical entries with `replacedAtNonce <= upToNonce` and any
 * orphaned account code. Mirrors the SQLite implementation.
 */
async function pruneAccountHistory(dbId, accountId, upToNonce) {
    try {
        const db = getDatabase(dbId);
        let totalDeleted = 0;
        const boundaryNonce = BigInt(upToNonce);
        await db.dexie.transaction("rw", [
            db.historicalAccountHeaders,
            db.historicalAccountStorages,
            db.historicalStorageMapEntries,
            db.historicalAccountAssets,
            db.accountCodes,
            db.latestAccountHeaders,
            db.foreignAccountCode,
        ], async () => {
            // Nonces are stored as strings so we cannot use index range queries
            // (lexicographic ordering would be wrong). Filter in JS instead.
            const headers = await db.historicalAccountHeaders
                .where("id")
                .equals(accountId)
                .toArray();
            const toPrune = headers.filter((h) => BigInt(h.replacedAtNonce) <= boundaryNonce);
            // Collect code roots from headers we are about to delete.
            const candidateCodeRoots = new Set(toPrune.map((h) => h.codeRoot));
            for (const h of toPrune) {
                await db.historicalAccountHeaders
                    .where("accountCommitment")
                    .equals(h.accountCommitment)
                    .delete();
                const rat = h.replacedAtNonce;
                totalDeleted += 1;
                totalDeleted += await db.historicalAccountStorages
                    .where("[accountId+replacedAtNonce]")
                    .equals([accountId, rat])
                    .delete();
                totalDeleted += await db.historicalStorageMapEntries
                    .where("[accountId+replacedAtNonce]")
                    .equals([accountId, rat])
                    .delete();
                totalDeleted += await db.historicalAccountAssets
                    .where("[accountId+replacedAtNonce]")
                    .equals([accountId, rat])
                    .delete();
            }
            // Delete orphaned code: only check roots from the deleted headers,
            // and only if they are not referenced by any remaining header or foreign code.
            if (candidateCodeRoots.size > 0) {
                const latestHeaders = await db.latestAccountHeaders.toArray();
                const remainingHistorical = await db.historicalAccountHeaders.toArray();
                const foreignCodes = await db.foreignAccountCode.toArray();
                const referencedCodeRoots = new Set();
                for (const h of latestHeaders)
                    referencedCodeRoots.add(h.codeRoot);
                for (const h of remainingHistorical)
                    referencedCodeRoots.add(h.codeRoot);
                for (const f of foreignCodes)
                    referencedCodeRoots.add(f.codeRoot);
                for (const root of candidateCodeRoots) {
                    if (!referencedCodeRoots.has(root)) {
                        await db.accountCodes.where("root").equals(root).delete();
                        totalDeleted += 1;
                    }
                }
            }
        });
        return totalDeleted;
    }
    catch (error) {
        logWebStoreError(error, `Error pruning account history for ${accountId}`);
        throw error;
    }
}
/**
 * Undoes discarded account states by restoring old values from historical
 * back to latest. Non-null old values overwrite latest; null old values
 * (entries that didn't exist before that nonce) cause deletion from latest.
 */
async function undoAccountStates(dbId, accountCommitments) {
    try {
        const db = getDatabase(dbId);
        await db.dexie.transaction("rw", [
            db.latestAccountStorages,
            db.historicalAccountStorages,
            db.latestStorageMapEntries,
            db.historicalStorageMapEntries,
            db.latestAccountAssets,
            db.historicalAccountAssets,
            db.latestAccountHeaders,
            db.historicalAccountHeaders,
        ], async () => {
            // Step 1: Resolve nonces from both latest and historical headers
            const accountNonces = new Map();
            for (const commitment of accountCommitments) {
                const latestRecord = await db.latestAccountHeaders
                    .where("accountCommitment")
                    .equals(commitment)
                    .first();
                if (latestRecord) {
                    if (!accountNonces.has(latestRecord.id)) {
                        accountNonces.set(latestRecord.id, new Set());
                    }
                    accountNonces.get(latestRecord.id).add(latestRecord.nonce);
                    continue;
                }
                const histRecord = await db.historicalAccountHeaders
                    .where("accountCommitment")
                    .equals(commitment)
                    .first();
                if (histRecord) {
                    if (!accountNonces.has(histRecord.id)) {
                        accountNonces.set(histRecord.id, new Set());
                    }
                    accountNonces.get(histRecord.id).add(histRecord.nonce);
                }
            }
            // Step 2: Group nonces by account, sort descending (undo most recent first).
            // Descending order is needed because each nonce's old value is the state before
            // that nonce — processing most recent first lets earlier nonces overwrite with
            // the correct final value.
            for (const [accountId, nonces] of accountNonces) {
                const sortedNonces = [...nonces].sort((a, b) => Number(BigInt(b) - BigInt(a)));
                // Step 3: Restore old values from historical back to latest, undoing
                // each nonce in descending order. Non-null old values overwrite latest;
                // null old values (entries that didn't exist before) cause deletion.
                for (const nonce of sortedNonces) {
                    await restoreSlotsFromHistorical(db, accountId, nonce);
                    await restoreMapEntriesFromHistorical(db, accountId, nonce);
                    await restoreAssetsFromHistorical(db, accountId, nonce);
                }
                // Step 4: Restore old header from the earliest discarded nonce
                const minNonce = sortedNonces[sortedNonces.length - 1];
                const oldHeader = await db.historicalAccountHeaders
                    .where("[id+replacedAtNonce]")
                    .equals([accountId, minNonce])
                    .first();
                if (oldHeader) {
                    await db.latestAccountHeaders.put({
                        id: oldHeader.id,
                        codeRoot: oldHeader.codeRoot,
                        storageRoot: oldHeader.storageRoot,
                        vaultRoot: oldHeader.vaultRoot,
                        nonce: oldHeader.nonce,
                        committed: oldHeader.committed,
                        accountSeed: oldHeader.accountSeed,
                        accountCommitment: oldHeader.accountCommitment,
                        locked: oldHeader.locked,
                    });
                }
                else {
                    // No previous state — delete the account entirely
                    await db.latestAccountHeaders
                        .where("id")
                        .equals(accountId)
                        .delete();
                    await db.latestAccountStorages
                        .where("accountId")
                        .equals(accountId)
                        .delete();
                    await db.latestStorageMapEntries
                        .where("accountId")
                        .equals(accountId)
                        .delete();
                    await db.latestAccountAssets
                        .where("accountId")
                        .equals(accountId)
                        .delete();
                }
                // Step 5: Delete consumed historical entries at discarded nonces
                for (const nonce of sortedNonces) {
                    await db.historicalAccountStorages
                        .where("[accountId+replacedAtNonce]")
                        .equals([accountId, nonce])
                        .delete();
                    await db.historicalStorageMapEntries
                        .where("[accountId+replacedAtNonce]")
                        .equals([accountId, nonce])
                        .delete();
                    await db.historicalAccountAssets
                        .where("[accountId+replacedAtNonce]")
                        .equals([accountId, nonce])
                        .delete();
                    await db.historicalAccountHeaders
                        .where("[id+replacedAtNonce]")
                        .equals([accountId, nonce])
                        .delete();
                }
            }
        });
    }
    catch (error) {
        logWebStoreError(error, `Error undoing account states: ${accountCommitments.join(",")}`);
        throw error;
    }
}

async function insertAccountAuth(dbId, pubKeyCommitmentHex, secretKey) {
    try {
        const db = getDatabase(dbId);
        const data = {
            pubKeyCommitmentHex,
            secretKeyHex: secretKey,
        };
        await db.accountAuths.add(data);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting account auth for pubKey: ${pubKeyCommitmentHex}`);
    }
}
async function getAccountAuthByPubKeyCommitment(dbId, pubKeyCommitmentHex) {
    const db = getDatabase(dbId);
    const accountSecretKey = await db.accountAuths
        .where("pubKeyCommitmentHex")
        .equals(pubKeyCommitmentHex)
        .first();
    if (!accountSecretKey) {
        throw new Error("Account auth not found in cache.");
    }
    const data = {
        secretKey: accountSecretKey.secretKeyHex,
    };
    return data;
}
async function removeAccountAuth(dbId, pubKeyCommitmentHex) {
    try {
        const db = getDatabase(dbId);
        await db.accountAuths
            .where("pubKeyCommitmentHex")
            .equals(pubKeyCommitmentHex)
            .delete();
    }
    catch (error) {
        logWebStoreError(error, `Error removing account auth for pubKey: ${pubKeyCommitmentHex}`);
    }
}
async function insertAccountKeyMapping(dbId, accountIdHex, pubKeyCommitmentHex) {
    try {
        const db = getDatabase(dbId);
        const data = {
            accountIdHex,
            pubKeyCommitmentHex,
        };
        await db.accountKeyMappings.put(data);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting account key mapping for account ${accountIdHex} and key ${pubKeyCommitmentHex}`);
    }
}
async function getKeyCommitmentsByAccountId(dbId, accountIdHex) {
    try {
        const db = getDatabase(dbId);
        const mappings = await db.accountKeyMappings
            .where("accountIdHex")
            .equals(accountIdHex)
            .toArray();
        return mappings.map((mapping) => mapping.pubKeyCommitmentHex);
    }
    catch (error) {
        logWebStoreError(error, `Error getting key commitments for account: ${accountIdHex}`);
        return [];
    }
}
async function removeAllMappingsForKey(dbId, pubKeyCommitmentHex) {
    try {
        const db = getDatabase(dbId);
        await db.accountKeyMappings
            .where("pubKeyCommitmentHex")
            .equals(pubKeyCommitmentHex)
            .delete();
    }
    catch (error) {
        logWebStoreError(error, `Error removing all mappings for key: ${pubKeyCommitmentHex}`);
    }
}
async function getAccountIdByKeyCommitment(dbId, pubKeyCommitmentHex) {
    try {
        const db = getDatabase(dbId);
        const mapping = await db.accountKeyMappings
            .where("pubKeyCommitmentHex")
            .equals(pubKeyCommitmentHex)
            .first();
        return mapping?.accountIdHex ?? null;
    }
    catch (error) {
        logWebStoreError(error, `Error fetching account by public key commitment: ${pubKeyCommitmentHex}`);
        return null;
    }
}

async function insertBlockHeader(dbId, blockNum, header, partialBlockchainPeaks, hasClientNotes) {
    try {
        const db = getDatabase(dbId);
        const data = {
            blockNum: blockNum,
            header,
            partialBlockchainPeaks,
            hasClientNotes: hasClientNotes.toString(),
        };
        // Mirror SQLite's `insert_block_header_tx`: do an INSERT OR IGNORE on the
        // row, then explicitly upgrade `has_client_notes` to true if the caller
        // says so. Two callers hit this:
        //   - Genesis flow — no existing row; the add succeeds.
        //   - `get_and_store_authenticated_block` for a past block — a row
        //     written by `applyStateSync` typically already exists. Overwriting
        //     it would clobber the correct historical peaks (popcount ==
        //     block_num) with peaks from the caller's current `PartialMmr`
        //     forest (popcount == current sync height). Later reads of those
        //     peaks trip `MmrPeaks::new`'s InvalidPeaks validation and wedge
        //     sync for the rest of the session.
        //
        // The `has_client_notes` upgrade is load-bearing: `get_tracked_block_
        // header_numbers` filters by this flag to seed `tracked_leaves`, which
        // `get_partial_blockchain_nodes(Forest)` relies on. A private-note
        // import at a block previously synced as irrelevant must flip the flag
        // to true or the auth paths won't be tracked.
        await db.blockHeaders.add(data).catch(async (err) => {
            if (!isConstraintError(err))
                throw err;
            if (hasClientNotes) {
                await db.blockHeaders.update(blockNum, { hasClientNotes: "true" });
            }
        });
    }
    catch (err) {
        logWebStoreError(err);
    }
}
/** Detect Dexie's primary-key collision error across sync + bulk wrappings. */
function isConstraintError(err) {
    const e = err;
    return e?.name === "ConstraintError" || e?.inner?.name === "ConstraintError";
}
async function insertPartialBlockchainNodes(dbId, ids, nodes) {
    try {
        const db = getDatabase(dbId);
        if (ids.length !== nodes.length) {
            throw new Error("ids and nodes arrays must be of the same length");
        }
        if (ids.length === 0) {
            return;
        }
        const data = nodes.map((node, index) => ({
            id: Number(ids[index]),
            node: node,
        }));
        await db.partialBlockchainNodes.bulkPut(data);
    }
    catch (err) {
        logWebStoreError(err, "Failed to insert partial blockchain nodes");
    }
}
async function getBlockHeaders(dbId, blockNumbers) {
    try {
        const db = getDatabase(dbId);
        const results = await db.blockHeaders.bulkGet(blockNumbers);
        const processedResults = await Promise.all(results.map((result) => {
            if (result === undefined) {
                return null;
            }
            else {
                const headerBase64 = uint8ArrayToBase64(result.header);
                const partialBlockchainPeaksBase64 = uint8ArrayToBase64(result.partialBlockchainPeaks);
                return {
                    blockNum: result.blockNum,
                    header: headerBase64,
                    partialBlockchainPeaks: partialBlockchainPeaksBase64,
                    hasClientNotes: result.hasClientNotes === "true",
                };
            }
        }));
        return processedResults;
    }
    catch (err) {
        logWebStoreError(err, "Failed to get block headers");
    }
}
async function getTrackedBlockHeaders(dbId) {
    try {
        const db = getDatabase(dbId);
        const allMatchingRecords = await db.blockHeaders
            .where("hasClientNotes")
            .equals("true")
            .toArray();
        const processedRecords = await Promise.all(allMatchingRecords.map((record) => {
            const headerBase64 = uint8ArrayToBase64(record.header);
            const partialBlockchainPeaksBase64 = uint8ArrayToBase64(record.partialBlockchainPeaks);
            return {
                blockNum: record.blockNum,
                header: headerBase64,
                partialBlockchainPeaks: partialBlockchainPeaksBase64,
                hasClientNotes: record.hasClientNotes === "true",
            };
        }));
        return processedRecords;
    }
    catch (err) {
        logWebStoreError(err, "Failed to get tracked block headers");
    }
}
async function getTrackedBlockHeaderNumbers(dbId) {
    try {
        const db = getDatabase(dbId);
        const blockNums = await db.blockHeaders
            .where("hasClientNotes")
            .equals("true")
            .primaryKeys();
        return blockNums;
    }
    catch (err) {
        logWebStoreError(err, "Failed to get tracked block header numbers");
    }
}
async function getPartialBlockchainPeaksByBlockNum(dbId, blockNum) {
    try {
        const db = getDatabase(dbId);
        const blockHeader = await db.blockHeaders.get(blockNum);
        if (blockHeader == undefined) {
            return {
                peaks: undefined,
            };
        }
        const partialBlockchainPeaksBase64 = uint8ArrayToBase64(blockHeader.partialBlockchainPeaks);
        return {
            peaks: partialBlockchainPeaksBase64,
        };
    }
    catch (err) {
        logWebStoreError(err, "Failed to get partial blockchain peaks");
    }
}
async function getPartialBlockchainNodesAll(dbId) {
    try {
        const db = getDatabase(dbId);
        const partialBlockchainNodesAll = await db.partialBlockchainNodes.toArray();
        return partialBlockchainNodesAll;
    }
    catch (err) {
        logWebStoreError(err, "Failed to get partial blockchain nodes");
    }
}
async function getPartialBlockchainNodes(dbId, ids) {
    try {
        const db = getDatabase(dbId);
        const numericIds = ids.map((id) => Number(id));
        const results = await db.partialBlockchainNodes.bulkGet(numericIds);
        // bulkGet returns undefined for missing keys — filter them out so the
        // Rust deserializer does not choke on undefined values.
        return results.filter((r) => r !== undefined);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get partial blockchain nodes");
    }
}
async function getPartialBlockchainNodesUpToInOrderIndex(dbId, maxInOrderIndex) {
    try {
        const db = getDatabase(dbId);
        const maxNumericId = Number(maxInOrderIndex);
        const results = await db.partialBlockchainNodes
            .where("id")
            .belowOrEqual(maxNumericId)
            .toArray();
        return results;
    }
    catch (err) {
        logWebStoreError(err, "Failed to get partial blockchain nodes up to index");
    }
}
async function pruneIrrelevantBlocks(dbId) {
    try {
        const db = getDatabase(dbId);
        const syncHeight = await db.stateSync.get(1);
        if (syncHeight == undefined) {
            throw Error("SyncHeight is undefined -- is the state sync table empty?");
        }
        const allMatchingRecords = await db.blockHeaders
            .where("hasClientNotes")
            .equals("false")
            .and((record) => record.blockNum !== 0 && record.blockNum !== syncHeight.blockNum)
            .toArray();
        await db.blockHeaders.bulkDelete(allMatchingRecords.map((r) => r.blockNum));
    }
    catch (err) {
        logWebStoreError(err, "Failed to prune irrelevant blocks");
    }
}

// Disabling `any` checks since this file mostly deals with exporting DB types.
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-unsafe-return */
/* eslint-disable  @typescript-eslint/no-unsafe-assignment */
async function recursivelyTransformForExport(obj) {
    switch (obj.type) {
        case "Uint8Array":
            return {
                __type: "Uint8Array",
                data: uint8ArrayToBase64(obj.value),
            };
        case "Blob":
            return {
                __type: "Blob",
                data: uint8ArrayToBase64(new Uint8Array(await obj.value.arrayBuffer())),
            };
        case "Array":
            return await Promise.all(obj.value.map((v) => recursivelyTransformForExport({ type: getInputType(v), value: v })));
        case "Record":
            return Object.fromEntries(await Promise.all(Object.entries(obj.value).map(async ([key, value]) => [
                key,
                await recursivelyTransformForExport({
                    type: getInputType(value),
                    value,
                }),
            ])));
        case "Primitive":
            return obj.value;
    }
}
function getInputType(value) {
    if (value instanceof Uint8Array)
        return "Uint8Array";
    if (value instanceof Blob)
        return "Blob";
    if (Array.isArray(value))
        return "Array";
    if (value && typeof value === "object")
        return "Record";
    return "Primitive";
}
async function transformForExport(obj) {
    return recursivelyTransformForExport({ type: getInputType(obj), value: obj });
}
async function exportStore(dbId) {
    const db = getDatabase(dbId);
    const dbJson = {};
    for (const table of db.dexie.tables) {
        const records = await table.toArray();
        dbJson[table.name] = await Promise.all(records.map(transformForExport));
    }
    return JSON.stringify(dbJson);
}

// Disabling `any` checks since this file mostly deals
// with importing DB types and we're testing this which
// should be enough + the TS compiler.
/* eslint-disable */
async function recursivelyTransformForImport(obj) {
    switch (obj.type) {
        case "Blob":
            return new Blob([base64ToUint8Array(obj.value.data)]);
        case "Uint8Array":
            return base64ToUint8Array(obj.value.data);
        case "Array":
            return await Promise.all(obj.value.map((v) => recursivelyTransformForImport({ type: getImportType(v), value: v })));
        case "Object":
            return Object.fromEntries(await Promise.all(Object.entries(obj.value).map(async ([key, value]) => [
                key,
                await recursivelyTransformForImport({
                    type: getImportType(value),
                    value,
                }),
            ])));
        case "Primitive":
            return obj.value;
    }
}
function getImportType(value) {
    if (value && typeof value === "object" && value.__type === "Blob") {
        return "Blob";
    }
    if (value && typeof value === "object" && value.__type === "Uint8Array") {
        return "Uint8Array";
    }
    if (Array.isArray(value))
        return "Array";
    if (value && typeof value === "object")
        return "Object";
    return "Primitive";
}
async function transformForImport(obj) {
    return recursivelyTransformForImport({
        type: getImportType(obj),
        value: obj,
    });
}
async function forceImportStore(dbId, jsonStr) {
    try {
        const db = getDatabase(dbId);
        let dbJson = JSON.parse(jsonStr);
        if (typeof dbJson === "string") {
            dbJson = JSON.parse(dbJson);
        }
        const jsonTableNames = Object.keys(dbJson);
        const dbTableNames = db.dexie.tables.map((t) => t.name);
        if (jsonTableNames.length === 0) {
            throw new Error("No tables found in the provided JSON.");
        }
        await db.dexie.transaction("rw", dbTableNames, async () => {
            await Promise.all(db.dexie.tables.map((t) => t.clear()));
            for (const tableName of jsonTableNames) {
                const table = db.dexie.table(tableName);
                if (!dbTableNames.includes(tableName)) {
                    console.warn(`Table "${tableName}" does not exist in the database schema. Skipping.`);
                    continue;
                }
                const records = dbJson[tableName];
                const transformedRecords = await Promise.all(records.map(transformForImport));
                await table.bulkPut(transformedRecords);
            }
        });
        console.log("Store imported successfully.");
    }
    catch (err) {
        logWebStoreError(err);
    }
}
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function getOutputNotes(dbId, states) {
    try {
        const db = getDatabase(dbId);
        let notes = states.length == 0
            ? await db.outputNotes.toArray()
            : await db.outputNotes
                .where("stateDiscriminant")
                .anyOf(states)
                .toArray();
        return await processOutputNotes(notes);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get output notes");
    }
}
async function getInputNotes(dbId, states) {
    try {
        const db = getDatabase(dbId);
        let notes;
        if (states.length === 0) {
            notes = await db.inputNotes.toArray();
        }
        else {
            notes = await db.inputNotes
                .where("stateDiscriminant")
                .anyOf(states)
                .toArray();
        }
        return await processInputNotes(dbId, notes);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get input notes");
    }
}
async function getInputNotesFromIds(dbId, noteIds) {
    try {
        const db = getDatabase(dbId);
        let notes = await db.inputNotes.where("noteId").anyOf(noteIds).toArray();
        return await processInputNotes(dbId, notes);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get input notes from IDs");
    }
}
async function getInputNotesFromNullifiers(dbId, nullifiers) {
    try {
        const db = getDatabase(dbId);
        let notes = await db.inputNotes
            .where("nullifier")
            .anyOf(nullifiers)
            .toArray();
        return await processInputNotes(dbId, notes);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get input notes from nullifiers");
    }
}
async function getOutputNotesFromNullifiers(dbId, nullifiers) {
    try {
        const db = getDatabase(dbId);
        let notes = await db.outputNotes
            .where("nullifier")
            .anyOf(nullifiers)
            .toArray();
        return await processOutputNotes(notes);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get output notes from nullifiers");
    }
}
async function getOutputNotesFromIds(dbId, noteIds) {
    try {
        const db = getDatabase(dbId);
        let notes = await db.outputNotes.where("noteId").anyOf(noteIds).toArray();
        return await processOutputNotes(notes);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get output notes from IDs");
    }
}
async function getUnspentInputNoteNullifiers(dbId) {
    try {
        const db = getDatabase(dbId);
        const notes = await db.inputNotes
            .where("stateDiscriminant")
            .anyOf([2, 4, 5])
            .toArray();
        return notes.map((note) => note.nullifier);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get unspent input note nullifiers");
    }
}
async function getNoteScript(dbId, scriptRoot) {
    try {
        const db = getDatabase(dbId);
        const noteScript = await db.notesScripts
            .where("scriptRoot")
            .equals(scriptRoot)
            .first();
        return noteScript;
    }
    catch (err) {
        logWebStoreError(err, "Failed to get note script from root");
    }
}
async function upsertInputNote(dbId, noteId, assets, serialNumber, inputs, scriptRoot, serializedNoteScript, nullifier, serializedCreatedAt, stateDiscriminant, state, consumedBlockHeight, consumedTxOrder, consumerAccountId, tx) {
    const db = getDatabase(dbId);
    const doWork = async (t) => {
        try {
            const data = {
                noteId,
                assets,
                serialNumber,
                inputs,
                scriptRoot,
                nullifier,
                state,
                stateDiscriminant,
                serializedCreatedAt,
                // These fields are null for non-consumed notes.
                // Convert null -> undefined so Dexie omits them from compound indexes.
                consumedBlockHeight: consumedBlockHeight ?? undefined,
                consumedTxOrder: consumedTxOrder ?? undefined,
                consumerAccountId: consumerAccountId ?? undefined,
            };
            await t.inputNotes.put(data);
            const noteScriptData = {
                scriptRoot,
                serializedNoteScript,
            };
            await t.notesScripts.put(noteScriptData);
            /* v8 ignore next 3 — requires a mid-transaction Dexie write failure, not modelable with fake-indexeddb */
        }
        catch (error) {
            logWebStoreError(error, `Error inserting note: ${noteId}`);
        }
    };
    return db.dexie.transaction("rw", db.inputNotes, db.notesScripts, doWork);
}
// Uses the [consumedBlockHeight+consumedTxOrder+noteId] compound index for cursor-based
// iteration.  When a consumerAccountId is provided the cursor path is used exclusively —
// only notes that are fully indexed (all three fields present) are returned.  When no
// consumer is specified a two-pass fallback is used: first the indexed notes (with a tx
// order), then the unindexed notes (null tx order), appended after so they sort last
// within the same block as described by the ordering contract.
async function getInputNoteByOffset(dbId, states, consumerAccountId, blockStart, blockEnd, offset) {
    try {
        const db = getDatabase(dbId);
        // The compound index sorts by consumedBlockHeight, consumedTxOrder, noteId.
        // Rows without these fields are excluded by the index.
        const indexed = await db.inputNotes
            .orderBy("[consumedBlockHeight+consumedTxOrder+noteId]")
            .filter((n) => {
            if (states.length > 0 && !states.includes(n.stateDiscriminant))
                return false;
            if (n.consumerAccountId !== consumerAccountId)
                return false;
            if (blockStart != null && n.consumedBlockHeight < blockStart)
                return false;
            if (blockEnd != null && n.consumedBlockHeight > blockEnd)
                return false;
            return true;
        })
            .toArray();
        // When no consumer is specified, also collect notes that lack a tx order
        // (they do not appear in the compound index at all) and append them after
        // the ordered notes so they sort last.
        let unordered = [];
        if (consumerAccountId == null) {
            unordered = await db.inputNotes
                .filter((n) => {
                if (n.consumedTxOrder != null)
                    return false; // already in indexed set
                if (states.length > 0 && !states.includes(n.stateDiscriminant))
                    return false;
                if (n.consumerAccountId !== consumerAccountId)
                    return false;
                if (blockStart != null &&
                    (n.consumedBlockHeight == null ||
                        n.consumedBlockHeight < blockStart))
                    return false;
                if (blockEnd != null &&
                    (n.consumedBlockHeight == null || n.consumedBlockHeight > blockEnd))
                    return false;
                return true;
            })
                .sortBy("noteId");
        }
        const all = [...indexed, ...unordered];
        if (offset >= all.length)
            return [];
        return await processInputNotes(dbId, [all[offset]]);
    }
    catch (err) {
        logWebStoreError(err, "Failed to get input note by offset");
    }
}
async function upsertOutputNote(dbId, noteId, assets, recipientDigest, metadata, nullifier, expectedHeight, stateDiscriminant, state, tx) {
    const db = getDatabase(dbId);
    const doWork = async (t) => {
        try {
            const data = {
                noteId,
                assets,
                recipientDigest,
                metadata,
                nullifier: nullifier ? nullifier : undefined,
                expectedHeight,
                stateDiscriminant,
                state,
            };
            await t.outputNotes.put(data);
            /* v8 ignore next 3 — requires a mid-transaction Dexie write failure, not modelable with fake-indexeddb */
        }
        catch (error) {
            logWebStoreError(error, `Error inserting note: ${noteId}`);
        }
    };
    return db.dexie.transaction("rw", db.outputNotes, db.notesScripts, doWork);
}
async function processInputNotes(dbId, notes) {
    const db = getDatabase(dbId);
    return await Promise.all(notes.map(async (note) => {
        const assetsBase64 = uint8ArrayToBase64(note.assets);
        const serialNumberBase64 = uint8ArrayToBase64(note.serialNumber);
        const inputsBase64 = uint8ArrayToBase64(note.inputs);
        let serializedNoteScriptBase64 = undefined;
        if (note.scriptRoot) {
            let record = await db.notesScripts.get(note.scriptRoot);
            if (record) {
                serializedNoteScriptBase64 = uint8ArrayToBase64(record.serializedNoteScript);
            }
        }
        const stateBase64 = uint8ArrayToBase64(note.state);
        return {
            assets: assetsBase64,
            serialNumber: serialNumberBase64,
            inputs: inputsBase64,
            createdAt: note.serializedCreatedAt,
            serializedNoteScript: serializedNoteScriptBase64,
            state: stateBase64,
        };
    }));
}
async function processOutputNotes(notes) {
    return await Promise.all(notes.map((note) => {
        const assetsBase64 = uint8ArrayToBase64(note.assets);
        const metadataBase64 = uint8ArrayToBase64(note.metadata);
        const stateBase64 = uint8ArrayToBase64(note.state);
        return {
            assets: assetsBase64,
            recipientDigest: note.recipientDigest,
            metadata: metadataBase64,
            expectedHeight: note.expectedHeight,
            state: stateBase64,
        };
    }));
}
async function upsertNoteScript(dbId, scriptRoot, serializedNoteScript) {
    const db = getDatabase(dbId);
    return db.dexie.transaction("rw", db.outputNotes, db.notesScripts, async (tx) => {
        try {
            const noteScriptData = {
                scriptRoot,
                serializedNoteScript,
            };
            await tx.notesScripts.put(noteScriptData);
            /* v8 ignore next 3 — requires a mid-transaction Dexie write failure, not modelable with fake-indexeddb */
        }
        catch (error) {
            logWebStoreError(error, `Error inserting note script: ${scriptRoot}`);
        }
    });
}

const INTERNAL_SETTING_KEYS = new Set([CLIENT_VERSION_SETTING_KEY]);
async function getSetting(dbId, key) {
    try {
        const db = getDatabase(dbId);
        const allMatchingRecords = await db.settings
            .where("key")
            .equals(key)
            .toArray();
        if (allMatchingRecords.length === 0) {
            console.log("No setting record found for given key.");
            return null;
        }
        const matchingRecord = allMatchingRecords[0];
        const valueBase64 = uint8ArrayToBase64(matchingRecord.value);
        return {
            key: matchingRecord.key,
            value: valueBase64,
        };
    }
    catch (error) {
        logWebStoreError(error, `Error while fetching setting key: ${key}`);
    }
}
async function insertSetting(dbId, key, value) {
    try {
        const db = getDatabase(dbId);
        const setting = {
            key,
            value,
        };
        await db.settings.put(setting);
    }
    catch (error) {
        logWebStoreError(error, `Error inserting setting with key: ${key} and value(base64): ${uint8ArrayToBase64(value)}`);
    }
}
async function removeSetting(dbId, key) {
    try {
        const db = getDatabase(dbId);
        await db.settings.where("key").equals(key).delete();
    }
    catch (error) {
        logWebStoreError(error, `Error deleting setting with key: ${key}`);
    }
}
async function listSettingKeys(dbId) {
    try {
        const db = getDatabase(dbId);
        const keys = await db.settings
            .toArray()
            .then((settings) => settings.map((setting) => setting.key));
        return keys.filter((key) => !INTERNAL_SETTING_KEYS.has(key));
    }
    catch (error) {
        logWebStoreError(error, `Error listing setting keys`);
    }
}

const IDS_FILTER_PREFIX = "Ids:";
const EXPIRED_BEFORE_FILTER_PREFIX = "ExpiredPending:";
const STATUS_PENDING_VARIANT = 0;
const STATUS_COMMITTED_VARIANT = 1;
const STATUS_DISCARDED_VARIANT = 2;
async function getTransactions(dbId, filter) {
    let transactionRecords = [];
    try {
        const db = getDatabase(dbId);
        if (filter === "Uncommitted") {
            transactionRecords = await db.transactions
                .filter((tx) => tx.statusVariant === STATUS_PENDING_VARIANT)
                .toArray();
        }
        else if (filter.startsWith(IDS_FILTER_PREFIX)) {
            const idsString = filter.substring(IDS_FILTER_PREFIX.length);
            const ids = idsString.split(",");
            if (ids.length > 0) {
                transactionRecords = await db.transactions
                    .where("id")
                    .anyOf(ids)
                    .toArray();
            }
            else {
                transactionRecords = [];
            }
        }
        else if (filter.startsWith(EXPIRED_BEFORE_FILTER_PREFIX)) {
            const blockNumString = filter.substring(EXPIRED_BEFORE_FILTER_PREFIX.length);
            const blockNum = parseInt(blockNumString);
            transactionRecords = await db.transactions
                .filter((tx) => tx.blockNum < blockNum &&
                tx.statusVariant !== STATUS_COMMITTED_VARIANT &&
                tx.statusVariant !== STATUS_DISCARDED_VARIANT)
                .toArray();
        }
        else {
            transactionRecords = await db.transactions.toArray();
        }
        if (transactionRecords.length === 0) {
            return [];
        }
        const scriptRoots = transactionRecords
            .map((transactionRecord) => {
            return transactionRecord.scriptRoot;
        })
            .filter((scriptRoot) => scriptRoot != undefined);
        const scripts = await db.transactionScripts
            .where("scriptRoot")
            .anyOf(scriptRoots)
            .toArray();
        const scriptMap = new Map();
        scripts.forEach((script) => {
            if (script.txScript) {
                scriptMap.set(script.scriptRoot, script.txScript);
            }
        });
        const processedTransactions = await Promise.all(transactionRecords.map((transactionRecord) => {
            let txScriptBase64 = undefined;
            if (transactionRecord.scriptRoot) {
                const txScript = scriptMap.get(transactionRecord.scriptRoot);
                if (txScript) {
                    txScriptBase64 = uint8ArrayToBase64(txScript);
                }
            }
            const detailsBase64 = uint8ArrayToBase64(transactionRecord.details);
            const statusBase64 = uint8ArrayToBase64(transactionRecord.status);
            const data = {
                id: transactionRecord.id,
                details: detailsBase64,
                scriptRoot: transactionRecord.scriptRoot,
                txScript: txScriptBase64,
                blockNum: transactionRecord.blockNum,
                statusVariant: transactionRecord.statusVariant,
                status: statusBase64,
            };
            return data;
        }));
        return processedTransactions;
    }
    catch (err) {
        logWebStoreError(err, "Failed to get transactions");
    }
}
async function insertTransactionScript(dbId, scriptRoot, txScript, tx) {
    try {
        const db = getDatabase(dbId);
        const scriptRootArray = new Uint8Array(scriptRoot);
        const scriptRootBase64 = uint8ArrayToBase64(scriptRootArray);
        const data = {
            scriptRoot: scriptRootBase64,
            txScript: mapOption(txScript, (txScript) => new Uint8Array(txScript)),
        };
        await (tx || db).transactionScripts.put(data);
    }
    catch (error) {
        logWebStoreError(error, "Failed to insert transaction script");
    }
}
async function upsertTransactionRecord(dbId, transactionId, details, blockNum, statusVariant, status, scriptRoot, tx) {
    try {
        const db = getDatabase(dbId);
        const data = {
            id: transactionId,
            details,
            scriptRoot: mapOption(scriptRoot, (root) => uint8ArrayToBase64(root)),
            blockNum,
            statusVariant,
            status,
        };
        await (tx || db).transactions.put(data);
    }
    catch (err) {
        logWebStoreError(err, "Failed to insert proven transaction data");
    }
}

async function getNoteTags(dbId) {
    try {
        const db = getDatabase(dbId);
        let records = await db.tags.toArray();
        let processedRecords = records.map((record) => {
            record.sourceNoteId =
                record.sourceNoteId == "" ? undefined : record.sourceNoteId;
            record.sourceAccountId =
                record.sourceAccountId == "" ? undefined : record.sourceAccountId;
            return record;
        });
        return processedRecords;
    }
    catch (error) {
        logWebStoreError(error, "Error fetch tag record");
    }
}
async function getSyncHeight(dbId) {
    try {
        const db = getDatabase(dbId);
        const record = await db.stateSync.get(1);
        if (record) {
            let data = {
                blockNum: record.blockNum,
            };
            return data;
        }
        else {
            return null;
        }
    }
    catch (error) {
        logWebStoreError(error, "Error fetching sync height");
    }
}
async function addNoteTag(dbId, tag, sourceNoteId, sourceAccountId) {
    try {
        const db = getDatabase(dbId);
        let tagArray = new Uint8Array(tag);
        let tagBase64 = uint8ArrayToBase64(tagArray);
        await db.tags.add({
            tag: tagBase64,
            sourceNoteId: sourceNoteId ? sourceNoteId : "",
            sourceAccountId: sourceAccountId ? sourceAccountId : "",
        });
    }
    catch (error) {
        logWebStoreError(error, "Failed to add note tag");
    }
}
async function removeNoteTag(dbId, tag, sourceNoteId, sourceAccountId) {
    try {
        const db = getDatabase(dbId);
        let tagArray = new Uint8Array(tag);
        let tagBase64 = uint8ArrayToBase64(tagArray);
        return await db.tags
            .where({
            tag: tagBase64,
            sourceNoteId: sourceNoteId ? sourceNoteId : "",
            sourceAccountId: sourceAccountId ? sourceAccountId : "",
        })
            .delete();
    }
    catch (error) {
        logWebStoreError(error, "Failed to remove note tag");
    }
}
async function applyStateSync(dbId, stateUpdate) {
    const db = getDatabase(dbId);
    const { blockNum, flattenedNewBlockHeaders, flattenedPartialBlockChainPeaks, newBlockNums, blockHasRelevantNotes, serializedNodeIds, serializedNodes, committedNoteIds, serializedInputNotes, serializedOutputNotes, accountUpdates, transactionUpdates, } = stateUpdate;
    const newBlockHeaders = reconstructFlattenedVec(flattenedNewBlockHeaders);
    const partialBlockchainPeaks = reconstructFlattenedVec(flattenedPartialBlockChainPeaks);
    const tablesToAccess = [
        db.stateSync,
        db.inputNotes,
        db.outputNotes,
        db.notesScripts,
        db.transactions,
        db.transactionScripts,
        db.blockHeaders,
        db.partialBlockchainNodes,
        db.tags,
        db.latestAccountHeaders,
        db.historicalAccountHeaders,
        db.latestAccountStorages,
        db.historicalAccountStorages,
        db.latestStorageMapEntries,
        db.historicalStorageMapEntries,
        db.latestAccountAssets,
        db.historicalAccountAssets,
    ];
    return await db.dexie.transaction("rw", tablesToAccess, async (tx) => {
        await Promise.all([
            Promise.all(serializedInputNotes.map((note) => {
                return upsertInputNote(dbId, note.noteId, note.noteAssets, note.serialNumber, note.inputs, note.noteScriptRoot, note.noteScript, note.nullifier, note.createdAt, note.stateDiscriminant, note.state, note.consumedBlockHeight, note.consumedTxOrder, note.consumerAccountId);
            })),
            Promise.all(serializedOutputNotes.map((note) => {
                return upsertOutputNote(dbId, note.noteId, note.noteAssets, note.recipientDigest, note.metadata, note.nullifier, note.expectedHeight, note.stateDiscriminant, note.state);
            })),
            Promise.all(transactionUpdates.map((transactionRecord) => {
                let promises = [
                    upsertTransactionRecord(dbId, transactionRecord.id, transactionRecord.details, transactionRecord.blockNum, transactionRecord.statusVariant, transactionRecord.status, transactionRecord.scriptRoot),
                ];
                if (transactionRecord.scriptRoot && transactionRecord.txScript) {
                    promises.push(insertTransactionScript(dbId, transactionRecord.scriptRoot, transactionRecord.txScript));
                }
                return Promise.all(promises);
            })),
            Promise.all(accountUpdates.map((accountUpdate) => applyFullAccountState(dbId, {
                accountId: accountUpdate.accountId,
                nonce: accountUpdate.nonce,
                storageSlots: accountUpdate.storageSlots,
                storageMapEntries: accountUpdate.storageMapEntries,
                assets: accountUpdate.assets,
                codeRoot: accountUpdate.codeRoot,
                storageRoot: accountUpdate.storageRoot,
                vaultRoot: accountUpdate.vaultRoot,
                committed: accountUpdate.committed,
                accountCommitment: accountUpdate.accountCommitment,
                accountSeed: accountUpdate.accountSeed,
            }))),
            updateSyncHeight(tx, blockNum),
            updatePartialBlockchainNodes(tx, serializedNodeIds, serializedNodes),
            updateCommittedNoteTags(tx, committedNoteIds),
            Promise.all(newBlockHeaders.map((newBlockHeader, i) => {
                return updateBlockHeader(tx, newBlockNums[i], newBlockHeader, partialBlockchainPeaks[i], blockHasRelevantNotes[i] == 1);
            })),
        ]);
    });
}
async function updateSyncHeight(tx, blockNum) {
    try {
        // Only update if moving forward to prevent race conditions
        const current = await tx.stateSync.get(1);
        if (!current || current.blockNum < blockNum) {
            await tx.stateSync.update(1, {
                blockNum: blockNum,
            });
        }
    }
    catch (error) {
        logWebStoreError(error, "Failed to update sync height");
    }
}
async function updateBlockHeader(tx, blockNum, blockHeader, partialBlockchainPeaks, hasClientNotes) {
    try {
        const data = {
            blockNum: blockNum,
            header: blockHeader,
            partialBlockchainPeaks,
            hasClientNotes: hasClientNotes.toString(),
        };
        const existingBlockHeader = await tx.blockHeaders.get(blockNum);
        if (!existingBlockHeader) {
            await tx.blockHeaders.add(data);
        }
    }
    catch (err) {
        /* v8 ignore next 2 -- IDB errors inside a Dexie tx abort the whole tx; this catch is unreachable */
        logWebStoreError(err, "Failed to insert block header");
    }
}
async function updatePartialBlockchainNodes(tx, nodeIndexes, nodes) {
    try {
        if (nodeIndexes.length !== nodes.length) {
            throw new Error("nodeIndexes and nodes arrays must be of the same length");
        }
        if (nodeIndexes.length === 0) {
            return;
        }
        const data = nodes.map((node, index) => ({
            id: Number(nodeIndexes[index]),
            node: node,
        }));
        // Use bulkPut to add/overwrite the entries
        await tx.partialBlockchainNodes.bulkPut(data);
    }
    catch (err) {
        logWebStoreError(err, "Failed to update partial blockchain nodes");
    }
}
async function updateCommittedNoteTags(tx, inputNoteIds) {
    try {
        for (let i = 0; i < inputNoteIds.length; i++) {
            const noteId = inputNoteIds[i];
            await tx.tags
                .where("sourceNoteId")
                .equals(noteId)
                .delete();
        }
    }
    catch (error) {
        /* v8 ignore next 2 -- IDB errors inside a Dexie tx abort the whole tx; this catch is unreachable */
        logWebStoreError(error, "Failed to update committed note tags");
    }
}
function reconstructFlattenedVec(flattenedVec) {
    const data = flattenedVec.data();
    const lengths = flattenedVec.lengths();
    let index = 0;
    const result = [];
    lengths.forEach((length) => {
        result.push(data.slice(index, index + length));
        index += length;
    });
    return result;
}

/*
 * Copyright 2022 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Note: we use `wasm_bindgen_worker_`-prefixed message types to make sure
// we can handle bundling into other files, which might happen to have their
// own `postMessage`/`onmessage` communication channels.
//
// If we didn't take that into the account, we could send much simpler signals
// like just `0` or whatever, but the code would be less resilient.

function waitForMsgType(target, type) {
  return new Promise(resolve => {
    target.addEventListener('message', function onMsg({ data }) {
      if (data?.type !== type) return;
      target.removeEventListener('message', onMsg);
      resolve(data);
    });
  });
}

waitForMsgType(self, 'wasm_bindgen_worker_init').then(async ({ init, receiver }) => {
  // # Note 1
  // Our JS should have been generated in
  // `[out-dir]/snippets/wasm-bindgen-rayon-[hash]/workerHelpers.js`,
  // resolve the main module via `../../..`.
  //
  // This might need updating if the generated structure changes on wasm-bindgen
  // side ever in the future, but works well with bundlers today. The whole
  // point of this crate, after all, is to abstract away unstable features
  // and temporary bugs so that you don't need to deal with them in your code.
  //
  // # Note 2
  // This could be a regular import, but then some bundlers complain about
  // circular deps.
  //
  // Dynamic import could be cheap if this file was inlined into the parent,
  // which would require us just using `../../..` in `new Worker` below,
  // but that doesn't work because wasm-pack unconditionally adds
  // "sideEffects":false (see below).
  //
  // OTOH, even though it can't be inlined, it should be still reasonably
  // cheap since the requested file is already in cache (it was loaded by
  // the main thread).
  const pkg = await Promise.resolve().then(function () { return index; });
  await pkg.default(init);
  postMessage({ type: 'wasm_bindgen_worker_ready' });
  pkg.wbg_rayon_start_worker(receiver);
});

async function startWorkers(module, memory, builder) {
  if (builder.numThreads() === 0) {
    throw new Error(`num_threads must be > 0.`);
  }

  const workerInit = {
    type: 'wasm_bindgen_worker_init',
    init: { module_or_path: module, memory },
    receiver: builder.receiver()
  };

  await Promise.all(
    Array.from({ length: builder.numThreads() }, async () => {
      // Self-spawn into a new Worker.
      //
      // TODO: while `new URL('...', import.meta.url) becomes a semi-standard
      // way to get asset URLs relative to the module across various bundlers
      // and browser, ideally we should switch to `import.meta.resolve`
      // once it becomes a standard.
      //
      // Note: we could use `../../..` as the URL here to inline workerHelpers.js
      // into the parent entry instead of creating another split point -
      // this would be preferable from optimization perspective -
      // however, Webpack then eliminates all message handler code
      // because wasm-pack produces "sideEffects":false in package.json
      // unconditionally.
      //
      // The only way to work around that is to have side effect code
      // in an entry point such as Worker file itself.
      const worker = new Worker(new URL('./workerHelpers.js', import.meta.url), {
        type: 'module'
      });
      worker.postMessage(workerInit);
      await waitForMsgType(worker, 'wasm_bindgen_worker_ready');
      return worker;
    })
  );
  builder.build();
}

/* @ts-self-types="./index.d.ts" */

/**
 * An account which can store assets and define rules for manipulating them.
 *
 * An account consists of the following components:
 * - Account ID, which uniquely identifies the account and also defines basic properties of the
 *   account.
 * - Account vault, which stores assets owned by the account.
 * - Account storage, which is a key-value map (both keys and values are words) used to store
 *   arbitrary user-defined data.
 * - Account code, which is a set of Miden VM programs defining the public interface of the
 *   account.
 * - Account nonce, a value which is incremented whenever account state is updated.
 *
 * Out of the above components account ID is always immutable (once defined it can never be
 * changed). Other components may be mutated throughout the lifetime of the account. However,
 * account state can be changed only by invoking one of account interface methods.
 *
 * The recommended way to build an account is through an `AccountBuilder`, which can be
 * instantiated directly from a 32-byte seed.
 */
class Account {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Account.prototype);
        obj.__wbg_ptr = ptr;
        AccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof Account)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_account_free(ptr, 0);
    }
    /**
     * Returns the code commitment for this account.
     * @returns {AccountCode}
     */
    code() {
        const ret = wasm.account_code(this.__wbg_ptr);
        return AccountCode.__wrap(ret);
    }
    /**
     * Restores an account from its serialized bytes.
     * @param {Uint8Array} bytes
     * @returns {Account}
     */
    static deserialize(bytes) {
        const ret = wasm.account_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Account.__wrap(ret[0]);
    }
    /**
     * Returns the public key commitments derived from the account's authentication scheme.
     * @returns {Word[]}
     */
    getPublicKeyCommitments() {
        const ret = wasm.account_getPublicKeyCommitments(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the account identifier.
     * @returns {AccountId}
     */
    id() {
        const ret = wasm.account_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns true if the account is a faucet.
     * @returns {boolean}
     */
    isFaucet() {
        const ret = wasm.account_isFaucet(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if this is a network-owned account.
     * @returns {boolean}
     */
    isNetwork() {
        const ret = wasm.account_isNetwork(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the account has not yet been committed to the chain.
     * @returns {boolean}
     */
    isNew() {
        const ret = wasm.account_isNew(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the account storage is private.
     * @returns {boolean}
     */
    isPrivate() {
        const ret = wasm.account_isPrivate(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the account exposes public storage.
     * @returns {boolean}
     */
    isPublic() {
        const ret = wasm.account_isPublic(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the account is a regular account (immutable or updatable code).
     * @returns {boolean}
     */
    isRegularAccount() {
        const ret = wasm.account_isRegularAccount(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the account can update its code.
     * @returns {boolean}
     */
    isUpdatable() {
        const ret = wasm.account_isUpdatable(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the account nonce, which is incremented on every state update.
     * @returns {Felt}
     */
    nonce() {
        const ret = wasm.account_nonce(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * Serializes the account into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.account_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the account storage commitment.
     * @returns {AccountStorage}
     */
    storage() {
        const ret = wasm.account_storage(this.__wbg_ptr);
        return AccountStorage.__wrap(ret);
    }
    /**
     * Returns the commitment to the account header, storage, and code.
     * @returns {Word}
     */
    to_commitment() {
        const ret = wasm.account_to_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the vault commitment for this account.
     * @returns {AssetVault}
     */
    vault() {
        const ret = wasm.account_vault(this.__wbg_ptr);
        return AssetVault.__wrap(ret);
    }
}
if (Symbol.dispose) Account.prototype[Symbol.dispose] = Account.prototype.free;

class AccountArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {Account}
     */
    get(index) {
        const ret = wasm.accountarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Account.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.accountarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Account[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        AccountArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Account} element
     */
    push(element) {
        _assertClass(element, Account);
        wasm.accountarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {Account} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, Account);
        const ret = wasm.accountarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) AccountArray.prototype[Symbol.dispose] = AccountArray.prototype.free;

class AccountBuilder {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountBuilder.prototype);
        obj.__wbg_ptr = ptr;
        AccountBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountbuilder_free(ptr, 0);
    }
    /**
     * Sets the account type (regular, faucet, etc.).
     *
     * Accepts either a numeric WASM enum value (0–3) or a string name
     * (`"FungibleFaucet"`, `"NonFungibleFaucet"`,
     * `"RegularAccountImmutableCode"`, `"RegularAccountUpdatableCode"`).
     * @param {any} account_type
     * @returns {AccountBuilder}
     */
    accountType(account_type) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.accountbuilder_accountType(ptr, account_type);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountBuilder.__wrap(ret[0]);
    }
    /**
     * Builds the account and returns it together with the derived seed.
     * @returns {AccountBuilderResult}
     */
    build() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.accountbuilder_build(ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountBuilderResult.__wrap(ret[0]);
    }
    /**
     * Creates a new account builder from a 32-byte initial seed.
     * @param {Uint8Array} init_seed
     */
    constructor(init_seed) {
        const ptr0 = passArray8ToWasm0(init_seed, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountbuilder_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        AccountBuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Sets the storage mode (public/private) for the account.
     * @param {AccountStorageMode} storage_mode
     * @returns {AccountBuilder}
     */
    storageMode(storage_mode) {
        const ptr = this.__destroy_into_raw();
        _assertClass(storage_mode, AccountStorageMode);
        const ret = wasm.accountbuilder_storageMode(ptr, storage_mode.__wbg_ptr);
        return AccountBuilder.__wrap(ret);
    }
    /**
     * Adds an authentication component to the account.
     * @param {AccountComponent} account_component
     * @returns {AccountBuilder}
     */
    withAuthComponent(account_component) {
        const ptr = this.__destroy_into_raw();
        _assertClass(account_component, AccountComponent);
        const ret = wasm.accountbuilder_withAuthComponent(ptr, account_component.__wbg_ptr);
        return AccountBuilder.__wrap(ret);
    }
    /**
     * @returns {AccountBuilder}
     */
    withBasicWalletComponent() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.accountbuilder_withBasicWalletComponent(ptr);
        return AccountBuilder.__wrap(ret);
    }
    /**
     * Adds a component to the account.
     * @param {AccountComponent} account_component
     * @returns {AccountBuilder}
     */
    withComponent(account_component) {
        const ptr = this.__destroy_into_raw();
        _assertClass(account_component, AccountComponent);
        const ret = wasm.accountbuilder_withComponent(ptr, account_component.__wbg_ptr);
        return AccountBuilder.__wrap(ret);
    }
    /**
     * Adds a no-auth component to the account (for public accounts).
     * @returns {AccountBuilder}
     */
    withNoAuthComponent() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.accountbuilder_withNoAuthComponent(ptr);
        return AccountBuilder.__wrap(ret);
    }
}
if (Symbol.dispose) AccountBuilder.prototype[Symbol.dispose] = AccountBuilder.prototype.free;

class AccountBuilderResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountBuilderResult.prototype);
        obj.__wbg_ptr = ptr;
        AccountBuilderResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountBuilderResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountbuilderresult_free(ptr, 0);
    }
    /**
     * Returns the built account.
     * @returns {Account}
     */
    get account() {
        const ret = wasm.accountbuilderresult_account(this.__wbg_ptr);
        return Account.__wrap(ret);
    }
    /**
     * Returns the seed used to derive the account ID.
     * @returns {Word}
     */
    get seed() {
        const ret = wasm.accountbuilderresult_seed(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) AccountBuilderResult.prototype[Symbol.dispose] = AccountBuilderResult.prototype.free;

/**
 * A public interface of an account.
 *
 * Account's public interface consists of a set of callable procedures, each committed to by its
 * root hash and paired with storage bounds (offset and size).
 *
 * The full interface commitment hashes every procedure root together with its storage bounds so
 * that the account code uniquely captures the set of available calls.
 */
class AccountCode {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountCode.prototype);
        obj.__wbg_ptr = ptr;
        AccountCodeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountCodeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountcode_free(ptr, 0);
    }
    /**
     * Returns the code commitment for the account.
     * @returns {Word}
     */
    commitment() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns true if the account code exports a procedure with the given MAST root.
     * @param {Word} mast_root
     * @returns {boolean}
     */
    hasProcedure(mast_root) {
        _assertClass(mast_root, Word);
        var ptr0 = mast_root.__destroy_into_raw();
        const ret = wasm.accountcode_hasProcedure(this.__wbg_ptr, ptr0);
        return ret !== 0;
    }
}
if (Symbol.dispose) AccountCode.prototype[Symbol.dispose] = AccountCode.prototype.free;

class AccountComponent {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountComponent.prototype);
        obj.__wbg_ptr = ptr;
        AccountComponentFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountComponentFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountcomponent_free(ptr, 0);
    }
    /**
     * Compiles account code with the given storage slots using the provided assembler.
     * @param {AccountComponentCode} account_code
     * @param {StorageSlot[]} storage_slots
     * @returns {AccountComponent}
     */
    static compile(account_code, storage_slots) {
        _assertClass(account_code, AccountComponentCode);
        var ptr0 = account_code.__destroy_into_raw();
        const ptr1 = passArrayJsValueToWasm0(storage_slots, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.accountcomponent_compile(ptr0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountComponent.__wrap(ret[0]);
    }
    /**
     * @param {Word} commitment
     * @param {AuthScheme} auth_scheme
     * @returns {AccountComponent}
     */
    static createAuthComponentFromCommitment(commitment, auth_scheme) {
        _assertClass(commitment, Word);
        const ret = wasm.accountcomponent_createAuthComponentFromCommitment(commitment.__wbg_ptr, auth_scheme);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountComponent.__wrap(ret[0]);
    }
    /**
     * Builds an auth component from a secret key, inferring the auth scheme from the key type.
     * @param {AuthSecretKey} secret_key
     * @returns {AccountComponent}
     */
    static createAuthComponentFromSecretKey(secret_key) {
        _assertClass(secret_key, AuthSecretKey);
        const ret = wasm.accountcomponent_createAuthComponentFromSecretKey(secret_key.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountComponent.__wrap(ret[0]);
    }
    /**
     * Creates an account component from a compiled library and storage slots.
     * @param {Library} library
     * @param {StorageSlot[]} storage_slots
     * @returns {AccountComponent}
     */
    static fromLibrary(library, storage_slots) {
        _assertClass(library, Library);
        const ptr0 = passArrayJsValueToWasm0(storage_slots, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountcomponent_fromLibrary(library.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountComponent.__wrap(ret[0]);
    }
    /**
     * Creates an account component from a compiled package and storage slots.
     * @param {Package} _package
     * @param {StorageSlotArray} storage_slots
     * @returns {AccountComponent}
     */
    static fromPackage(_package, storage_slots) {
        _assertClass(_package, Package);
        _assertClass(storage_slots, StorageSlotArray);
        const ret = wasm.accountcomponent_fromPackage(_package.__wbg_ptr, storage_slots.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountComponent.__wrap(ret[0]);
    }
    /**
     * Returns the hex-encoded MAST root for a procedure by name.
     *
     * Matches by full path, relative path, or local name (after the last `::`).
     * When matching by local name, if multiple procedures share the same local
     * name across modules, the first match is returned.
     * @param {string} procedure_name
     * @returns {string}
     */
    getProcedureHash(procedure_name) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(procedure_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.accountcomponent_getProcedureHash(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Returns all procedures exported by this component.
     * @returns {GetProceduresResultItem[]}
     */
    getProcedures() {
        const ret = wasm.accountcomponent_getProcedures(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Marks the component as supporting all account types.
     * @returns {AccountComponent}
     */
    withSupportsAllTypes() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.accountcomponent_withSupportsAllTypes(ptr);
        return AccountComponent.__wrap(ret);
    }
}
if (Symbol.dispose) AccountComponent.prototype[Symbol.dispose] = AccountComponent.prototype.free;

/**
 * A Library that has been assembled for use as component code.
 */
class AccountComponentCode {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountComponentCode.prototype);
        obj.__wbg_ptr = ptr;
        AccountComponentCodeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountComponentCodeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountcomponentcode_free(ptr, 0);
    }
    /**
     * Returns the underlying Library
     * @returns {Library}
     */
    asLibrary() {
        const ret = wasm.accountcomponentcode_asLibrary(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Library.__wrap(ret[0]);
    }
}
if (Symbol.dispose) AccountComponentCode.prototype[Symbol.dispose] = AccountComponentCode.prototype.free;

/**
 * `AccountDelta` stores the differences between two account states.
 *
 * The differences are represented as follows:
 * - `storage`: an `AccountStorageDelta` that contains the changes to the account storage.
 * - `vault`: an `AccountVaultDelta` object that contains the changes to the account vault.
 * - `nonce`: if the nonce of the account has changed, the new nonce is stored here.
 */
class AccountDelta {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountDelta.prototype);
        obj.__wbg_ptr = ptr;
        AccountDeltaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountDeltaFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountdelta_free(ptr, 0);
    }
    /**
     * Deserializes an account delta from bytes.
     * @param {Uint8Array} bytes
     * @returns {AccountDelta}
     */
    static deserialize(bytes) {
        const ret = wasm.accountdelta_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountDelta.__wrap(ret[0]);
    }
    /**
     * Returns the affected account ID.
     * @returns {AccountId}
     */
    id() {
        const ret = wasm.accountdelta_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns true if there are no changes.
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.accountdelta_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the nonce change.
     * @returns {Felt}
     */
    nonceDelta() {
        const ret = wasm.accountdelta_nonceDelta(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * Serializes the account delta into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.accountdelta_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the storage delta.
     * @returns {AccountStorageDelta}
     */
    storage() {
        const ret = wasm.accountdelta_storage(this.__wbg_ptr);
        return AccountStorageDelta.__wrap(ret);
    }
    /**
     * Returns the vault delta.
     * @returns {AccountVaultDelta}
     */
    vault() {
        const ret = wasm.accountdelta_vault(this.__wbg_ptr);
        return AccountVaultDelta.__wrap(ret);
    }
}
if (Symbol.dispose) AccountDelta.prototype[Symbol.dispose] = AccountDelta.prototype.free;

class AccountFile {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountFile.prototype);
        obj.__wbg_ptr = ptr;
        AccountFileFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountFileFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountfile_free(ptr, 0);
    }
    /**
     * Returns the account data.
     * @returns {Account}
     */
    account() {
        const ret = wasm.accountfile_account(this.__wbg_ptr);
        return Account.__wrap(ret);
    }
    /**
     * Returns the account ID.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.account_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the number of auth secret keys included.
     * @returns {number}
     */
    authSecretKeyCount() {
        const ret = wasm.accountfile_authSecretKeyCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Deserializes a byte array into an `AccountFile`
     * @param {Uint8Array} bytes
     * @returns {AccountFile}
     */
    static deserialize(bytes) {
        const ret = wasm.accountfile_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountFile.__wrap(ret[0]);
    }
    /**
     * Serializes the `AccountFile` into a byte array
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.accountfile_serialize(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) AccountFile.prototype[Symbol.dispose] = AccountFile.prototype.free;

/**
 * A header of an account which contains information that succinctly describes the state of the
 * components of the account.
 *
 * The account header is composed of:
 * - `id`: the account ID (`AccountId`).
 * - `nonce`: the nonce of the account.
 * - `vault_root`: a commitment to the account's vault (`AssetVault`).
 * - `storage_commitment`: a commitment to the account's storage (`AccountStorage`).
 * - `code_commitment`: a commitment to the account's code (`AccountCode`).
 */
class AccountHeader {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountHeader.prototype);
        obj.__wbg_ptr = ptr;
        AccountHeaderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountHeaderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountheader_free(ptr, 0);
    }
    /**
     * Returns the code commitment.
     * @returns {Word}
     */
    codeCommitment() {
        const ret = wasm.accountheader_codeCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the account ID.
     * @returns {AccountId}
     */
    id() {
        const ret = wasm.accountheader_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the current nonce.
     * @returns {Felt}
     */
    nonce() {
        const ret = wasm.accountheader_nonce(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * Returns the storage commitment.
     * @returns {Word}
     */
    storageCommitment() {
        const ret = wasm.accountheader_storageCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the full account commitment.
     * @returns {Word}
     */
    to_commitment() {
        const ret = wasm.accountheader_to_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the vault commitment.
     * @returns {Word}
     */
    vaultCommitment() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) AccountHeader.prototype[Symbol.dispose] = AccountHeader.prototype.free;

/**
 * Uniquely identifies a specific account.
 *
 * A Miden account ID is a 120-bit value derived from the commitments to account code and storage,
 * and a random user-provided seed.
 */
class AccountId {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountId.prototype);
        obj.__wbg_ptr = ptr;
        AccountIdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof AccountId)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountIdFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountid_free(ptr, 0);
    }
    /**
     * Given a bech32 encoded string, return the matching Account ID for it.
     * @param {string} bech_32_encoded_id
     * @returns {AccountId}
     */
    static fromBech32(bech_32_encoded_id) {
        const ptr0 = passStringToWasm0(bech_32_encoded_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountid_fromBech32(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountId.__wrap(ret[0]);
    }
    /**
     * Builds an account ID from its hex string representation.
     *
     * Returns an error if the provided string is not a valid hex-encoded account ID.
     * @param {string} hex
     * @returns {AccountId}
     */
    static fromHex(hex) {
        const ptr0 = passStringToWasm0(hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountid_fromHex(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountId.__wrap(ret[0]);
    }
    /**
     * Builds an account ID from its prefix and suffix field elements.
     *
     * This is useful when the account ID components are stored separately (e.g., in storage
     * maps) and need to be recombined into an `AccountId`.
     *
     * Returns an error if the provided felts do not form a valid account ID.
     * @param {Felt} prefix
     * @param {Felt} suffix
     * @returns {AccountId}
     */
    static fromPrefixSuffix(prefix, suffix) {
        _assertClass(prefix, Felt);
        _assertClass(suffix, Felt);
        const ret = wasm.accountid_fromPrefixSuffix(prefix.__wbg_ptr, suffix.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountId.__wrap(ret[0]);
    }
    /**
     * Returns true if the ID refers to a faucet.
     * @returns {boolean}
     */
    isFaucet() {
        const ret = wasm.accountid_isFaucet(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the ID is reserved for network accounts.
     * @returns {boolean}
     */
    isNetwork() {
        const ret = wasm.accountid_isNetwork(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the account uses private storage.
     * @returns {boolean}
     */
    isPrivate() {
        const ret = wasm.accountid_isPrivate(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the account uses public storage.
     * @returns {boolean}
     */
    isPublic() {
        const ret = wasm.accountid_isPublic(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the ID refers to a regular account.
     * @returns {boolean}
     */
    isRegularAccount() {
        const ret = wasm.accountid_isRegularAccount(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the prefix field element storing metadata about version, type, and storage mode.
     * @returns {Felt}
     */
    prefix() {
        const ret = wasm.accountid_prefix(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * Returns the suffix field element derived from the account seed.
     * @returns {Felt}
     */
    suffix() {
        const ret = wasm.accountid_suffix(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * Will turn the Account ID into its bech32 string representation.
     * @param {NetworkId} network_id
     * @param {AccountInterface} account_interface
     * @returns {string}
     */
    toBech32(network_id, account_interface) {
        let deferred3_0;
        let deferred3_1;
        try {
            _assertClass(network_id, NetworkId);
            var ptr0 = network_id.__destroy_into_raw();
            const ret = wasm.accountid_toBech32(this.__wbg_ptr, ptr0, account_interface);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Returns the canonical hex representation of the account ID.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.accountid_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) AccountId.prototype[Symbol.dispose] = AccountId.prototype.free;

class AccountIdArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountIdArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountidarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {AccountId}
     */
    get(index) {
        const ret = wasm.accountidarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountId.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.accountidarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {AccountId[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountidarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        AccountIdArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {AccountId} element
     */
    push(element) {
        _assertClass(element, AccountId);
        wasm.accountidarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {AccountId} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, AccountId);
        const ret = wasm.accountidarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) AccountIdArray.prototype[Symbol.dispose] = AccountIdArray.prototype.free;

/**
 * @enum {0}
 */
const AccountInterface = Object.freeze({
    /**
     * Basic wallet address interface.
     */
    BasicWallet: 0, "0": "BasicWallet",
});

/**
 * Proof of existence of an account's state at a specific block number, as returned by the node.
 *
 * For public accounts, this includes the account header, storage slot values, account code,
 * and optionally storage map entries for the requested storage maps.
 * For private accounts, only the account commitment and merkle proof are available.
 */
class AccountProof {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountProof.prototype);
        obj.__wbg_ptr = ptr;
        AccountProofFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountProofFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountproof_free(ptr, 0);
    }
    /**
     * Returns the account code, if available (public accounts only).
     * @returns {AccountCode | undefined}
     */
    accountCode() {
        const ret = wasm.accountproof_accountCode(this.__wbg_ptr);
        return ret === 0 ? undefined : AccountCode.__wrap(ret);
    }
    /**
     * Returns the account commitment (hash of the full state).
     * @returns {Word}
     */
    accountCommitment() {
        const ret = wasm.accountproof_accountCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the account header, if available (public accounts only).
     * @returns {AccountHeader | undefined}
     */
    accountHeader() {
        const ret = wasm.accountproof_accountHeader(this.__wbg_ptr);
        return ret === 0 ? undefined : AccountHeader.__wrap(ret);
    }
    /**
     * Returns the account ID.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.accountproof_accountId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the block number at which this proof was retrieved.
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.accountproof_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns storage map entries for a given slot name, if available.
     *
     * Returns `undefined` if the account is private, the slot was not requested in the
     * storage requirements, or the slot is not a map.
     *
     * Each entry contains a `key` and `value` as `Word` objects.
     * @param {string} slot_name
     * @returns {StorageMapEntry[] | undefined}
     */
    getStorageMapEntries(slot_name) {
        const ptr0 = passStringToWasm0(slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountproof_getStorageMapEntries(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        let v2;
        if (ret[0] !== 0) {
            v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v2;
    }
    /**
     * Returns the names of all storage slots that have map details available.
     *
     * This can be used to discover which storage maps were included in the proof response.
     * Returns `undefined` if the account is private.
     * @returns {string[] | undefined}
     */
    getStorageMapSlotNames() {
        const ret = wasm.accountproof_getStorageMapSlotNames(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
    /**
     * Returns the value of a storage slot by name, if available.
     *
     * For `Value` slots, this returns the stored word.
     * For `Map` slots, this returns the map root commitment.
     *
     * Returns `undefined` if the account is private or the slot name is not found.
     * @param {string} slot_name
     * @returns {Word | undefined}
     */
    getStorageSlotValue(slot_name) {
        const ptr0 = passStringToWasm0(slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountproof_getStorageSlotValue(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] === 0 ? undefined : Word.__wrap(ret[0]);
    }
    /**
     * Returns whether a storage map slot had too many entries to return inline.
     *
     * When this returns `true`, use `RpcClient.syncStorageMaps()` to fetch the full
     * storage map data.
     *
     * Returns `undefined` if the slot was not found or the account is private.
     * @param {string} slot_name
     * @returns {boolean | undefined}
     */
    hasStorageMapTooManyEntries(slot_name) {
        const ptr0 = passStringToWasm0(slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountproof_hasStorageMapTooManyEntries(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] === 0xFFFFFF ? undefined : ret[0] !== 0;
    }
    /**
     * Returns the number of storage slots, if available (public accounts only).
     * @returns {number | undefined}
     */
    numStorageSlots() {
        const ret = wasm.accountproof_numStorageSlots(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret;
    }
}
if (Symbol.dispose) AccountProof.prototype[Symbol.dispose] = AccountProof.prototype.free;

/**
 * Provides lazy access to account data.
 *
 * `AccountReader` executes queries lazily - each method call fetches fresh data
 * from storage, ensuring you always see the current state.
 */
class AccountReader {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountReader.prototype);
        obj.__wbg_ptr = ptr;
        AccountReaderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountReaderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountreader_free(ptr, 0);
    }
    /**
     * Returns the account ID.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.accountreader_accountId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Retrieves the addresses associated with this account.
     * @returns {Promise<Address[]>}
     */
    addresses() {
        const ret = wasm.accountreader_addresses(this.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the code commitment (hash of the account code).
     * @returns {Promise<Word>}
     */
    codeCommitment() {
        const ret = wasm.accountreader_codeCommitment(this.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the account commitment (hash of the full state).
     * @returns {Promise<Word>}
     */
    commitment() {
        const ret = wasm.accountreader_commitment(this.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the balance of a fungible asset in the account's vault.
     *
     * Returns 0 if the asset is not present in the vault.
     * @param {AccountId} faucet_id
     * @returns {Promise<bigint>}
     */
    getBalance(faucet_id) {
        _assertClass(faucet_id, AccountId);
        const ret = wasm.accountreader_getBalance(this.__wbg_ptr, faucet_id.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves a storage slot value by name.
     *
     * For `Value` slots, returns the stored word.
     * For `Map` slots, returns the map root.
     * @param {string} slot_name
     * @returns {Promise<Word>}
     */
    getStorageItem(slot_name) {
        const ptr0 = passStringToWasm0(slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountreader_getStorageItem(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Retrieves a value from a storage map slot by name and key.
     * @param {string} slot_name
     * @param {Word} key
     * @returns {Promise<Word>}
     */
    getStorageMapItem(slot_name, key) {
        const ptr0 = passStringToWasm0(slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(key, Word);
        const ret = wasm.accountreader_getStorageMapItem(this.__wbg_ptr, ptr0, len0, key.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the account header.
     * @returns {Promise<AccountHeader>}
     */
    header() {
        const ret = wasm.accountreader_header(this.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the current account nonce.
     * @returns {Promise<Felt>}
     */
    nonce() {
        const ret = wasm.accountreader_nonce(this.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the account status.
     * @returns {Promise<AccountStatus>}
     */
    status() {
        const ret = wasm.accountreader_status(this.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the storage commitment (root of the storage tree).
     * @returns {Promise<Word>}
     */
    storageCommitment() {
        const ret = wasm.accountreader_storageCommitment(this.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the vault root (root of the asset vault tree).
     * @returns {Promise<Word>}
     */
    vaultRoot() {
        const ret = wasm.accountreader_vaultRoot(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) AccountReader.prototype[Symbol.dispose] = AccountReader.prototype.free;

/**
 * Represents the status of an account tracked by the client.
 *
 * The status of an account may change by local or external factors.
 */
class AccountStatus {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountStatus.prototype);
        obj.__wbg_ptr = ptr;
        AccountStatusFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountStatusFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountstatus_free(ptr, 0);
    }
    /**
     * Returns `true` if the account is locked.
     *
     * A locked account has a local state that doesn't match the node's state,
     * rendering it unusable for transactions.
     * @returns {boolean}
     */
    isLocked() {
        const ret = wasm.accountstatus_isLocked(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns `true` if the account is new and hasn't been used yet.
     * @returns {boolean}
     */
    isNew() {
        const ret = wasm.accountstatus_isNew(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the account seed if available.
     *
     * The seed is available for:
     * - New accounts (stored in the New status)
     * - Locked private accounts with nonce=0 (preserved for reconstruction)
     * @returns {Word | undefined}
     */
    seed() {
        const ret = wasm.accountstatus_seed(this.__wbg_ptr);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * Returns the status as a string representation.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.accountstatus_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) AccountStatus.prototype[Symbol.dispose] = AccountStatus.prototype.free;

/**
 * Account storage is composed of a variable number of index-addressable storage slots up to 255
 * slots in total.
 *
 * Each slot has a type which defines its size and structure. Currently, the following types are
 * supported:
 * - `StorageSlot::Value`: contains a single Word of data (i.e., 32 bytes).
 * - `StorageSlot::Map`: contains a `StorageMap` which is a key-value map where both keys and
 *   values are Words. The value of a storage slot containing a map is the commitment to the
 *   underlying map.
 */
class AccountStorage {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountStorage.prototype);
        obj.__wbg_ptr = ptr;
        AccountStorageFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountStorageFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountstorage_free(ptr, 0);
    }
    /**
     * Returns the commitment to the full account storage.
     * @returns {Word}
     */
    commitment() {
        const ret = wasm.accountstorage_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the value stored at the given slot name, if any.
     * @param {string} slot_name
     * @returns {Word | undefined}
     */
    getItem(slot_name) {
        const ptr0 = passStringToWasm0(slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountstorage_getItem(this.__wbg_ptr, ptr0, len0);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * Get all key-value pairs from the map slot identified by `slot_name`.
     * Returns `undefined` if the slot isn't a map or doesn't exist.
     * Returns `[]` if the map exists but is empty.
     * @param {string} slot_name
     * @returns {JsStorageMapEntry[] | undefined}
     */
    getMapEntries(slot_name) {
        const ptr0 = passStringToWasm0(slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountstorage_getMapEntries(this.__wbg_ptr, ptr0, len0);
        let v2;
        if (ret[0] !== 0) {
            v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v2;
    }
    /**
     * Returns the value for a key in the map stored at the given slot, if any.
     * @param {string} slot_name
     * @param {Word} key
     * @returns {Word | undefined}
     */
    getMapItem(slot_name, key) {
        const ptr0 = passStringToWasm0(slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(key, Word);
        const ret = wasm.accountstorage_getMapItem(this.__wbg_ptr, ptr0, len0, key.__wbg_ptr);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * Returns the names of all storage slots on this account.
     * @returns {string[]}
     */
    getSlotNames() {
        const ret = wasm.accountstorage_getSlotNames(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) AccountStorage.prototype[Symbol.dispose] = AccountStorage.prototype.free;

/**
 * `AccountStorageDelta` stores the differences between two states of account storage.
 *
 * The delta consists of two maps:
 * - A map containing the updates to value storage slots. The keys in this map are indexes of the
 *   updated storage slots and the values are the new values for these slots.
 * - A map containing updates to storage maps. The keys in this map are indexes of the updated
 *   storage slots and the values are corresponding storage map delta objects.
 */
class AccountStorageDelta {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountStorageDelta.prototype);
        obj.__wbg_ptr = ptr;
        AccountStorageDeltaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountStorageDeltaFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountstoragedelta_free(ptr, 0);
    }
    /**
     * Deserializes a storage delta from bytes.
     * @param {Uint8Array} bytes
     * @returns {AccountStorageDelta}
     */
    static deserialize(bytes) {
        const ret = wasm.accountstoragedelta_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountStorageDelta.__wrap(ret[0]);
    }
    /**
     * Returns true if no storage slots are changed.
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.accountstoragedelta_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Serializes the storage delta into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.accountstoragedelta_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the new values for modified storage slots.
     * @returns {Word[]}
     */
    values() {
        const ret = wasm.accountstoragedelta_values(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) AccountStorageDelta.prototype[Symbol.dispose] = AccountStorageDelta.prototype.free;

/**
 * Storage visibility mode for an account.
 */
class AccountStorageMode {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountStorageMode.prototype);
        obj.__wbg_ptr = ptr;
        AccountStorageModeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountStorageModeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountstoragemode_free(ptr, 0);
    }
    /**
     * Returns the storage mode as a string.
     * @returns {string}
     */
    asStr() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.accountstoragemode_asStr(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Creates a network storage mode.
     * @returns {AccountStorageMode}
     */
    static network() {
        const ret = wasm.accountstoragemode_network();
        return AccountStorageMode.__wrap(ret);
    }
    /**
     * Creates a private storage mode.
     * @returns {AccountStorageMode}
     */
    static private() {
        const ret = wasm.accountstoragemode_private();
        return AccountStorageMode.__wrap(ret);
    }
    /**
     * Creates a public storage mode.
     * @returns {AccountStorageMode}
     */
    static public() {
        const ret = wasm.accountstoragemode_public();
        return AccountStorageMode.__wrap(ret);
    }
    /**
     * Parses a storage mode from its string representation.
     * @param {string} s
     * @returns {AccountStorageMode}
     */
    static tryFromStr(s) {
        const ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountstoragemode_tryFromStr(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountStorageMode.__wrap(ret[0]);
    }
}
if (Symbol.dispose) AccountStorageMode.prototype[Symbol.dispose] = AccountStorageMode.prototype.free;

class AccountStorageRequirements {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountStorageRequirements.prototype);
        obj.__wbg_ptr = ptr;
        AccountStorageRequirementsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountStorageRequirementsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountstoragerequirements_free(ptr, 0);
    }
    /**
     * Builds storage requirements from a list of slot/key pairs.
     * @param {SlotAndKeys[]} slots_and_keys
     * @returns {AccountStorageRequirements}
     */
    static fromSlotAndKeysArray(slots_and_keys) {
        const ptr0 = passArrayJsValueToWasm0(slots_and_keys, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountstoragerequirements_fromSlotAndKeysArray(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountStorageRequirements.__wrap(ret[0]);
    }
    /**
     * Creates empty storage requirements.
     */
    constructor() {
        const ret = wasm.accountstoragerequirements_new();
        this.__wbg_ptr = ret >>> 0;
        AccountStorageRequirementsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) AccountStorageRequirements.prototype[Symbol.dispose] = AccountStorageRequirements.prototype.free;

/**
 * @enum {0 | 1 | 2 | 3}
 */
const AccountType = Object.freeze({
    FungibleFaucet: 0, "0": "FungibleFaucet",
    NonFungibleFaucet: 1, "1": "NonFungibleFaucet",
    RegularAccountImmutableCode: 2, "2": "RegularAccountImmutableCode",
    RegularAccountUpdatableCode: 3, "3": "RegularAccountUpdatableCode",
});

/**
 * `AccountVaultDelta` stores the difference between the initial and final account vault states.
 *
 * The difference is represented as follows:
 * - `fungible`: a binary tree map of fungible asset balance changes in the account vault.
 * - `non_fungible`: a binary tree map of non-fungible assets that were added to or removed from
 *   the account vault.
 */
class AccountVaultDelta {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountVaultDelta.prototype);
        obj.__wbg_ptr = ptr;
        AccountVaultDeltaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountVaultDeltaFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountvaultdelta_free(ptr, 0);
    }
    /**
     * Returns the fungible assets that increased.
     * @returns {FungibleAsset[]}
     */
    addedFungibleAssets() {
        const ret = wasm.accountvaultdelta_addedFungibleAssets(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Deserializes a vault delta from bytes.
     * @param {Uint8Array} bytes
     * @returns {AccountVaultDelta}
     */
    static deserialize(bytes) {
        const ret = wasm.accountvaultdelta_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountVaultDelta.__wrap(ret[0]);
    }
    /**
     * Returns the fungible portion of the delta.
     * @returns {FungibleAssetDelta}
     */
    fungible() {
        const ret = wasm.accountvaultdelta_fungible(this.__wbg_ptr);
        return FungibleAssetDelta.__wrap(ret);
    }
    /**
     * Returns true if no assets are changed.
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.accountvaultdelta_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the fungible assets that decreased.
     * @returns {FungibleAsset[]}
     */
    removedFungibleAssets() {
        const ret = wasm.accountvaultdelta_removedFungibleAssets(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Serializes the vault delta into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.accountvaultdelta_serialize(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) AccountVaultDelta.prototype[Symbol.dispose] = AccountVaultDelta.prototype.free;

/**
 * Representation of a Miden address (account ID plus routing parameters).
 */
class Address {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Address.prototype);
        obj.__wbg_ptr = ptr;
        AddressFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AddressFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_address_free(ptr, 0);
    }
    /**
     * Returns the account ID embedded in the address.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.address_accountId(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountId.__wrap(ret[0]);
    }
    /**
     * Deserializes a byte array into an `Address`.
     * @param {Uint8Array} bytes
     * @returns {Address}
     */
    static deserialize(bytes) {
        const ret = wasm.address_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Builds an address from an account ID and optional interface.
     * @param {AccountId} account_id
     * @param {string | null} [_interface]
     * @returns {Address}
     */
    static fromAccountId(account_id, _interface) {
        _assertClass(account_id, AccountId);
        var ptr0 = isLikeNone(_interface) ? 0 : passStringToWasm0(_interface, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.address_fromAccountId(account_id.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Builds an address from a bech32-encoded string.
     * @param {string} bech32
     * @returns {Address}
     */
    static fromBech32(bech32) {
        const ptr0 = passStringToWasm0(bech32, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.address_fromBech32(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Returns the address interface.
     * @returns {AddressInterface}
     */
    interface() {
        const ret = wasm.address_interface(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return __wbindgen_enum_AddressInterface[ret[0]];
    }
    /**
     * Encodes the address using the provided network prefix.
     * @param {NetworkId} network_id
     * @returns {string}
     */
    toBech32(network_id) {
        let deferred3_0;
        let deferred3_1;
        try {
            _assertClass(network_id, NetworkId);
            var ptr0 = network_id.__destroy_into_raw();
            const ret = wasm.address_toBech32(this.__wbg_ptr, ptr0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Converts the address into a note tag.
     * @returns {NoteTag}
     */
    toNoteTag() {
        const ret = wasm.address_toNoteTag(this.__wbg_ptr);
        return NoteTag.__wrap(ret);
    }
}
if (Symbol.dispose) Address.prototype[Symbol.dispose] = Address.prototype.free;

/**
 * Advice inputs provided to a transaction or note script.
 */
class AdviceInputs {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AdviceInputs.prototype);
        obj.__wbg_ptr = ptr;
        AdviceInputsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AdviceInputsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_adviceinputs_free(ptr, 0);
    }
    /**
     * Returns mapped values for a given key if present.
     * @param {Word} key
     * @returns {Felt[] | undefined}
     */
    mappedValues(key) {
        _assertClass(key, Word);
        const ret = wasm.adviceinputs_mappedValues(this.__wbg_ptr, key.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
    /**
     * `wasm_bindgen` requires an explicit constructor; `#[derive(Default)]` alone
     * is not callable from JS.
     */
    constructor() {
        const ret = wasm.adviceinputs_new();
        this.__wbg_ptr = ret >>> 0;
        AdviceInputsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the stack inputs as a vector of felts.
     * @returns {Felt[]}
     */
    stack() {
        const ret = wasm.adviceinputs_stack(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) AdviceInputs.prototype[Symbol.dispose] = AdviceInputs.prototype.free;

/**
 * Map of advice values keyed by words for script execution.
 */
class AdviceMap {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AdviceMapFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_advicemap_free(ptr, 0);
    }
    /**
     * Inserts a value for the given key, returning any previous value.
     * @param {Word} key
     * @param {FeltArray} value
     * @returns {Felt[] | undefined}
     */
    insert(key, value) {
        _assertClass(key, Word);
        _assertClass(value, FeltArray);
        const ret = wasm.advicemap_insert(this.__wbg_ptr, key.__wbg_ptr, value.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
    /**
     * Creates an empty advice map.
     */
    constructor() {
        const ret = wasm.accountstoragerequirements_new();
        this.__wbg_ptr = ret >>> 0;
        AdviceMapFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) AdviceMap.prototype[Symbol.dispose] = AdviceMap.prototype.free;

/**
 * A container for an unlimited number of assets.
 *
 * An asset vault can contain an unlimited number of assets. The assets are stored in a Sparse
 * Merkle tree as follows:
 * - For fungible assets, the index of a node is defined by the issuing faucet ID, and the value of
 *   the node is the asset itself. Thus, for any fungible asset there will be only one node in the
 *   tree.
 * - For non-fungible assets, the index is defined by the asset itself, and the asset is also the
 *   value of the node.
 *
 * An asset vault can be reduced to a single hash which is the root of the Sparse Merkle Tree.
 */
class AssetVault {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AssetVault.prototype);
        obj.__wbg_ptr = ptr;
        AssetVaultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AssetVaultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_assetvault_free(ptr, 0);
    }
    /**
     * Returns the fungible assets contained in this vault.
     * @returns {FungibleAsset[]}
     */
    fungibleAssets() {
        const ret = wasm.assetvault_fungibleAssets(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the balance for the given fungible faucet, or zero if absent.
     * @param {AccountId} faucet_id
     * @returns {bigint}
     */
    getBalance(faucet_id) {
        _assertClass(faucet_id, AccountId);
        const ret = wasm.assetvault_getBalance(this.__wbg_ptr, faucet_id.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Returns the root commitment of the asset vault tree.
     * @returns {Word}
     */
    root() {
        const ret = wasm.accountheader_codeCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) AssetVault.prototype[Symbol.dispose] = AssetVault.prototype.free;

/**
 * Multisig auth configuration for `RpoFalcon512` signatures.
 */
class AuthFalcon512RpoMultisigConfig {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AuthFalcon512RpoMultisigConfig.prototype);
        obj.__wbg_ptr = ptr;
        AuthFalcon512RpoMultisigConfigFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AuthFalcon512RpoMultisigConfigFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_authfalcon512rpomultisigconfig_free(ptr, 0);
    }
    /**
     * Approver public key commitments as Words.
     * @returns {Word[]}
     */
    get approvers() {
        const ret = wasm.authfalcon512rpomultisigconfig_approvers(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {number}
     */
    get defaultThreshold() {
        const ret = wasm.authfalcon512rpomultisigconfig_defaultThreshold(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Per-procedure thresholds.
     * @returns {ProcedureThreshold[]}
     */
    getProcThresholds() {
        const ret = wasm.authfalcon512rpomultisigconfig_getProcThresholds(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Build a configuration with a list of approver public key commitments and a default
     * threshold.
     *
     * `default_threshold` must be >= 1 and <= `approvers.length`.
     * @param {Word[]} approvers
     * @param {number} default_threshold
     */
    constructor(approvers, default_threshold) {
        const ptr0 = passArrayJsValueToWasm0(approvers, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.authfalcon512rpomultisigconfig_new(ptr0, len0, default_threshold);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        AuthFalcon512RpoMultisigConfigFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Attach per-procedure thresholds. Each threshold must be >= 1 and <= `approvers.length`.
     * @param {ProcedureThreshold[]} proc_thresholds
     * @returns {AuthFalcon512RpoMultisigConfig}
     */
    withProcThresholds(proc_thresholds) {
        const ptr = this.__destroy_into_raw();
        const ptr0 = passArrayJsValueToWasm0(proc_thresholds, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.authfalcon512rpomultisigconfig_withProcThresholds(ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AuthFalcon512RpoMultisigConfig.__wrap(ret[0]);
    }
}
if (Symbol.dispose) AuthFalcon512RpoMultisigConfig.prototype[Symbol.dispose] = AuthFalcon512RpoMultisigConfig.prototype.free;

/**
 * Authentication schemes supported by the web client.
 * @enum {1 | 2}
 */
const AuthScheme = Object.freeze({
    AuthEcdsaK256Keccak: 1, "1": "AuthEcdsaK256Keccak",
    AuthRpoFalcon512: 2, "2": "AuthRpoFalcon512",
});

class AuthSecretKey {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AuthSecretKey.prototype);
        obj.__wbg_ptr = ptr;
        AuthSecretKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AuthSecretKeyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_authsecretkey_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {AuthSecretKey}
     */
    static deserialize(bytes) {
        const ret = wasm.authsecretkey_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AuthSecretKey.__wrap(ret[0]);
    }
    /**
     * @param {Uint8Array | null} [seed]
     * @returns {AuthSecretKey}
     */
    static ecdsaWithRNG(seed) {
        var ptr0 = isLikeNone(seed) ? 0 : passArray8ToWasm0(seed, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.authsecretkey_ecdsaWithRNG(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AuthSecretKey.__wrap(ret[0]);
    }
    /**
     * Returns the ECDSA k256 Keccak secret key bytes encoded as felts.
     * @returns {Felt[]}
     */
    getEcdsaK256KeccakSecretKeyAsFelts() {
        const ret = wasm.authsecretkey_getEcdsaK256KeccakSecretKeyAsFelts(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Word}
     */
    getPublicKeyAsWord() {
        const ret = wasm.authsecretkey_getPublicKeyAsWord(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * @returns {Felt[]}
     */
    getRpoFalcon512SecretKeyAsFelts() {
        const ret = wasm.authsecretkey_getRpoFalcon512SecretKeyAsFelts(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {PublicKey}
     */
    publicKey() {
        const ret = wasm.authsecretkey_publicKey(this.__wbg_ptr);
        return PublicKey.__wrap(ret);
    }
    /**
     * @param {Uint8Array | null} [seed]
     * @returns {AuthSecretKey}
     */
    static rpoFalconWithRNG(seed) {
        var ptr0 = isLikeNone(seed) ? 0 : passArray8ToWasm0(seed, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.authsecretkey_rpoFalconWithRNG(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AuthSecretKey.__wrap(ret[0]);
    }
    /**
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.authsecretkey_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Word} message
     * @returns {Signature}
     */
    sign(message) {
        _assertClass(message, Word);
        const ret = wasm.authsecretkey_sign(this.__wbg_ptr, message.__wbg_ptr);
        return Signature.__wrap(ret);
    }
    /**
     * @param {SigningInputs} signing_inputs
     * @returns {Signature}
     */
    signData(signing_inputs) {
        _assertClass(signing_inputs, SigningInputs);
        const ret = wasm.authsecretkey_signData(this.__wbg_ptr, signing_inputs.__wbg_ptr);
        return Signature.__wrap(ret);
    }
}
if (Symbol.dispose) AuthSecretKey.prototype[Symbol.dispose] = AuthSecretKey.prototype.free;

/**
 * Provides metadata for a basic fungible faucet account component.
 */
class BasicFungibleFaucetComponent {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BasicFungibleFaucetComponent.prototype);
        obj.__wbg_ptr = ptr;
        BasicFungibleFaucetComponentFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BasicFungibleFaucetComponentFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_basicfungiblefaucetcomponent_free(ptr, 0);
    }
    /**
     * Returns the number of decimal places for the token.
     * @returns {number}
     */
    decimals() {
        const ret = wasm.basicfungiblefaucetcomponent_decimals(this.__wbg_ptr);
        return ret;
    }
    /**
     * Extracts faucet metadata from an account.
     * @param {Account} account
     * @returns {BasicFungibleFaucetComponent}
     */
    static fromAccount(account) {
        _assertClass(account, Account);
        var ptr0 = account.__destroy_into_raw();
        const ret = wasm.basicfungiblefaucetcomponent_fromAccount(ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return BasicFungibleFaucetComponent.__wrap(ret[0]);
    }
    /**
     * Returns the maximum token supply.
     * @returns {Felt}
     */
    maxSupply() {
        const ret = wasm.accountid_prefix(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * Returns the faucet's token symbol.
     * @returns {TokenSymbol}
     */
    symbol() {
        const ret = wasm.basicfungiblefaucetcomponent_symbol(this.__wbg_ptr);
        return TokenSymbol.__wrap(ret);
    }
}
if (Symbol.dispose) BasicFungibleFaucetComponent.prototype[Symbol.dispose] = BasicFungibleFaucetComponent.prototype.free;

/**
 * Public header for a block, containing commitments to the chain state and the proof attesting to
 * the block's validity.
 *
 * Key fields include the previous block commitment, block number, chain/nullifier/note roots,
 * transaction commitments (including the kernel), proof commitment, and a timestamp. Two derived
 * values are exposed:
 * - `sub_commitment`: sequential hash of all fields except the `note_root`.
 * - `commitment`: a 2-to-1 hash of the `sub_commitment` and the `note_root`.
 */
class BlockHeader {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BlockHeader.prototype);
        obj.__wbg_ptr = ptr;
        BlockHeaderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BlockHeaderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blockheader_free(ptr, 0);
    }
    /**
     * Returns the account root commitment.
     * @returns {Word}
     */
    accountRoot() {
        const ret = wasm.accountheader_codeCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the block height.
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.blockheader_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the chain commitment.
     * @returns {Word}
     */
    chainCommitment() {
        const ret = wasm.accountheader_storageCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the commitment to the block contents.
     * @returns {Word}
     */
    commitment() {
        const ret = wasm.blockheader_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the account ID of the fungible faucet whose assets are accepted as the native
     * asset of the blockchain (i.e. the asset used for paying transaction verification fees).
     *
     * This is stored on-chain as part of the block's fee parameters, which means consumers can
     * discover the native faucet by reading any block header rather than hardcoding it per
     * network.
     * @returns {AccountId}
     */
    nativeAssetId() {
        const ret = wasm.blockheader_nativeAssetId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the note commitment root.
     * @returns {Word}
     */
    noteRoot() {
        const ret = wasm.blockheader_noteRoot(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the nullifier root commitment.
     * @returns {Word}
     */
    nullifierRoot() {
        const ret = wasm.blockheader_nullifierRoot(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the commitment of the previous block.
     * @returns {Word}
     */
    prevBlockCommitment() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the proof commitment.
     * @returns {Word}
     */
    proofCommitment() {
        const ret = wasm.blockheader_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the commitment to block metadata.
     * @returns {Word}
     */
    subCommitment() {
        const ret = wasm.blockheader_subCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the block timestamp.
     * @returns {number}
     */
    timestamp() {
        const ret = wasm.blockheader_timestamp(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the transaction commitment.
     * @returns {Word}
     */
    txCommitment() {
        const ret = wasm.blockheader_txCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the transaction kernel commitment.
     * @returns {Word}
     */
    txKernelCommitment() {
        const ret = wasm.blockheader_txKernelCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the header version.
     * @returns {number}
     */
    version() {
        const ret = wasm.blockheader_version(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) BlockHeader.prototype[Symbol.dispose] = BlockHeader.prototype.free;

/**
 * Utility for linking libraries and compiling transaction/note scripts.
 */
class CodeBuilder {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(CodeBuilder.prototype);
        obj.__wbg_ptr = ptr;
        CodeBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CodeBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_codebuilder_free(ptr, 0);
    }
    /**
     * Given a Library Path, and a source code, turn it into a Library.
     * E.g. A path library can be `miden::my_contract`. When turned into a library,
     * this can be used from another script with an import statement, following the
     * previous example: `use miden::my_contract'.
     * @param {string} library_path
     * @param {string} source_code
     * @returns {Library}
     */
    buildLibrary(library_path, source_code) {
        const ptr0 = passStringToWasm0(library_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(source_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.codebuilder_buildLibrary(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Library.__wrap(ret[0]);
    }
    /**
     * Given an `AccountComponentCode`, compiles it
     * with the available modules under this builder. Returns the compiled account component code.
     * @param {string} account_code
     * @returns {AccountComponentCode}
     */
    compileAccountComponentCode(account_code) {
        const ptr0 = passStringToWasm0(account_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.codebuilder_compileAccountComponentCode(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountComponentCode.__wrap(ret[0]);
    }
    /**
     * Given a Note Script's source code, compiles it with the available
     * modules under this builder. Returns the compiled script.
     * @param {string} program
     * @returns {NoteScript}
     */
    compileNoteScript(program) {
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.codebuilder_compileNoteScript(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteScript.__wrap(ret[0]);
    }
    /**
     * Given a Transaction Script's source code, compiles it with the available
     * modules under this builder. Returns the compiled script.
     * @param {string} tx_script
     * @returns {TransactionScript}
     */
    compileTxScript(tx_script) {
        const ptr0 = passStringToWasm0(tx_script, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.codebuilder_compileTxScript(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionScript.__wrap(ret[0]);
    }
    /**
     * This is useful to dynamically link the {@link Library} of a foreign account
     * that is invoked using foreign procedure invocation (FPI). Its code is available
     * on-chain and so it does not have to be copied into the script code.
     *
     * For all other use cases not involving FPI, link the library statically.
     * Receives as argument the library to be linked.
     * @param {Library} library
     */
    linkDynamicLibrary(library) {
        _assertClass(library, Library);
        const ret = wasm.codebuilder_linkDynamicLibrary(this.__wbg_ptr, library.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Given a module path (something like `my_lib::module`) and source code, this will
     * statically link it for use with scripts to be built with this builder.
     * @param {string} module_path
     * @param {string} module_code
     */
    linkModule(module_path, module_code) {
        const ptr0 = passStringToWasm0(module_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(module_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.codebuilder_linkModule(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Statically links the given library.
     *
     * Static linking means the library code is copied into the script code.
     * Use this for most libraries that are not available on-chain.
     *
     * Receives as argument the library to link.
     * @param {Library} library
     */
    linkStaticLibrary(library) {
        _assertClass(library, Library);
        const ret = wasm.codebuilder_linkStaticLibrary(this.__wbg_ptr, library.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) CodeBuilder.prototype[Symbol.dispose] = CodeBuilder.prototype.free;

/**
 * Represents a note committed on chain.
 */
class CommittedNote {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(CommittedNote.prototype);
        obj.__wbg_ptr = ptr;
        CommittedNoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CommittedNoteFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_committednote_free(ptr, 0);
    }
    /**
     * Returns the full note metadata when the attachment payload is available.
     * @returns {NoteMetadata | undefined}
     */
    fullMetadata() {
        const ret = wasm.committednote_fullMetadata(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteMetadata.__wrap(ret);
    }
    /**
     * Returns the inclusion path for the note in the block's note tree.
     * @returns {SparseMerklePath}
     */
    inclusionPath() {
        const ret = wasm.committednote_inclusionPath(this.__wbg_ptr);
        return SparseMerklePath.__wrap(ret);
    }
    /**
     * Returns the inclusion proof for this note.
     * @returns {NoteInclusionProof}
     */
    inclusionProof() {
        const ret = wasm.committednote_inclusionProof(this.__wbg_ptr);
        return NoteInclusionProof.__wrap(ret);
    }
    /**
     * Returns the note metadata.
     *
     * If only metadata headers are available, the returned metadata contains
     * the sender, note type, and tag without attachment payload.
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.committednote_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * Returns the note ID.
     * @returns {NoteId}
     */
    noteId() {
        const ret = wasm.committednote_noteId(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns the note index in the block's note tree.
     * @returns {number}
     */
    noteIndex() {
        const ret = wasm.committednote_noteIndex(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the note type (public, private, etc.).
     * @returns {NoteType}
     */
    noteType() {
        const ret = wasm.committednote_noteType(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the note sender, even when only header metadata is available.
     * @returns {AccountId}
     */
    sender() {
        const ret = wasm.committednote_sender(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the note tag.
     * @returns {number}
     */
    tag() {
        const ret = wasm.committednote_tag(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) CommittedNote.prototype[Symbol.dispose] = CommittedNote.prototype.free;

/**
 * Input note record annotated with consumption conditions.
 */
class ConsumableNoteRecord {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ConsumableNoteRecord.prototype);
        obj.__wbg_ptr = ptr;
        ConsumableNoteRecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ConsumableNoteRecordFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_consumablenoterecord_free(ptr, 0);
    }
    /**
     * Returns the underlying input note record.
     * @returns {InputNoteRecord}
     */
    inputNoteRecord() {
        const ret = wasm.consumablenoterecord_inputNoteRecord(this.__wbg_ptr);
        return InputNoteRecord.__wrap(ret);
    }
    /**
     * Creates a new consumable note record from an input note record and consumability metadata.
     * @param {InputNoteRecord} input_note_record
     * @param {NoteConsumability[]} note_consumability
     */
    constructor(input_note_record, note_consumability) {
        _assertClass(input_note_record, InputNoteRecord);
        var ptr0 = input_note_record.__destroy_into_raw();
        const ptr1 = passArrayJsValueToWasm0(note_consumability, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.consumablenoterecord_new(ptr0, ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        ConsumableNoteRecordFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the consumability entries.
     * @returns {NoteConsumability[]}
     */
    noteConsumability() {
        const ret = wasm.consumablenoterecord_noteConsumability(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) ConsumableNoteRecord.prototype[Symbol.dispose] = ConsumableNoteRecord.prototype.free;

/**
 * The `Endpoint` struct represents a network endpoint, consisting of a protocol, a host, and a
 * port.
 *
 * This struct is used to define the address of a Miden node that the client will connect to.
 */
class Endpoint {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Endpoint.prototype);
        obj.__wbg_ptr = ptr;
        EndpointFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EndpointFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_endpoint_free(ptr, 0);
    }
    /**
     * Returns the endpoint for the Miden devnet.
     * @returns {Endpoint}
     */
    static devnet() {
        const ret = wasm.endpoint_devnet();
        return Endpoint.__wrap(ret);
    }
    /**
     * Returns the host of the endpoint.
     * @returns {string}
     */
    get host() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.endpoint_host(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the endpoint for a local Miden node.
     *
     * Uses <http://localhost:57291>
     * @returns {Endpoint}
     */
    static localhost() {
        const ret = wasm.endpoint_localhost();
        return Endpoint.__wrap(ret);
    }
    /**
     * Creates an endpoint from a URL string.
     *
     * @param url - The URL string (e.g., <https://localhost:57291>)
     * @throws throws an error if the URL is invalid
     * @param {string} url
     */
    constructor(url) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.endpoint_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        EndpointFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the port of the endpoint.
     * @returns {number | undefined}
     */
    get port() {
        const ret = wasm.endpoint_port(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret;
    }
    /**
     * Returns the protocol of the endpoint.
     * @returns {string}
     */
    get protocol() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.endpoint_protocol(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the endpoint for the Miden testnet.
     * @returns {Endpoint}
     */
    static testnet() {
        const ret = wasm.endpoint_testnet();
        return Endpoint.__wrap(ret);
    }
    /**
     * Returns the string representation of the endpoint.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.endpoint_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Endpoint.prototype[Symbol.dispose] = Endpoint.prototype.free;

/**
 * Describes the result of executing a transaction program for the Miden protocol.
 *
 * Executed transaction serves two primary purposes:
 * - It contains a complete description of the effects of the transaction. Specifically, it
 *   contains all output notes created as the result of the transaction and describes all the
 *   changes made to the involved account (i.e., the account delta).
 * - It contains all the information required to re-execute and prove the transaction in a
 *   stateless manner. This includes all public transaction inputs, but also all nondeterministic
 *   inputs that the host provided to Miden VM while executing the transaction (i.e., advice
 *   witness).
 */
class ExecutedTransaction {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ExecutedTransaction.prototype);
        obj.__wbg_ptr = ptr;
        ExecutedTransactionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExecutedTransactionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_executedtransaction_free(ptr, 0);
    }
    /**
     * Returns the account delta resulting from execution.
     * @returns {AccountDelta}
     */
    accountDelta() {
        const ret = wasm.executedtransaction_accountDelta(this.__wbg_ptr);
        return AccountDelta.__wrap(ret);
    }
    /**
     * Returns the account the transaction was executed against.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.executedtransaction_accountId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the block header that included the transaction.
     * @returns {BlockHeader}
     */
    blockHeader() {
        const ret = wasm.executedtransaction_blockHeader(this.__wbg_ptr);
        return BlockHeader.__wrap(ret);
    }
    /**
     * Returns the final account header after execution.
     * @returns {AccountHeader}
     */
    finalAccountHeader() {
        const ret = wasm.executedtransaction_finalAccountHeader(this.__wbg_ptr);
        return AccountHeader.__wrap(ret);
    }
    /**
     * Returns the transaction ID.
     * @returns {TransactionId}
     */
    id() {
        const ret = wasm.executedtransaction_id(this.__wbg_ptr);
        return TransactionId.__wrap(ret);
    }
    /**
     * Returns the initial account header before execution.
     * @returns {AccountHeader}
     */
    initialAccountHeader() {
        const ret = wasm.executedtransaction_initialAccountHeader(this.__wbg_ptr);
        return AccountHeader.__wrap(ret);
    }
    /**
     * Returns the input notes consumed by the transaction.
     * @returns {InputNotes}
     */
    inputNotes() {
        const ret = wasm.executedtransaction_inputNotes(this.__wbg_ptr);
        return InputNotes.__wrap(ret);
    }
    /**
     * Returns the output notes produced by the transaction.
     * @returns {OutputNotes}
     */
    outputNotes() {
        const ret = wasm.executedtransaction_outputNotes(this.__wbg_ptr);
        return OutputNotes.__wrap(ret);
    }
    /**
     * Returns the arguments passed to the transaction script.
     * @returns {TransactionArgs}
     */
    txArgs() {
        const ret = wasm.executedtransaction_txArgs(this.__wbg_ptr);
        return TransactionArgs.__wrap(ret);
    }
}
if (Symbol.dispose) ExecutedTransaction.prototype[Symbol.dispose] = ExecutedTransaction.prototype.free;

/**
 * Field element wrapper exposed to JavaScript.
 */
class Felt {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Felt.prototype);
        obj.__wbg_ptr = ptr;
        FeltFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof Felt)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FeltFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_felt_free(ptr, 0);
    }
    /**
     * Returns the integer representation of the field element.
     * @returns {bigint}
     */
    asInt() {
        const ret = wasm.felt_asInt(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Creates a new field element from a u64 value.
     * @param {bigint} value
     */
    constructor(value) {
        const ret = wasm.felt_new(value);
        this.__wbg_ptr = ret >>> 0;
        FeltFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the string representation of the field element.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.felt_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Felt.prototype[Symbol.dispose] = Felt.prototype.free;

class FeltArray {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FeltArray.prototype);
        obj.__wbg_ptr = ptr;
        FeltArrayFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FeltArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_feltarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {Felt}
     */
    get(index) {
        const ret = wasm.feltarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Felt.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.feltarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Felt[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.feltarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        FeltArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Felt} element
     */
    push(element) {
        _assertClass(element, Felt);
        wasm.feltarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {Felt} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, Felt);
        const ret = wasm.feltarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) FeltArray.prototype[Symbol.dispose] = FeltArray.prototype.free;

/**
 * Account details returned by the node.
 */
class FetchedAccount {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FetchedAccount.prototype);
        obj.__wbg_ptr = ptr;
        FetchedAccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FetchedAccountFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fetchedaccount_free(ptr, 0);
    }
    /**
     * Returns the full account data when the account is public.
     * @returns {Account | undefined}
     */
    account() {
        const ret = wasm.fetchedaccount_account(this.__wbg_ptr);
        return ret === 0 ? undefined : Account.__wrap(ret);
    }
    /**
     * Returns the account ID.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.fetchedaccount_accountId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the account commitment reported by the node.
     * @returns {Word}
     */
    commitment() {
        const ret = wasm.fetchedaccount_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns true when the account is a network account.
     * @returns {boolean}
     */
    isNetwork() {
        const ret = wasm.fetchedaccount_isNetwork(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true when the account is private.
     * @returns {boolean}
     */
    isPrivate() {
        const ret = wasm.fetchedaccount_isPrivate(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true when the account is public.
     * @returns {boolean}
     */
    isPublic() {
        const ret = wasm.fetchedaccount_isPublic(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the last block height where the account was updated.
     * @returns {number}
     */
    lastBlockNum() {
        const ret = wasm.accountproof_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) FetchedAccount.prototype[Symbol.dispose] = FetchedAccount.prototype.free;

/**
 * Wrapper for a note fetched over RPC.
 *
 * It contains the note header and inclusion proof. The note details are only present for
 * public notes.
 */
class FetchedNote {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FetchedNote.prototype);
        obj.__wbg_ptr = ptr;
        FetchedNoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FetchedNoteFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fetchednote_free(ptr, 0);
    }
    /**
     * Returns an [`InputNote`] when the fetched note is public.
     *
     * Returns `undefined` when the note body is missing (e.g. private notes); in that case build
     * an `InputNote` manually using the inclusion proof and note data obtained elsewhere.
     * @returns {InputNote | undefined}
     */
    asInputNote() {
        const ret = wasm.fetchednote_asInputNote(this.__wbg_ptr);
        return ret === 0 ? undefined : InputNote.__wrap(ret);
    }
    /**
     * The note's header, containing the ID and metadata.
     * @returns {NoteHeader}
     */
    get header() {
        const ret = wasm.fetchednote_header(this.__wbg_ptr);
        return NoteHeader.__wrap(ret);
    }
    /**
     * The note's inclusion proof.
     *
     * Contains the data required to prove inclusion of the note in the canonical chain.
     * @returns {NoteInclusionProof}
     */
    get inclusionProof() {
        const ret = wasm.fetchednote_inclusionProof(this.__wbg_ptr);
        return NoteInclusionProof.__wrap(ret);
    }
    /**
     * The note's metadata, including sender, tag, and other properties.
     * Available for both private and public notes.
     * @returns {NoteMetadata}
     */
    get metadata() {
        const ret = wasm.fetchednote_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * Create a `FetchedNote` with an optional [`Note`].
     * @param {NoteId} note_id
     * @param {NoteMetadata} metadata
     * @param {NoteInclusionProof} inclusion_proof
     * @param {Note | null} [note]
     */
    constructor(note_id, metadata, inclusion_proof, note) {
        _assertClass(note_id, NoteId);
        var ptr0 = note_id.__destroy_into_raw();
        _assertClass(metadata, NoteMetadata);
        var ptr1 = metadata.__destroy_into_raw();
        _assertClass(inclusion_proof, NoteInclusionProof);
        var ptr2 = inclusion_proof.__destroy_into_raw();
        let ptr3 = 0;
        if (!isLikeNone(note)) {
            _assertClass(note, Note);
            ptr3 = note.__destroy_into_raw();
        }
        const ret = wasm.fetchednote_new(ptr0, ptr1, ptr2, ptr3);
        this.__wbg_ptr = ret >>> 0;
        FetchedNoteFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * The full [`Note`] data.
     *
     * For public notes, it contains the complete note data.
     * For private notes, it will be undefined.
     * @returns {Note | undefined}
     */
    get note() {
        const ret = wasm.fetchednote_note(this.__wbg_ptr);
        return ret === 0 ? undefined : Note.__wrap(ret);
    }
    /**
     * The unique identifier of the note.
     * @returns {NoteId}
     */
    get noteId() {
        const ret = wasm.fetchednote_noteId(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns whether the note is private, encrypted, or public.
     * @returns {NoteType}
     */
    get noteType() {
        const ret = wasm.fetchednote_noteType(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) FetchedNote.prototype[Symbol.dispose] = FetchedNote.prototype.free;

class FlattenedU8Vec {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FlattenedU8Vec.prototype);
        obj.__wbg_ptr = ptr;
        FlattenedU8VecFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FlattenedU8VecFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_flattenedu8vec_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    data() {
        const ret = wasm.flattenedu8vec_data(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    lengths() {
        const ret = wasm.flattenedu8vec_lengths(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {number}
     */
    num_inner_vecs() {
        const ret = wasm.flattenedu8vec_num_inner_vecs(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) FlattenedU8Vec.prototype[Symbol.dispose] = FlattenedU8Vec.prototype.free;

/**
 * Description of a foreign account referenced by a transaction.
 */
class ForeignAccount {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ForeignAccount.prototype);
        obj.__wbg_ptr = ptr;
        ForeignAccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof ForeignAccount)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ForeignAccountFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_foreignaccount_free(ptr, 0);
    }
    /**
     * Returns the ID of the foreign account.
     * @returns {AccountId}
     */
    account_id() {
        const ret = wasm.foreignaccount_account_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Creates a foreign account entry for a public account with given storage requirements.
     * @param {AccountId} account_id
     * @param {AccountStorageRequirements} storage_requirements
     * @returns {ForeignAccount}
     */
    static public(account_id, storage_requirements) {
        _assertClass(account_id, AccountId);
        _assertClass(storage_requirements, AccountStorageRequirements);
        var ptr0 = storage_requirements.__destroy_into_raw();
        const ret = wasm.foreignaccount_public(account_id.__wbg_ptr, ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ForeignAccount.__wrap(ret[0]);
    }
    /**
     * Returns the required storage slots/keys for this foreign account.
     * @returns {AccountStorageRequirements}
     */
    storage_slot_requirements() {
        const ret = wasm.foreignaccount_storage_slot_requirements(this.__wbg_ptr);
        return AccountStorageRequirements.__wrap(ret);
    }
}
if (Symbol.dispose) ForeignAccount.prototype[Symbol.dispose] = ForeignAccount.prototype.free;

class ForeignAccountArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ForeignAccountArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_foreignaccountarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {ForeignAccount}
     */
    get(index) {
        const ret = wasm.foreignaccountarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ForeignAccount.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.foreignaccountarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {ForeignAccount[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.foreignaccountarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        ForeignAccountArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {ForeignAccount} element
     */
    push(element) {
        _assertClass(element, ForeignAccount);
        wasm.foreignaccountarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {ForeignAccount} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, ForeignAccount);
        const ret = wasm.foreignaccountarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) ForeignAccountArray.prototype[Symbol.dispose] = ForeignAccountArray.prototype.free;

/**
 * A fungible asset.
 *
 * A fungible asset consists of a faucet ID of the faucet which issued the asset as well as the
 * asset amount. Asset amount is guaranteed to be 2^63 - 1 or smaller.
 */
class FungibleAsset {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FungibleAsset.prototype);
        obj.__wbg_ptr = ptr;
        FungibleAssetFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof FungibleAsset)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FungibleAssetFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fungibleasset_free(ptr, 0);
    }
    /**
     * Returns the amount of fungible units.
     * @returns {bigint}
     */
    amount() {
        const ret = wasm.fungibleasset_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Returns the faucet account that minted this asset.
     * @returns {AccountId}
     */
    faucetId() {
        const ret = wasm.accountdelta_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Encodes this asset into the word layout used in the vault.
     * @returns {Word}
     */
    intoWord() {
        const ret = wasm.fungibleasset_intoWord(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Creates a fungible asset for the given faucet and amount.
     * @param {AccountId} faucet_id
     * @param {bigint} amount
     */
    constructor(faucet_id, amount) {
        _assertClass(faucet_id, AccountId);
        const ret = wasm.fungibleasset_new(faucet_id.__wbg_ptr, amount);
        this.__wbg_ptr = ret >>> 0;
        FungibleAssetFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) FungibleAsset.prototype[Symbol.dispose] = FungibleAsset.prototype.free;

/**
 * Aggregated fungible deltas keyed by faucet ID.
 */
class FungibleAssetDelta {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FungibleAssetDelta.prototype);
        obj.__wbg_ptr = ptr;
        FungibleAssetDeltaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FungibleAssetDeltaFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fungibleassetdelta_free(ptr, 0);
    }
    /**
     * Returns the delta amount for a given faucet, if present.
     * @param {AccountId} faucet_id
     * @returns {bigint | undefined}
     */
    amount(faucet_id) {
        _assertClass(faucet_id, AccountId);
        const ret = wasm.fungibleassetdelta_amount(this.__wbg_ptr, faucet_id.__wbg_ptr);
        return ret[0] === 0 ? undefined : ret[1];
    }
    /**
     * Returns all fungible asset deltas as a list.
     * @returns {FungibleAssetDeltaItem[]}
     */
    assets() {
        const ret = wasm.fungibleassetdelta_assets(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Deserializes a fungible delta from bytes.
     * @param {Uint8Array} bytes
     * @returns {FungibleAssetDelta}
     */
    static deserialize(bytes) {
        const ret = wasm.fungibleassetdelta_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return FungibleAssetDelta.__wrap(ret[0]);
    }
    /**
     * Returns true if no fungible assets are affected.
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.accountstoragedelta_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the number of distinct fungible assets in the delta.
     * @returns {number}
     */
    numAssets() {
        const ret = wasm.fungibleassetdelta_numAssets(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Serializes the fungible delta into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.fungibleassetdelta_serialize(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) FungibleAssetDelta.prototype[Symbol.dispose] = FungibleAssetDelta.prototype.free;

/**
 * A single fungible asset change in the vault delta.
 */
class FungibleAssetDeltaItem {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FungibleAssetDeltaItem.prototype);
        obj.__wbg_ptr = ptr;
        FungibleAssetDeltaItemFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FungibleAssetDeltaItemFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fungibleassetdeltaitem_free(ptr, 0);
    }
    /**
     * Returns the signed amount change (positive adds assets, negative removes).
     * @returns {bigint}
     */
    get amount() {
        const ret = wasm.fungibleasset_amount(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the faucet ID this delta refers to.
     * @returns {AccountId}
     */
    get faucetId() {
        const ret = wasm.accountdelta_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
}
if (Symbol.dispose) FungibleAssetDeltaItem.prototype[Symbol.dispose] = FungibleAssetDeltaItem.prototype.free;

/**
 * Procedure digest paired with whether it is an auth procedure.
 */
class GetProceduresResultItem {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(GetProceduresResultItem.prototype);
        obj.__wbg_ptr = ptr;
        GetProceduresResultItemFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GetProceduresResultItemFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_getproceduresresultitem_free(ptr, 0);
    }
    /**
     * Returns the MAST root digest for the procedure.
     * @returns {Word}
     */
    get digest() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns true if the procedure is used for authentication.
     * @returns {boolean}
     */
    get isAuth() {
        const ret = wasm.getproceduresresultitem_isAuth(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) GetProceduresResultItem.prototype[Symbol.dispose] = GetProceduresResultItem.prototype.free;

/**
 * Note supplied as an input to a transaction, optionally with authentication data.
 */
class InputNote {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(InputNote.prototype);
        obj.__wbg_ptr = ptr;
        InputNoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InputNoteFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inputnote_free(ptr, 0);
    }
    /**
     * Creates an authenticated input note from a note and its inclusion proof.
     *
     * An authenticated note has a proof of inclusion in the block's note tree,
     * which is required for consuming the note in a transaction.
     * @param {Note} note
     * @param {NoteInclusionProof} inclusion_proof
     * @returns {InputNote}
     */
    static authenticated(note, inclusion_proof) {
        _assertClass(note, Note);
        _assertClass(inclusion_proof, NoteInclusionProof);
        const ret = wasm.inputnote_authenticated(note.__wbg_ptr, inclusion_proof.__wbg_ptr);
        return InputNote.__wrap(ret);
    }
    /**
     * Returns the commitment to the note ID and metadata.
     * @returns {Word}
     */
    commitment() {
        const ret = wasm.inputnote_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the identifier of the input note.
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.inputnote_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns the note's location within the commitment tree when available.
     * @returns {NoteLocation | undefined}
     */
    location() {
        const ret = wasm.inputnote_location(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteLocation.__wrap(ret);
    }
    /**
     * Returns the underlying note contents.
     * @returns {Note}
     */
    note() {
        const ret = wasm.inputnote_note(this.__wbg_ptr);
        return Note.__wrap(ret);
    }
    /**
     * Returns the inclusion proof if the note is authenticated.
     * @returns {NoteInclusionProof | undefined}
     */
    proof() {
        const ret = wasm.inputnote_proof(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteInclusionProof.__wrap(ret);
    }
    /**
     * Creates an unauthenticated input note from note details.
     *
     * An unauthenticated note can be consumed in a transaction as long as the note exists in the
     * network as of the transaction batch in which the consume transaction is included.
     * @param {Note} note
     * @returns {InputNote}
     */
    static unauthenticated(note) {
        _assertClass(note, Note);
        const ret = wasm.inputnote_unauthenticated(note.__wbg_ptr);
        return InputNote.__wrap(ret);
    }
}
if (Symbol.dispose) InputNote.prototype[Symbol.dispose] = InputNote.prototype.free;

/**
 * Represents a Note of which the Store can keep track and retrieve.
 *
 * An `InputNoteRecord` contains all the information of a `NoteDetails`, in addition to specific
 * information about the note state.
 *
 * Once a proof is received, the `InputNoteRecord` can be transformed into an `InputNote` and used
 * as input for transactions. It is also possible to convert `Note` and `InputNote` into
 * `InputNoteRecord` (we fill the `metadata` and `inclusion_proof` fields if possible).
 *
 * Notes can also be consumed as unauthenticated notes, where their existence is verified by the
 * network.
 */
class InputNoteRecord {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(InputNoteRecord.prototype);
        obj.__wbg_ptr = ptr;
        InputNoteRecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InputNoteRecordFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inputnoterecord_free(ptr, 0);
    }
    /**
     * Returns the note commitment (id + metadata), if available.
     * @returns {Word | undefined}
     */
    commitment() {
        const ret = wasm.inputnoterecord_commitment(this.__wbg_ptr);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * Returns the transaction ID that consumed this note, if any.
     * @returns {string | undefined}
     */
    consumerTransactionId() {
        const ret = wasm.inputnoterecord_consumerTransactionId(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Returns the note details, if present.
     * @returns {NoteDetails}
     */
    details() {
        const ret = wasm.inputnoterecord_details(this.__wbg_ptr);
        return NoteDetails.__wrap(ret);
    }
    /**
     * Returns the note ID.
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.inputnoterecord_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns the inclusion proof when the note is authenticated.
     * @returns {NoteInclusionProof | undefined}
     */
    inclusionProof() {
        const ret = wasm.inputnoterecord_inclusionProof(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteInclusionProof.__wrap(ret);
    }
    /**
     * Returns true if the record contains authentication data (proof).
     * @returns {boolean}
     */
    isAuthenticated() {
        const ret = wasm.inputnoterecord_isAuthenticated(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the note has already been consumed.
     * @returns {boolean}
     */
    isConsumed() {
        const ret = wasm.inputnoterecord_isConsumed(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the note is currently being processed.
     * @returns {boolean}
     */
    isProcessing() {
        const ret = wasm.inputnoterecord_isProcessing(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the note metadata if available.
     * @returns {NoteMetadata | undefined}
     */
    metadata() {
        const ret = wasm.inputnoterecord_metadata(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteMetadata.__wrap(ret);
    }
    /**
     * Returns the nullifier for this note.
     * @returns {string}
     */
    nullifier() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.inputnoterecord_nullifier(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the current processing state for this note.
     * @returns {InputNoteState}
     */
    state() {
        const ret = wasm.inputnoterecord_state(this.__wbg_ptr);
        return ret;
    }
    /**
     * Converts the record into an `InputNote` (including proof when available).
     * @returns {InputNote}
     */
    toInputNote() {
        const ret = wasm.inputnoterecord_toInputNote(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return InputNote.__wrap(ret[0]);
    }
    /**
     * Converts the record into a `Note` (including proof when available).
     * @returns {Note}
     */
    toNote() {
        const ret = wasm.inputnoterecord_toNote(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Note.__wrap(ret[0]);
    }
}
if (Symbol.dispose) InputNoteRecord.prototype[Symbol.dispose] = InputNoteRecord.prototype.free;

/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
 */
const InputNoteState = Object.freeze({
    Expected: 0, "0": "Expected",
    Unverified: 1, "1": "Unverified",
    Committed: 2, "2": "Committed",
    Invalid: 3, "3": "Invalid",
    ProcessingAuthenticated: 4, "4": "ProcessingAuthenticated",
    ProcessingUnauthenticated: 5, "5": "ProcessingUnauthenticated",
    ConsumedAuthenticatedLocal: 6, "6": "ConsumedAuthenticatedLocal",
    ConsumedUnauthenticatedLocal: 7, "7": "ConsumedUnauthenticatedLocal",
    ConsumedExternal: 8, "8": "ConsumedExternal",
});

/**
 * Input notes for a transaction, empty if the transaction does not consume notes.
 */
class InputNotes {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(InputNotes.prototype);
        obj.__wbg_ptr = ptr;
        InputNotesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InputNotesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inputnotes_free(ptr, 0);
    }
    /**
     * Returns the commitment to all input notes.
     * @returns {Word}
     */
    commitment() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the input note at the specified index.
     * @param {number} index
     * @returns {InputNote}
     */
    getNote(index) {
        const ret = wasm.inputnotes_getNote(this.__wbg_ptr, index);
        return InputNote.__wrap(ret);
    }
    /**
     * Returns true if there are no input notes.
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.inputnotes_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns all input notes as a vector.
     * @returns {InputNote[]}
     */
    notes() {
        const ret = wasm.inputnotes_notes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the number of input notes.
     * @returns {number}
     */
    numNotes() {
        const ret = wasm.inputnotes_numNotes(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) InputNotes.prototype[Symbol.dispose] = InputNotes.prototype.free;

class IntoUnderlyingByteSource {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingByteSourceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingbytesource_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get autoAllocateChunkSize() {
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingbytesource_cancel(ptr);
    }
    /**
     * @param {ReadableByteStreamController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, controller);
        return ret;
    }
    /**
     * @param {ReadableByteStreamController} controller
     */
    start(controller) {
        wasm.intounderlyingbytesource_start(this.__wbg_ptr, controller);
    }
    /**
     * @returns {ReadableStreamType}
     */
    get type() {
        const ret = wasm.intounderlyingbytesource_type(this.__wbg_ptr);
        return __wbindgen_enum_ReadableStreamType[ret];
    }
}
if (Symbol.dispose) IntoUnderlyingByteSource.prototype[Symbol.dispose] = IntoUnderlyingByteSource.prototype.free;

class IntoUnderlyingSink {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSinkFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsink_free(ptr, 0);
    }
    /**
     * @param {any} reason
     * @returns {Promise<any>}
     */
    abort(reason) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_abort(ptr, reason);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    close() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_close(ptr);
        return ret;
    }
    /**
     * @param {any} chunk
     * @returns {Promise<any>}
     */
    write(chunk) {
        const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, chunk);
        return ret;
    }
}
if (Symbol.dispose) IntoUnderlyingSink.prototype[Symbol.dispose] = IntoUnderlyingSink.prototype.free;

class IntoUnderlyingSource {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSourceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsource_free(ptr, 0);
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingsource_cancel(ptr);
    }
    /**
     * @param {ReadableStreamDefaultController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, controller);
        return ret;
    }
}
if (Symbol.dispose) IntoUnderlyingSource.prototype[Symbol.dispose] = IntoUnderlyingSource.prototype.free;

/**
 * Represents an update to a single account's state.
 */
class JsAccountUpdate {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(JsAccountUpdate.prototype);
        obj.__wbg_ptr = ptr;
        JsAccountUpdateFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof JsAccountUpdate)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    toJSON() {
        return {
            accountCommitment: this.accountCommitment,
            accountId: this.accountId,
            accountSeed: this.accountSeed,
            assets: this.assets,
            codeRoot: this.codeRoot,
            committed: this.committed,
            nonce: this.nonce,
            storageMapEntries: this.storageMapEntries,
            storageRoot: this.storageRoot,
            storageSlots: this.storageSlots,
            vaultRoot: this.vaultRoot,
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        JsAccountUpdateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_jsaccountupdate_free(ptr, 0);
    }
    /**
     * The cryptographic commitment representing this account's current state.
     * @returns {string}
     */
    get accountCommitment() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsaccountupdate_accountCommitment(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * ID for this account.
     * @returns {string}
     */
    get accountId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsaccountupdate_accountId(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Optional seed data for the account.
     * @returns {Uint8Array | undefined}
     */
    get accountSeed() {
        const ret = wasm.__wbg_get_jsaccountupdate_accountSeed(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * The account's asset vault.
     * @returns {JsVaultAsset[]}
     */
    get assets() {
        const ret = wasm.__wbg_get_jsaccountupdate_assets(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The merkle root of the account's executable code.
     * @returns {string}
     */
    get codeRoot() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsaccountupdate_codeRoot(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Whether this account update has been committed.
     * @returns {boolean}
     */
    get committed() {
        const ret = wasm.__wbg_get_jsaccountupdate_committed(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * The account's transaction nonce as a string.
     * @returns {string}
     */
    get nonce() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsaccountupdate_nonce(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Serialized storage map entries for this account.
     * @returns {JsStorageMapEntry[]}
     */
    get storageMapEntries() {
        const ret = wasm.__wbg_get_jsaccountupdate_storageMapEntries(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The merkle root of the account's storage trie.
     * @returns {string}
     */
    get storageRoot() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsaccountupdate_storageRoot(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Serialized storage slot data for this account.
     * @returns {JsStorageSlot[]}
     */
    get storageSlots() {
        const ret = wasm.__wbg_get_jsaccountupdate_storageSlots(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The merkle root of the account's asset vault.
     * @returns {string}
     */
    get vaultRoot() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsaccountupdate_vaultRoot(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The cryptographic commitment representing this account's current state.
     * @param {string} arg0
     */
    set accountCommitment(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_accountCommitment(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * ID for this account.
     * @param {string} arg0
     */
    set accountId(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_accountId(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Optional seed data for the account.
     * @param {Uint8Array | null} [arg0]
     */
    set accountSeed(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_accountSeed(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The account's asset vault.
     * @param {JsVaultAsset[]} arg0
     */
    set assets(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_assets(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The merkle root of the account's executable code.
     * @param {string} arg0
     */
    set codeRoot(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_codeRoot(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Whether this account update has been committed.
     * @param {boolean} arg0
     */
    set committed(arg0) {
        wasm.__wbg_set_jsaccountupdate_committed(this.__wbg_ptr, arg0);
    }
    /**
     * The account's transaction nonce as a string.
     * @param {string} arg0
     */
    set nonce(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_nonce(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Serialized storage map entries for this account.
     * @param {JsStorageMapEntry[]} arg0
     */
    set storageMapEntries(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_storageMapEntries(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The merkle root of the account's storage trie.
     * @param {string} arg0
     */
    set storageRoot(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_storageRoot(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Serialized storage slot data for this account.
     * @param {JsStorageSlot[]} arg0
     */
    set storageSlots(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_storageSlots(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The merkle root of the account's asset vault.
     * @param {string} arg0
     */
    set vaultRoot(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_vaultRoot(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) JsAccountUpdate.prototype[Symbol.dispose] = JsAccountUpdate.prototype.free;

/**
 * An object that contains data for a sync update,
 * which will be received by the applyStateSync JS function.
 * under sync.js
 */
class JsStateSyncUpdate {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(JsStateSyncUpdate.prototype);
        obj.__wbg_ptr = ptr;
        JsStateSyncUpdateFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        JsStateSyncUpdateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_jsstatesyncupdate_free(ptr, 0);
    }
    /**
     * Account state updates included in this sync.
     * @returns {JsAccountUpdate[]}
     */
    get accountUpdates() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_accountUpdates(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * For each block in this update, stores a boolean (as u8) indicating whether
     * that block contains notes relevant to this client. Index i corresponds to
     * the ith block, with 1 meaning relevant and 0 meaning not relevant.
     * @returns {Uint8Array}
     */
    get blockHasRelevantNotes() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_blockHasRelevantNotes(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The block number for this update.
     * @returns {number}
     */
    get blockNum() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * IDs of note tags that should be removed from the client's local state.
     * @returns {string[]}
     */
    get committedNoteIds() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_committedNoteIds(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The new block headers for this state update, serialized into a flattened byte array.
     * @returns {FlattenedU8Vec}
     */
    get flattenedNewBlockHeaders() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_flattenedNewBlockHeaders(this.__wbg_ptr);
        return FlattenedU8Vec.__wrap(ret);
    }
    /**
     * Flattened byte array containing partial blockchain peaks used for merkle tree
     * verification.
     * @returns {FlattenedU8Vec}
     */
    get flattenedPartialBlockChainPeaks() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_flattenedPartialBlockChainPeaks(this.__wbg_ptr);
        return FlattenedU8Vec.__wrap(ret);
    }
    /**
     * The block numbers corresponding to each header in `flattened_new_block_headers`.
     * This vec should have the same length as the number of headers, with each index
     * representing the block number for the header at that same index.
     * @returns {Uint32Array}
     */
    get newBlockNums() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_newBlockNums(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Input notes for this state update in serialized form.
     * @returns {SerializedInputNoteData[]}
     */
    get serializedInputNotes() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_serializedInputNotes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Serialized IDs for new authentication nodes required to verify block headers.
     * @returns {string[]}
     */
    get serializedNodeIds() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_serializedNodeIds(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The actual authentication node data corresponding to the IDs above.
     * @returns {string[]}
     */
    get serializedNodes() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_serializedNodes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Output notes created in this state update in serialized form.
     * @returns {SerializedOutputNoteData[]}
     */
    get serializedOutputNotes() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_serializedOutputNotes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Transaction data for transactions included in this update.
     * @returns {SerializedTransactionData[]}
     */
    get transactionUpdates() {
        const ret = wasm.__wbg_get_jsstatesyncupdate_transactionUpdates(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Account state updates included in this sync.
     * @param {JsAccountUpdate[]} arg0
     */
    set accountUpdates(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_accountUpdates(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * For each block in this update, stores a boolean (as u8) indicating whether
     * that block contains notes relevant to this client. Index i corresponds to
     * the ith block, with 1 meaning relevant and 0 meaning not relevant.
     * @param {Uint8Array} arg0
     */
    set blockHasRelevantNotes(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_blockHasRelevantNotes(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The block number for this update.
     * @param {number} arg0
     */
    set blockNum(arg0) {
        wasm.__wbg_set_jsstatesyncupdate_blockNum(this.__wbg_ptr, arg0);
    }
    /**
     * IDs of note tags that should be removed from the client's local state.
     * @param {string[]} arg0
     */
    set committedNoteIds(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_committedNoteIds(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The new block headers for this state update, serialized into a flattened byte array.
     * @param {FlattenedU8Vec} arg0
     */
    set flattenedNewBlockHeaders(arg0) {
        _assertClass(arg0, FlattenedU8Vec);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_jsstatesyncupdate_flattenedNewBlockHeaders(this.__wbg_ptr, ptr0);
    }
    /**
     * Flattened byte array containing partial blockchain peaks used for merkle tree
     * verification.
     * @param {FlattenedU8Vec} arg0
     */
    set flattenedPartialBlockChainPeaks(arg0) {
        _assertClass(arg0, FlattenedU8Vec);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_jsstatesyncupdate_flattenedPartialBlockChainPeaks(this.__wbg_ptr, ptr0);
    }
    /**
     * The block numbers corresponding to each header in `flattened_new_block_headers`.
     * This vec should have the same length as the number of headers, with each index
     * representing the block number for the header at that same index.
     * @param {Uint32Array} arg0
     */
    set newBlockNums(arg0) {
        const ptr0 = passArray32ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_newBlockNums(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Input notes for this state update in serialized form.
     * @param {SerializedInputNoteData[]} arg0
     */
    set serializedInputNotes(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_serializedInputNotes(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Serialized IDs for new authentication nodes required to verify block headers.
     * @param {string[]} arg0
     */
    set serializedNodeIds(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_serializedNodeIds(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The actual authentication node data corresponding to the IDs above.
     * @param {string[]} arg0
     */
    set serializedNodes(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_serializedNodes(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Output notes created in this state update in serialized form.
     * @param {SerializedOutputNoteData[]} arg0
     */
    set serializedOutputNotes(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_serializedOutputNotes(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Transaction data for transactions included in this update.
     * @param {SerializedTransactionData[]} arg0
     */
    set transactionUpdates(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstatesyncupdate_transactionUpdates(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) JsStateSyncUpdate.prototype[Symbol.dispose] = JsStateSyncUpdate.prototype.free;

/**
 * A JavaScript representation of a storage map entry in an account.
 */
class JsStorageMapEntry {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(JsStorageMapEntry.prototype);
        obj.__wbg_ptr = ptr;
        JsStorageMapEntryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof JsStorageMapEntry)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    toJSON() {
        return {
            key: this.key,
            slotName: this.slotName,
            value: this.value,
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        JsStorageMapEntryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_jsstoragemapentry_free(ptr, 0);
    }
    /**
     * The key of the storage map entry.
     * @returns {string}
     */
    get key() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsstoragemapentry_key(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The slot name of the map this entry belongs to.
     * @returns {string}
     */
    get slotName() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsstoragemapentry_slotName(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The value of the storage map entry.
     * @returns {string}
     */
    get value() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsstoragemapentry_value(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The key of the storage map entry.
     * @param {string} arg0
     */
    set key(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstoragemapentry_key(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The slot name of the map this entry belongs to.
     * @param {string} arg0
     */
    set slotName(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_storageRoot(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The value of the storage map entry.
     * @param {string} arg0
     */
    set value(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstoragemapentry_value(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) JsStorageMapEntry.prototype[Symbol.dispose] = JsStorageMapEntry.prototype.free;

/**
 * A JavaScript representation of a storage slot in an account.
 */
class JsStorageSlot {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(JsStorageSlot.prototype);
        obj.__wbg_ptr = ptr;
        JsStorageSlotFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof JsStorageSlot)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    toJSON() {
        return {
            slotName: this.slotName,
            slotType: this.slotType,
            slotValue: this.slotValue,
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        JsStorageSlotFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_jsstorageslot_free(ptr, 0);
    }
    /**
     * The name of the storage slot.
     * @returns {string}
     */
    get slotName() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsstorageslot_slotName(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The type of the storage slot.
     * @returns {number}
     */
    get slotType() {
        const ret = wasm.__wbg_get_jsstorageslot_slotType(this.__wbg_ptr);
        return ret;
    }
    /**
     * The value stored in the storage slot.
     * @returns {string}
     */
    get slotValue() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsstorageslot_slotValue(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The name of the storage slot.
     * @param {string} arg0
     */
    set slotName(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_storageRoot(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The type of the storage slot.
     * @param {number} arg0
     */
    set slotType(arg0) {
        wasm.__wbg_set_jsstorageslot_slotType(this.__wbg_ptr, arg0);
    }
    /**
     * The value stored in the storage slot.
     * @param {string} arg0
     */
    set slotValue(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstoragemapentry_key(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) JsStorageSlot.prototype[Symbol.dispose] = JsStorageSlot.prototype.free;

/**
 * An object that contains a serialized vault asset.
 */
class JsVaultAsset {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(JsVaultAsset.prototype);
        obj.__wbg_ptr = ptr;
        JsVaultAssetFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof JsVaultAsset)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    toJSON() {
        return {
            asset: this.asset,
            vaultKey: this.vaultKey,
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        JsVaultAssetFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_jsvaultasset_free(ptr, 0);
    }
    /**
     * Word representing the asset.
     * @returns {string}
     */
    get asset() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsvaultasset_asset(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The vault key associated with the asset.
     * @returns {string}
     */
    get vaultKey() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jsvaultasset_vaultKey(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Word representing the asset.
     * @param {string} arg0
     */
    set asset(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstoragemapentry_key(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The vault key associated with the asset.
     * @param {string} arg0
     */
    set vaultKey(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_storageRoot(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) JsVaultAsset.prototype[Symbol.dispose] = JsVaultAsset.prototype.free;

class Library {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Library.prototype);
        obj.__wbg_ptr = ptr;
        LibraryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LibraryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_library_free(ptr, 0);
    }
}
if (Symbol.dispose) Library.prototype[Symbol.dispose] = Library.prototype.free;

/**
 * Represents a Merkle path.
 */
class MerklePath {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(MerklePath.prototype);
        obj.__wbg_ptr = ptr;
        MerklePathFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MerklePathFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_merklepath_free(ptr, 0);
    }
    /**
     * Computes the root given a leaf index and value.
     * @param {bigint} index
     * @param {Word} node
     * @returns {Word}
     */
    computeRoot(index, node) {
        _assertClass(node, Word);
        const ret = wasm.merklepath_computeRoot(this.__wbg_ptr, index, node.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Word.__wrap(ret[0]);
    }
    /**
     * Returns the depth of the path.
     * @returns {number}
     */
    depth() {
        const ret = wasm.merklepath_depth(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the nodes that make up the path.
     * @returns {Word[]}
     */
    nodes() {
        const ret = wasm.merklepath_nodes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Verifies the path against a root.
     * @param {bigint} index
     * @param {Word} node
     * @param {Word} root
     * @returns {boolean}
     */
    verify(index, node, root) {
        _assertClass(node, Word);
        _assertClass(root, Word);
        const ret = wasm.merklepath_verify(this.__wbg_ptr, index, node.__wbg_ptr, root.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) MerklePath.prototype[Symbol.dispose] = MerklePath.prototype.free;

/**
 * The identifier of a Miden network.
 */
class NetworkId {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NetworkId.prototype);
        obj.__wbg_ptr = ptr;
        NetworkIdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NetworkIdFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_networkid_free(ptr, 0);
    }
    /**
     * Builds a custom network ID from a provided custom prefix.
     *
     * Returns an error if the prefix is invalid.
     * @param {string} custom_prefix
     * @returns {NetworkId}
     */
    static custom(custom_prefix) {
        const ptr0 = passStringToWasm0(custom_prefix, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.networkid_custom(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NetworkId.__wrap(ret[0]);
    }
    /**
     * @returns {NetworkId}
     */
    static devnet() {
        const ret = wasm.networkid_devnet();
        return NetworkId.__wrap(ret);
    }
    /**
     * @returns {NetworkId}
     */
    static mainnet() {
        const ret = wasm.networkid_mainnet();
        return NetworkId.__wrap(ret);
    }
    /**
     * @returns {NetworkId}
     */
    static testnet() {
        const ret = wasm.networkid_testnet();
        return NetworkId.__wrap(ret);
    }
}
if (Symbol.dispose) NetworkId.prototype[Symbol.dispose] = NetworkId.prototype.free;

/**
 * The type of a Miden network.
 * @enum {0 | 1 | 2 | 3}
 */
const NetworkType = Object.freeze({
    /**
     * Main network prefix (`mm`).
     */
    Mainnet: 0, "0": "Mainnet",
    /**
     * Public test network prefix (`mtst`).
     */
    Testnet: 1, "1": "Testnet",
    /**
     * Developer network prefix (`mdev`).
     */
    Devnet: 2, "2": "Devnet",
    /**
     * Custom network prefix.
     */
    Custom: 3, "3": "Custom",
});

/**
 * A note bundles public metadata with private details: assets, script, inputs, and a serial number
 * grouped into a recipient. The public identifier (`NoteId`) commits to those
 * details, while the nullifier stays hidden until the note is consumed. Assets move by
 * transferring them into the note; the script and inputs define how and when consumption can
 * happen. See `NoteRecipient` for the shape of the recipient data.
 */
class Note {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Note.prototype);
        obj.__wbg_ptr = ptr;
        NoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof Note)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_note_free(ptr, 0);
    }
    /**
     * Returns the assets locked inside the note.
     * @returns {NoteAssets}
     */
    assets() {
        const ret = wasm.note_assets(this.__wbg_ptr);
        return NoteAssets.__wrap(ret);
    }
    /**
     * Returns the commitment to the note ID and metadata.
     * @returns {Word}
     */
    commitment() {
        const ret = wasm.note_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Builds a P2IDE note that can be reclaimed or timelocked based on block heights.
     * @param {AccountId} sender
     * @param {AccountId} target
     * @param {NoteAssets} assets
     * @param {number | null | undefined} reclaim_height
     * @param {number | null | undefined} timelock_height
     * @param {NoteType} note_type
     * @param {NoteAttachment} attachment
     * @returns {Note}
     */
    static createP2IDENote(sender, target, assets, reclaim_height, timelock_height, note_type, attachment) {
        _assertClass(sender, AccountId);
        _assertClass(target, AccountId);
        _assertClass(assets, NoteAssets);
        _assertClass(attachment, NoteAttachment);
        const ret = wasm.note_createP2IDENote(sender.__wbg_ptr, target.__wbg_ptr, assets.__wbg_ptr, isLikeNone(reclaim_height) ? 0x100000001 : (reclaim_height) >>> 0, isLikeNone(timelock_height) ? 0x100000001 : (timelock_height) >>> 0, note_type, attachment.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Note.__wrap(ret[0]);
    }
    /**
     * Builds a standard P2ID note that targets the specified account.
     * @param {AccountId} sender
     * @param {AccountId} target
     * @param {NoteAssets} assets
     * @param {NoteType} note_type
     * @param {NoteAttachment} attachment
     * @returns {Note}
     */
    static createP2IDNote(sender, target, assets, note_type, attachment) {
        _assertClass(sender, AccountId);
        _assertClass(target, AccountId);
        _assertClass(assets, NoteAssets);
        _assertClass(attachment, NoteAttachment);
        const ret = wasm.note_createP2IDNote(sender.__wbg_ptr, target.__wbg_ptr, assets.__wbg_ptr, note_type, attachment.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Note.__wrap(ret[0]);
    }
    /**
     * Deserializes a note from its byte representation.
     * @param {Uint8Array} bytes
     * @returns {Note}
     */
    static deserialize(bytes) {
        const ret = wasm.note_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Note.__wrap(ret[0]);
    }
    /**
     * Returns the unique identifier of the note.
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.accountheader_storageCommitment(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns the public metadata associated with the note.
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.note_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * Creates a new note from the provided assets, metadata, and recipient.
     * @param {NoteAssets} note_assets
     * @param {NoteMetadata} note_metadata
     * @param {NoteRecipient} note_recipient
     */
    constructor(note_assets, note_metadata, note_recipient) {
        _assertClass(note_assets, NoteAssets);
        _assertClass(note_metadata, NoteMetadata);
        _assertClass(note_recipient, NoteRecipient);
        const ret = wasm.note_new(note_assets.__wbg_ptr, note_metadata.__wbg_ptr, note_recipient.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the note nullifier as a word.
     * @returns {Word}
     */
    nullifier() {
        const ret = wasm.note_nullifier(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the recipient who can consume this note.
     * @returns {NoteRecipient}
     */
    recipient() {
        const ret = wasm.note_recipient(this.__wbg_ptr);
        return NoteRecipient.__wrap(ret);
    }
    /**
     * Returns the script that guards the note.
     * @returns {NoteScript}
     */
    script() {
        const ret = wasm.note_script(this.__wbg_ptr);
        return NoteScript.__wrap(ret);
    }
    /**
     * Serializes the note into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.note_serialize(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) Note.prototype[Symbol.dispose] = Note.prototype.free;

class NoteAndArgs {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteAndArgs.prototype);
        obj.__wbg_ptr = ptr;
        NoteAndArgsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteAndArgs)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteAndArgsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteandargs_free(ptr, 0);
    }
    /**
     * Creates a new note/args pair for transaction building.
     * @param {Note} note
     * @param {Word | null} [args]
     */
    constructor(note, args) {
        _assertClass(note, Note);
        let ptr0 = 0;
        if (!isLikeNone(args)) {
            _assertClass(args, Word);
            ptr0 = args.__destroy_into_raw();
        }
        const ret = wasm.noteandargs_new(note.__wbg_ptr, ptr0);
        this.__wbg_ptr = ret >>> 0;
        NoteAndArgsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) NoteAndArgs.prototype[Symbol.dispose] = NoteAndArgs.prototype.free;

class NoteAndArgsArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteAndArgsArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteandargsarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {NoteAndArgs}
     */
    get(index) {
        const ret = wasm.noteandargsarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteAndArgs.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.noteandargsarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {NoteAndArgs[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.noteandargsarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteAndArgsArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteAndArgs} element
     */
    push(element) {
        _assertClass(element, NoteAndArgs);
        wasm.noteandargsarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {NoteAndArgs} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, NoteAndArgs);
        const ret = wasm.noteandargsarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) NoteAndArgsArray.prototype[Symbol.dispose] = NoteAndArgsArray.prototype.free;

class NoteArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notearray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {Note}
     */
    get(index) {
        const ret = wasm.notearray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Note.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.notearray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Note[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.notearray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Note} element
     */
    push(element) {
        _assertClass(element, Note);
        wasm.notearray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {Note} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, Note);
        const ret = wasm.notearray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) NoteArray.prototype[Symbol.dispose] = NoteArray.prototype.free;

/**
 * An asset container for a note.
 *
 * A note must contain at least 1 asset and can contain up to 256 assets. No duplicates are
 * allowed, but the order of assets is unspecified.
 *
 * All the assets in a note can be reduced to a single commitment which is computed by sequentially
 * hashing the assets. Note that the same list of assets can result in two different commitments if
 * the asset ordering is different.
 */
class NoteAssets {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteAssets.prototype);
        obj.__wbg_ptr = ptr;
        NoteAssetsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteAssetsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteassets_free(ptr, 0);
    }
    /**
     * Returns all fungible assets contained in the note.
     * @returns {FungibleAsset[]}
     */
    fungibleAssets() {
        const ret = wasm.noteassets_fungibleAssets(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Creates a new asset list for a note.
     * @param {FungibleAsset[] | null} [assets_array]
     */
    constructor(assets_array) {
        var ptr0 = isLikeNone(assets_array) ? 0 : passArrayJsValueToWasm0(assets_array, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.noteassets_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteAssetsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Adds a fungible asset to the collection.
     * @param {FungibleAsset} asset
     */
    push(asset) {
        _assertClass(asset, FungibleAsset);
        wasm.noteassets_push(this.__wbg_ptr, asset.__wbg_ptr);
    }
}
if (Symbol.dispose) NoteAssets.prototype[Symbol.dispose] = NoteAssets.prototype.free;

/**
 * An attachment to a note.
 *
 * Note attachments provide additional context about how notes should be processed.
 * For example, a network account target attachment indicates that the note should
 * be consumed by a specific network account.
 */
class NoteAttachment {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteAttachment.prototype);
        obj.__wbg_ptr = ptr;
        NoteAttachmentFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteAttachmentFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteattachment_free(ptr, 0);
    }
    /**
     * Returns the content as an array of Felts if the attachment kind is Array, otherwise None.
     * @returns {FeltArray | undefined}
     */
    asArray() {
        const ret = wasm.noteattachment_asArray(this.__wbg_ptr);
        return ret === 0 ? undefined : FeltArray.__wrap(ret);
    }
    /**
     * Returns the content as a Word if the attachment kind is Word, otherwise None.
     * @returns {Word | undefined}
     */
    asWord() {
        const ret = wasm.noteattachment_asWord(this.__wbg_ptr);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * Returns the attachment kind.
     * @returns {NoteAttachmentKind}
     */
    attachmentKind() {
        const ret = wasm.noteattachment_attachmentKind(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the attachment scheme.
     * @returns {NoteAttachmentScheme}
     */
    attachmentScheme() {
        const ret = wasm.noteattachment_attachmentScheme(this.__wbg_ptr);
        return NoteAttachmentScheme.__wrap(ret);
    }
    /**
     * Creates a default (empty) note attachment.
     */
    constructor() {
        const ret = wasm.noteattachment_new();
        this.__wbg_ptr = ret >>> 0;
        NoteAttachmentFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Creates a new note attachment with Array content from the provided elements.
     * @param {NoteAttachmentScheme} scheme
     * @param {FeltArray} elements
     * @returns {NoteAttachment}
     */
    static newArray(scheme, elements) {
        _assertClass(scheme, NoteAttachmentScheme);
        _assertClass(elements, FeltArray);
        const ret = wasm.noteattachment_newArray(scheme.__wbg_ptr, elements.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteAttachment.__wrap(ret[0]);
    }
    /**
     * Creates a new note attachment for a network account target.
     *
     * This attachment indicates that the note should be consumed by a specific network account.
     * Network accounts are accounts whose storage mode is `Network`, meaning the network (nodes)
     * can execute transactions on behalf of the account.
     *
     * # Arguments
     * * `target_id` - The ID of the network account that should consume the note
     * * `exec_hint` - A hint about when the note can be executed
     *
     * # Errors
     * Returns an error if the target account is not a network account.
     * @param {AccountId} target_id
     * @param {NoteExecutionHint} exec_hint
     * @returns {NoteAttachment}
     */
    static newNetworkAccountTarget(target_id, exec_hint) {
        _assertClass(target_id, AccountId);
        _assertClass(exec_hint, NoteExecutionHint);
        const ret = wasm.noteattachment_newNetworkAccountTarget(target_id.__wbg_ptr, exec_hint.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteAttachment.__wrap(ret[0]);
    }
    /**
     * Creates a new note attachment with Word content from the provided word.
     * @param {NoteAttachmentScheme} scheme
     * @param {Word} word
     * @returns {NoteAttachment}
     */
    static newWord(scheme, word) {
        _assertClass(scheme, NoteAttachmentScheme);
        _assertClass(word, Word);
        const ret = wasm.noteattachment_newWord(scheme.__wbg_ptr, word.__wbg_ptr);
        return NoteAttachment.__wrap(ret);
    }
}
if (Symbol.dispose) NoteAttachment.prototype[Symbol.dispose] = NoteAttachment.prototype.free;

/**
 * Defines the payload shape of a note attachment.
 * @enum {0 | 1 | 2}
 */
const NoteAttachmentKind = Object.freeze({
    None: 0, "0": "None",
    Word: 1, "1": "Word",
    Array: 2, "2": "Array",
});

/**
 * Describes the type of a note attachment.
 *
 * Value `0` is reserved to signal that the scheme is none or absent. Whenever the kind of
 * attachment is not standardized or interoperability is unimportant, this none value can be used.
 */
class NoteAttachmentScheme {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteAttachmentScheme.prototype);
        obj.__wbg_ptr = ptr;
        NoteAttachmentSchemeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteAttachmentSchemeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteattachmentscheme_free(ptr, 0);
    }
    /**
     * Returns the note attachment scheme as a u32.
     * @returns {number}
     */
    asU32() {
        const ret = wasm.noteattachmentscheme_asU32(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns true if the attachment scheme is the reserved value that signals an absent scheme.
     * @returns {boolean}
     */
    isNone() {
        const ret = wasm.noteattachmentscheme_isNone(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Creates a new `NoteAttachmentScheme` from a u32.
     * @param {number} scheme
     */
    constructor(scheme) {
        const ret = wasm.noteattachmentscheme_new(scheme);
        this.__wbg_ptr = ret >>> 0;
        NoteAttachmentSchemeFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the `NoteAttachmentScheme` that signals the absence of an attachment scheme.
     * @returns {NoteAttachmentScheme}
     */
    static none() {
        const ret = wasm.noteattachmentscheme_none();
        return NoteAttachmentScheme.__wrap(ret);
    }
}
if (Symbol.dispose) NoteAttachmentScheme.prototype[Symbol.dispose] = NoteAttachmentScheme.prototype.free;

class NoteConsumability {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteConsumability.prototype);
        obj.__wbg_ptr = ptr;
        NoteConsumabilityFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteConsumability)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteConsumabilityFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteconsumability_free(ptr, 0);
    }
    /**
     * Returns the account that can consume the note.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.accountdelta_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the consumption status of the note.
     * @returns {NoteConsumptionStatus}
     */
    consumptionStatus() {
        const ret = wasm.noteconsumability_consumptionStatus(this.__wbg_ptr);
        return NoteConsumptionStatus.__wrap(ret);
    }
}
if (Symbol.dispose) NoteConsumability.prototype[Symbol.dispose] = NoteConsumability.prototype.free;

/**
 * Describes if a note could be consumed under a specific conditions: target account state and
 * block height.
 */
class NoteConsumptionStatus {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteConsumptionStatus.prototype);
        obj.__wbg_ptr = ptr;
        NoteConsumptionStatusFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteConsumptionStatusFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteconsumptionstatus_free(ptr, 0);
    }
    /**
     * Constructs a `NoteConsumptionStatus` that is consumable.
     * @returns {NoteConsumptionStatus}
     */
    static consumable() {
        const ret = wasm.noteconsumptionstatus_consumable();
        return NoteConsumptionStatus.__wrap(ret);
    }
    /**
     * Constructs a `NoteConsumptionStatus` that is consumable after a specific block height.
     * @param {number} block_height
     * @returns {NoteConsumptionStatus}
     */
    static consumableAfter(block_height) {
        const ret = wasm.noteconsumptionstatus_consumableAfter(block_height);
        return NoteConsumptionStatus.__wrap(ret);
    }
    /**
     * Returns the block number at which the note can be consumed.
     * Returns None if the note is already consumable or never possible
     * @returns {number | undefined}
     */
    consumableAfterBlock() {
        const ret = wasm.noteconsumptionstatus_consumableAfterBlock(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * Constructs a `NoteConsumptionStatus` that is consumable with authorization.
     * @returns {NoteConsumptionStatus}
     */
    static consumableWithAuthorization() {
        const ret = wasm.noteconsumptionstatus_consumableWithAuthorization();
        return NoteConsumptionStatus.__wrap(ret);
    }
    /**
     * Constructs a `NoteConsumptionStatus` that is never consumable.
     * @param {string} err
     * @returns {NoteConsumptionStatus}
     */
    static neverConsumable(err) {
        const ptr0 = passStringToWasm0(err, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.noteconsumptionstatus_neverConsumable(ptr0, len0);
        return NoteConsumptionStatus.__wrap(ret);
    }
    /**
     * Constructs a `NoteConsumptionStatus` that is unconsumable due to conditions.
     * @returns {NoteConsumptionStatus}
     */
    static unconsumableConditions() {
        const ret = wasm.noteconsumptionstatus_unconsumableConditions();
        return NoteConsumptionStatus.__wrap(ret);
    }
}
if (Symbol.dispose) NoteConsumptionStatus.prototype[Symbol.dispose] = NoteConsumptionStatus.prototype.free;

/**
 * Details of a note consisting of assets, script, inputs, and a serial number.
 *
 * See the {@link Note} type for more details.
 */
class NoteDetails {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteDetails.prototype);
        obj.__wbg_ptr = ptr;
        NoteDetailsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteDetailsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notedetails_free(ptr, 0);
    }
    /**
     * Returns the assets locked by the note.
     * @returns {NoteAssets}
     */
    assets() {
        const ret = wasm.notedetails_assets(this.__wbg_ptr);
        return NoteAssets.__wrap(ret);
    }
    /**
     * Returns the note identifier derived from these details.
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.notedetails_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Creates a new set of note details from the given assets and recipient.
     * @param {NoteAssets} note_assets
     * @param {NoteRecipient} note_recipient
     */
    constructor(note_assets, note_recipient) {
        _assertClass(note_assets, NoteAssets);
        _assertClass(note_recipient, NoteRecipient);
        const ret = wasm.notedetails_new(note_assets.__wbg_ptr, note_recipient.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteDetailsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the note nullifier as a word.
     * @returns {Word}
     */
    nullifier() {
        const ret = wasm.notedetails_nullifier(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the recipient which controls when the note can be consumed.
     * @returns {NoteRecipient}
     */
    recipient() {
        const ret = wasm.notedetails_recipient(this.__wbg_ptr);
        return NoteRecipient.__wrap(ret);
    }
}
if (Symbol.dispose) NoteDetails.prototype[Symbol.dispose] = NoteDetails.prototype.free;

/**
 * Pair of note details and tag used when declaring expected notes.
 */
class NoteDetailsAndTag {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteDetailsAndTag.prototype);
        obj.__wbg_ptr = ptr;
        NoteDetailsAndTagFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteDetailsAndTag)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteDetailsAndTagFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notedetailsandtag_free(ptr, 0);
    }
    /**
     * Creates a new pair from note details and tag.
     * @param {NoteDetails} note_details
     * @param {NoteTag} tag
     */
    constructor(note_details, tag) {
        _assertClass(note_details, NoteDetails);
        var ptr0 = note_details.__destroy_into_raw();
        _assertClass(tag, NoteTag);
        var ptr1 = tag.__destroy_into_raw();
        const ret = wasm.notedetailsandtag_new(ptr0, ptr1);
        this.__wbg_ptr = ret >>> 0;
        NoteDetailsAndTagFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the note details.
     * @returns {NoteDetails}
     */
    get noteDetails() {
        const ret = wasm.notedetailsandtag_noteDetails(this.__wbg_ptr);
        return NoteDetails.__wrap(ret);
    }
    /**
     * Returns the note tag.
     * @returns {NoteTag}
     */
    get tag() {
        const ret = wasm.notedetailsandtag_tag(this.__wbg_ptr);
        return NoteTag.__wrap(ret);
    }
}
if (Symbol.dispose) NoteDetailsAndTag.prototype[Symbol.dispose] = NoteDetailsAndTag.prototype.free;

class NoteDetailsAndTagArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteDetailsAndTagArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notedetailsandtagarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {NoteDetailsAndTag}
     */
    get(index) {
        const ret = wasm.notedetailsandtagarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteDetailsAndTag.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.notedetailsandtagarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {NoteDetailsAndTag[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.notedetailsandtagarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteDetailsAndTagArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteDetailsAndTag} element
     */
    push(element) {
        _assertClass(element, NoteDetailsAndTag);
        wasm.notedetailsandtagarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {NoteDetailsAndTag} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, NoteDetailsAndTag);
        const ret = wasm.notedetailsandtagarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) NoteDetailsAndTagArray.prototype[Symbol.dispose] = NoteDetailsAndTagArray.prototype.free;

/**
 * Hint describing when a note can be consumed.
 */
class NoteExecutionHint {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteExecutionHint.prototype);
        obj.__wbg_ptr = ptr;
        NoteExecutionHintFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteExecutionHintFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteexecutionhint_free(ptr, 0);
    }
    /**
     * Creates a hint that activates after the given block number.
     * @param {number} block_num
     * @returns {NoteExecutionHint}
     */
    static afterBlock(block_num) {
        const ret = wasm.noteexecutionhint_afterBlock(block_num);
        return NoteExecutionHint.__wrap(ret);
    }
    /**
     * Creates a hint indicating the note can always be consumed.
     * @returns {NoteExecutionHint}
     */
    static always() {
        const ret = wasm.noteexecutionhint_always();
        return NoteExecutionHint.__wrap(ret);
    }
    /**
     * Returns whether the note can be consumed at the provided block height.
     * @param {number} block_num
     * @returns {boolean}
     */
    canBeConsumed(block_num) {
        const ret = wasm.noteexecutionhint_canBeConsumed(this.__wbg_ptr, block_num);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * Reconstructs a hint from its encoded tag and payload.
     * @param {number} tag
     * @param {number} payload
     * @returns {NoteExecutionHint}
     */
    static fromParts(tag, payload) {
        const ret = wasm.noteexecutionhint_fromParts(tag, payload);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteExecutionHint.__wrap(ret[0]);
    }
    /**
     * Creates a hint that does not specify any execution constraint.
     * @returns {NoteExecutionHint}
     */
    static none() {
        const ret = wasm.noteexecutionhint_none();
        return NoteExecutionHint.__wrap(ret);
    }
    /**
     * Creates a hint that allows execution in a specific slot of a round.
     * @param {number} epoch_len
     * @param {number} slot_len
     * @param {number} slot_offset
     * @returns {NoteExecutionHint}
     */
    static onBlockSlot(epoch_len, slot_len, slot_offset) {
        const ret = wasm.noteexecutionhint_onBlockSlot(epoch_len, slot_len, slot_offset);
        return NoteExecutionHint.__wrap(ret);
    }
}
if (Symbol.dispose) NoteExecutionHint.prototype[Symbol.dispose] = NoteExecutionHint.prototype.free;

/**
 * @enum {0 | 1 | 2}
 */
const NoteExportFormat = Object.freeze({
    Id: 0, "0": "Id",
    Full: 1, "1": "Full",
    Details: 2, "2": "Details",
});

/**
 * A serialized representation of a note.
 */
class NoteFile {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteFile.prototype);
        obj.__wbg_ptr = ptr;
        NoteFileFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteFileFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notefile_free(ptr, 0);
    }
    /**
     * Returns the after-block hint when present.
     * @returns {number | undefined}
     */
    afterBlockNum() {
        const ret = wasm.notefile_afterBlockNum(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * Given a valid byte representation of a `NoteFile`,
     * return it as a struct.
     * @param {Uint8Array} bytes
     * @returns {NoteFile}
     */
    static deserialize(bytes) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.notefile_deserialize(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteFile.__wrap(ret[0]);
    }
    /**
     * Creates a `NoteFile` from an input note, preserving proof when available.
     * @param {InputNote} note
     * @returns {NoteFile}
     */
    static fromInputNote(note) {
        _assertClass(note, InputNote);
        const ret = wasm.notefile_fromInputNote(note.__wbg_ptr);
        return NoteFile.__wrap(ret);
    }
    /**
     * Creates a `NoteFile` from note details.
     * @param {NoteDetails} note_details
     * @returns {NoteFile}
     */
    static fromNoteDetails(note_details) {
        _assertClass(note_details, NoteDetails);
        const ret = wasm.notefile_fromNoteDetails(note_details.__wbg_ptr);
        return NoteFile.__wrap(ret);
    }
    /**
     * Creates a `NoteFile` from a note ID.
     * @param {NoteId} note_details
     * @returns {NoteFile}
     */
    static fromNoteId(note_details) {
        _assertClass(note_details, NoteId);
        const ret = wasm.notefile_fromNoteId(note_details.__wbg_ptr);
        return NoteFile.__wrap(ret);
    }
    /**
     * Creates a `NoteFile` from an output note, choosing details when present.
     * @param {OutputNote} note
     * @returns {NoteFile}
     */
    static fromOutputNote(note) {
        _assertClass(note, OutputNote);
        const ret = wasm.notefile_fromOutputNote(note.__wbg_ptr);
        return NoteFile.__wrap(ret);
    }
    /**
     * Returns the inclusion proof if present.
     * @returns {NoteInclusionProof | undefined}
     */
    inclusionProof() {
        const ret = wasm.notefile_inclusionProof(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteInclusionProof.__wrap(ret);
    }
    /**
     * Returns the full note when the file includes it.
     * @returns {Note | undefined}
     */
    note() {
        const ret = wasm.notefile_note(this.__wbg_ptr);
        return ret === 0 ? undefined : Note.__wrap(ret);
    }
    /**
     * Returns the note details if present.
     * @returns {NoteDetails | undefined}
     */
    noteDetails() {
        const ret = wasm.notefile_noteDetails(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteDetails.__wrap(ret);
    }
    /**
     * Returns the note ID for any `NoteFile` variant.
     * @returns {NoteId}
     */
    noteId() {
        const ret = wasm.notefile_noteId(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns the note tag hint when present.
     * @returns {NoteTag | undefined}
     */
    noteTag() {
        const ret = wasm.notefile_noteTag(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteTag.__wrap(ret);
    }
    /**
     * Returns this `NoteFile`'s types.
     * @returns {string}
     */
    noteType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.notefile_noteType(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the note nullifier when present.
     * @returns {string | undefined}
     */
    nullifier() {
        const ret = wasm.notefile_nullifier(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Turn a notefile into its byte representation.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.notefile_serialize(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}
if (Symbol.dispose) NoteFile.prototype[Symbol.dispose] = NoteFile.prototype.free;

/**
 * Filter options for querying notes from the store.
 */
class NoteFilter {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteFilterFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notefilter_free(ptr, 0);
    }
    /**
     * Creates a new filter for the given type and optional note IDs.
     * @param {NoteFilterTypes} note_type
     * @param {NoteId[] | null} [note_ids]
     */
    constructor(note_type, note_ids) {
        var ptr0 = isLikeNone(note_ids) ? 0 : passArrayJsValueToWasm0(note_ids, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.notefilter_new(note_type, ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteFilterFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) NoteFilter.prototype[Symbol.dispose] = NoteFilter.prototype.free;

/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
 */
const NoteFilterTypes = Object.freeze({
    All: 0, "0": "All",
    Consumed: 1, "1": "Consumed",
    Committed: 2, "2": "Committed",
    Expected: 3, "3": "Expected",
    Processing: 4, "4": "Processing",
    List: 5, "5": "List",
    Unique: 6, "6": "Unique",
    Nullifiers: 7, "7": "Nullifiers",
    Unverified: 8, "8": "Unverified",
});

/**
 * Holds the strictly required, public information of a note.
 *
 * See `NoteId` and `NoteMetadata` for additional details.
 */
class NoteHeader {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteHeader.prototype);
        obj.__wbg_ptr = ptr;
        NoteHeaderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteHeaderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteheader_free(ptr, 0);
    }
    /**
     * Returns the unique identifier for the note.
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns the public metadata attached to the note.
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.noteheader_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * Returns a commitment to the note ID and metadata.
     * @returns {Word}
     */
    toCommitment() {
        const ret = wasm.noteheader_toCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) NoteHeader.prototype[Symbol.dispose] = NoteHeader.prototype.free;

/**
 * Returns a unique identifier of a note, which is simultaneously a commitment to the note.
 *
 * Note ID is computed as:
 *
 * > `hash(recipient, asset_commitment)`
 *
 * where `recipient` is defined as:
 *
 * > `hash(hash(hash(serial_num, ZERO), script_root), input_commitment)`
 *
 * This achieves the following properties:
 * - Every note can be reduced to a single unique ID.
 * - To compute a note ID, we do not need to know the note's `serial_num`. Knowing the hash of the
 *   `serial_num` (as well as script root, input commitment, and note assets) is sufficient.
 */
class NoteId {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteId.prototype);
        obj.__wbg_ptr = ptr;
        NoteIdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteId)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteIdFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteid_free(ptr, 0);
    }
    /**
     * Parses a note ID from its hex encoding.
     * @param {string} hex
     * @returns {NoteId}
     */
    static fromHex(hex) {
        const ptr0 = passStringToWasm0(hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.noteid_fromHex(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteId.__wrap(ret[0]);
    }
    /**
     * Builds a note ID from the recipient and asset commitments.
     * @param {Word} recipient_digest
     * @param {Word} asset_commitment_digest
     */
    constructor(recipient_digest, asset_commitment_digest) {
        _assertClass(recipient_digest, Word);
        _assertClass(asset_commitment_digest, Word);
        const ret = wasm.noteid_new(recipient_digest.__wbg_ptr, asset_commitment_digest.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteIdFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the canonical hex representation of the note ID.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.noteid_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) NoteId.prototype[Symbol.dispose] = NoteId.prototype.free;

/**
 * Note ID paired with optional arguments for inclusion in a transaction request.
 */
class NoteIdAndArgs {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteIdAndArgs.prototype);
        obj.__wbg_ptr = ptr;
        NoteIdAndArgsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteIdAndArgs)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteIdAndArgsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteidandargs_free(ptr, 0);
    }
    /**
     * Creates a new NoteId/args pair.
     * @param {NoteId} note_id
     * @param {Word | null} [args]
     */
    constructor(note_id, args) {
        _assertClass(note_id, NoteId);
        var ptr0 = note_id.__destroy_into_raw();
        let ptr1 = 0;
        if (!isLikeNone(args)) {
            _assertClass(args, Word);
            ptr1 = args.__destroy_into_raw();
        }
        const ret = wasm.noteidandargs_new(ptr0, ptr1);
        this.__wbg_ptr = ret >>> 0;
        NoteIdAndArgsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) NoteIdAndArgs.prototype[Symbol.dispose] = NoteIdAndArgs.prototype.free;

class NoteIdAndArgsArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteIdAndArgsArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteidandargsarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {NoteIdAndArgs}
     */
    get(index) {
        const ret = wasm.noteidandargsarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteIdAndArgs.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.noteidandargsarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {NoteIdAndArgs[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.noteidandargsarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteIdAndArgsArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteIdAndArgs} element
     */
    push(element) {
        _assertClass(element, NoteIdAndArgs);
        wasm.noteidandargsarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {NoteIdAndArgs} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, NoteIdAndArgs);
        const ret = wasm.noteidandargsarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) NoteIdAndArgsArray.prototype[Symbol.dispose] = NoteIdAndArgsArray.prototype.free;

/**
 * Contains the data required to prove inclusion of a note in the canonical chain.
 */
class NoteInclusionProof {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteInclusionProof.prototype);
        obj.__wbg_ptr = ptr;
        NoteInclusionProofFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteInclusionProofFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteinclusionproof_free(ptr, 0);
    }
    /**
     * Returns the location of the note within the tree.
     * @returns {NoteLocation}
     */
    location() {
        const ret = wasm.noteinclusionproof_location(this.__wbg_ptr);
        return NoteLocation.__wrap(ret);
    }
    /**
     * Returns the Merkle authentication path for the note.
     * @returns {MerklePath}
     */
    notePath() {
        const ret = wasm.noteinclusionproof_notePath(this.__wbg_ptr);
        return MerklePath.__wrap(ret);
    }
}
if (Symbol.dispose) NoteInclusionProof.prototype[Symbol.dispose] = NoteInclusionProof.prototype.free;

/**
 * Contains information about the location of a note.
 */
class NoteLocation {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteLocation.prototype);
        obj.__wbg_ptr = ptr;
        NoteLocationFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteLocationFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notelocation_free(ptr, 0);
    }
    /**
     * Returns the index of the note leaf within the block's note tree.
     * @returns {number}
     */
    blockNoteTreeIndex() {
        const ret = wasm.notelocation_blockNoteTreeIndex(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the block height containing the note.
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.noteattachmentscheme_asU32(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) NoteLocation.prototype[Symbol.dispose] = NoteLocation.prototype.free;

/**
 * Metadata associated with a note.
 *
 * This metadata includes the sender, note type, tag, and an optional attachment.
 * Attachments provide additional context about how notes should be processed.
 */
class NoteMetadata {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteMetadata.prototype);
        obj.__wbg_ptr = ptr;
        NoteMetadataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteMetadataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notemetadata_free(ptr, 0);
    }
    /**
     * Returns the attachment of the note.
     * @returns {NoteAttachment}
     */
    attachment() {
        const ret = wasm.notemetadata_attachment(this.__wbg_ptr);
        return NoteAttachment.__wrap(ret);
    }
    /**
     * Creates metadata for a note.
     * @param {AccountId} sender
     * @param {NoteType} note_type
     * @param {NoteTag} note_tag
     */
    constructor(sender, note_type, note_tag) {
        _assertClass(sender, AccountId);
        _assertClass(note_tag, NoteTag);
        const ret = wasm.notemetadata_new(sender.__wbg_ptr, note_type, note_tag.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteMetadataFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns whether the note is private, encrypted, or public.
     * @returns {NoteType}
     */
    noteType() {
        const ret = wasm.notemetadata_noteType(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the account that created the note.
     * @returns {AccountId}
     */
    sender() {
        const ret = wasm.accountdelta_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the tag associated with the note.
     * @returns {NoteTag}
     */
    tag() {
        const ret = wasm.notemetadata_tag(this.__wbg_ptr);
        return NoteTag.__wrap(ret);
    }
    /**
     * Adds an attachment to this metadata and returns the updated metadata.
     *
     * Attachments provide additional context about how notes should be processed.
     * For example, a `NetworkAccountTarget` attachment indicates that the note
     * should be consumed by a specific network account.
     * @param {NoteAttachment} attachment
     * @returns {NoteMetadata}
     */
    withAttachment(attachment) {
        _assertClass(attachment, NoteAttachment);
        const ret = wasm.notemetadata_withAttachment(this.__wbg_ptr, attachment.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * Sets the tag for this metadata and returns the updated metadata.
     * @param {NoteTag} tag
     * @returns {NoteMetadata}
     */
    withTag(tag) {
        _assertClass(tag, NoteTag);
        const ret = wasm.notemetadata_withTag(this.__wbg_ptr, tag.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
}
if (Symbol.dispose) NoteMetadata.prototype[Symbol.dispose] = NoteMetadata.prototype.free;

/**
 * Value that describes under which condition a note can be consumed.
 *
 * The recipient is not an account address, instead it is a value that describes when a note can be
 * consumed. Because not all notes have predetermined consumer addresses, e.g. swap notes can be
 * consumed by anyone, the recipient is defined as the code and its storage, that when successfully
 * executed results in the note's consumption.
 *
 * Recipient is computed as a nested hash of the serial number, the script root, and the storage
 * commitment, ensuring the recipient digest binds all three pieces of data together.
 */
class NoteRecipient {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteRecipient.prototype);
        obj.__wbg_ptr = ptr;
        NoteRecipientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteRecipient)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteRecipientFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noterecipient_free(ptr, 0);
    }
    /**
     * Returns the digest of the recipient data (used in the note commitment).
     * @returns {Word}
     */
    digest() {
        const ret = wasm.accountheader_storageCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Creates a note recipient from its serial number, script, and storage.
     * @param {Word} serial_num
     * @param {NoteScript} note_script
     * @param {NoteStorage} storage
     */
    constructor(serial_num, note_script, storage) {
        _assertClass(serial_num, Word);
        _assertClass(note_script, NoteScript);
        _assertClass(storage, NoteStorage);
        const ret = wasm.noterecipient_new(serial_num.__wbg_ptr, note_script.__wbg_ptr, storage.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteRecipientFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the script that controls consumption.
     * @returns {NoteScript}
     */
    script() {
        const ret = wasm.noterecipient_script(this.__wbg_ptr);
        return NoteScript.__wrap(ret);
    }
    /**
     * Returns the serial number that prevents double spends.
     * @returns {Word}
     */
    serialNum() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the storage provided to the script.
     * @returns {NoteStorage}
     */
    storage() {
        const ret = wasm.noterecipient_storage(this.__wbg_ptr);
        return NoteStorage.__wrap(ret);
    }
}
if (Symbol.dispose) NoteRecipient.prototype[Symbol.dispose] = NoteRecipient.prototype.free;

class NoteRecipientArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteRecipientArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noterecipientarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {NoteRecipient}
     */
    get(index) {
        const ret = wasm.noterecipientarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteRecipient.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.noterecipientarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {NoteRecipient[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.noterecipientarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteRecipientArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteRecipient} element
     */
    push(element) {
        _assertClass(element, NoteRecipient);
        wasm.noterecipientarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {NoteRecipient} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, NoteRecipient);
        const ret = wasm.noterecipientarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) NoteRecipientArray.prototype[Symbol.dispose] = NoteRecipientArray.prototype.free;

/**
 * An executable program of a note.
 *
 * A note's script represents a program which must be executed for a note to be consumed. As such
 * it defines the rules and side effects of consuming a given note.
 */
class NoteScript {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteScript.prototype);
        obj.__wbg_ptr = ptr;
        NoteScriptFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteScriptFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notescript_free(ptr, 0);
    }
    /**
     * Deserializes a script from bytes.
     * @param {Uint8Array} bytes
     * @returns {NoteScript}
     */
    static deserialize(bytes) {
        const ret = wasm.notescript_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteScript.__wrap(ret[0]);
    }
    /**
     * Creates a `NoteScript` from the given `Package`.
     * The package must contain a library with exactly one procedure annotated with
     * `@note_script`.
     * @param {Package} _package
     * @returns {NoteScript}
     */
    static fromPackage(_package) {
        _assertClass(_package, Package);
        const ret = wasm.notescript_fromPackage(_package.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteScript.__wrap(ret[0]);
    }
    /**
     * Returns the well-known P2ID script.
     * @returns {NoteScript}
     */
    static p2id() {
        const ret = wasm.notescript_p2id();
        return NoteScript.__wrap(ret);
    }
    /**
     * Returns the well-known P2IDE script (P2ID with execution hint).
     * @returns {NoteScript}
     */
    static p2ide() {
        const ret = wasm.notescript_p2ide();
        return NoteScript.__wrap(ret);
    }
    /**
     * Returns the MAST root of this script.
     * @returns {Word}
     */
    root() {
        const ret = wasm.notescript_root(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Serializes the script into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.notescript_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the well-known SWAP script.
     * @returns {NoteScript}
     */
    static swap() {
        const ret = wasm.notescript_swap();
        return NoteScript.__wrap(ret);
    }
    /**
     * Pretty-prints the MAST source for this script.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.notescript_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) NoteScript.prototype[Symbol.dispose] = NoteScript.prototype.free;

/**
 * A container for note storage items.
 *
 * A note can be associated with up to 1024 storage items. Each item is represented by a single
 * field element. Thus, note storage can contain up to ~8 KB of data.
 *
 * All storage items associated with a note can be reduced to a single commitment which is
 * computed as an RPO256 hash over the storage elements.
 */
class NoteStorage {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteStorage.prototype);
        obj.__wbg_ptr = ptr;
        NoteStorageFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteStorageFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notestorage_free(ptr, 0);
    }
    /**
     * Returns the raw storage items as an array of field elements.
     * @returns {Felt[]}
     */
    items() {
        const ret = wasm.notestorage_items(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Creates note storage from a list of field elements.
     * @param {FeltArray} felt_array
     */
    constructor(felt_array) {
        _assertClass(felt_array, FeltArray);
        const ret = wasm.notestorage_new(felt_array.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        NoteStorageFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) NoteStorage.prototype[Symbol.dispose] = NoteStorage.prototype.free;

/**
 * Represents a single block's worth of note sync data.
 */
class NoteSyncBlock {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteSyncBlock.prototype);
        obj.__wbg_ptr = ptr;
        NoteSyncBlockFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteSyncBlockFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notesyncblock_free(ptr, 0);
    }
    /**
     * Returns the block header for this block.
     * @returns {BlockHeader}
     */
    blockHeader() {
        const ret = wasm.notesyncblock_blockHeader(this.__wbg_ptr);
        return BlockHeader.__wrap(ret);
    }
    /**
     * Returns the MMR path for the block header.
     * @returns {MerklePath}
     */
    mmrPath() {
        const ret = wasm.notesyncblock_mmrPath(this.__wbg_ptr);
        return MerklePath.__wrap(ret);
    }
    /**
     * Returns the committed notes in this block.
     * @returns {CommittedNote[]}
     */
    notes() {
        const ret = wasm.notesyncblock_notes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) NoteSyncBlock.prototype[Symbol.dispose] = NoteSyncBlock.prototype.free;

/**
 * Represents the response data from `syncNotes`.
 */
class NoteSyncInfo {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteSyncInfo.prototype);
        obj.__wbg_ptr = ptr;
        NoteSyncInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteSyncInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notesyncinfo_free(ptr, 0);
    }
    /**
     * Returns the first block header associated with matching notes, if any.
     * @returns {BlockHeader | undefined}
     */
    blockHeader() {
        const ret = wasm.notesyncinfo_blockHeader(this.__wbg_ptr);
        return ret === 0 ? undefined : BlockHeader.__wrap(ret);
    }
    /**
     * Returns the last block checked by the node. Used as a cursor for pagination.
     * @returns {number}
     */
    blockTo() {
        const ret = wasm.notesyncinfo_blockTo(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the blocks containing matching notes.
     * @returns {NoteSyncBlock[]}
     */
    blocks() {
        const ret = wasm.notesyncinfo_blocks(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the latest block number in the chain.
     * @returns {number}
     */
    chainTip() {
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the first block MMR path associated with matching notes, if any.
     * @returns {MerklePath | undefined}
     */
    mmrPath() {
        const ret = wasm.notesyncinfo_mmrPath(this.__wbg_ptr);
        return ret === 0 ? undefined : MerklePath.__wrap(ret);
    }
    /**
     * Returns the committed notes across all matching blocks.
     * @returns {CommittedNote[]}
     */
    notes() {
        const ret = wasm.notesyncinfo_notes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) NoteSyncInfo.prototype[Symbol.dispose] = NoteSyncInfo.prototype.free;

/**
 * Note tags are 32-bits of data that serve as best-effort filters for notes.
 *
 * Tags enable quick lookups for notes related to particular use cases, scripts, or account
 * prefixes.
 */
class NoteTag {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteTag.prototype);
        obj.__wbg_ptr = ptr;
        NoteTagFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteTag)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteTagFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notetag_free(ptr, 0);
    }
    /**
     * Returns the inner u32 value of this tag.
     * @returns {number}
     */
    asU32() {
        const ret = wasm.noteattachmentscheme_asU32(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Creates a new `NoteTag` from an arbitrary u32.
     * @param {number} tag
     */
    constructor(tag) {
        const ret = wasm.noteattachmentscheme_new(tag);
        this.__wbg_ptr = ret >>> 0;
        NoteTagFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Constructs a note tag that targets the given account ID.
     * @param {AccountId} account_id
     * @returns {NoteTag}
     */
    static withAccountTarget(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.notetag_withAccountTarget(account_id.__wbg_ptr);
        return NoteTag.__wrap(ret);
    }
    /**
     * Constructs a note tag that targets the given account ID with a custom tag length.
     * @param {AccountId} account_id
     * @param {number} tag_len
     * @returns {NoteTag}
     */
    static withCustomAccountTarget(account_id, tag_len) {
        _assertClass(account_id, AccountId);
        const ret = wasm.notetag_withCustomAccountTarget(account_id.__wbg_ptr, tag_len);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteTag.__wrap(ret[0]);
    }
}
if (Symbol.dispose) NoteTag.prototype[Symbol.dispose] = NoteTag.prototype.free;

/**
 * Visibility level for note contents when published to the network.
 * @enum {2 | 1}
 */
const NoteType = Object.freeze({
    /**
     * Notes with this type have only their hash published to the network.
     */
    Private: 2, "2": "Private",
    /**
     * Notes with this type are fully shared with the network.
     */
    Public: 1, "1": "Public",
});

/**
 * Representation of a note produced by a transaction (full or partial).
 */
class OutputNote {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(OutputNote.prototype);
        obj.__wbg_ptr = ptr;
        OutputNoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof OutputNote)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutputNoteFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_outputnote_free(ptr, 0);
    }
    /**
     * Returns the assets if they are present.
     * @returns {NoteAssets | undefined}
     */
    assets() {
        const ret = wasm.outputnote_assets(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteAssets.__wrap(ret);
    }
    /**
     * Wraps a full note output.
     * @param {Note} note
     * @returns {OutputNote}
     */
    static full(note) {
        _assertClass(note, Note);
        const ret = wasm.outputnote_full(note.__wbg_ptr);
        return OutputNote.__wrap(ret);
    }
    /**
     * Returns the note ID for this output.
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.outputnote_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Converts into a full note if the data is present.
     * @returns {Note | undefined}
     */
    intoFull() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.outputnote_intoFull(ptr);
        return ret === 0 ? undefined : Note.__wrap(ret);
    }
    /**
     * Returns the metadata that accompanies this output.
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.outputnote_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * Wraps a partial note containing assets and recipient only.
     * @param {PartialNote} partial_note
     * @returns {OutputNote}
     */
    static partial(partial_note) {
        _assertClass(partial_note, PartialNote);
        const ret = wasm.outputnote_partial(partial_note.__wbg_ptr);
        return OutputNote.__wrap(ret);
    }
    /**
     * Returns the recipient digest.
     * @returns {Word}
     */
    recipientDigest() {
        const ret = wasm.outputnote_recipientDigest(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) OutputNote.prototype[Symbol.dispose] = OutputNote.prototype.free;

class OutputNoteArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutputNoteArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_outputnotearray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {OutputNote}
     */
    get(index) {
        const ret = wasm.outputnotearray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return OutputNote.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.notearray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {OutputNote[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.outputnotearray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        OutputNoteArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {OutputNote} element
     */
    push(element) {
        _assertClass(element, OutputNote);
        wasm.outputnotearray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {OutputNote} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, OutputNote);
        const ret = wasm.outputnotearray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) OutputNoteArray.prototype[Symbol.dispose] = OutputNoteArray.prototype.free;

/**
 * Represents an output note tracked by the client store.
 */
class OutputNoteRecord {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(OutputNoteRecord.prototype);
        obj.__wbg_ptr = ptr;
        OutputNoteRecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutputNoteRecordFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_outputnoterecord_free(ptr, 0);
    }
    /**
     * Returns the note assets.
     * @returns {NoteAssets}
     */
    assets() {
        const ret = wasm.outputnoterecord_assets(this.__wbg_ptr);
        return NoteAssets.__wrap(ret);
    }
    /**
     * Returns the expected block height for the note.
     * @returns {number}
     */
    expectedHeight() {
        const ret = wasm.blockheader_version(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the note ID.
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.outputnoterecord_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns the inclusion proof when the note is committed.
     * @returns {NoteInclusionProof | undefined}
     */
    inclusionProof() {
        const ret = wasm.outputnoterecord_inclusionProof(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteInclusionProof.__wrap(ret);
    }
    /**
     * Returns true if the note is committed on chain.
     * @returns {boolean}
     */
    isCommitted() {
        const ret = wasm.outputnoterecord_isCommitted(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the note has been consumed on chain.
     * @returns {boolean}
     */
    isConsumed() {
        const ret = wasm.outputnoterecord_isConsumed(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the note metadata.
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.outputnoterecord_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * Returns the nullifier when the recipient is known.
     * @returns {string | undefined}
     */
    nullifier() {
        const ret = wasm.outputnoterecord_nullifier(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Returns the recipient details if available.
     * @returns {NoteRecipient | undefined}
     */
    recipient() {
        const ret = wasm.outputnoterecord_recipient(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteRecipient.__wrap(ret);
    }
    /**
     * Returns the recipient digest committed for the note.
     * @returns {Word}
     */
    recipientDigest() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the current processing state for this note.
     * @returns {OutputNoteState}
     */
    state() {
        const ret = wasm.outputnoterecord_state(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) OutputNoteRecord.prototype[Symbol.dispose] = OutputNoteRecord.prototype.free;

/**
 * @enum {0 | 1 | 2 | 3 | 4}
 */
const OutputNoteState = Object.freeze({
    ExpectedPartial: 0, "0": "ExpectedPartial",
    ExpectedFull: 1, "1": "ExpectedFull",
    CommittedPartial: 2, "2": "CommittedPartial",
    CommittedFull: 3, "3": "CommittedFull",
    Consumed: 4, "4": "Consumed",
});

/**
 * Contains a list of output notes of a transaction. The list can be empty if the transaction does
 * not produce any notes.
 */
class OutputNotes {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(OutputNotes.prototype);
        obj.__wbg_ptr = ptr;
        OutputNotesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutputNotesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_outputnotes_free(ptr, 0);
    }
    /**
     * Returns the commitment to all output notes.
     * @returns {Word}
     */
    commitment() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the output note at the specified index.
     * @param {number} index
     * @returns {OutputNote}
     */
    getNote(index) {
        const ret = wasm.outputnotes_getNote(this.__wbg_ptr, index);
        return OutputNote.__wrap(ret);
    }
    /**
     * Returns true if there are no output notes.
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.outputnotes_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns all output notes as a vector.
     * @returns {OutputNote[]}
     */
    notes() {
        const ret = wasm.outputnotes_notes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the number of notes emitted.
     * @returns {number}
     */
    numNotes() {
        const ret = wasm.outputnotes_numNotes(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) OutputNotes.prototype[Symbol.dispose] = OutputNotes.prototype.free;

/**
 * Compiled VM package containing libraries and metadata.
 */
class Package {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Package.prototype);
        obj.__wbg_ptr = ptr;
        PackageFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PackageFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_package_free(ptr, 0);
    }
    /**
     * Returns the underlying library of a `Package`.
     * Fails if the package is not a library.
     * @returns {Library}
     */
    asLibrary() {
        const ret = wasm.package_asLibrary(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Library.__wrap(ret[0]);
    }
    /**
     * Returns the underlying program of a `Package`.
     * Fails if the package is not a program.
     * @returns {Program}
     */
    asProgram() {
        const ret = wasm.package_asProgram(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Program.__wrap(ret[0]);
    }
    /**
     * Deserializes a package from bytes.
     * @param {Uint8Array} bytes
     * @returns {Package}
     */
    static deserialize(bytes) {
        const ret = wasm.package_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Package.__wrap(ret[0]);
    }
    /**
     * Serializes the package into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.package_serialize(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) Package.prototype[Symbol.dispose] = Package.prototype.free;

/**
 * Partial information about a note.
 *
 * Partial note consists of `NoteMetadata`, `NoteAssets`, and a recipient digest (see
 * `NoteRecipient`). However, it does not contain detailed recipient info, including
 * note script, note inputs, and note's serial number. This means that a partial note is sufficient
 * to compute note ID and note header, but not sufficient to compute note nullifier, and generally
 * does not have enough info to execute the note.
 */
class PartialNote {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PartialNoteFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_partialnote_free(ptr, 0);
    }
    /**
     * Returns the assets locked in the note.
     * @returns {NoteAssets}
     */
    assets() {
        const ret = wasm.partialnote_assets(this.__wbg_ptr);
        return NoteAssets.__wrap(ret);
    }
    /**
     * Returns the identifier of the partial note.
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.partialnote_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * Returns the metadata attached to the note.
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.partialnote_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * Returns the digest of the recipient information.
     * @returns {Word}
     */
    recipientDigest() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) PartialNote.prototype[Symbol.dispose] = PartialNote.prototype.free;

/**
 * Poseidon2 hashing helpers exposed to JavaScript.
 */
class Poseidon2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Poseidon2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_poseidon2_free(ptr, 0);
    }
    /**
     * Computes a Poseidon2 digest from the provided field elements.
     * @param {FeltArray} felt_array
     * @returns {Word}
     */
    static hashElements(felt_array) {
        _assertClass(felt_array, FeltArray);
        const ret = wasm.poseidon2_hashElements(felt_array.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) Poseidon2.prototype[Symbol.dispose] = Poseidon2.prototype.free;

class ProcedureThreshold {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ProcedureThreshold.prototype);
        obj.__wbg_ptr = ptr;
        ProcedureThresholdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof ProcedureThreshold)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProcedureThresholdFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_procedurethreshold_free(ptr, 0);
    }
    /**
     * @param {Word} proc_root
     * @param {number} threshold
     */
    constructor(proc_root, threshold) {
        _assertClass(proc_root, Word);
        const ret = wasm.procedurethreshold_new(proc_root.__wbg_ptr, threshold);
        this.__wbg_ptr = ret >>> 0;
        ProcedureThresholdFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Word}
     */
    get procRoot() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    get threshold() {
        const ret = wasm.procedurethreshold_threshold(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) ProcedureThreshold.prototype[Symbol.dispose] = ProcedureThreshold.prototype.free;

class Program {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Program.prototype);
        obj.__wbg_ptr = ptr;
        ProgramFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProgramFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_program_free(ptr, 0);
    }
}
if (Symbol.dispose) Program.prototype[Symbol.dispose] = Program.prototype.free;

/**
 * Result of executing and proving a transaction. Contains all the data required to verify that a
 * transaction was executed correctly.
 */
class ProvenTransaction {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ProvenTransaction.prototype);
        obj.__wbg_ptr = ptr;
        ProvenTransactionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProvenTransactionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_proventransaction_free(ptr, 0);
    }
    /**
     * Returns the account ID the transaction was executed against.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.account_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Deserializes a proven transaction from bytes.
     * @param {Uint8Array} bytes
     * @returns {ProvenTransaction}
     */
    static deserialize(bytes) {
        const ret = wasm.proventransaction_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ProvenTransaction.__wrap(ret[0]);
    }
    /**
     * Returns the block number at which the transaction expires.
     * @returns {number}
     */
    expirationBlockNumber() {
        const ret = wasm.proventransaction_expirationBlockNumber(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the transaction ID.
     * @returns {TransactionId}
     */
    id() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return TransactionId.__wrap(ret);
    }
    /**
     * Returns the nullifiers of the consumed input notes.
     * @returns {Word[]}
     */
    nullifiers() {
        const ret = wasm.proventransaction_nullifiers(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the commitment of the reference block.
     * @returns {Word}
     */
    refBlockCommitment() {
        const ret = wasm.accountheader_storageCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the reference block number used during execution.
     * @returns {number}
     */
    refBlockNumber() {
        const ret = wasm.proventransaction_refBlockNumber(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Serializes the proven transaction into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.proventransaction_serialize(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) ProvenTransaction.prototype[Symbol.dispose] = ProvenTransaction.prototype.free;

class PublicKey {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PublicKey.prototype);
        obj.__wbg_ptr = ptr;
        PublicKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PublicKeyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_publickey_free(ptr, 0);
    }
    /**
     * Deserializes a public key from bytes.
     * @param {Uint8Array} bytes
     * @returns {PublicKey}
     */
    static deserialize(bytes) {
        const ret = wasm.publickey_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PublicKey.__wrap(ret[0]);
    }
    /**
     * Recovers a public key from a signature (only supported for `RpoFalcon512`).
     * @param {Word} message
     * @param {Signature} signature
     * @returns {PublicKey}
     */
    static recoverFrom(message, signature) {
        _assertClass(message, Word);
        _assertClass(signature, Signature);
        const ret = wasm.publickey_recoverFrom(message.__wbg_ptr, signature.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PublicKey.__wrap(ret[0]);
    }
    /**
     * Serializes the public key into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.publickey_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the commitment corresponding to this public key.
     * @returns {Word}
     */
    toCommitment() {
        const ret = wasm.publickey_toCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Verifies a blind message word against the signature.
     * @param {Word} message
     * @param {Signature} signature
     * @returns {boolean}
     */
    verify(message, signature) {
        _assertClass(message, Word);
        _assertClass(signature, Signature);
        const ret = wasm.publickey_verify(this.__wbg_ptr, message.__wbg_ptr, signature.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verifies a signature over arbitrary signing inputs.
     * @param {SigningInputs} signing_inputs
     * @param {Signature} signature
     * @returns {boolean}
     */
    verifyData(signing_inputs, signature) {
        _assertClass(signing_inputs, SigningInputs);
        _assertClass(signature, Signature);
        const ret = wasm.publickey_verifyData(this.__wbg_ptr, signing_inputs.__wbg_ptr, signature.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) PublicKey.prototype[Symbol.dispose] = PublicKey.prototype.free;

/**
 * RPC Client for interacting with Miden nodes directly.
 */
class RpcClient {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RpcClientFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rpcclient_free(ptr, 0);
    }
    /**
     * Fetches account details for a specific account ID.
     * @param {AccountId} account_id
     * @returns {Promise<FetchedAccount>}
     */
    getAccountDetails(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.rpcclient_getAccountDetails(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * Fetches an account proof from the node.
     *
     * This is a lighter-weight alternative to `getAccountDetails` that makes a single RPC call
     * and returns the account proof alongside the account header, storage slot values, and
     * account code without reconstructing the full account state.
     *
     * For private accounts, the proof is returned but account details will not be available
     * since they are not stored on-chain.
     *
     * Useful for reading storage slot values (e.g., faucet metadata) or specific storage map
     * entries without the overhead of fetching the complete account with all vault assets and
     * storage map entries.
     *
     * @param `account_id` - The account to fetch the proof for.
     * @param `storage_requirements` - Optional storage requirements specifying which storage
     *   maps and keys to include. When `undefined`, no storage map data is requested.
     * @param `block_num` - Optional block number to fetch the account state at. When `undefined`,
     *   fetches the latest state (chain tip).
     * @param `known_vault_commitment` - Optional known vault commitment. When provided,
     *   vault data is returned only if the account's current vault root differs from this
     *   value. Use `Word.new([0, 0, 0, 0])` to always fetch. When `undefined`, vault data
     *   is not requested.
     * @param {AccountId} account_id
     * @param {AccountStorageRequirements | null} [storage_requirements]
     * @param {number | null} [block_num]
     * @param {Word | null} [known_vault_commitment]
     * @returns {Promise<AccountProof>}
     */
    getAccountProof(account_id, storage_requirements, block_num, known_vault_commitment) {
        _assertClass(account_id, AccountId);
        let ptr0 = 0;
        if (!isLikeNone(storage_requirements)) {
            _assertClass(storage_requirements, AccountStorageRequirements);
            ptr0 = storage_requirements.__destroy_into_raw();
        }
        let ptr1 = 0;
        if (!isLikeNone(known_vault_commitment)) {
            _assertClass(known_vault_commitment, Word);
            ptr1 = known_vault_commitment.__destroy_into_raw();
        }
        const ret = wasm.rpcclient_getAccountProof(this.__wbg_ptr, account_id.__wbg_ptr, ptr0, isLikeNone(block_num) ? 0x100000001 : (block_num) >>> 0, ptr1);
        return ret;
    }
    /**
     * Fetches a block header by number. When `block_num` is undefined, returns the latest header.
     * @param {number | null} [block_num]
     * @returns {Promise<BlockHeader>}
     */
    getBlockHeaderByNumber(block_num) {
        const ret = wasm.rpcclient_getBlockHeaderByNumber(this.__wbg_ptr, isLikeNone(block_num) ? 0x100000001 : (block_num) >>> 0);
        return ret;
    }
    /**
     * Fetches a note script by its root hash from the connected Miden node.
     *
     * @param script_root - The root hash of the note script to fetch.
     * @returns Promise that resolves to the `NoteScript`.
     * @param {Word} script_root
     * @returns {Promise<NoteScript>}
     */
    getNoteScriptByRoot(script_root) {
        _assertClass(script_root, Word);
        const ret = wasm.rpcclient_getNoteScriptByRoot(this.__wbg_ptr, script_root.__wbg_ptr);
        return ret;
    }
    /**
     * Fetches notes by their IDs from the connected Miden node.
     *
     * @param note_ids - Array of [`NoteId`] objects to fetch
     * @returns Promise that resolves to different data depending on the note type:
     * - Private notes: Returns the `noteHeader`, and the  `inclusionProof`. The `note` field will
     *   be `null`.
     * - Public notes: Returns the full `note` with `inclusionProof`, alongside its header.
     * @param {NoteId[]} note_ids
     * @returns {Promise<FetchedNote[]>}
     */
    getNotesById(note_ids) {
        const ptr0 = passArrayJsValueToWasm0(note_ids, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.rpcclient_getNotesById(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Fetches the block height at which a nullifier was committed, if any.
     * @param {Word} nullifier
     * @param {number} block_num
     * @returns {Promise<number | undefined>}
     */
    getNullifierCommitHeight(nullifier, block_num) {
        _assertClass(nullifier, Word);
        const ret = wasm.rpcclient_getNullifierCommitHeight(this.__wbg_ptr, nullifier.__wbg_ptr, block_num);
        return ret;
    }
    /**
     * Creates a new RPC client instance.
     *
     * @param endpoint - Endpoint to connect to.
     * @param {Endpoint} endpoint
     */
    constructor(endpoint) {
        _assertClass(endpoint, Endpoint);
        var ptr0 = endpoint.__destroy_into_raw();
        const ret = wasm.rpcclient_new(ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        RpcClientFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Fetches notes matching the provided tags from the node.
     * @param {number} block_num
     * @param {number | null | undefined} block_to
     * @param {NoteTag[]} note_tags
     * @returns {Promise<NoteSyncInfo>}
     */
    syncNotes(block_num, block_to, note_tags) {
        const ptr0 = passArrayJsValueToWasm0(note_tags, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.rpcclient_syncNotes(this.__wbg_ptr, block_num, isLikeNone(block_to) ? 0x100000001 : (block_to) >>> 0, ptr0, len0);
        return ret;
    }
    /**
     * Syncs storage map updates for an account within a block range.
     *
     * This is used when `AccountProof.hasStorageMapTooManyEntries()` returns `true` for a
     * slot, indicating the storage map was too large to return inline. This endpoint fetches
     * the full storage map data with pagination support.
     *
     * @param `block_from` - The starting block number.
     * @param `block_to` - Optional ending block number. When `undefined`, syncs to chain tip.
     * @param `account_id` - The account to sync storage maps for.
     * @param {number} block_from
     * @param {number | null | undefined} block_to
     * @param {AccountId} account_id
     * @returns {Promise<StorageMapInfo>}
     */
    syncStorageMaps(block_from, block_to, account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.rpcclient_syncStorageMaps(this.__wbg_ptr, block_from, isLikeNone(block_to) ? 0x100000001 : (block_to) >>> 0, account_id.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) RpcClient.prototype[Symbol.dispose] = RpcClient.prototype.free;

/**
 * RPO256 hashing helpers exposed to JavaScript.
 */
class Rpo256 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Rpo256Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rpo256_free(ptr, 0);
    }
    /**
     * Computes an RPO256 digest from the provided field elements.
     * @param {FeltArray} felt_array
     * @returns {Word}
     */
    static hashElements(felt_array) {
        _assertClass(felt_array, FeltArray);
        const ret = wasm.rpo256_hashElements(felt_array.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) Rpo256.prototype[Symbol.dispose] = Rpo256.prototype.free;

class SerializedInputNoteData {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SerializedInputNoteData.prototype);
        obj.__wbg_ptr = ptr;
        SerializedInputNoteDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof SerializedInputNoteData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SerializedInputNoteDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_serializedinputnotedata_free(ptr, 0);
    }
    /**
     * @returns {number | undefined}
     */
    get consumedBlockHeight() {
        const ret = wasm.__wbg_get_serializedinputnotedata_consumedBlockHeight(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * @returns {number | undefined}
     */
    get consumedTxOrder() {
        const ret = wasm.__wbg_get_serializedinputnotedata_consumedTxOrder(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * @returns {string | undefined}
     */
    get consumerAccountId() {
        const ret = wasm.__wbg_get_serializedinputnotedata_consumerAccountId(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @returns {string}
     */
    get createdAt() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_serializedinputnotedata_createdAt(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get inputs() {
        const ret = wasm.__wbg_get_serializedinputnotedata_inputs(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get noteAssets() {
        const ret = wasm.__wbg_get_serializedinputnotedata_noteAssets(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get noteId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_serializedinputnotedata_noteId(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get noteScriptRoot() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_serializedinputnotedata_noteScriptRoot(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get noteScript() {
        const ret = wasm.__wbg_get_serializedinputnotedata_noteScript(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get nullifier() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_serializedinputnotedata_nullifier(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get serialNumber() {
        const ret = wasm.__wbg_get_serializedinputnotedata_serialNumber(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {number}
     */
    get stateDiscriminant() {
        const ret = wasm.__wbg_get_serializedinputnotedata_stateDiscriminant(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Uint8Array}
     */
    get state() {
        const ret = wasm.__wbg_get_serializedinputnotedata_state(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number | null} [arg0]
     */
    set consumedBlockHeight(arg0) {
        wasm.__wbg_set_serializedinputnotedata_consumedBlockHeight(this.__wbg_ptr, isLikeNone(arg0) ? 0x100000001 : (arg0) >>> 0);
    }
    /**
     * @param {number | null} [arg0]
     */
    set consumedTxOrder(arg0) {
        wasm.__wbg_set_serializedinputnotedata_consumedTxOrder(this.__wbg_ptr, isLikeNone(arg0) ? 0x100000001 : (arg0) >>> 0);
    }
    /**
     * @param {string | null} [arg0]
     */
    set consumerAccountId(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_consumerAccountId(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} arg0
     */
    set createdAt(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_createdAt(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set inputs(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_inputs(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set noteAssets(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_noteAssets(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} arg0
     */
    set noteId(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_noteId(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} arg0
     */
    set noteScriptRoot(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_noteScriptRoot(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set noteScript(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_noteScript(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} arg0
     */
    set nullifier(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_nullifier(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set serialNumber(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_serialNumber(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {number} arg0
     */
    set stateDiscriminant(arg0) {
        wasm.__wbg_set_serializedinputnotedata_stateDiscriminant(this.__wbg_ptr, arg0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set state(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedinputnotedata_state(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) SerializedInputNoteData.prototype[Symbol.dispose] = SerializedInputNoteData.prototype.free;

class SerializedOutputNoteData {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SerializedOutputNoteData.prototype);
        obj.__wbg_ptr = ptr;
        SerializedOutputNoteDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof SerializedOutputNoteData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SerializedOutputNoteDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_serializedoutputnotedata_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get expectedHeight() {
        const ret = wasm.__wbg_get_serializedoutputnotedata_expectedHeight(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {Uint8Array}
     */
    get metadata() {
        const ret = wasm.__wbg_get_serializedoutputnotedata_metadata(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get noteAssets() {
        const ret = wasm.__wbg_get_serializedoutputnotedata_noteAssets(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get noteId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_serializedoutputnotedata_noteId(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string | undefined}
     */
    get nullifier() {
        const ret = wasm.__wbg_get_serializedoutputnotedata_nullifier(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @returns {string}
     */
    get recipientDigest() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_serializedoutputnotedata_recipientDigest(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get stateDiscriminant() {
        const ret = wasm.__wbg_get_serializedoutputnotedata_stateDiscriminant(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Uint8Array}
     */
    get state() {
        const ret = wasm.__wbg_get_serializedoutputnotedata_state(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number} arg0
     */
    set expectedHeight(arg0) {
        wasm.__wbg_set_serializedoutputnotedata_expectedHeight(this.__wbg_ptr, arg0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set metadata(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedoutputnotedata_metadata(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set noteAssets(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedoutputnotedata_noteAssets(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} arg0
     */
    set noteId(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_storageRoot(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string | null} [arg0]
     */
    set nullifier(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedoutputnotedata_nullifier(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} arg0
     */
    set recipientDigest(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsstoragemapentry_value(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {number} arg0
     */
    set stateDiscriminant(arg0) {
        wasm.__wbg_set_serializedoutputnotedata_stateDiscriminant(this.__wbg_ptr, arg0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set state(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedoutputnotedata_state(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) SerializedOutputNoteData.prototype[Symbol.dispose] = SerializedOutputNoteData.prototype.free;

class SerializedTransactionData {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SerializedTransactionData.prototype);
        obj.__wbg_ptr = ptr;
        SerializedTransactionDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof SerializedTransactionData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SerializedTransactionDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_serializedtransactiondata_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get blockNum() {
        const ret = wasm.__wbg_get_serializedtransactiondata_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {Uint8Array}
     */
    get details() {
        const ret = wasm.__wbg_get_serializedtransactiondata_details(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_serializedtransactiondata_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array | undefined}
     */
    get scriptRoot() {
        const ret = wasm.__wbg_get_serializedtransactiondata_scriptRoot(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @returns {number}
     */
    get statusVariant() {
        const ret = wasm.__wbg_get_serializedtransactiondata_statusVariant(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Uint8Array}
     */
    get status() {
        const ret = wasm.__wbg_get_serializedtransactiondata_status(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array | undefined}
     */
    get txScript() {
        const ret = wasm.__wbg_get_serializedtransactiondata_txScript(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {number} arg0
     */
    set blockNum(arg0) {
        wasm.__wbg_set_serializedtransactiondata_blockNum(this.__wbg_ptr, arg0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set details(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedoutputnotedata_noteAssets(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} arg0
     */
    set id(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jsaccountupdate_storageRoot(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Uint8Array | null} [arg0]
     */
    set scriptRoot(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedtransactiondata_scriptRoot(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {number} arg0
     */
    set statusVariant(arg0) {
        wasm.__wbg_set_serializedtransactiondata_statusVariant(this.__wbg_ptr, arg0);
    }
    /**
     * @param {Uint8Array} arg0
     */
    set status(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedtransactiondata_status(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Uint8Array | null} [arg0]
     */
    set txScript(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_serializedtransactiondata_txScript(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) SerializedTransactionData.prototype[Symbol.dispose] = SerializedTransactionData.prototype.free;

/**
 * Cryptographic signature produced by supported auth schemes.
 */
class Signature {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Signature.prototype);
        obj.__wbg_ptr = ptr;
        SignatureFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SignatureFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_signature_free(ptr, 0);
    }
    /**
     * Deserializes a signature from bytes.
     * @param {Uint8Array} bytes
     * @returns {Signature}
     */
    static deserialize(bytes) {
        const ret = wasm.signature_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Signature.__wrap(ret[0]);
    }
    /**
     * Serializes the signature into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.signature_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Converts the signature to the prepared field elements expected by verifying code.
     * @param {Word} message
     * @returns {Felt[]}
     */
    toPreparedSignature(message) {
        _assertClass(message, Word);
        var ptr0 = message.__destroy_into_raw();
        const ret = wasm.signature_toPreparedSignature(this.__wbg_ptr, ptr0);
        var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
}
if (Symbol.dispose) Signature.prototype[Symbol.dispose] = Signature.prototype.free;

class SigningInputs {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SigningInputs.prototype);
        obj.__wbg_ptr = ptr;
        SigningInputsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SigningInputsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_signinginputs_free(ptr, 0);
    }
    /**
     * Returns the arbitrary payload as an array of felts.
     * @returns {FeltArray}
     */
    arbitraryPayload() {
        const ret = wasm.signinginputs_arbitraryPayload(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return FeltArray.__wrap(ret[0]);
    }
    /**
     * Returns the blind payload as a word.
     * @returns {Word}
     */
    blindPayload() {
        const ret = wasm.signinginputs_blindPayload(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Word.__wrap(ret[0]);
    }
    /**
     * Deserializes signing inputs from bytes.
     * @param {Uint8Array} bytes
     * @returns {SigningInputs}
     */
    static deserialize(bytes) {
        const ret = wasm.signinginputs_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return SigningInputs.__wrap(ret[0]);
    }
    /**
     * Creates signing inputs from arbitrary field elements.
     * @param {Felt[]} felts
     * @returns {SigningInputs}
     */
    static newArbitrary(felts) {
        const ptr0 = passArrayJsValueToWasm0(felts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signinginputs_newArbitrary(ptr0, len0);
        return SigningInputs.__wrap(ret);
    }
    /**
     * Creates blind signing inputs from a single word.
     * @param {Word} word
     * @returns {SigningInputs}
     */
    static newBlind(word) {
        _assertClass(word, Word);
        const ret = wasm.signinginputs_newBlind(word.__wbg_ptr);
        return SigningInputs.__wrap(ret);
    }
    /**
     * Creates signing inputs from a transaction summary.
     * @param {TransactionSummary} summary
     * @returns {SigningInputs}
     */
    static newTransactionSummary(summary) {
        _assertClass(summary, TransactionSummary);
        var ptr0 = summary.__destroy_into_raw();
        const ret = wasm.signinginputs_newTransactionSummary(ptr0);
        return SigningInputs.__wrap(ret);
    }
    /**
     * Serializes the signing inputs into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.signinginputs_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the commitment to these signing inputs.
     * @returns {Word}
     */
    toCommitment() {
        const ret = wasm.signinginputs_toCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the inputs as field elements.
     * @returns {FeltArray}
     */
    toElements() {
        const ret = wasm.signinginputs_toElements(this.__wbg_ptr);
        return FeltArray.__wrap(ret);
    }
    /**
     * Returns the transaction summary payload if this variant contains one.
     * @returns {TransactionSummary}
     */
    transactionSummaryPayload() {
        const ret = wasm.signinginputs_transactionSummaryPayload(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionSummary.__wrap(ret[0]);
    }
    /**
     * Returns which variant these signing inputs represent.
     * @returns {SigningInputsType}
     */
    get variantType() {
        const ret = wasm.signinginputs_variantType(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) SigningInputs.prototype[Symbol.dispose] = SigningInputs.prototype.free;

/**
 * @enum {0 | 1 | 2}
 */
const SigningInputsType = Object.freeze({
    /**
     * Signing commitment over a transaction summary.
     */
    TransactionSummary: 0, "0": "TransactionSummary",
    /**
     * Arbitrary field elements supplied by caller.
     */
    Arbitrary: 1, "1": "Arbitrary",
    /**
     * Blind commitment derived from a single word.
     */
    Blind: 2, "2": "Blind",
});

/**
 * Storage slot index paired with map keys that must be present.
 */
class SlotAndKeys {
    static __unwrap(jsValue) {
        if (!(jsValue instanceof SlotAndKeys)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SlotAndKeysFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_slotandkeys_free(ptr, 0);
    }
    /**
     * Creates a new slot-and-keys entry.
     * @param {string} storage_slot_name
     * @param {Word[]} storage_map_keys
     */
    constructor(storage_slot_name, storage_map_keys) {
        const ptr0 = passStringToWasm0(storage_slot_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(storage_map_keys, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.slotandkeys_new(ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        SlotAndKeysFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the storage map keys required for this slot.
     * @returns {Word[]}
     */
    storage_map_keys() {
        const ret = wasm.slotandkeys_storage_map_keys(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the slot name.
     * @returns {string}
     */
    storage_slot_name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.slotandkeys_storage_slot_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) SlotAndKeys.prototype[Symbol.dispose] = SlotAndKeys.prototype.free;

/**
 * Represents a sparse Merkle path.
 */
class SparseMerklePath {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SparseMerklePath.prototype);
        obj.__wbg_ptr = ptr;
        SparseMerklePathFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SparseMerklePathFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sparsemerklepath_free(ptr, 0);
    }
    /**
     * Returns the empty nodes mask used by this path.
     * @returns {bigint}
     */
    emptyNodesMask() {
        const ret = wasm.sparsemerklepath_emptyNodesMask(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Returns the sibling nodes that make up the path.
     * @returns {Word[]}
     */
    nodes() {
        const ret = wasm.sparsemerklepath_nodes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Verifies the path against a root.
     * @param {bigint} index
     * @param {Word} node
     * @param {Word} root
     * @returns {boolean}
     */
    verify(index, node, root) {
        _assertClass(node, Word);
        _assertClass(root, Word);
        const ret = wasm.sparsemerklepath_verify(this.__wbg_ptr, index, node.__wbg_ptr, root.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) SparseMerklePath.prototype[Symbol.dispose] = SparseMerklePath.prototype.free;

/**
 * An account storage map is a sparse merkle tree of depth 64.
 *
 * It can be used to store a large amount of data in an account than would be otherwise possible
 * using just the account's storage slots. This works by storing the root of the map's underlying
 * SMT in one account storage slot. Each map entry is a leaf in the tree and its inclusion is
 * proven while retrieving it (e.g. via `AccountStorage::get_map_item`).
 *
 * As a side-effect, this also means that _not all_ entries of the map have to be present at
 * transaction execution time in order to access or modify the map. It is sufficient if _just_ the
 * accessed/modified items are present in the advice provider.
 *
 * Because the keys of the map are user-chosen and thus not necessarily uniformly distributed, the
 * tree could be imbalanced and made less efficient. To mitigate that, the keys used in the storage
 * map are hashed before they are inserted into the SMT, which creates a uniform distribution. The
 * original keys are retained in a separate map. This causes redundancy but allows for
 * introspection of the map, e.g. by querying the set of stored (original) keys which is useful in
 * debugging and explorer scenarios.
 */
class StorageMap {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StorageMapFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_storagemap_free(ptr, 0);
    }
    /**
     * Inserts a key/value pair, returning any previous value.
     * @param {Word} key
     * @param {Word} value
     * @returns {Word}
     */
    insert(key, value) {
        _assertClass(key, Word);
        _assertClass(value, Word);
        const ret = wasm.storagemap_insert(this.__wbg_ptr, key.__wbg_ptr, value.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Creates an empty storage map.
     */
    constructor() {
        const ret = wasm.storagemap_new();
        this.__wbg_ptr = ret >>> 0;
        StorageMapFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) StorageMap.prototype[Symbol.dispose] = StorageMap.prototype.free;

/**
 * A key-value entry from a storage map.
 */
class StorageMapEntry {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StorageMapEntry.prototype);
        obj.__wbg_ptr = ptr;
        StorageMapEntryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StorageMapEntryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_storagemapentry_free(ptr, 0);
    }
    /**
     * Returns the storage map key.
     * @returns {Word}
     */
    key() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the storage map value.
     * @returns {Word}
     */
    value() {
        const ret = wasm.accountheader_storageCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) StorageMapEntry.prototype[Symbol.dispose] = StorageMapEntry.prototype.free;

/**
 * Information about storage map updates for an account, as returned by the
 * `syncStorageMaps` RPC endpoint.
 *
 * Contains the list of storage map updates within the requested block range,
 * along with the chain tip and last processed block number.
 */
class StorageMapInfo {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StorageMapInfo.prototype);
        obj.__wbg_ptr = ptr;
        StorageMapInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StorageMapInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_storagemapinfo_free(ptr, 0);
    }
    /**
     * Returns the block number of the last check included in this response.
     * @returns {number}
     */
    blockNumber() {
        const ret = wasm.notesyncinfo_blockTo(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the current chain tip block number.
     * @returns {number}
     */
    chainTip() {
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the list of storage map updates.
     * @returns {StorageMapUpdate[]}
     */
    updates() {
        const ret = wasm.storagemapinfo_updates(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) StorageMapInfo.prototype[Symbol.dispose] = StorageMapInfo.prototype.free;

/**
 * A single storage map update entry, containing the block number, slot name,
 * key, and new value.
 */
class StorageMapUpdate {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StorageMapUpdate.prototype);
        obj.__wbg_ptr = ptr;
        StorageMapUpdateFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StorageMapUpdateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_storagemapupdate_free(ptr, 0);
    }
    /**
     * Returns the block number in which this update occurred.
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.storagemapupdate_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the storage map key that was updated.
     * @returns {Word}
     */
    key() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the name of the storage slot that was updated.
     * @returns {string}
     */
    slotName() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.storagemapupdate_slotName(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the new value for this storage map key.
     * @returns {Word}
     */
    value() {
        const ret = wasm.accountheader_storageCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) StorageMapUpdate.prototype[Symbol.dispose] = StorageMapUpdate.prototype.free;

/**
 * A single storage slot value or map for an account component.
 */
class StorageSlot {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StorageSlot.prototype);
        obj.__wbg_ptr = ptr;
        StorageSlotFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof StorageSlot)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StorageSlotFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_storageslot_free(ptr, 0);
    }
    /**
     * Returns an empty value slot (zeroed).
     * @param {string} name
     * @returns {StorageSlot}
     */
    static emptyValue(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.storageslot_emptyValue(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return StorageSlot.__wrap(ret[0]);
    }
    /**
     * Creates a storage slot holding a single value.
     * @param {string} name
     * @param {Word} value
     * @returns {StorageSlot}
     */
    static fromValue(name, value) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(value, Word);
        const ret = wasm.storageslot_fromValue(ptr0, len0, value.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return StorageSlot.__wrap(ret[0]);
    }
    /**
     * Creates a storage slot backed by a map.
     * @param {string} name
     * @param {StorageMap} storage_map
     * @returns {StorageSlot}
     */
    static map(name, storage_map) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(storage_map, StorageMap);
        const ret = wasm.storageslot_map(ptr0, len0, storage_map.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return StorageSlot.__wrap(ret[0]);
    }
}
if (Symbol.dispose) StorageSlot.prototype[Symbol.dispose] = StorageSlot.prototype.free;

class StorageSlotArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StorageSlotArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_storageslotarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {StorageSlot}
     */
    get(index) {
        const ret = wasm.storageslotarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return StorageSlot.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.storageslotarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {StorageSlot[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.storageslotarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        StorageSlotArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {StorageSlot} element
     */
    push(element) {
        _assertClass(element, StorageSlot);
        wasm.storageslotarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {StorageSlot} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, StorageSlot);
        const ret = wasm.storageslotarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) StorageSlotArray.prototype[Symbol.dispose] = StorageSlotArray.prototype.free;

/**
 * Contains stats about the sync operation.
 */
class SyncSummary {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SyncSummary.prototype);
        obj.__wbg_ptr = ptr;
        SyncSummaryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SyncSummaryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_syncsummary_free(ptr, 0);
    }
    /**
     * Returns the block height the summary is based on.
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.syncsummary_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns IDs of notes committed in this sync window.
     * @returns {NoteId[]}
     */
    committedNotes() {
        const ret = wasm.syncsummary_committedNotes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns transactions that were committed.
     * @returns {TransactionId[]}
     */
    committedTransactions() {
        const ret = wasm.syncsummary_committedTransactions(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns IDs of notes that were consumed.
     * @returns {NoteId[]}
     */
    consumedNotes() {
        const ret = wasm.syncsummary_consumedNotes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Deserializes a sync summary from bytes.
     * @param {Uint8Array} bytes
     * @returns {SyncSummary}
     */
    static deserialize(bytes) {
        const ret = wasm.syncsummary_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return SyncSummary.__wrap(ret[0]);
    }
    /**
     * Serializes the sync summary into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.syncsummary_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns accounts that were updated.
     * @returns {AccountId[]}
     */
    updatedAccounts() {
        const ret = wasm.syncsummary_updatedAccounts(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) SyncSummary.prototype[Symbol.dispose] = SyncSummary.prototype.free;

class TestUtils {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TestUtilsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_testutils_free(ptr, 0);
    }
    /**
     * @returns {AccountId}
     */
    static createMockAccountId() {
        const ret = wasm.testutils_createMockAccountId();
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {Uint8Array}
     */
    static createMockSerializedLibraryPackage() {
        const ret = wasm.testutils_createMockSerializedLibraryPackage();
        return ret;
    }
    /**
     * @returns {Uint8Array}
     */
    static createMockSerializedProgramPackage() {
        const ret = wasm.testutils_createMockSerializedProgramPackage();
        return ret;
    }
}
if (Symbol.dispose) TestUtils.prototype[Symbol.dispose] = TestUtils.prototype.free;

/**
 * Represents a string token symbol (e.g. "POL", "ETH") as a single {@link Felt | `Felt`} value.
 *
 * Token Symbols can consists of up to 6 capital Latin characters, e.g. "C", "ETH", "MIDENC".
 */
class TokenSymbol {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TokenSymbol.prototype);
        obj.__wbg_ptr = ptr;
        TokenSymbolFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TokenSymbolFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tokensymbol_free(ptr, 0);
    }
    /**
     * Creates a token symbol from a string.
     * @param {string} symbol
     */
    constructor(symbol) {
        const ptr0 = passStringToWasm0(symbol, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokensymbol_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        TokenSymbolFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the validated symbol string.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.tokensymbol_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) TokenSymbol.prototype[Symbol.dispose] = TokenSymbol.prototype.free;

/**
 * Optional transaction arguments.
 *
 * - Transaction script: a program that is executed in a transaction after all input notes scripts
 *   have been executed.
 * - Note arguments: data put onto the stack right before a note script is executed. These are
 *   different from note inputs, as the user executing the transaction can specify arbitrary note
 *   args.
 * - Advice inputs: Provides data needed by the runtime, like the details of public output notes.
 * - Account inputs: Provides account data that will be accessed in the transaction.
 */
class TransactionArgs {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionArgs.prototype);
        obj.__wbg_ptr = ptr;
        TransactionArgsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionArgsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionargs_free(ptr, 0);
    }
    /**
     * Returns advice inputs attached to the transaction.
     * @returns {AdviceInputs}
     */
    adviceInputs() {
        const ret = wasm.transactionargs_adviceInputs(this.__wbg_ptr);
        return AdviceInputs.__wrap(ret);
    }
    /**
     * Returns note-specific arguments for the given note ID.
     * @param {NoteId} note_id
     * @returns {Word | undefined}
     */
    getNoteArgs(note_id) {
        _assertClass(note_id, NoteId);
        const ret = wasm.transactionargs_getNoteArgs(this.__wbg_ptr, note_id.__wbg_ptr);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * Returns the transaction script if provided.
     * @returns {TransactionScript | undefined}
     */
    txScript() {
        const ret = wasm.transactionargs_txScript(this.__wbg_ptr);
        return ret === 0 ? undefined : TransactionScript.__wrap(ret);
    }
}
if (Symbol.dispose) TransactionArgs.prototype[Symbol.dispose] = TransactionArgs.prototype.free;

/**
 * Filter used when querying stored transactions.
 */
class TransactionFilter {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionFilter.prototype);
        obj.__wbg_ptr = ptr;
        TransactionFilterFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionFilterFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionfilter_free(ptr, 0);
    }
    /**
     * Matches all transactions.
     * @returns {TransactionFilter}
     */
    static all() {
        const ret = wasm.transactionfilter_all();
        return TransactionFilter.__wrap(ret);
    }
    /**
     * Matches transactions that expired before the given block number.
     * @param {number} block_num
     * @returns {TransactionFilter}
     */
    static expiredBefore(block_num) {
        const ret = wasm.transactionfilter_expiredBefore(block_num);
        return TransactionFilter.__wrap(ret);
    }
    /**
     * Matches specific transaction IDs.
     * @param {TransactionId[]} ids
     * @returns {TransactionFilter}
     */
    static ids(ids) {
        const ptr0 = passArrayJsValueToWasm0(ids, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionfilter_ids(ptr0, len0);
        return TransactionFilter.__wrap(ret);
    }
    /**
     * Matches transactions that are not yet committed.
     * @returns {TransactionFilter}
     */
    static uncommitted() {
        const ret = wasm.transactionfilter_uncommitted();
        return TransactionFilter.__wrap(ret);
    }
}
if (Symbol.dispose) TransactionFilter.prototype[Symbol.dispose] = TransactionFilter.prototype.free;

/**
 * A unique identifier of a transaction.
 *
 * Transaction ID is computed as a hash of the initial and final account commitments together with
 * the commitments of the input and output notes.
 *
 * This achieves the following properties:
 * - Transactions are identical if and only if they have the same ID.
 * - Computing transaction ID can be done solely from public transaction data.
 */
class TransactionId {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionId.prototype);
        obj.__wbg_ptr = ptr;
        TransactionIdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof TransactionId)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionIdFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionid_free(ptr, 0);
    }
    /**
     * Returns the transaction ID as raw bytes.
     * @returns {Uint8Array}
     */
    asBytes() {
        const ret = wasm.transactionid_asBytes(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Returns the transaction ID as field elements.
     * @returns {Felt[]}
     */
    asElements() {
        const ret = wasm.transactionid_asElements(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Creates a `TransactionId` from a hex string.
     *
     * Fails if the provided string is not a valid hex representation of a `TransactionId`.
     * @param {string} hex
     * @returns {TransactionId}
     */
    static fromHex(hex) {
        const ptr0 = passStringToWasm0(hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionid_fromHex(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionId.__wrap(ret[0]);
    }
    /**
     * Returns the underlying word representation.
     * @returns {Word}
     */
    inner() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the hexadecimal encoding of the transaction ID.
     * @returns {string}
     */
    toHex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.transactionid_toHex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) TransactionId.prototype[Symbol.dispose] = TransactionId.prototype.free;

/**
 * Wrapper over local or remote transaction proving backends.
 */
class TransactionProver {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionProver.prototype);
        obj.__wbg_ptr = ptr;
        TransactionProverFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionProverFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionprover_free(ptr, 0);
    }
    /**
     * Reconstructs a prover from its serialized descriptor.
     *
     * Parses the format produced by `serialize()`:
     * - `"local"` for local prover
     * - `"remote|{endpoint}"` for remote prover without timeout
     * - `"remote|{endpoint}|{timeout_ms}"` for remote prover with timeout
     * @param {string} payload
     * @returns {TransactionProver}
     */
    static deserialize(payload) {
        const ptr0 = passStringToWasm0(payload, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionprover_deserialize(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionProver.__wrap(ret[0]);
    }
    /**
     * Returns the endpoint if this is a remote prover.
     * @returns {string | undefined}
     */
    endpoint() {
        const ret = wasm.transactionprover_endpoint(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Creates a prover that uses the local proving backend.
     * @returns {TransactionProver}
     */
    static newLocalProver() {
        const ret = wasm.transactionprover_newLocalProver();
        return TransactionProver.__wrap(ret);
    }
    /**
     * Creates a new remote transaction prover.
     *
     * Arguments:
     * - `endpoint`: The URL of the remote prover.
     * - `timeout_ms`: The timeout in milliseconds for the remote prover.
     * @param {string} endpoint
     * @param {bigint | null} [timeout_ms]
     * @returns {TransactionProver}
     */
    static newRemoteProver(endpoint, timeout_ms) {
        const ptr0 = passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionprover_newRemoteProver(ptr0, len0, !isLikeNone(timeout_ms), isLikeNone(timeout_ms) ? BigInt(0) : timeout_ms);
        return TransactionProver.__wrap(ret);
    }
    /**
     * Serializes the prover configuration into a string descriptor.
     *
     * Format:
     * - `"local"` for local prover
     * - `"remote|{endpoint}"` for remote prover without timeout
     * - `"remote|{endpoint}|{timeout_ms}"` for remote prover with timeout
     *
     * Uses `|` as delimiter since it's not a valid URL character.
     * @returns {string}
     */
    serialize() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.transactionprover_serialize(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) TransactionProver.prototype[Symbol.dispose] = TransactionProver.prototype.free;

/**
 * Describes a transaction that has been executed and is being tracked on the Client.
 */
class TransactionRecord {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionRecord.prototype);
        obj.__wbg_ptr = ptr;
        TransactionRecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionRecordFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionrecord_free(ptr, 0);
    }
    /**
     * Returns the account this transaction was executed against.
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.transactionrecord_accountId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * Returns the block height in which the transaction was included.
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.transactionrecord_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the timestamp when the record was created.
     * @returns {bigint}
     */
    creationTimestamp() {
        const ret = wasm.transactionrecord_creationTimestamp(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Returns the expiration block height for the transaction.
     * @returns {number}
     */
    expirationBlockNum() {
        const ret = wasm.transactionrecord_expirationBlockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the final account state commitment after execution.
     * @returns {Word}
     */
    finalAccountState() {
        const ret = wasm.transactionrecord_finalAccountState(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the transaction ID.
     * @returns {TransactionId}
     */
    id() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return TransactionId.__wrap(ret);
    }
    /**
     * Returns the initial account state commitment before execution.
     * @returns {Word}
     */
    initAccountState() {
        const ret = wasm.transactionrecord_initAccountState(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * Returns the nullifiers of the consumed input notes.
     * @returns {Word[]}
     */
    inputNoteNullifiers() {
        const ret = wasm.transactionrecord_inputNoteNullifiers(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the output notes created by this transaction.
     * @returns {OutputNotes}
     */
    outputNotes() {
        const ret = wasm.transactionrecord_outputNotes(this.__wbg_ptr);
        return OutputNotes.__wrap(ret);
    }
    /**
     * Returns the block height at which the transaction was submitted.
     * @returns {number}
     */
    submissionHeight() {
        const ret = wasm.transactionrecord_submissionHeight(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the current status of the transaction.
     * @returns {TransactionStatus}
     */
    transactionStatus() {
        const ret = wasm.transactionrecord_transactionStatus(this.__wbg_ptr);
        return TransactionStatus.__wrap(ret);
    }
}
if (Symbol.dispose) TransactionRecord.prototype[Symbol.dispose] = TransactionRecord.prototype.free;

/**
 * Specifies a transaction request that can be executed by an account.
 *
 * A request contains information about input notes to be consumed by the transaction (if any),
 * description of the transaction script to be executed (if any), and a set of notes expected to be
 * generated by the transaction or by consuming notes generated by the transaction.
 */
class TransactionRequest {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionRequest.prototype);
        obj.__wbg_ptr = ptr;
        TransactionRequestFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionRequestFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionrequest_free(ptr, 0);
    }
    /**
     * Returns the authentication argument if present.
     * @returns {Word | undefined}
     */
    authArg() {
        const ret = wasm.transactionrequest_authArg(this.__wbg_ptr);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * Deserializes a transaction request from bytes.
     * @param {Uint8Array} bytes
     * @returns {TransactionRequest}
     */
    static deserialize(bytes) {
        const ret = wasm.transactionrequest_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
    /**
     * Returns notes expected to be created in subsequent executions.
     * @returns {NoteDetailsAndTag[]}
     */
    expectedFutureNotes() {
        const ret = wasm.transactionrequest_expectedFutureNotes(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns output notes created by the sender account.
     * @returns {Note[]}
     */
    expectedOutputOwnNotes() {
        const ret = wasm.transactionrequest_expectedOutputOwnNotes(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the transaction script argument if present.
     * @returns {Word | undefined}
     */
    scriptArg() {
        const ret = wasm.transactionrequest_scriptArg(this.__wbg_ptr);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * Serializes the transaction request into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.transactionrequest_serialize(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) TransactionRequest.prototype[Symbol.dispose] = TransactionRequest.prototype.free;

/**
 * A builder for a `TransactionRequest`.
 *
 * Use this builder to construct a `TransactionRequest` by adding input notes, specifying
 * scripts, and setting other transaction parameters.
 */
class TransactionRequestBuilder {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionRequestBuilder.prototype);
        obj.__wbg_ptr = ptr;
        TransactionRequestBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionRequestBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionrequestbuilder_free(ptr, 0);
    }
    /**
     * Finalizes the builder into a `TransactionRequest`.
     * @returns {TransactionRequest}
     */
    build() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.transactionrequestbuilder_build(ptr);
        return TransactionRequest.__wrap(ret);
    }
    /**
     * Merges an advice map to be available during script execution.
     * @param {AdviceMap} advice_map
     * @returns {TransactionRequestBuilder}
     */
    extendAdviceMap(advice_map) {
        const ptr = this.__destroy_into_raw();
        _assertClass(advice_map, AdviceMap);
        const ret = wasm.transactionrequestbuilder_extendAdviceMap(ptr, advice_map.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Creates a new empty transaction request builder.
     */
    constructor() {
        const ret = wasm.transactionrequestbuilder_new();
        this.__wbg_ptr = ret >>> 0;
        TransactionRequestBuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Adds an authentication argument.
     * @param {Word} auth_arg
     * @returns {TransactionRequestBuilder}
     */
    withAuthArg(auth_arg) {
        const ptr = this.__destroy_into_raw();
        _assertClass(auth_arg, Word);
        const ret = wasm.transactionrequestbuilder_withAuthArg(ptr, auth_arg.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Attaches a custom transaction script.
     * @param {TransactionScript} script
     * @returns {TransactionRequestBuilder}
     */
    withCustomScript(script) {
        const ptr = this.__destroy_into_raw();
        _assertClass(script, TransactionScript);
        const ret = wasm.transactionrequestbuilder_withCustomScript(ptr, script.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Declares notes expected to be created in follow-up executions.
     * @param {NoteDetailsAndTagArray} note_details_and_tag
     * @returns {TransactionRequestBuilder}
     */
    withExpectedFutureNotes(note_details_and_tag) {
        const ptr = this.__destroy_into_raw();
        _assertClass(note_details_and_tag, NoteDetailsAndTagArray);
        const ret = wasm.transactionrequestbuilder_withExpectedFutureNotes(ptr, note_details_and_tag.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Declares expected output recipients (used for verification).
     * @param {NoteRecipientArray} recipients
     * @returns {TransactionRequestBuilder}
     */
    withExpectedOutputRecipients(recipients) {
        const ptr = this.__destroy_into_raw();
        _assertClass(recipients, NoteRecipientArray);
        const ret = wasm.transactionrequestbuilder_withExpectedOutputRecipients(ptr, recipients.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Sets the maximum number of blocks until the transaction request expires.
     * @param {number} expiration_delta
     * @returns {TransactionRequestBuilder}
     */
    withExpirationDelta(expiration_delta) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.transactionrequestbuilder_withExpirationDelta(ptr, expiration_delta);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Registers foreign accounts referenced by the transaction.
     * @param {ForeignAccountArray} foreign_accounts
     * @returns {TransactionRequestBuilder}
     */
    withForeignAccounts(foreign_accounts) {
        const ptr = this.__destroy_into_raw();
        _assertClass(foreign_accounts, ForeignAccountArray);
        const ret = wasm.transactionrequestbuilder_withForeignAccounts(ptr, foreign_accounts.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Adds input notes with optional arguments.
     * @param {NoteAndArgsArray} notes
     * @returns {TransactionRequestBuilder}
     */
    withInputNotes(notes) {
        const ptr = this.__destroy_into_raw();
        _assertClass(notes, NoteAndArgsArray);
        const ret = wasm.transactionrequestbuilder_withInputNotes(ptr, notes.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Adds output notes created by the sender that should be emitted by the transaction.
     * @param {NoteArray} notes
     * @returns {TransactionRequestBuilder}
     */
    withOwnOutputNotes(notes) {
        const ptr = this.__destroy_into_raw();
        _assertClass(notes, NoteArray);
        const ret = wasm.transactionrequestbuilder_withOwnOutputNotes(ptr, notes.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * Adds a transaction script argument.
     * @param {Word} script_arg
     * @returns {TransactionRequestBuilder}
     */
    withScriptArg(script_arg) {
        const ptr = this.__destroy_into_raw();
        _assertClass(script_arg, Word);
        const ret = wasm.transactionrequestbuilder_withScriptArg(ptr, script_arg.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
}
if (Symbol.dispose) TransactionRequestBuilder.prototype[Symbol.dispose] = TransactionRequestBuilder.prototype.free;

/**
 * Represents the result of executing a transaction by the client.
 *
 * It contains an `ExecutedTransaction`, and a list of `future_notes`
 * that we expect to receive in the future (you can check at swap notes for an example of this).
 */
class TransactionResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionResult.prototype);
        obj.__wbg_ptr = ptr;
        TransactionResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionresult_free(ptr, 0);
    }
    /**
     * Deserializes a transaction result from bytes.
     * @param {Uint8Array} bytes
     * @returns {TransactionResult}
     */
    static deserialize(bytes) {
        const ret = wasm.transactionresult_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionResult.__wrap(ret[0]);
    }
    /**
     * Returns the executed transaction.
     * @returns {ExecutedTransaction}
     */
    executedTransaction() {
        const ret = wasm.transactionresult_executedTransaction(this.__wbg_ptr);
        return ExecutedTransaction.__wrap(ret);
    }
    /**
     * Returns notes that are expected to be created as a result of follow-up executions.
     * @returns {NoteDetailsAndTag[]}
     */
    futureNotes() {
        const ret = wasm.transactionresult_futureNotes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the ID of the transaction.
     * @returns {TransactionId}
     */
    id() {
        const ret = wasm.executedtransaction_id(this.__wbg_ptr);
        return TransactionId.__wrap(ret);
    }
    /**
     * Serializes the transaction result into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.transactionresult_serialize(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) TransactionResult.prototype[Symbol.dispose] = TransactionResult.prototype.free;

/**
 * A transaction script is a program that is executed in a transaction after all input notes have
 * been executed.
 *
 * The `TransactionScript` object is composed of:
 * - An executable program defined by a MAST forest and an associated entrypoint.
 * - A set of transaction script inputs defined by a map of key-value inputs that are loaded into
 *   the advice inputs' map such that the transaction script can access them.
 */
class TransactionScript {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionScript.prototype);
        obj.__wbg_ptr = ptr;
        TransactionScriptFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionScriptFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionscript_free(ptr, 0);
    }
    /**
     * Creates a `NoteScript` from the given `Package`.
     * Throws if the package is invalid.
     * @param {Package} _package
     * @returns {TransactionScript}
     */
    static fromPackage(_package) {
        _assertClass(_package, Package);
        const ret = wasm.transactionscript_fromPackage(_package.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionScript.__wrap(ret[0]);
    }
    /**
     * Returns the MAST root commitment of the transaction script.
     * @returns {Word}
     */
    root() {
        const ret = wasm.transactionscript_root(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) TransactionScript.prototype[Symbol.dispose] = TransactionScript.prototype.free;

/**
 * A script argument represented as a word plus additional felts.
 */
class TransactionScriptInputPair {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionScriptInputPair.prototype);
        obj.__wbg_ptr = ptr;
        TransactionScriptInputPairFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof TransactionScriptInputPair)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionScriptInputPairFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionscriptinputpair_free(ptr, 0);
    }
    /**
     * Returns the remaining felts for the input.
     * @returns {FeltArray}
     */
    felts() {
        const ret = wasm.transactionscriptinputpair_felts(this.__wbg_ptr);
        return FeltArray.__wrap(ret);
    }
    /**
     * Creates a new script input pair.
     * @param {Word} word
     * @param {FeltArray} felts
     */
    constructor(word, felts) {
        _assertClass(word, Word);
        var ptr0 = word.__destroy_into_raw();
        _assertClass(felts, FeltArray);
        const ret = wasm.transactionscriptinputpair_new(ptr0, felts.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        TransactionScriptInputPairFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the word part of the input.
     * @returns {Word}
     */
    word() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) TransactionScriptInputPair.prototype[Symbol.dispose] = TransactionScriptInputPair.prototype.free;

class TransactionScriptInputPairArray {
    toJSON() {
        return {
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionScriptInputPairArrayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionscriptinputpairarray_free(ptr, 0);
    }
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     * @param {number} index
     * @returns {TransactionScriptInputPair}
     */
    get(index) {
        const ret = wasm.transactionscriptinputpairarray_get(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionScriptInputPair.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    length() {
        const ret = wasm.transactionscriptinputpairarray_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {TransactionScriptInputPair[] | null} [elements]
     */
    constructor(elements) {
        var ptr0 = isLikeNone(elements) ? 0 : passArrayJsValueToWasm0(elements, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionscriptinputpairarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        TransactionScriptInputPairArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {TransactionScriptInputPair} element
     */
    push(element) {
        _assertClass(element, TransactionScriptInputPair);
        wasm.transactionscriptinputpairarray_push(this.__wbg_ptr, element.__wbg_ptr);
    }
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     * @param {number} index
     * @param {TransactionScriptInputPair} elem
     */
    replaceAt(index, elem) {
        _assertClass(elem, TransactionScriptInputPair);
        const ret = wasm.transactionscriptinputpairarray_replaceAt(this.__wbg_ptr, index, elem.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) TransactionScriptInputPairArray.prototype[Symbol.dispose] = TransactionScriptInputPairArray.prototype.free;

/**
 * Status of a transaction in the node or store.
 */
class TransactionStatus {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionStatus.prototype);
        obj.__wbg_ptr = ptr;
        TransactionStatusFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionStatusFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionstatus_free(ptr, 0);
    }
    /**
     * Creates a committed status with block number and timestamp.
     * @param {number} block_num
     * @param {bigint} commit_timestamp
     * @returns {TransactionStatus}
     */
    static committed(block_num, commit_timestamp) {
        const ret = wasm.transactionstatus_committed(block_num, commit_timestamp);
        return TransactionStatus.__wrap(ret);
    }
    /**
     * Creates a discarded status from a discard cause string.
     * @param {string} cause
     * @returns {TransactionStatus}
     */
    static discarded(cause) {
        const ptr0 = passStringToWasm0(cause, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionstatus_discarded(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionStatus.__wrap(ret[0]);
    }
    /**
     * Returns the block number if the transaction was committed.
     * @returns {number | undefined}
     */
    getBlockNum() {
        const ret = wasm.transactionstatus_getBlockNum(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * Returns the commit timestamp if the transaction was committed.
     * @returns {bigint | undefined}
     */
    getCommitTimestamp() {
        const ret = wasm.transactionstatus_getCommitTimestamp(this.__wbg_ptr);
        return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
    }
    /**
     * Returns true if the transaction has been committed.
     * @returns {boolean}
     */
    isCommitted() {
        const ret = wasm.transactionstatus_isCommitted(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the transaction was discarded.
     * @returns {boolean}
     */
    isDiscarded() {
        const ret = wasm.transactionstatus_isDiscarded(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the transaction is still pending.
     * @returns {boolean}
     */
    isPending() {
        const ret = wasm.transactionstatus_isPending(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Creates a pending transaction status.
     * @returns {TransactionStatus}
     */
    static pending() {
        const ret = wasm.transactionstatus_pending();
        return TransactionStatus.__wrap(ret);
    }
}
if (Symbol.dispose) TransactionStatus.prototype[Symbol.dispose] = TransactionStatus.prototype.free;

/**
 * Represents the changes that need to be applied to the client store as a result of a transaction
 * execution.
 */
class TransactionStoreUpdate {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionStoreUpdate.prototype);
        obj.__wbg_ptr = ptr;
        TransactionStoreUpdateFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionStoreUpdateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionstoreupdate_free(ptr, 0);
    }
    /**
     * Returns the account delta applied by the transaction.
     * @returns {AccountDelta}
     */
    accountDelta() {
        const ret = wasm.transactionstoreupdate_accountDelta(this.__wbg_ptr);
        return AccountDelta.__wrap(ret);
    }
    /**
     * Returns the output notes created by the transaction.
     * @returns {OutputNotes}
     */
    createdNotes() {
        const ret = wasm.transactionstoreupdate_createdNotes(this.__wbg_ptr);
        return OutputNotes.__wrap(ret);
    }
    /**
     * Deserializes an update from bytes.
     * @param {Uint8Array} bytes
     * @returns {TransactionStoreUpdate}
     */
    static deserialize(bytes) {
        const ret = wasm.transactionstoreupdate_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionStoreUpdate.__wrap(ret[0]);
    }
    /**
     * Returns the executed transaction associated with this update.
     * @returns {ExecutedTransaction}
     */
    executedTransaction() {
        const ret = wasm.transactionstoreupdate_executedTransaction(this.__wbg_ptr);
        return ExecutedTransaction.__wrap(ret);
    }
    /**
     * Returns notes expected to be created in follow-up executions.
     * @returns {NoteDetailsAndTag[]}
     */
    futureNotes() {
        const ret = wasm.transactionstoreupdate_futureNotes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Serializes the update into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.transactionstoreupdate_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the block height at which the transaction was submitted.
     * @returns {number}
     */
    submissionHeight() {
        const ret = wasm.transactionstoreupdate_submissionHeight(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) TransactionStoreUpdate.prototype[Symbol.dispose] = TransactionStoreUpdate.prototype.free;

/**
 * Represents a transaction summary.
 */
class TransactionSummary {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionSummary.prototype);
        obj.__wbg_ptr = ptr;
        TransactionSummaryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionSummaryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionsummary_free(ptr, 0);
    }
    /**
     * Returns the account delta described by the summary.
     * @returns {AccountDelta}
     */
    accountDelta() {
        const ret = wasm.transactionsummary_accountDelta(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountDelta.__wrap(ret[0]);
    }
    /**
     * Deserializes a summary from bytes.
     * @param {Uint8Array} bytes
     * @returns {TransactionSummary}
     */
    static deserialize(bytes) {
        const ret = wasm.transactionsummary_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionSummary.__wrap(ret[0]);
    }
    /**
     * Returns the input notes referenced by the summary.
     * @returns {InputNotes}
     */
    inputNotes() {
        const ret = wasm.transactionsummary_inputNotes(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return InputNotes.__wrap(ret[0]);
    }
    /**
     * Returns the output notes referenced by the summary.
     * @returns {OutputNotes}
     */
    outputNotes() {
        const ret = wasm.transactionsummary_outputNotes(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return OutputNotes.__wrap(ret[0]);
    }
    /**
     * Returns the random salt mixed into the summary commitment.
     * @returns {Word}
     */
    salt() {
        const ret = wasm.transactionsummary_salt(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Word.__wrap(ret[0]);
    }
    /**
     * Serializes the summary into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.transactionsummary_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Computes the commitment to this `TransactionSummary`.
     * @returns {Word}
     */
    toCommitment() {
        const ret = wasm.transactionsummary_toCommitment(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}
if (Symbol.dispose) TransactionSummary.prototype[Symbol.dispose] = TransactionSummary.prototype.free;

class WebClient {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WebClientFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_webclient_free(ptr, 0);
    }
    /**
     * Creates a new `AccountReader` for lazy access to account data.
     *
     * The `AccountReader` executes queries lazily - each method call fetches fresh data
     * from storage, ensuring you always see the current state.
     *
     * # Arguments
     * * `account_id` - The ID of the account to read.
     *
     * # Example
     * ```javascript
     * const reader = client.accountReader(accountId);
     * const nonce = await reader.nonce();
     * const balance = await reader.getBalance(faucetId);
     * ```
     * @param {AccountId} account_id
     * @returns {AccountReader}
     */
    accountReader(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.webclient_accountReader(this.__wbg_ptr, account_id.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountReader.__wrap(ret[0]);
    }
    /**
     * @param {string} tag
     * @returns {Promise<void>}
     */
    addTag(tag) {
        const ptr0 = passStringToWasm0(tag, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_addTag(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {TransactionResult} transaction_result
     * @param {number} submission_height
     * @returns {Promise<TransactionStoreUpdate>}
     */
    applyTransaction(transaction_result, submission_height) {
        _assertClass(transaction_result, TransactionResult);
        const ret = wasm.webclient_applyTransaction(this.__wbg_ptr, transaction_result.__wbg_ptr, submission_height);
        return ret;
    }
    /**
     * @param {NoteType} note_type
     * @param {AccountId} offered_asset_faucet_id
     * @param {bigint} offered_asset_amount
     * @param {AccountId} requested_asset_faucet_id
     * @param {bigint} requested_asset_amount
     * @returns {NoteTag}
     */
    static buildSwapTag(note_type, offered_asset_faucet_id, offered_asset_amount, requested_asset_faucet_id, requested_asset_amount) {
        _assertClass(offered_asset_faucet_id, AccountId);
        _assertClass(requested_asset_faucet_id, AccountId);
        const ret = wasm.webclient_buildSwapTag(note_type, offered_asset_faucet_id.__wbg_ptr, offered_asset_amount, requested_asset_faucet_id.__wbg_ptr, requested_asset_amount);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteTag.__wrap(ret[0]);
    }
    /**
     * Creates a new `WebClient` instance with the specified configuration.
     *
     * # Arguments
     * * `node_url`: The URL of the node RPC endpoint. If `None`, defaults to the testnet endpoint.
     * * `node_note_transport_url`: Optional URL of the note transport service.
     * * `seed`: Optional seed for account initialization.
     * * `store_name`: Optional name for the web store. If `None`, the store name defaults to
     *   `MidenClientDB_{network_id}`, where `network_id` is derived from the `node_url`.
     *   Explicitly setting this allows for creating multiple isolated clients.
     * @param {string | null} [node_url]
     * @param {string | null} [node_note_transport_url]
     * @param {Uint8Array | null} [seed]
     * @param {string | null} [store_name]
     * @param {boolean | null} [debug_mode]
     * @returns {Promise<any>}
     */
    createClient(node_url, node_note_transport_url, seed, store_name, debug_mode) {
        var ptr0 = isLikeNone(node_url) ? 0 : passStringToWasm0(node_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(node_note_transport_url) ? 0 : passStringToWasm0(node_note_transport_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(seed) ? 0 : passArray8ToWasm0(seed, wasm.__wbindgen_malloc);
        var len2 = WASM_VECTOR_LEN;
        var ptr3 = isLikeNone(store_name) ? 0 : passStringToWasm0(store_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len3 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_createClient(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, isLikeNone(debug_mode) ? 0xFFFFFF : debug_mode ? 1 : 0);
        return ret;
    }
    /**
     * Creates a new `WebClient` instance with external keystore callbacks.
     *
     * # Arguments
     * * `node_url`: The URL of the node RPC endpoint. If `None`, defaults to the testnet endpoint.
     * * `node_note_transport_url`: Optional URL of the note transport service.
     * * `seed`: Optional seed for account initialization.
     * * `store_name`: Optional name for the web store. If `None`, the store name defaults to
     *   `MidenClientDB_{network_id}`, where `network_id` is derived from the `node_url`.
     *   Explicitly setting this allows for creating multiple isolated clients.
     * * `get_key_cb`: Callback to retrieve the secret key bytes for a given public key.
     * * `insert_key_cb`: Callback to persist a secret key.
     * * `sign_cb`: Callback to produce serialized signature bytes for the provided inputs.
     * @param {string | null} [node_url]
     * @param {string | null} [node_note_transport_url]
     * @param {Uint8Array | null} [seed]
     * @param {string | null} [store_name]
     * @param {Function | null} [get_key_cb]
     * @param {Function | null} [insert_key_cb]
     * @param {Function | null} [sign_cb]
     * @param {boolean | null} [debug_mode]
     * @returns {Promise<any>}
     */
    createClientWithExternalKeystore(node_url, node_note_transport_url, seed, store_name, get_key_cb, insert_key_cb, sign_cb, debug_mode) {
        var ptr0 = isLikeNone(node_url) ? 0 : passStringToWasm0(node_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(node_note_transport_url) ? 0 : passStringToWasm0(node_note_transport_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(seed) ? 0 : passArray8ToWasm0(seed, wasm.__wbindgen_malloc);
        var len2 = WASM_VECTOR_LEN;
        var ptr3 = isLikeNone(store_name) ? 0 : passStringToWasm0(store_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len3 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_createClientWithExternalKeystore(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, isLikeNone(get_key_cb) ? 0 : addToExternrefTable0(get_key_cb), isLikeNone(insert_key_cb) ? 0 : addToExternrefTable0(insert_key_cb), isLikeNone(sign_cb) ? 0 : addToExternrefTable0(sign_cb), isLikeNone(debug_mode) ? 0xFFFFFF : debug_mode ? 1 : 0);
        return ret;
    }
    /**
     * @returns {CodeBuilder}
     */
    createCodeBuilder() {
        const ret = wasm.webclient_createCodeBuilder(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return CodeBuilder.__wrap(ret[0]);
    }
    /**
     * Creates a new client with a mock RPC API. Useful for testing purposes and proof-of-concept
     * applications as it uses a mock chain that simulates the behavior of a real node.
     * @param {Uint8Array | null} [seed]
     * @param {Uint8Array | null} [serialized_mock_chain]
     * @param {Uint8Array | null} [serialized_mock_note_transport_node]
     * @returns {Promise<any>}
     */
    createMockClient(seed, serialized_mock_chain, serialized_mock_note_transport_node) {
        var ptr0 = isLikeNone(seed) ? 0 : passArray8ToWasm0(seed, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(serialized_mock_chain) ? 0 : passArray8ToWasm0(serialized_mock_chain, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(serialized_mock_note_transport_node) ? 0 : passArray8ToWasm0(serialized_mock_note_transport_node, wasm.__wbindgen_malloc);
        var len2 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_createMockClient(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * Executes a transaction and returns the `TransactionSummary`.
     *
     * If the transaction is unauthorized (auth script emits the unauthorized event),
     * returns the summary from the error. If the transaction succeeds, constructs
     * a summary from the executed transaction using the `auth_arg` from the transaction
     * request as the salt (or a zero salt if not provided).
     *
     * # Errors
     * - If there is an internal failure during execution.
     * @param {AccountId} account_id
     * @param {TransactionRequest} transaction_request
     * @returns {Promise<TransactionSummary>}
     */
    executeForSummary(account_id, transaction_request) {
        _assertClass(account_id, AccountId);
        _assertClass(transaction_request, TransactionRequest);
        const ret = wasm.webclient_executeForSummary(this.__wbg_ptr, account_id.__wbg_ptr, transaction_request.__wbg_ptr);
        return ret;
    }
    /**
     * Executes the provided transaction script against the specified account
     * and returns the resulting stack output. This is a local-only "view call"
     * that does not submit anything to the network.
     * @param {AccountId} account_id
     * @param {TransactionScript} tx_script
     * @param {AdviceInputs} advice_inputs
     * @param {ForeignAccountArray} foreign_accounts
     * @returns {Promise<FeltArray>}
     */
    executeProgram(account_id, tx_script, advice_inputs, foreign_accounts) {
        _assertClass(account_id, AccountId);
        _assertClass(tx_script, TransactionScript);
        _assertClass(advice_inputs, AdviceInputs);
        _assertClass(foreign_accounts, ForeignAccountArray);
        const ret = wasm.webclient_executeProgram(this.__wbg_ptr, account_id.__wbg_ptr, tx_script.__wbg_ptr, advice_inputs.__wbg_ptr, foreign_accounts.__wbg_ptr);
        return ret;
    }
    /**
     * Executes a transaction specified by the request against the specified account but does not
     * submit it to the network nor update the local database. The returned [`TransactionResult`]
     * retains the execution artifacts needed to continue with the transaction lifecycle.
     *
     * If the transaction utilizes foreign account data, there is a chance that the client doesn't
     * have the required block header in the local database. In these scenarios, a sync to
     * the chain tip is performed, and the required block header is retrieved.
     * @param {AccountId} account_id
     * @param {TransactionRequest} transaction_request
     * @returns {Promise<TransactionResult>}
     */
    executeTransaction(account_id, transaction_request) {
        _assertClass(account_id, AccountId);
        _assertClass(transaction_request, TransactionRequest);
        const ret = wasm.webclient_executeTransaction(this.__wbg_ptr, account_id.__wbg_ptr, transaction_request.__wbg_ptr);
        return ret;
    }
    /**
     * @param {AccountId} account_id
     * @returns {Promise<AccountFile>}
     */
    exportAccountFile(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.webclient_exportAccountFile(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * @param {string} note_id
     * @param {NoteExportFormat} export_format
     * @returns {Promise<NoteFile>}
     */
    exportNoteFile(note_id, export_format) {
        const ptr0 = passStringToWasm0(note_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_exportNoteFile(this.__wbg_ptr, ptr0, len0, export_format);
        return ret;
    }
    /**
     * Fetch all private notes from the note transport layer
     *
     * Fetches all notes stored in the transport layer, with no pagination.
     * Prefer using [`WebClient::fetch_private_notes`] for a more efficient, on-going,
     * fetching mechanism.
     * @returns {Promise<void>}
     */
    fetchAllPrivateNotes() {
        const ret = wasm.webclient_fetchAllPrivateNotes(this.__wbg_ptr);
        return ret;
    }
    /**
     * Fetch private notes from the note transport layer
     *
     * Uses an internal pagination mechanism to avoid fetching duplicate notes.
     * @returns {Promise<void>}
     */
    fetchPrivateNotes() {
        const ret = wasm.webclient_fetchPrivateNotes(this.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the full account data for the given account ID, returning `null` if not found.
     *
     * This method loads the complete account state including vault, storage, and code.
     * @param {AccountId} account_id
     * @returns {Promise<Account | undefined>}
     */
    getAccount(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.webclient_getAccount(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the account code for a specific account.
     *
     * Returns `null` if the account is not found.
     * @param {AccountId} account_id
     * @returns {Promise<AccountCode | undefined>}
     */
    getAccountCode(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.webclient_getAccountCode(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the storage for a specific account.
     *
     * To only load a specific slot, use `accountReader` instead.
     * @param {AccountId} account_id
     * @returns {Promise<AccountStorage>}
     */
    getAccountStorage(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.webclient_getAccountStorage(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * Retrieves the asset vault for a specific account.
     *
     * To check the balance for a single asset, use `accountReader` instead.
     * @param {AccountId} account_id
     * @returns {Promise<AssetVault>}
     */
    getAccountVault(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.webclient_getAccountVault(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<AccountHeader[]>}
     */
    getAccounts() {
        const ret = wasm.webclient_getAccounts(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {AccountId | null} [account_id]
     * @returns {Promise<ConsumableNoteRecord[]>}
     */
    getConsumableNotes(account_id) {
        let ptr0 = 0;
        if (!isLikeNone(account_id)) {
            _assertClass(account_id, AccountId);
            ptr0 = account_id.__destroy_into_raw();
        }
        const ret = wasm.webclient_getConsumableNotes(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {string} note_id
     * @returns {Promise<InputNoteRecord | undefined>}
     */
    getInputNote(note_id) {
        const ptr0 = passStringToWasm0(note_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_getInputNote(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {NoteFilter} filter
     * @returns {Promise<InputNoteRecord[]>}
     */
    getInputNotes(filter) {
        _assertClass(filter, NoteFilter);
        var ptr0 = filter.__destroy_into_raw();
        const ret = wasm.webclient_getInputNotes(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {string} note_id
     * @returns {Promise<OutputNoteRecord>}
     */
    getOutputNote(note_id) {
        const ptr0 = passStringToWasm0(note_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_getOutputNote(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {NoteFilter} filter
     * @returns {Promise<OutputNoteRecord[]>}
     */
    getOutputNotes(filter) {
        _assertClass(filter, NoteFilter);
        var ptr0 = filter.__destroy_into_raw();
        const ret = wasm.webclient_getOutputNotes(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * Retrieves the setting value for `key`, or `None` if it hasn’t been set.
     * @param {string} key
     * @returns {Promise<any | undefined>}
     */
    getSetting(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_getSetting(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @returns {Promise<number>}
     */
    getSyncHeight() {
        const ret = wasm.webclient_getSyncHeight(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {TransactionFilter} transaction_filter
     * @returns {Promise<TransactionRecord[]>}
     */
    getTransactions(transaction_filter) {
        _assertClass(transaction_filter, TransactionFilter);
        var ptr0 = transaction_filter.__destroy_into_raw();
        const ret = wasm.webclient_getTransactions(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {AccountId} account_id
     * @returns {Promise<any>}
     */
    importAccountById(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.webclient_importAccountById(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * @param {AccountFile} account_file
     * @returns {Promise<any>}
     */
    importAccountFile(account_file) {
        _assertClass(account_file, AccountFile);
        var ptr0 = account_file.__destroy_into_raw();
        const ret = wasm.webclient_importAccountFile(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {NoteFile} note_file
     * @returns {Promise<NoteId>}
     */
    importNoteFile(note_file) {
        _assertClass(note_file, NoteFile);
        var ptr0 = note_file.__destroy_into_raw();
        const ret = wasm.webclient_importNoteFile(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {Uint8Array} init_seed
     * @param {boolean} mutable
     * @param {AuthScheme} auth_scheme
     * @returns {Promise<Account>}
     */
    importPublicAccountFromSeed(init_seed, mutable, auth_scheme) {
        const ptr0 = passArray8ToWasm0(init_seed, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_importPublicAccountFromSeed(this.__wbg_ptr, ptr0, len0, mutable, auth_scheme);
        return ret;
    }
    /**
     * @param {AccountId} account_id
     * @param {Address} address
     * @returns {Promise<void>}
     */
    insertAccountAddress(account_id, address) {
        _assertClass(account_id, AccountId);
        _assertClass(address, Address);
        const ret = wasm.webclient_insertAccountAddress(this.__wbg_ptr, account_id.__wbg_ptr, address.__wbg_ptr);
        return ret;
    }
    /**
     * Returns a `WebKeystoreApi` handle for managing secret keys.
     *
     * The returned object can be used from JavaScript as `client.keystore`.
     * @returns {WebKeystoreApi}
     */
    get keystore() {
        const ret = wasm.webclient_keystore(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WebKeystoreApi.__wrap(ret[0]);
    }
    /**
     * Returns the raw JS value that the most recent sign-callback invocation
     * threw, or `null` if the last sign call succeeded (or no call has
     * happened yet).
     *
     * Combined with the serialized-call discipline enforced at the JS
     * `WebClient` wrapper, this lets a caller that caught a failed
     * `executeTransaction` / `submitNewTransaction` recover the original
     * JS error the signing callback threw — preserving any structured
     * metadata (e.g. a `reason: 'locked'` property) that the kernel-level
     * `auth::request` diagnostic would otherwise have erased.
     *
     * # Usage (TS)
     * ```ts
     * try {
     *   await client.submitNewTransaction(acc, req);
     * } catch (e) {
     *   const authErr = client.lastAuthError();
     *   if (authErr && authErr.reason === 'locked') {
     *     // wait for unlock, then retry
     *   }
     * }
     * ```
     * @returns {any}
     */
    lastAuthError() {
        const ret = wasm.webclient_lastAuthError(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns all the existing setting keys from the store.
     * @returns {Promise<string[]>}
     */
    listSettingKeys() {
        const ret = wasm.webclient_listSettingKeys(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    listTags() {
        const ret = wasm.webclient_listTags(this.__wbg_ptr);
        return ret;
    }
    constructor() {
        const ret = wasm.webclient_new();
        this.__wbg_ptr = ret >>> 0;
        WebClientFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Account} account
     * @param {boolean} overwrite
     * @returns {Promise<void>}
     */
    newAccount(account, overwrite) {
        _assertClass(account, Account);
        const ret = wasm.webclient_newAccount(this.__wbg_ptr, account.__wbg_ptr, overwrite);
        return ret;
    }
    /**
     * Inserts an account and its secret key in one call, matching how
     * `newWallet` / `newFaucet` already work internally.  If the key
     * insertion fails the account is still persisted (same as wallet/faucet),
     * but callers only need a single await instead of two.
     * @param {Account} account
     * @param {AuthSecretKey} secret_key
     * @returns {Promise<void>}
     */
    newAccountWithSecretKey(account, secret_key) {
        _assertClass(account, Account);
        _assertClass(secret_key, AuthSecretKey);
        const ret = wasm.webclient_newAccountWithSecretKey(this.__wbg_ptr, account.__wbg_ptr, secret_key.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Note[]} list_of_notes
     * @returns {TransactionRequest}
     */
    newConsumeTransactionRequest(list_of_notes) {
        const ptr0 = passArrayJsValueToWasm0(list_of_notes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_newConsumeTransactionRequest(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
    /**
     * @param {AccountStorageMode} storage_mode
     * @param {boolean} non_fungible
     * @param {string} token_symbol
     * @param {number} decimals
     * @param {bigint} max_supply
     * @param {AuthScheme} auth_scheme
     * @returns {Promise<Account>}
     */
    newFaucet(storage_mode, non_fungible, token_symbol, decimals, max_supply, auth_scheme) {
        _assertClass(storage_mode, AccountStorageMode);
        const ptr0 = passStringToWasm0(token_symbol, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_newFaucet(this.__wbg_ptr, storage_mode.__wbg_ptr, non_fungible, ptr0, len0, decimals, max_supply, auth_scheme);
        return ret;
    }
    /**
     * @param {AccountId} target_account_id
     * @param {AccountId} faucet_id
     * @param {NoteType} note_type
     * @param {bigint} amount
     * @returns {TransactionRequest}
     */
    newMintTransactionRequest(target_account_id, faucet_id, note_type, amount) {
        _assertClass(target_account_id, AccountId);
        _assertClass(faucet_id, AccountId);
        const ret = wasm.webclient_newMintTransactionRequest(this.__wbg_ptr, target_account_id.__wbg_ptr, faucet_id.__wbg_ptr, note_type, amount);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
    /**
     * @param {AccountId} sender_account_id
     * @param {AccountId} target_account_id
     * @param {AccountId} faucet_id
     * @param {NoteType} note_type
     * @param {bigint} amount
     * @param {number | null} [recall_height]
     * @param {number | null} [timelock_height]
     * @returns {TransactionRequest}
     */
    newSendTransactionRequest(sender_account_id, target_account_id, faucet_id, note_type, amount, recall_height, timelock_height) {
        _assertClass(sender_account_id, AccountId);
        _assertClass(target_account_id, AccountId);
        _assertClass(faucet_id, AccountId);
        const ret = wasm.webclient_newSendTransactionRequest(this.__wbg_ptr, sender_account_id.__wbg_ptr, target_account_id.__wbg_ptr, faucet_id.__wbg_ptr, note_type, amount, isLikeNone(recall_height) ? 0x100000001 : (recall_height) >>> 0, isLikeNone(timelock_height) ? 0x100000001 : (timelock_height) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
    /**
     * @param {AccountId} sender_account_id
     * @param {AccountId} offered_asset_faucet_id
     * @param {bigint} offered_asset_amount
     * @param {AccountId} requested_asset_faucet_id
     * @param {bigint} requested_asset_amount
     * @param {NoteType} note_type
     * @param {NoteType} payback_note_type
     * @returns {TransactionRequest}
     */
    newSwapTransactionRequest(sender_account_id, offered_asset_faucet_id, offered_asset_amount, requested_asset_faucet_id, requested_asset_amount, note_type, payback_note_type) {
        _assertClass(sender_account_id, AccountId);
        _assertClass(offered_asset_faucet_id, AccountId);
        _assertClass(requested_asset_faucet_id, AccountId);
        const ret = wasm.webclient_newSwapTransactionRequest(this.__wbg_ptr, sender_account_id.__wbg_ptr, offered_asset_faucet_id.__wbg_ptr, offered_asset_amount, requested_asset_faucet_id.__wbg_ptr, requested_asset_amount, note_type, payback_note_type);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
    /**
     * @param {AccountStorageMode} storage_mode
     * @param {boolean} mutable
     * @param {AuthScheme} auth_scheme
     * @param {Uint8Array | null} [init_seed]
     * @returns {Promise<Account>}
     */
    newWallet(storage_mode, mutable, auth_scheme, init_seed) {
        _assertClass(storage_mode, AccountStorageMode);
        var ptr0 = isLikeNone(init_seed) ? 0 : passArray8ToWasm0(init_seed, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_newWallet(this.__wbg_ptr, storage_mode.__wbg_ptr, mutable, auth_scheme, ptr0, len0);
        return ret;
    }
    proveBlock() {
        const ret = wasm.webclient_proveBlock(this.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Generates a transaction proof using the client's default (local) prover.
     * @param {TransactionResult} transaction_result
     * @returns {Promise<ProvenTransaction>}
     */
    proveTransaction(transaction_result) {
        _assertClass(transaction_result, TransactionResult);
        const ret = wasm.webclient_proveTransaction(this.__wbg_ptr, transaction_result.__wbg_ptr);
        return ret;
    }
    /**
     * Generates a transaction proof using the provided prover.
     *
     * Takes the prover by reference so the JS-side handle is NOT consumed
     * by wasm-bindgen. Taking `TransactionProver` by value would transfer
     * ownership on each call, invalidating the JS object's internal WASM
     * handle; after one use, subsequent calls from JS would pass a dangling
     * handle that wasm-bindgen interprets as `None`, silently falling back
     * to the local prover.
     * @param {TransactionResult} transaction_result
     * @param {TransactionProver} prover
     * @returns {Promise<ProvenTransaction>}
     */
    proveTransactionWithProver(transaction_result, prover) {
        _assertClass(transaction_result, TransactionResult);
        _assertClass(prover, TransactionProver);
        const ret = wasm.webclient_proveTransactionWithProver(this.__wbg_ptr, transaction_result.__wbg_ptr, prover.__wbg_ptr);
        return ret;
    }
    /**
     * Prunes historical account states for the specified account up to the given nonce.
     *
     * Deletes all historical entries with `replaced_at_nonce <= up_to_nonce` and any
     * orphaned account code.
     *
     * Returns the total number of rows deleted, including historical entries and orphaned
     * account code.
     * @param {AccountId} account_id
     * @param {Felt} up_to_nonce
     * @returns {Promise<number>}
     */
    pruneAccountHistory(account_id, up_to_nonce) {
        _assertClass(account_id, AccountId);
        _assertClass(up_to_nonce, Felt);
        const ret = wasm.webclient_pruneAccountHistory(this.__wbg_ptr, account_id.__wbg_ptr, up_to_nonce.__wbg_ptr);
        return ret;
    }
    /**
     * @param {AccountId} account_id
     * @param {Address} address
     * @returns {Promise<void>}
     */
    removeAccountAddress(account_id, address) {
        _assertClass(account_id, AccountId);
        _assertClass(address, Address);
        const ret = wasm.webclient_removeAccountAddress(this.__wbg_ptr, account_id.__wbg_ptr, address.__wbg_ptr);
        return ret;
    }
    /**
     * Deletes a setting key-value from the store.
     * @param {string} key
     * @returns {Promise<void>}
     */
    removeSetting(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_removeSetting(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} tag
     * @returns {Promise<void>}
     */
    removeTag(tag) {
        const ptr0 = passStringToWasm0(tag, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_removeTag(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Send a private note via the note transport layer
     * @param {Note} note
     * @param {Address} address
     * @returns {Promise<void>}
     */
    sendPrivateNote(note, address) {
        _assertClass(note, Note);
        var ptr0 = note.__destroy_into_raw();
        _assertClass(address, Address);
        var ptr1 = address.__destroy_into_raw();
        const ret = wasm.webclient_sendPrivateNote(this.__wbg_ptr, ptr0, ptr1);
        return ret;
    }
    /**
     * Returns the inner serialized mock chain if it exists.
     * @returns {Uint8Array}
     */
    serializeMockChain() {
        const ret = wasm.webclient_serializeMockChain(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Returns the inner serialized mock note transport node if it exists.
     * @returns {Uint8Array}
     */
    serializeMockNoteTransportNode() {
        const ret = wasm.webclient_serializeMockNoteTransportNode(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Sets a setting key-value in the store. It can then be retrieved using `get_setting`.
     * @param {string} key
     * @param {any} value
     * @returns {Promise<void>}
     */
    setSetting(key, value) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.webclient_setSetting(this.__wbg_ptr, ptr0, len0, value);
        return ret;
    }
    /**
     * Returns the identifier of the underlying store (e.g. `IndexedDB` database name, file path).
     * @returns {string}
     */
    storeIdentifier() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.webclient_storeIdentifier(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Executes a transaction specified by the request against the specified account,
     * proves it, submits it to the network, and updates the local database.
     *
     * Uses the prover configured for this client.
     *
     * If the transaction utilizes foreign account data, there is a chance that the client doesn't
     * have the required block header in the local database. In these scenarios, a sync to
     * the chain tip is performed, and the required block header is retrieved.
     * @param {AccountId} account_id
     * @param {TransactionRequest} transaction_request
     * @returns {Promise<TransactionId>}
     */
    submitNewTransaction(account_id, transaction_request) {
        _assertClass(account_id, AccountId);
        _assertClass(transaction_request, TransactionRequest);
        const ret = wasm.webclient_submitNewTransaction(this.__wbg_ptr, account_id.__wbg_ptr, transaction_request.__wbg_ptr);
        return ret;
    }
    /**
     * Executes a transaction specified by the request against the specified account, proves it
     * with the user provided prover, submits it to the network, and updates the local database.
     *
     * If the transaction utilizes foreign account data, there is a chance that the client doesn't
     * have the required block header in the local database. In these scenarios, a sync to the
     * chain tip is performed, and the required block header is retrieved.
     * @param {AccountId} account_id
     * @param {TransactionRequest} transaction_request
     * @param {TransactionProver} prover
     * @returns {Promise<TransactionId>}
     */
    submitNewTransactionWithProver(account_id, transaction_request, prover) {
        _assertClass(account_id, AccountId);
        _assertClass(transaction_request, TransactionRequest);
        _assertClass(prover, TransactionProver);
        const ret = wasm.webclient_submitNewTransactionWithProver(this.__wbg_ptr, account_id.__wbg_ptr, transaction_request.__wbg_ptr, prover.__wbg_ptr);
        return ret;
    }
    /**
     * @param {ProvenTransaction} proven_transaction
     * @param {TransactionResult} transaction_result
     * @returns {Promise<number>}
     */
    submitProvenTransaction(proven_transaction, transaction_result) {
        _assertClass(proven_transaction, ProvenTransaction);
        _assertClass(transaction_result, TransactionResult);
        const ret = wasm.webclient_submitProvenTransaction(this.__wbg_ptr, proven_transaction.__wbg_ptr, transaction_result.__wbg_ptr);
        return ret;
    }
    /**
     * Internal implementation of `sync_state`.
     *
     * This method performs the actual sync operation. Concurrent call coordination
     * is handled at the JavaScript layer using the Web Locks API.
     *
     * **Note:** Do not call this method directly. Use `syncState()` from JavaScript instead,
     * which provides proper coordination for concurrent calls.
     * @returns {Promise<SyncSummary>}
     */
    syncStateImpl() {
        const ret = wasm.webclient_syncStateImpl(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    usesMockChain() {
        const ret = wasm.webclient_usesMockChain(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) WebClient.prototype[Symbol.dispose] = WebClient.prototype.free;

/**
 * JavaScript API for the client's keystore.
 *
 * Manages the association between accounts and their authentication secret keys,
 * indexed by public key commitment.
 */
class WebKeystoreApi {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WebKeystoreApi.prototype);
        obj.__wbg_ptr = ptr;
        WebKeystoreApiFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WebKeystoreApiFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_webkeystoreapi_free(ptr, 0);
    }
    /**
     * Retrieves a secret key from the keystore given a public key commitment.
     *
     * Returns the associated `AuthSecretKey` if found, or `null` if not found.
     * @param {Word} pub_key_commitment
     * @returns {Promise<AuthSecretKey | undefined>}
     */
    get(pub_key_commitment) {
        _assertClass(pub_key_commitment, Word);
        const ret = wasm.webkeystoreapi_get(this.__wbg_ptr, pub_key_commitment.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the account ID associated with a given public key commitment,
     * or `null` if no account is found.
     * @param {Word} pub_key_commitment
     * @returns {Promise<AccountId | undefined>}
     */
    getAccountId(pub_key_commitment) {
        _assertClass(pub_key_commitment, Word);
        const ret = wasm.webkeystoreapi_getAccountId(this.__wbg_ptr, pub_key_commitment.__wbg_ptr);
        return ret;
    }
    /**
     * Returns all public key commitments associated with the given account ID.
     * @param {AccountId} account_id
     * @returns {Promise<Word[]>}
     */
    getCommitments(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.webkeystoreapi_getCommitments(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * Inserts a secret key into the keystore, associating it with the given account ID.
     * @param {AccountId} account_id
     * @param {AuthSecretKey} secret_key
     * @returns {Promise<void>}
     */
    insert(account_id, secret_key) {
        _assertClass(account_id, AccountId);
        _assertClass(secret_key, AuthSecretKey);
        const ret = wasm.webkeystoreapi_insert(this.__wbg_ptr, account_id.__wbg_ptr, secret_key.__wbg_ptr);
        return ret;
    }
    /**
     * Removes a key from the keystore by its public key commitment.
     * @param {Word} pub_key_commitment
     * @returns {Promise<void>}
     */
    remove(pub_key_commitment) {
        _assertClass(pub_key_commitment, Word);
        const ret = wasm.webkeystoreapi_remove(this.__wbg_ptr, pub_key_commitment.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WebKeystoreApi.prototype[Symbol.dispose] = WebKeystoreApi.prototype.free;

class Word {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Word.prototype);
        obj.__wbg_ptr = ptr;
        WordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    static __unwrap(jsValue) {
        if (!(jsValue instanceof Word)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WordFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_word_free(ptr, 0);
    }
    /**
     * Deserializes a word from bytes.
     * @param {Uint8Array} bytes
     * @returns {Word}
     */
    static deserialize(bytes) {
        const ret = wasm.word_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Word.__wrap(ret[0]);
    }
    /**
     * Creates a Word from a hex string.
     * Fails if the provided string is not a valid hex representation of a Word.
     * @param {string} hex
     * @returns {Word}
     */
    static fromHex(hex) {
        const ptr0 = passStringToWasm0(hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.word_fromHex(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Word.__wrap(ret[0]);
    }
    /**
     * Creates a word from four u64 values.
     * @param {BigUint64Array} u64_vec
     */
    constructor(u64_vec) {
        const ptr0 = passArray64ToWasm0(u64_vec, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.word_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        WordFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Creates a word from four field elements.
     * @param {Felt[]} felt_vec
     * @returns {Word}
     */
    static newFromFelts(felt_vec) {
        const ptr0 = passArrayJsValueToWasm0(felt_vec, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.word_newFromFelts(ptr0, len0);
        return Word.__wrap(ret);
    }
    /**
     * Serializes the word into bytes.
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.word_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the word as an array of field elements.
     * @returns {Felt[]}
     */
    toFelts() {
        const ret = wasm.word_toFelts(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the hex representation of the word.
     * @returns {string}
     */
    toHex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.word_toHex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the word as an array of u64 values.
     * @returns {BigUint64Array}
     */
    toU64s() {
        const ret = wasm.word_toU64s(this.__wbg_ptr);
        var v1 = getArrayU64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
}
if (Symbol.dispose) Word.prototype[Symbol.dispose] = Word.prototype.free;

/**
 * Create an auth component for `Falcon512Rpo` multisig.
 * @param {AuthFalcon512RpoMultisigConfig} config
 * @returns {AccountComponent}
 */
function createAuthFalcon512RpoMultisig(config) {
    _assertClass(config, AuthFalcon512RpoMultisigConfig);
    var ptr0 = config.__destroy_into_raw();
    const ret = wasm.createAuthFalcon512RpoMultisig(ptr0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return AccountComponent.__wrap(ret[0]);
}

/**
 * Exports the entire contents of an `IndexedDB` store as a JSON string.
 *
 * Use together with [`import_store`].
 * @param {string} store_name
 * @returns {Promise<any>}
 */
function exportStore2(store_name) {
    const ptr0 = passStringToWasm0(store_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.exportStore(ptr0, len0);
    return ret;
}

/**
 * Imports store contents from a JSON string, replacing all existing data.
 *
 * Use together with [`export_store`].
 * @param {string} store_name
 * @param {string} store_dump
 * @returns {Promise<void>}
 */
function importStore(store_name, store_dump) {
    const ptr0 = passStringToWasm0(store_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(store_dump, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.importStore(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * @param {number} num_threads
 * @returns {Promise<any>}
 */
function initThreadPool(num_threads) {
    const ret = wasm.initThreadPool(num_threads);
    return ret;
}

/**
 * Synthetic parallel benchmark: sums 0..n via `par_iter()` on the global
 * rayon pool. Returns elapsed micros. If the pool is actually multi-threaded,
 * large `n` should scale ~linearly with thread count. Diagnostic for
 * confirming whether rayon is dispatching work at all.
 * @param {bigint} n
 * @returns {bigint}
 */
function parallelSumBench(n) {
    const ret = wasm.parallelSumBench(n);
    return BigInt.asUintN(64, ret);
}

/**
 * How many rayon worker threads are visible from THIS WASM instance's view of
 * the global rayon pool. Diagnostic only — the value should equal whatever
 * `initThreadPool(n)` was called with. If it's 1, rayon is in single-threaded
 * fallback (workers never spawned, or spawned in a different WASM instance).
 * @returns {number}
 */
function rayonThreadCount() {
    const ret = wasm.rayonThreadCount();
    return ret >>> 0;
}

/**
 * Single-threaded version of `parallel_sum_bench` for direct comparison.
 * Same workload, plain `iter()` — bypasses rayon entirely.
 * @param {bigint} n
 * @returns {bigint}
 */
function sequentialSumBench(n) {
    const ret = wasm.sequentialSumBench(n);
    return BigInt.asUintN(64, ret);
}

/**
 * Initializes the `tracing` subscriber that routes Rust log output to the
 * browser console via `console.log` / `console.warn` / `console.error`.
 *
 * `log_level` must be one of `"error"`, `"warn"`, `"info"`, `"debug"`,
 * `"trace"`, `"off"`, or `"none"` (no logging). Unknown values are treated
 * as "off".
 *
 * This is a **per-thread global** — call it once on the main thread and, if
 * you use a Web Worker, once inside the worker. Subsequent calls on the same
 * thread are harmless no-ops.
 * @param {string} log_level
 */
function setupLogging(log_level) {
    const ptr0 = passStringToWasm0(log_level, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.setupLogging(ptr0, len0);
}

class wbg_rayon_PoolBuilder {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(wbg_rayon_PoolBuilder.prototype);
        obj.__wbg_ptr = ptr;
        wbg_rayon_PoolBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        wbg_rayon_PoolBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wbg_rayon_poolbuilder_free(ptr, 0);
    }
    build() {
        wasm.wbg_rayon_poolbuilder_build(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    numThreads() {
        const ret = wasm.notesyncinfo_blockTo(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    receiver() {
        const ret = wasm.wbg_rayon_poolbuilder_receiver(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) wbg_rayon_PoolBuilder.prototype[Symbol.dispose] = wbg_rayon_PoolBuilder.prototype.free;

/**
 * @param {number} receiver
 */
function wbg_rayon_start_worker(receiver) {
    wasm.wbg_rayon_start_worker(receiver);
}

function __wbg_get_imports(memory) {
    const import0 = {
        __proto__: null,
        __wbg_Error_8c4e43fe74559d73: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_04624de7d0e8332d: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8f0eb39a4a4c2f66: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_8fcf4ce7f1ca72a2: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_47fa6863be6f2f25: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_31b12575b56f32fc: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_0095a73b8b156f76: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_ac34f5003991759a: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_11888390b0186270: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_9dd77d8cd6671811: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_memory_bd1fbcf21fbef3c8: function() {
            const ret = wasm.memory;
            return ret;
        },
        __wbg___wbindgen_module_f6b8052d79c1cc16: function() {
            const ret = wasmModule;
            return ret;
        },
        __wbg___wbindgen_number_get_8ff4255516ccad3e: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_rethrow_05525c567f154472: function(arg0) {
            throw arg0;
        },
        __wbg___wbindgen_string_get_72fb696202c56729: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_d9b87ff7982e3b21: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_abort_2f0584e03e8e3950: function(arg0) {
            arg0.abort();
        },
        __wbg_abort_d549b92d3c665de1: function(arg0, arg1) {
            arg0.abort(arg1);
        },
        __wbg_account_new: function(arg0) {
            const ret = Account.__wrap(arg0);
            return ret;
        },
        __wbg_account_unwrap: function(arg0) {
            const ret = Account.__unwrap(arg0);
            return ret;
        },
        __wbg_accountcode_new: function(arg0) {
            const ret = AccountCode.__wrap(arg0);
            return ret;
        },
        __wbg_accountfile_new: function(arg0) {
            const ret = AccountFile.__wrap(arg0);
            return ret;
        },
        __wbg_accountheader_new: function(arg0) {
            const ret = AccountHeader.__wrap(arg0);
            return ret;
        },
        __wbg_accountid_new: function(arg0) {
            const ret = AccountId.__wrap(arg0);
            return ret;
        },
        __wbg_accountid_unwrap: function(arg0) {
            const ret = AccountId.__unwrap(arg0);
            return ret;
        },
        __wbg_accountproof_new: function(arg0) {
            const ret = AccountProof.__wrap(arg0);
            return ret;
        },
        __wbg_accountstatus_new: function(arg0) {
            const ret = AccountStatus.__wrap(arg0);
            return ret;
        },
        __wbg_accountstorage_new: function(arg0) {
            const ret = AccountStorage.__wrap(arg0);
            return ret;
        },
        __wbg_addNoteTag_73f23a831a6e3b6a: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            var v0 = getArrayU8FromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 1, 1);
            let v1;
            if (arg4 !== 0) {
                v1 = getStringFromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
            }
            let v2;
            if (arg6 !== 0) {
                v2 = getStringFromWasm0(arg6, arg7).slice();
                wasm.__wbindgen_free(arg6, arg7 * 1, 1);
            }
            const ret = addNoteTag(getStringFromWasm0(arg0, arg1), v0, v1, v2);
            return ret;
        },
        __wbg_address_new: function(arg0) {
            const ret = Address.__wrap(arg0);
            return ret;
        },
        __wbg_append_a992ccc37aa62dc4: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_applyFullAccountState_0d845d902fcf8977: function(arg0, arg1, arg2) {
            const ret = applyFullAccountState(getStringFromWasm0(arg0, arg1), JsAccountUpdate.__wrap(arg2));
            return ret;
        },
        __wbg_applyStateSync_1bcd5a63e003b122: function(arg0, arg1, arg2) {
            const ret = applyStateSync(getStringFromWasm0(arg0, arg1), JsStateSyncUpdate.__wrap(arg2));
            return ret;
        },
        __wbg_applyTransactionDelta_e3969ada5c15edfa: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16, arg17, arg18, arg19, arg20) {
            let deferred0_0;
            let deferred0_1;
            let deferred1_0;
            let deferred1_1;
            let deferred5_0;
            let deferred5_1;
            let deferred6_0;
            let deferred6_1;
            let deferred7_0;
            let deferred7_1;
            let deferred8_0;
            let deferred8_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                deferred1_0 = arg4;
                deferred1_1 = arg5;
                var v2 = getArrayJsValueFromWasm0(arg6, arg7).slice();
                wasm.__wbindgen_free(arg6, arg7 * 4, 4);
                var v3 = getArrayJsValueFromWasm0(arg8, arg9).slice();
                wasm.__wbindgen_free(arg8, arg9 * 4, 4);
                var v4 = getArrayJsValueFromWasm0(arg10, arg11).slice();
                wasm.__wbindgen_free(arg10, arg11 * 4, 4);
                deferred5_0 = arg12;
                deferred5_1 = arg13;
                deferred6_0 = arg14;
                deferred6_1 = arg15;
                deferred7_0 = arg16;
                deferred7_1 = arg17;
                deferred8_0 = arg19;
                deferred8_1 = arg20;
                const ret = applyTransactionDelta(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), v2, v3, v4, getStringFromWasm0(arg12, arg13), getStringFromWasm0(arg14, arg15), getStringFromWasm0(arg16, arg17), arg18 !== 0, getStringFromWasm0(arg19, arg20));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
                wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
                wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
                wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
                wasm.__wbindgen_free(deferred8_0, deferred8_1, 1);
            }
        },
        __wbg_assetvault_new: function(arg0) {
            const ret = AssetVault.__wrap(arg0);
            return ret;
        },
        __wbg_async_79f2a61f9d0b31cf: function(arg0) {
            const ret = arg0.async;
            return ret;
        },
        __wbg_authsecretkey_new: function(arg0) {
            const ret = AuthSecretKey.__wrap(arg0);
            return ret;
        },
        __wbg_blockheader_new: function(arg0) {
            const ret = BlockHeader.__wrap(arg0);
            return ret;
        },
        __wbg_body_3a0b4437dadea6bf: function(arg0) {
            const ret = arg0.body;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_buffer_26d0910f3a5bc899: function(arg0) {
            const ret = arg0.buffer;
            return ret;
        },
        __wbg_buffer_7b5f53e46557d8f1: function(arg0) {
            const ret = arg0.buffer;
            return ret;
        },
        __wbg_byobRequest_80e594e6da4e1af7: function(arg0) {
            const ret = arg0.byobRequest;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_byteLength_3417f266f4bf562a: function(arg0) {
            const ret = arg0.byteLength;
            return ret;
        },
        __wbg_byteOffset_f88547ca47c86358: function(arg0) {
            const ret = arg0.byteOffset;
            return ret;
        },
        __wbg_call_389efe28435a9388: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_4708e0c13bdc8e95: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_call_812d25f1510c13c8: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.call(arg1, arg2, arg3);
            return ret;
        }, arguments); },
        __wbg_cancel_2c0a0a251ff6b2b7: function(arg0) {
            const ret = arg0.cancel();
            return ret;
        },
        __wbg_catch_c1f8c7623b458214: function(arg0, arg1) {
            const ret = arg0.catch(arg1);
            return ret;
        },
        __wbg_clearTimeout_4307ae83d0111797: function(arg0) {
            const ret = clearTimeout(arg0);
            return ret;
        },
        __wbg_clearTimeout_5a54f8841c30079a: function(arg0) {
            const ret = clearTimeout(arg0);
            return ret;
        },
        __wbg_close_06dfa0a815b9d71f: function() { return handleError(function (arg0) {
            arg0.close();
        }, arguments); },
        __wbg_close_a79afee31de55b36: function() { return handleError(function (arg0) {
            arg0.close();
        }, arguments); },
        __wbg_committednote_new: function(arg0) {
            const ret = CommittedNote.__wrap(arg0);
            return ret;
        },
        __wbg_consumablenoterecord_new: function(arg0) {
            const ret = ConsumableNoteRecord.__wrap(arg0);
            return ret;
        },
        __wbg_data_5330da50312d0bc1: function(arg0) {
            const ret = arg0.data;
            return ret;
        },
        __wbg_done_57b39ecd9addfe81: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_enqueue_2c63f2044f257c3e: function() { return handleError(function (arg0, arg1) {
            arg0.enqueue(arg1);
        }, arguments); },
        __wbg_error_7534b8e9a36f1ab4: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_exportStore_67cb33e10694e807: function(arg0, arg1) {
            const ret = exportStore(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_felt_new: function(arg0) {
            const ret = Felt.__wrap(arg0);
            return ret;
        },
        __wbg_felt_unwrap: function(arg0) {
            const ret = Felt.__unwrap(arg0);
            return ret;
        },
        __wbg_feltarray_new: function(arg0) {
            const ret = FeltArray.__wrap(arg0);
            return ret;
        },
        __wbg_fetch_c97461e1e8f610cd: function(arg0, arg1, arg2) {
            const ret = arg0.fetch(arg1, arg2);
            return ret;
        },
        __wbg_fetch_da370f859548acb0: function(arg0, arg1) {
            const ret = fetch(arg0, arg1);
            return ret;
        },
        __wbg_fetchedaccount_new: function(arg0) {
            const ret = FetchedAccount.__wrap(arg0);
            return ret;
        },
        __wbg_fetchednote_new: function(arg0) {
            const ret = FetchedNote.__wrap(arg0);
            return ret;
        },
        __wbg_forceImportStore_680f1469df7413c7: function(arg0, arg1, arg2) {
            const ret = forceImportStore(getStringFromWasm0(arg0, arg1), arg2);
            return ret;
        },
        __wbg_foreignaccount_unwrap: function(arg0) {
            const ret = ForeignAccount.__unwrap(arg0);
            return ret;
        },
        __wbg_fungibleasset_new: function(arg0) {
            const ret = FungibleAsset.__wrap(arg0);
            return ret;
        },
        __wbg_fungibleasset_unwrap: function(arg0) {
            const ret = FungibleAsset.__unwrap(arg0);
            return ret;
        },
        __wbg_fungibleassetdeltaitem_new: function(arg0) {
            const ret = FungibleAssetDeltaItem.__wrap(arg0);
            return ret;
        },
        __wbg_getAccountAddresses_8baffdc3eeb998cf: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getAccountAddresses(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAccountAuthByPubKeyCommitment_e43b4fa523c75690: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getAccountAuthByPubKeyCommitment(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAccountCode_2c01e0b1d6e4c0c4: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getAccountCode(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAccountHeaderByCommitment_1937c881a4ffe36d: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getAccountHeaderByCommitment(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAccountHeader_31cd380543ca54bb: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getAccountHeader(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAccountIdByKeyCommitment_7e1627233d417ef0: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getAccountIdByKeyCommitment(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAccountIds_880fce01ae9ed908: function(arg0, arg1) {
            const ret = getAccountIds(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_getAccountStorageMaps_77f9e51e9f936384: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getAccountStorageMaps(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAccountStorage_b81f8fc1f4174bf4: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayJsValueFromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 4, 4);
                const ret = getAccountStorage(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAccountVaultAssets_3aaa86634b9c362e: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayJsValueFromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 4, 4);
                const ret = getAccountVaultAssets(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getAllAccountHeaders_de7adaa6ce6f8022: function(arg0, arg1) {
            const ret = getAllAccountHeaders(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_getBlockHeaders_1a3602f84753a649: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayU32FromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            const ret = getBlockHeaders(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getForeignAccountCode_dcbbf63304933fb9: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayJsValueFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            const ret = getForeignAccountCode(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getInputNoteByOffset_afd8189342d490ba: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
            let deferred1_0;
            let deferred1_1;
            try {
                var v0 = getArrayU8FromWasm0(arg2, arg3).slice();
                wasm.__wbindgen_free(arg2, arg3 * 1, 1);
                deferred1_0 = arg4;
                deferred1_1 = arg5;
                const ret = getInputNoteByOffset(getStringFromWasm0(arg0, arg1), v0, getStringFromWasm0(arg4, arg5), arg6 === 0x100000001 ? undefined : arg6, arg7 === 0x100000001 ? undefined : arg7, arg8 >>> 0);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        },
        __wbg_getInputNotesFromIds_e24a7b2888455307: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayJsValueFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            const ret = getInputNotesFromIds(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getInputNotesFromNullifiers_96cb2e010b7806d6: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayJsValueFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            const ret = getInputNotesFromNullifiers(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getInputNotes_51ceedc136efe8a5: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayU8FromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 1, 1);
            const ret = getInputNotes(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getKeyCommitmentsByAccountId_e7f6c3397b516c99: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getKeyCommitmentsByAccountId(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getNoteScript_ebcab1b756e132b7: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getNoteScript(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getNoteTags_430e9c90b199fcaf: function(arg0, arg1) {
            const ret = getNoteTags(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_getOutputNotesFromIds_5e6d42b0b3a25b4b: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayJsValueFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            const ret = getOutputNotesFromIds(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getOutputNotesFromNullifiers_5a9fc255157b6fbd: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayJsValueFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            const ret = getOutputNotesFromNullifiers(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getOutputNotes_4809f2cd6485ad68: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayU8FromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 1, 1);
            const ret = getOutputNotes(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getPartialBlockchainNodesAll_674fcd3d1955cfaa: function(arg0, arg1) {
            const ret = getPartialBlockchainNodesAll(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_getPartialBlockchainNodesUpToInOrderIndex_ce09946942839df4: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getPartialBlockchainNodesUpToInOrderIndex(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getPartialBlockchainNodes_8a5579c21093ba83: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayJsValueFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            const ret = getPartialBlockchainNodes(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_getPartialBlockchainPeaksByBlockNum_d6eeb9e6a1fba098: function(arg0, arg1, arg2) {
            const ret = getPartialBlockchainPeaksByBlockNum(getStringFromWasm0(arg0, arg1), arg2 >>> 0);
            return ret;
        },
        __wbg_getRandomValues_ea728b1d79dae146: function() { return handleError(function (arg0) {
            globalThis.crypto.getRandomValues(arg0);
        }, arguments); },
        __wbg_getReader_f47519d698a4505e: function() { return handleError(function (arg0) {
            const ret = arg0.getReader();
            return ret;
        }, arguments); },
        __wbg_getSetting_1d08025676323ba9: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getSetting(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getSyncHeight_945bdd99f3962099: function(arg0, arg1) {
            const ret = getSyncHeight(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_getTime_1e3cd1391c5c3995: function(arg0) {
            const ret = arg0.getTime();
            return ret;
        },
        __wbg_getTrackedBlockHeaderNumbers_63af295c749079e4: function(arg0, arg1) {
            const ret = getTrackedBlockHeaderNumbers(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_getTrackedBlockHeaders_3e40bc541ec5a490: function(arg0, arg1) {
            const ret = getTrackedBlockHeaders(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_getTransactions_3cd589dfbcd48460: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = getTransactions(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getUnspentInputNoteNullifiers_f403872bd5cdee30: function(arg0, arg1) {
            const ret = getUnspentInputNoteNullifiers(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_get_9b94d73e6221f75c: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_b3ed3ad4be2bc8ac: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_done_1ad1c16537f444c6: function(arg0) {
            const ret = arg0.done;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg_get_value_6b77a1b7b90c9200: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_get_with_ref_key_1dc361bd10053bfe: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_getproceduresresultitem_new: function(arg0) {
            const ret = GetProceduresResultItem.__wrap(arg0);
            return ret;
        },
        __wbg_has_d4e53238966c12b6: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.has(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_headers_59a2938db9f80985: function(arg0) {
            const ret = arg0.headers;
            return ret;
        },
        __wbg_inputnote_new: function(arg0) {
            const ret = InputNote.__wrap(arg0);
            return ret;
        },
        __wbg_inputnoterecord_new: function(arg0) {
            const ret = InputNoteRecord.__wrap(arg0);
            return ret;
        },
        __wbg_insertAccountAddress_010cd84f15a2fba0: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
                const ret = insertAccountAddress(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_insertAccountAuth_47c33fb7c61f1aea: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            let deferred1_0;
            let deferred1_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                deferred1_0 = arg4;
                deferred1_1 = arg5;
                const ret = insertAccountAuth(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        },
        __wbg_insertAccountKeyMapping_b94e28f85f7038ef: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            let deferred1_0;
            let deferred1_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                deferred1_0 = arg4;
                deferred1_1 = arg5;
                const ret = insertAccountKeyMapping(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        },
        __wbg_insertBlockHeader_f5ae91cdec3dcadd: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            var v0 = getArrayU8FromWasm0(arg3, arg4).slice();
            wasm.__wbindgen_free(arg3, arg4 * 1, 1);
            var v1 = getArrayU8FromWasm0(arg5, arg6).slice();
            wasm.__wbindgen_free(arg5, arg6 * 1, 1);
            const ret = insertBlockHeader(getStringFromWasm0(arg0, arg1), arg2 >>> 0, v0, v1, arg7 !== 0);
            return ret;
        },
        __wbg_insertPartialBlockchainNodes_b0cb6befaab01e5f: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            var v0 = getArrayJsValueFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            var v1 = getArrayJsValueFromWasm0(arg4, arg5).slice();
            wasm.__wbindgen_free(arg4, arg5 * 4, 4);
            const ret = insertPartialBlockchainNodes(getStringFromWasm0(arg0, arg1), v0, v1);
            return ret;
        },
        __wbg_insertSetting_db9299455a50a86e: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
                const ret = insertSetting(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_insertTransactionScript_0ce3812a118db4dd: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            var v0 = getArrayU8FromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 1, 1);
            let v1;
            if (arg4 !== 0) {
                v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
            }
            const ret = insertTransactionScript(getStringFromWasm0(arg0, arg1), v0, v1);
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Promise_0094681e3519d6ec: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Promise;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_9b9075935c74707c: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_ed49b2db8df90359: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_d314bb98fcf08331: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_bfbc7332a9768d2a: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_6ff6560ca1568e55: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_jsaccountupdate_new: function(arg0) {
            const ret = JsAccountUpdate.__wrap(arg0);
            return ret;
        },
        __wbg_jsaccountupdate_unwrap: function(arg0) {
            const ret = JsAccountUpdate.__unwrap(arg0);
            return ret;
        },
        __wbg_jsstoragemapentry_new: function(arg0) {
            const ret = JsStorageMapEntry.__wrap(arg0);
            return ret;
        },
        __wbg_jsstoragemapentry_unwrap: function(arg0) {
            const ret = JsStorageMapEntry.__unwrap(arg0);
            return ret;
        },
        __wbg_jsstorageslot_new: function(arg0) {
            const ret = JsStorageSlot.__wrap(arg0);
            return ret;
        },
        __wbg_jsstorageslot_unwrap: function(arg0) {
            const ret = JsStorageSlot.__unwrap(arg0);
            return ret;
        },
        __wbg_jsvaultasset_new: function(arg0) {
            const ret = JsVaultAsset.__wrap(arg0);
            return ret;
        },
        __wbg_jsvaultasset_unwrap: function(arg0) {
            const ret = JsVaultAsset.__unwrap(arg0);
            return ret;
        },
        __wbg_length_32ed9a279acd054c: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_35a7bace40f36eac: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_listSettingKeys_0a51e3f4cad7f036: function(arg0, arg1) {
            const ret = listSettingKeys(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_lockAccount_8a141fe8afe53d1f: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = lockAccount(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_log_0cc1b7768397bcfe: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.log(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_log_cb9e190acc5753fb: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.log(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_mark_7438147ce31e9d4b: function(arg0, arg1) {
            performance.mark(getStringFromWasm0(arg0, arg1));
        },
        __wbg_measure_fb7825c11612c823: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            let deferred1_0;
            let deferred1_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                deferred1_0 = arg2;
                deferred1_1 = arg3;
                performance.measure(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        }, arguments); },
        __wbg_new_0_73afc35eb544e539: function() {
            const ret = new Date();
            return ret;
        },
        __wbg_new_361308b2356cecd0: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_3eb36ae241fe6f44: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_4f8f3c123e474358: function() { return handleError(function (arg0, arg1) {
            const ret = new Worker(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_new_64284bd487f9d239: function() { return handleError(function () {
            const ret = new Headers();
            return ret;
        }, arguments); },
        __wbg_new_72b49615380db768: function(arg0, arg1) {
            const ret = new Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_72c627ba80de1c21: function(arg0) {
            const ret = new Int32Array(arg0);
            return ret;
        },
        __wbg_new_8a6f238a6ece86ea: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_b5d9e2fb389fef91: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke___wasm_bindgen_d95d7c4a5cb06fc0___JsValue__wasm_bindgen_d95d7c4a5cb06fc0___JsValue_____(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = state0.b = 0;
            }
        },
        __wbg_new_b949e7f56150a5d1: function() { return handleError(function () {
            const ret = new AbortController();
            return ret;
        }, arguments); },
        __wbg_new_dd2b680c8bf6ae29: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_from_slice_a3d2629dc1826784: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_no_args_1c7c842f08d00ebb: function(arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_with_byte_offset_and_length_aa261d9c9da49eb1: function(arg0, arg1, arg2) {
            const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_new_with_length_a2c39cbe88fd8ff1: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_str_and_init_a61cbc6bdef21614: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
            return ret;
        }, arguments); },
        __wbg_next_3482f54c49e8af19: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_next_418f80d8f5303233: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_note_new: function(arg0) {
            const ret = Note.__wrap(arg0);
            return ret;
        },
        __wbg_note_unwrap: function(arg0) {
            const ret = Note.__unwrap(arg0);
            return ret;
        },
        __wbg_noteandargs_unwrap: function(arg0) {
            const ret = NoteAndArgs.__unwrap(arg0);
            return ret;
        },
        __wbg_noteconsumability_new: function(arg0) {
            const ret = NoteConsumability.__wrap(arg0);
            return ret;
        },
        __wbg_noteconsumability_unwrap: function(arg0) {
            const ret = NoteConsumability.__unwrap(arg0);
            return ret;
        },
        __wbg_notedetailsandtag_new: function(arg0) {
            const ret = NoteDetailsAndTag.__wrap(arg0);
            return ret;
        },
        __wbg_notedetailsandtag_unwrap: function(arg0) {
            const ret = NoteDetailsAndTag.__unwrap(arg0);
            return ret;
        },
        __wbg_notefile_new: function(arg0) {
            const ret = NoteFile.__wrap(arg0);
            return ret;
        },
        __wbg_noteid_new: function(arg0) {
            const ret = NoteId.__wrap(arg0);
            return ret;
        },
        __wbg_noteid_unwrap: function(arg0) {
            const ret = NoteId.__unwrap(arg0);
            return ret;
        },
        __wbg_noteidandargs_unwrap: function(arg0) {
            const ret = NoteIdAndArgs.__unwrap(arg0);
            return ret;
        },
        __wbg_noterecipient_unwrap: function(arg0) {
            const ret = NoteRecipient.__unwrap(arg0);
            return ret;
        },
        __wbg_notescript_new: function(arg0) {
            const ret = NoteScript.__wrap(arg0);
            return ret;
        },
        __wbg_notesyncblock_new: function(arg0) {
            const ret = NoteSyncBlock.__wrap(arg0);
            return ret;
        },
        __wbg_notesyncinfo_new: function(arg0) {
            const ret = NoteSyncInfo.__wrap(arg0);
            return ret;
        },
        __wbg_notetag_unwrap: function(arg0) {
            const ret = NoteTag.__unwrap(arg0);
            return ret;
        },
        __wbg_of_ddc0942b0dce16a1: function(arg0, arg1, arg2) {
            const ret = Array.of(arg0, arg1, arg2);
            return ret;
        },
        __wbg_openDatabase_cde23913ad00e851: function(arg0, arg1, arg2, arg3) {
            const ret = openDatabase(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
            return ret;
        },
        __wbg_outputnote_new: function(arg0) {
            const ret = OutputNote.__wrap(arg0);
            return ret;
        },
        __wbg_outputnote_unwrap: function(arg0) {
            const ret = OutputNote.__unwrap(arg0);
            return ret;
        },
        __wbg_outputnoterecord_new: function(arg0) {
            const ret = OutputNoteRecord.__wrap(arg0);
            return ret;
        },
        __wbg_postMessage_771ef3293a28bbac: function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments); },
        __wbg_procedurethreshold_new: function(arg0) {
            const ret = ProcedureThreshold.__wrap(arg0);
            return ret;
        },
        __wbg_procedurethreshold_unwrap: function(arg0) {
            const ret = ProcedureThreshold.__unwrap(arg0);
            return ret;
        },
        __wbg_prototypesetcall_bdcdcc5842e4d77d: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_proventransaction_new: function(arg0) {
            const ret = ProvenTransaction.__wrap(arg0);
            return ret;
        },
        __wbg_pruneAccountHistory_354251ecd3d1db75: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            let deferred1_0;
            let deferred1_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                deferred1_0 = arg4;
                deferred1_1 = arg5;
                const ret = pruneAccountHistory(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        },
        __wbg_pruneIrrelevantBlocks_dc97d14f31702d1f: function(arg0, arg1) {
            const ret = pruneIrrelevantBlocks(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_queueMicrotask_0aa0a927f78f5d98: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_queueMicrotask_5bb536982f78a56f: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_read_68fd377df67e19b0: function(arg0) {
            const ret = arg0.read();
            return ret;
        },
        __wbg_releaseLock_aa5846c2494b3032: function(arg0) {
            arg0.releaseLock();
        },
        __wbg_removeAccountAddress_3f0e0ecc294d79fa: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayU8FromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 1, 1);
            const ret = removeAccountAddress(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_removeAccountAuth_0c07288e7cb5a02d: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = removeAccountAuth(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_removeAllMappingsForKey_17fa2424f229b2ce: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = removeAllMappingsForKey(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_removeNoteTag_3d017b00fc0fe3f2: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            var v0 = getArrayU8FromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 1, 1);
            let v1;
            if (arg4 !== 0) {
                v1 = getStringFromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
            }
            let v2;
            if (arg6 !== 0) {
                v2 = getStringFromWasm0(arg6, arg7).slice();
                wasm.__wbindgen_free(arg6, arg7 * 1, 1);
            }
            const ret = removeNoteTag(getStringFromWasm0(arg0, arg1), v0, v1, v2);
            return ret;
        },
        __wbg_removeSetting_e2432798ff986675: function(arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                const ret = removeSetting(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_resolve_002c4b7d9d8f6b64: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_respond_bf6ab10399ca8722: function() { return handleError(function (arg0, arg1) {
            arg0.respond(arg1 >>> 0);
        }, arguments); },
        __wbg_serializedinputnotedata_new: function(arg0) {
            const ret = SerializedInputNoteData.__wrap(arg0);
            return ret;
        },
        __wbg_serializedinputnotedata_unwrap: function(arg0) {
            const ret = SerializedInputNoteData.__unwrap(arg0);
            return ret;
        },
        __wbg_serializedoutputnotedata_new: function(arg0) {
            const ret = SerializedOutputNoteData.__wrap(arg0);
            return ret;
        },
        __wbg_serializedoutputnotedata_unwrap: function(arg0) {
            const ret = SerializedOutputNoteData.__unwrap(arg0);
            return ret;
        },
        __wbg_serializedtransactiondata_new: function(arg0) {
            const ret = SerializedTransactionData.__wrap(arg0);
            return ret;
        },
        __wbg_serializedtransactiondata_unwrap: function(arg0) {
            const ret = SerializedTransactionData.__unwrap(arg0);
            return ret;
        },
        __wbg_setTimeout_098c3cf1a18edbf9: function(arg0, arg1) {
            const ret = setTimeout(arg0, arg1);
            return ret;
        },
        __wbg_setTimeout_db2dbaeefb6f39c7: function() { return handleError(function (arg0, arg1) {
            const ret = setTimeout(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_set_6cb8631f80447a67: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_body_9a7e00afe3cfe244: function(arg0, arg1) {
            arg0.body = arg1;
        },
        __wbg_set_cache_315a3ed773a41543: function(arg0, arg1) {
            arg0.cache = __wbindgen_enum_RequestCache[arg1];
        },
        __wbg_set_cc56eefd2dd91957: function(arg0, arg1, arg2) {
            arg0.set(getArrayU8FromWasm0(arg1, arg2));
        },
        __wbg_set_credentials_c4a58d2e05ef24fb: function(arg0, arg1) {
            arg0.credentials = __wbindgen_enum_RequestCredentials[arg1];
        },
        __wbg_set_db769d02949a271d: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_set_f43e577aea94465b: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_headers_cfc5f4b2c1f20549: function(arg0, arg1) {
            arg0.headers = arg1;
        },
        __wbg_set_integrity_aa1d5cf2e257cade: function(arg0, arg1, arg2) {
            arg0.integrity = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_method_c3e20375f5ae7fac: function(arg0, arg1, arg2) {
            arg0.method = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_mode_b13642c312648202: function(arg0, arg1) {
            arg0.mode = __wbindgen_enum_RequestMode[arg1];
        },
        __wbg_set_onmessage_6ed41050e4a5cee2: function(arg0, arg1) {
            arg0.onmessage = arg1;
        },
        __wbg_set_redirect_a7956fa3f817cbbc: function(arg0, arg1) {
            arg0.redirect = __wbindgen_enum_RequestRedirect[arg1];
        },
        __wbg_set_referrer_aa8e6f0f198f18cd: function(arg0, arg1, arg2) {
            arg0.referrer = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_referrer_policy_544ba074b97231a6: function(arg0, arg1) {
            arg0.referrerPolicy = __wbindgen_enum_ReferrerPolicy[arg1];
        },
        __wbg_set_signal_f2d3f8599248896d: function(arg0, arg1) {
            arg0.signal = arg1;
        },
        __wbg_signal_d1285ecab4ebc5ad: function(arg0) {
            const ret = arg0.signal;
            return ret;
        },
        __wbg_slotandkeys_unwrap: function(arg0) {
            const ret = SlotAndKeys.__unwrap(arg0);
            return ret;
        },
        __wbg_stack_0ed75d68575b0f3c: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_startWorkers_2ca11761e08ff5d5: function(arg0, arg1, arg2) {
            const ret = startWorkers(arg0, arg1, wbg_rayon_PoolBuilder.__wrap(arg2));
            return ret;
        },
        __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_status_89d7e803db911ee7: function(arg0) {
            const ret = arg0.status;
            return ret;
        },
        __wbg_storagemapentry_new: function(arg0) {
            const ret = StorageMapEntry.__wrap(arg0);
            return ret;
        },
        __wbg_storagemapinfo_new: function(arg0) {
            const ret = StorageMapInfo.__wrap(arg0);
            return ret;
        },
        __wbg_storagemapupdate_new: function(arg0) {
            const ret = StorageMapUpdate.__wrap(arg0);
            return ret;
        },
        __wbg_storageslot_unwrap: function(arg0) {
            const ret = StorageSlot.__unwrap(arg0);
            return ret;
        },
        __wbg_syncsummary_new: function(arg0) {
            const ret = SyncSummary.__wrap(arg0);
            return ret;
        },
        __wbg_then_0d9fe2c7b1857d32: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_then_b9e7b3b5f1a9e1b5: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_toString_964ff7fe6eca8362: function(arg0) {
            const ret = arg0.toString();
            return ret;
        },
        __wbg_transactionid_new: function(arg0) {
            const ret = TransactionId.__wrap(arg0);
            return ret;
        },
        __wbg_transactionid_unwrap: function(arg0) {
            const ret = TransactionId.__unwrap(arg0);
            return ret;
        },
        __wbg_transactionrecord_new: function(arg0) {
            const ret = TransactionRecord.__wrap(arg0);
            return ret;
        },
        __wbg_transactionresult_new: function(arg0) {
            const ret = TransactionResult.__wrap(arg0);
            return ret;
        },
        __wbg_transactionscriptinputpair_unwrap: function(arg0) {
            const ret = TransactionScriptInputPair.__unwrap(arg0);
            return ret;
        },
        __wbg_transactionstoreupdate_new: function(arg0) {
            const ret = TransactionStoreUpdate.__wrap(arg0);
            return ret;
        },
        __wbg_transactionsummary_new: function(arg0) {
            const ret = TransactionSummary.__wrap(arg0);
            return ret;
        },
        __wbg_undoAccountStates_f1df265279e53b63: function(arg0, arg1, arg2, arg3) {
            var v0 = getArrayJsValueFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 4, 4);
            const ret = undoAccountStates(getStringFromWasm0(arg0, arg1), v0);
            return ret;
        },
        __wbg_upsertAccountCode_a4ac11852963005d: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
                const ret = upsertAccountCode(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_upsertAccountRecord_e676487b1aeca41f: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16) {
            let deferred0_0;
            let deferred0_1;
            let deferred1_0;
            let deferred1_1;
            let deferred2_0;
            let deferred2_1;
            let deferred3_0;
            let deferred3_1;
            let deferred4_0;
            let deferred4_1;
            let deferred5_0;
            let deferred5_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                deferred1_0 = arg4;
                deferred1_1 = arg5;
                deferred2_0 = arg6;
                deferred2_1 = arg7;
                deferred3_0 = arg8;
                deferred3_1 = arg9;
                deferred4_0 = arg10;
                deferred4_1 = arg11;
                deferred5_0 = arg13;
                deferred5_1 = arg14;
                let v6;
                if (arg15 !== 0) {
                    v6 = getArrayU8FromWasm0(arg15, arg16).slice();
                    wasm.__wbindgen_free(arg15, arg16 * 1, 1);
                }
                const ret = upsertAccountRecord(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7), getStringFromWasm0(arg8, arg9), getStringFromWasm0(arg10, arg11), arg12 !== 0, getStringFromWasm0(arg13, arg14), v6);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
                wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
                wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
                wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
                wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
            }
        },
        __wbg_upsertAccountStorage_27c35c950278ccb7: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayJsValueFromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 4, 4);
                const ret = upsertAccountStorage(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_upsertForeignAccountCode_ca44fb2bb646a2e5: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            let deferred0_0;
            let deferred0_1;
            let deferred2_0;
            let deferred2_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
                deferred2_0 = arg6;
                deferred2_1 = arg7;
                const ret = upsertForeignAccountCode(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1, getStringFromWasm0(arg6, arg7));
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
            }
        },
        __wbg_upsertInputNote_c0a91baad890bea3: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16, arg17, arg18, arg19, arg20, arg21, arg22, arg23, arg24) {
            let deferred0_0;
            let deferred0_1;
            let deferred4_0;
            let deferred4_1;
            let deferred6_0;
            let deferred6_1;
            let deferred7_0;
            let deferred7_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
                var v2 = getArrayU8FromWasm0(arg6, arg7).slice();
                wasm.__wbindgen_free(arg6, arg7 * 1, 1);
                var v3 = getArrayU8FromWasm0(arg8, arg9).slice();
                wasm.__wbindgen_free(arg8, arg9 * 1, 1);
                deferred4_0 = arg10;
                deferred4_1 = arg11;
                var v5 = getArrayU8FromWasm0(arg12, arg13).slice();
                wasm.__wbindgen_free(arg12, arg13 * 1, 1);
                deferred6_0 = arg14;
                deferred6_1 = arg15;
                deferred7_0 = arg16;
                deferred7_1 = arg17;
                var v8 = getArrayU8FromWasm0(arg19, arg20).slice();
                wasm.__wbindgen_free(arg19, arg20 * 1, 1);
                let v9;
                if (arg23 !== 0) {
                    v9 = getStringFromWasm0(arg23, arg24).slice();
                    wasm.__wbindgen_free(arg23, arg24 * 1, 1);
                }
                const ret = upsertInputNote(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1, v2, v3, getStringFromWasm0(arg10, arg11), v5, getStringFromWasm0(arg14, arg15), getStringFromWasm0(arg16, arg17), arg18, v8, arg21 === 0x100000001 ? undefined : arg21, arg22 === 0x100000001 ? undefined : arg22, v9);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
                wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
                wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
            }
        },
        __wbg_upsertNoteScript_a3c063a2acfa4780: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
                const ret = upsertNoteScript(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_upsertOutputNote_46d6890a38b77f16: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15) {
            let deferred0_0;
            let deferred0_1;
            let deferred2_0;
            let deferred2_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
                deferred2_0 = arg6;
                deferred2_1 = arg7;
                var v3 = getArrayU8FromWasm0(arg8, arg9).slice();
                wasm.__wbindgen_free(arg8, arg9 * 1, 1);
                let v4;
                if (arg10 !== 0) {
                    v4 = getStringFromWasm0(arg10, arg11).slice();
                    wasm.__wbindgen_free(arg10, arg11 * 1, 1);
                }
                var v5 = getArrayU8FromWasm0(arg14, arg15).slice();
                wasm.__wbindgen_free(arg14, arg15 * 1, 1);
                const ret = upsertOutputNote(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1, getStringFromWasm0(arg6, arg7), v3, v4, arg12 >>> 0, arg13, v5);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
            }
        },
        __wbg_upsertStorageMapEntries_f21a9df772c69fc9: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayJsValueFromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 4, 4);
                const ret = upsertStorageMapEntries(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_upsertTransactionRecord_0bc4df87c698be51: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayU8FromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 1, 1);
                var v2 = getArrayU8FromWasm0(arg8, arg9).slice();
                wasm.__wbindgen_free(arg8, arg9 * 1, 1);
                let v3;
                if (arg10 !== 0) {
                    v3 = getArrayU8FromWasm0(arg10, arg11).slice();
                    wasm.__wbindgen_free(arg10, arg11 * 1, 1);
                }
                const ret = upsertTransactionRecord(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1, arg6 >>> 0, arg7, v2, v3);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_upsertVaultAssets_ceae9eb0e4c816f0: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg2;
                deferred0_1 = arg3;
                var v1 = getArrayJsValueFromWasm0(arg4, arg5).slice();
                wasm.__wbindgen_free(arg4, arg5 * 4, 4);
                const ret = upsertVaultAssets(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), v1);
                return ret;
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_value_0546255b415e96c1: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_value_fe6ee34af5dc3dce: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_view_6c32e7184b8606ad: function(arg0) {
            const ret = arg0.view;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_waitAsync_a58b2134bff39c3e: function(arg0, arg1, arg2) {
            const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
            return ret;
        },
        __wbg_waitAsync_c0a39a7d3318d91e: function() {
            const ret = Atomics.waitAsync;
            return ret;
        },
        __wbg_word_new: function(arg0) {
            const ret = Word.__wrap(arg0);
            return ret;
        },
        __wbg_word_unwrap: function(arg0) {
            const ret = Word.__unwrap(arg0);
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 100, function: Function { arguments: [Externref], shim_idx: 101, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen_d95d7c4a5cb06fc0___closure__destroy___dyn_core_91ed24bc3d45dfd0___ops__function__FnMut__wasm_bindgen_d95d7c4a5cb06fc0___JsValue____Output_______, wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke___wasm_bindgen_d95d7c4a5cb06fc0___JsValue_____);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 100, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 101, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen_d95d7c4a5cb06fc0___closure__destroy___dyn_core_91ed24bc3d45dfd0___ops__function__FnMut__wasm_bindgen_d95d7c4a5cb06fc0___JsValue____Output_______, wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke___wasm_bindgen_d95d7c4a5cb06fc0___JsValue_____);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 100, function: Function { arguments: [], shim_idx: 359, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen_d95d7c4a5cb06fc0___closure__destroy___dyn_core_91ed24bc3d45dfd0___ops__function__FnMut__wasm_bindgen_d95d7c4a5cb06fc0___JsValue____Output_______, wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke______);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000005: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000006: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_cast_0000000000000007: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("AccountHeader")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_0000000000000008: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("Address")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_0000000000000009: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("ConsumableNoteRecord")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_000000000000000a: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("FetchedNote")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_000000000000000b: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("InputNoteRecord")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_000000000000000c: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("OutputNoteRecord")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_000000000000000d: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("TransactionRecord")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_000000000000000e: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("Word")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_000000000000000f: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("string")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_cast_0000000000000010: function(arg0, arg1) {
            var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 1, 1);
            // Cast intrinsic for `Vector(U8) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
        __wbindgen_link_0b1f76d235fd2b86: function(arg0) {
            const val = `onmessage = function (ev) {
                let [ia, index, value] = ev.data;
                ia = new Int32Array(ia.buffer);
                let result = Atomics.wait(ia, index, value);
                postMessage(result);
            };
            `;
            const ret = typeof URL.createObjectURL === 'undefined' ? "data:application/javascript," + encodeURIComponent(val) : URL.createObjectURL(new Blob([val], { type: "text/javascript" }));
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        memory: memory || new WebAssembly.Memory({initial:48,maximum:65536,shared:true}),
    };
    return {
        __proto__: null,
        "./index_bg.js": import0,
    };
}

function wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke______(arg0, arg1) {
    wasm.wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke______(arg0, arg1);
}

function wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke___wasm_bindgen_d95d7c4a5cb06fc0___JsValue_____(arg0, arg1, arg2) {
    wasm.wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke___wasm_bindgen_d95d7c4a5cb06fc0___JsValue_____(arg0, arg1, arg2);
}

function wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke___wasm_bindgen_d95d7c4a5cb06fc0___JsValue__wasm_bindgen_d95d7c4a5cb06fc0___JsValue_____(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen_d95d7c4a5cb06fc0___convert__closures_____invoke___wasm_bindgen_d95d7c4a5cb06fc0___JsValue__wasm_bindgen_d95d7c4a5cb06fc0___JsValue_____(arg0, arg1, arg2, arg3);
}


const __wbindgen_enum_AddressInterface = ["BasicWallet"];


const __wbindgen_enum_ReadableStreamType = ["bytes"];


const __wbindgen_enum_ReferrerPolicy = ["", "no-referrer", "no-referrer-when-downgrade", "origin", "origin-when-cross-origin", "unsafe-url", "same-origin", "strict-origin", "strict-origin-when-cross-origin"];


const __wbindgen_enum_RequestCache = ["default", "no-store", "reload", "no-cache", "force-cache", "only-if-cached"];


const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];


const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];


const __wbindgen_enum_RequestRedirect = ["follow", "error", "manual"];
const AccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_account_free(ptr >>> 0, 1));
const AccountArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountarray_free(ptr >>> 0, 1));
const AccountBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountbuilder_free(ptr >>> 0, 1));
const AccountBuilderResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountbuilderresult_free(ptr >>> 0, 1));
const AccountCodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountcode_free(ptr >>> 0, 1));
const AccountComponentFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountcomponent_free(ptr >>> 0, 1));
const AccountComponentCodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountcomponentcode_free(ptr >>> 0, 1));
const AccountDeltaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountdelta_free(ptr >>> 0, 1));
const AccountFileFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountfile_free(ptr >>> 0, 1));
const AccountHeaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountheader_free(ptr >>> 0, 1));
const AccountIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountid_free(ptr >>> 0, 1));
const AccountIdArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountidarray_free(ptr >>> 0, 1));
const AccountProofFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountproof_free(ptr >>> 0, 1));
const AccountReaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountreader_free(ptr >>> 0, 1));
const AccountStatusFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountstatus_free(ptr >>> 0, 1));
const AccountStorageFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountstorage_free(ptr >>> 0, 1));
const AccountStorageDeltaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountstoragedelta_free(ptr >>> 0, 1));
const AccountStorageModeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountstoragemode_free(ptr >>> 0, 1));
const AccountStorageRequirementsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountstoragerequirements_free(ptr >>> 0, 1));
const AccountVaultDeltaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountvaultdelta_free(ptr >>> 0, 1));
const AddressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_address_free(ptr >>> 0, 1));
const AdviceInputsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_adviceinputs_free(ptr >>> 0, 1));
const AdviceMapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_advicemap_free(ptr >>> 0, 1));
const AssetVaultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_assetvault_free(ptr >>> 0, 1));
const AuthFalcon512RpoMultisigConfigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_authfalcon512rpomultisigconfig_free(ptr >>> 0, 1));
const AuthSecretKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_authsecretkey_free(ptr >>> 0, 1));
const BasicFungibleFaucetComponentFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_basicfungiblefaucetcomponent_free(ptr >>> 0, 1));
const BlockHeaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_blockheader_free(ptr >>> 0, 1));
const CodeBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_codebuilder_free(ptr >>> 0, 1));
const CommittedNoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_committednote_free(ptr >>> 0, 1));
const ConsumableNoteRecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_consumablenoterecord_free(ptr >>> 0, 1));
const EndpointFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_endpoint_free(ptr >>> 0, 1));
const ExecutedTransactionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_executedtransaction_free(ptr >>> 0, 1));
const FeltFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_felt_free(ptr >>> 0, 1));
const FeltArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_feltarray_free(ptr >>> 0, 1));
const FetchedAccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fetchedaccount_free(ptr >>> 0, 1));
const FetchedNoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fetchednote_free(ptr >>> 0, 1));
const FlattenedU8VecFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_flattenedu8vec_free(ptr >>> 0, 1));
const ForeignAccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_foreignaccount_free(ptr >>> 0, 1));
const ForeignAccountArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_foreignaccountarray_free(ptr >>> 0, 1));
const FungibleAssetFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fungibleasset_free(ptr >>> 0, 1));
const FungibleAssetDeltaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fungibleassetdelta_free(ptr >>> 0, 1));
const FungibleAssetDeltaItemFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fungibleassetdeltaitem_free(ptr >>> 0, 1));
const GetProceduresResultItemFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_getproceduresresultitem_free(ptr >>> 0, 1));
const InputNoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inputnote_free(ptr >>> 0, 1));
const InputNoteRecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inputnoterecord_free(ptr >>> 0, 1));
const InputNotesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inputnotes_free(ptr >>> 0, 1));
const IntoUnderlyingByteSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingbytesource_free(ptr >>> 0, 1));
const IntoUnderlyingSinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1));
const IntoUnderlyingSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1));
const JsAccountUpdateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_jsaccountupdate_free(ptr >>> 0, 1));
const JsStateSyncUpdateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_jsstatesyncupdate_free(ptr >>> 0, 1));
const JsStorageMapEntryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_jsstoragemapentry_free(ptr >>> 0, 1));
const JsStorageSlotFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_jsstorageslot_free(ptr >>> 0, 1));
const JsVaultAssetFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_jsvaultasset_free(ptr >>> 0, 1));
const LibraryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_library_free(ptr >>> 0, 1));
const MerklePathFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_merklepath_free(ptr >>> 0, 1));
const NetworkIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_networkid_free(ptr >>> 0, 1));
const NoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_note_free(ptr >>> 0, 1));
const NoteAndArgsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteandargs_free(ptr >>> 0, 1));
const NoteAndArgsArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteandargsarray_free(ptr >>> 0, 1));
const NoteArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notearray_free(ptr >>> 0, 1));
const NoteAssetsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteassets_free(ptr >>> 0, 1));
const NoteAttachmentFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteattachment_free(ptr >>> 0, 1));
const NoteAttachmentSchemeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteattachmentscheme_free(ptr >>> 0, 1));
const NoteConsumabilityFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteconsumability_free(ptr >>> 0, 1));
const NoteConsumptionStatusFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteconsumptionstatus_free(ptr >>> 0, 1));
const NoteDetailsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notedetails_free(ptr >>> 0, 1));
const NoteDetailsAndTagFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notedetailsandtag_free(ptr >>> 0, 1));
const NoteDetailsAndTagArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notedetailsandtagarray_free(ptr >>> 0, 1));
const NoteExecutionHintFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteexecutionhint_free(ptr >>> 0, 1));
const NoteFileFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notefile_free(ptr >>> 0, 1));
const NoteFilterFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notefilter_free(ptr >>> 0, 1));
const NoteHeaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteheader_free(ptr >>> 0, 1));
const NoteIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteid_free(ptr >>> 0, 1));
const NoteIdAndArgsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteidandargs_free(ptr >>> 0, 1));
const NoteIdAndArgsArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteidandargsarray_free(ptr >>> 0, 1));
const NoteInclusionProofFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteinclusionproof_free(ptr >>> 0, 1));
const NoteLocationFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notelocation_free(ptr >>> 0, 1));
const NoteMetadataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notemetadata_free(ptr >>> 0, 1));
const NoteRecipientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noterecipient_free(ptr >>> 0, 1));
const NoteRecipientArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noterecipientarray_free(ptr >>> 0, 1));
const NoteScriptFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notescript_free(ptr >>> 0, 1));
const NoteStorageFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notestorage_free(ptr >>> 0, 1));
const NoteSyncBlockFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notesyncblock_free(ptr >>> 0, 1));
const NoteSyncInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notesyncinfo_free(ptr >>> 0, 1));
const NoteTagFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notetag_free(ptr >>> 0, 1));
const OutputNoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_outputnote_free(ptr >>> 0, 1));
const OutputNoteArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_outputnotearray_free(ptr >>> 0, 1));
const OutputNoteRecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_outputnoterecord_free(ptr >>> 0, 1));
const OutputNotesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_outputnotes_free(ptr >>> 0, 1));
const PackageFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_package_free(ptr >>> 0, 1));
const PartialNoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_partialnote_free(ptr >>> 0, 1));
const Poseidon2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_poseidon2_free(ptr >>> 0, 1));
const ProcedureThresholdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_procedurethreshold_free(ptr >>> 0, 1));
const ProgramFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_program_free(ptr >>> 0, 1));
const ProvenTransactionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_proventransaction_free(ptr >>> 0, 1));
const PublicKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_publickey_free(ptr >>> 0, 1));
const RpcClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rpcclient_free(ptr >>> 0, 1));
const Rpo256Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rpo256_free(ptr >>> 0, 1));
const SerializedInputNoteDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_serializedinputnotedata_free(ptr >>> 0, 1));
const SerializedOutputNoteDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_serializedoutputnotedata_free(ptr >>> 0, 1));
const SerializedTransactionDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_serializedtransactiondata_free(ptr >>> 0, 1));
const SignatureFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_signature_free(ptr >>> 0, 1));
const SigningInputsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_signinginputs_free(ptr >>> 0, 1));
const SlotAndKeysFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_slotandkeys_free(ptr >>> 0, 1));
const SparseMerklePathFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sparsemerklepath_free(ptr >>> 0, 1));
const StorageMapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_storagemap_free(ptr >>> 0, 1));
const StorageMapEntryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_storagemapentry_free(ptr >>> 0, 1));
const StorageMapInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_storagemapinfo_free(ptr >>> 0, 1));
const StorageMapUpdateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_storagemapupdate_free(ptr >>> 0, 1));
const StorageSlotFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_storageslot_free(ptr >>> 0, 1));
const StorageSlotArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_storageslotarray_free(ptr >>> 0, 1));
const SyncSummaryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_syncsummary_free(ptr >>> 0, 1));
const TestUtilsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_testutils_free(ptr >>> 0, 1));
const TokenSymbolFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tokensymbol_free(ptr >>> 0, 1));
const TransactionArgsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionargs_free(ptr >>> 0, 1));
const TransactionFilterFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionfilter_free(ptr >>> 0, 1));
const TransactionIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionid_free(ptr >>> 0, 1));
const TransactionProverFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionprover_free(ptr >>> 0, 1));
const TransactionRecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionrecord_free(ptr >>> 0, 1));
const TransactionRequestFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionrequest_free(ptr >>> 0, 1));
const TransactionRequestBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionrequestbuilder_free(ptr >>> 0, 1));
const TransactionResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionresult_free(ptr >>> 0, 1));
const TransactionScriptFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionscript_free(ptr >>> 0, 1));
const TransactionScriptInputPairFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionscriptinputpair_free(ptr >>> 0, 1));
const TransactionScriptInputPairArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionscriptinputpairarray_free(ptr >>> 0, 1));
const TransactionStatusFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionstatus_free(ptr >>> 0, 1));
const TransactionStoreUpdateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionstoreupdate_free(ptr >>> 0, 1));
const TransactionSummaryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionsummary_free(ptr >>> 0, 1));
const WebClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_webclient_free(ptr >>> 0, 1));
const WebKeystoreApiFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_webkeystoreapi_free(ptr >>> 0, 1));
const WordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_word_free(ptr >>> 0, 1));
const wbg_rayon_PoolBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wbg_rayon_poolbuilder_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => state.dtor(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigUint64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedBigUint64ArrayMemory0 = null;
function getBigUint64ArrayMemory0() {
    if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
    }
    return cachedBigUint64ArrayMemory0;
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getBigUint64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : undefined);
if (cachedTextDecoder) cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().slice(ptr, ptr + len));
}

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder() : undefined);

if (cachedTextEncoder) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module, thread_stack_size) {
    wasm = instance.exports;
    wasmModule = module;
    cachedBigUint64ArrayMemory0 = null;
    cachedDataViewMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    if (typeof thread_stack_size !== 'undefined' && (typeof thread_stack_size !== 'number' || thread_stack_size === 0 || thread_stack_size % 65536 !== 0)) {
        throw 'invalid stack size';
    }
    wasm.__wbindgen_start(thread_stack_size);
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size;
    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module, memory, thread_stack_size} = module);
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead');
        }
    }

    const imports = __wbg_get_imports(memory);
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module, thread_stack_size);
}

async function __wbg_init(module_or_path, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size;
    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path, memory, thread_stack_size} = module_or_path);
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead');
        }
    }


    const imports = __wbg_get_imports(memory);

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module, thread_stack_size);
}

var index = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Account: Account,
	AccountArray: AccountArray,
	AccountBuilder: AccountBuilder,
	AccountBuilderResult: AccountBuilderResult,
	AccountCode: AccountCode,
	AccountComponent: AccountComponent,
	AccountComponentCode: AccountComponentCode,
	AccountDelta: AccountDelta,
	AccountFile: AccountFile,
	AccountHeader: AccountHeader,
	AccountId: AccountId,
	AccountIdArray: AccountIdArray,
	AccountInterface: AccountInterface,
	AccountProof: AccountProof,
	AccountReader: AccountReader,
	AccountStatus: AccountStatus,
	AccountStorage: AccountStorage,
	AccountStorageDelta: AccountStorageDelta,
	AccountStorageMode: AccountStorageMode,
	AccountStorageRequirements: AccountStorageRequirements,
	AccountType: AccountType,
	AccountVaultDelta: AccountVaultDelta,
	Address: Address,
	AdviceInputs: AdviceInputs,
	AdviceMap: AdviceMap,
	AssetVault: AssetVault,
	AuthFalcon512RpoMultisigConfig: AuthFalcon512RpoMultisigConfig,
	AuthScheme: AuthScheme,
	AuthSecretKey: AuthSecretKey,
	BasicFungibleFaucetComponent: BasicFungibleFaucetComponent,
	BlockHeader: BlockHeader,
	CodeBuilder: CodeBuilder,
	CommittedNote: CommittedNote,
	ConsumableNoteRecord: ConsumableNoteRecord,
	Endpoint: Endpoint,
	ExecutedTransaction: ExecutedTransaction,
	Felt: Felt,
	FeltArray: FeltArray,
	FetchedAccount: FetchedAccount,
	FetchedNote: FetchedNote,
	FlattenedU8Vec: FlattenedU8Vec,
	ForeignAccount: ForeignAccount,
	ForeignAccountArray: ForeignAccountArray,
	FungibleAsset: FungibleAsset,
	FungibleAssetDelta: FungibleAssetDelta,
	FungibleAssetDeltaItem: FungibleAssetDeltaItem,
	GetProceduresResultItem: GetProceduresResultItem,
	InputNote: InputNote,
	InputNoteRecord: InputNoteRecord,
	InputNoteState: InputNoteState,
	InputNotes: InputNotes,
	IntoUnderlyingByteSource: IntoUnderlyingByteSource,
	IntoUnderlyingSink: IntoUnderlyingSink,
	IntoUnderlyingSource: IntoUnderlyingSource,
	JsAccountUpdate: JsAccountUpdate,
	JsStateSyncUpdate: JsStateSyncUpdate,
	JsStorageMapEntry: JsStorageMapEntry,
	JsStorageSlot: JsStorageSlot,
	JsVaultAsset: JsVaultAsset,
	Library: Library,
	MerklePath: MerklePath,
	NetworkId: NetworkId,
	NetworkType: NetworkType,
	Note: Note,
	NoteAndArgs: NoteAndArgs,
	NoteAndArgsArray: NoteAndArgsArray,
	NoteArray: NoteArray,
	NoteAssets: NoteAssets,
	NoteAttachment: NoteAttachment,
	NoteAttachmentKind: NoteAttachmentKind,
	NoteAttachmentScheme: NoteAttachmentScheme,
	NoteConsumability: NoteConsumability,
	NoteConsumptionStatus: NoteConsumptionStatus,
	NoteDetails: NoteDetails,
	NoteDetailsAndTag: NoteDetailsAndTag,
	NoteDetailsAndTagArray: NoteDetailsAndTagArray,
	NoteExecutionHint: NoteExecutionHint,
	NoteExportFormat: NoteExportFormat,
	NoteFile: NoteFile,
	NoteFilter: NoteFilter,
	NoteFilterTypes: NoteFilterTypes,
	NoteHeader: NoteHeader,
	NoteId: NoteId,
	NoteIdAndArgs: NoteIdAndArgs,
	NoteIdAndArgsArray: NoteIdAndArgsArray,
	NoteInclusionProof: NoteInclusionProof,
	NoteLocation: NoteLocation,
	NoteMetadata: NoteMetadata,
	NoteRecipient: NoteRecipient,
	NoteRecipientArray: NoteRecipientArray,
	NoteScript: NoteScript,
	NoteStorage: NoteStorage,
	NoteSyncBlock: NoteSyncBlock,
	NoteSyncInfo: NoteSyncInfo,
	NoteTag: NoteTag,
	NoteType: NoteType,
	OutputNote: OutputNote,
	OutputNoteArray: OutputNoteArray,
	OutputNoteRecord: OutputNoteRecord,
	OutputNoteState: OutputNoteState,
	OutputNotes: OutputNotes,
	Package: Package,
	PartialNote: PartialNote,
	Poseidon2: Poseidon2,
	ProcedureThreshold: ProcedureThreshold,
	Program: Program,
	ProvenTransaction: ProvenTransaction,
	PublicKey: PublicKey,
	RpcClient: RpcClient,
	Rpo256: Rpo256,
	SerializedInputNoteData: SerializedInputNoteData,
	SerializedOutputNoteData: SerializedOutputNoteData,
	SerializedTransactionData: SerializedTransactionData,
	Signature: Signature,
	SigningInputs: SigningInputs,
	SigningInputsType: SigningInputsType,
	SlotAndKeys: SlotAndKeys,
	SparseMerklePath: SparseMerklePath,
	StorageMap: StorageMap,
	StorageMapEntry: StorageMapEntry,
	StorageMapInfo: StorageMapInfo,
	StorageMapUpdate: StorageMapUpdate,
	StorageSlot: StorageSlot,
	StorageSlotArray: StorageSlotArray,
	SyncSummary: SyncSummary,
	TestUtils: TestUtils,
	TokenSymbol: TokenSymbol,
	TransactionArgs: TransactionArgs,
	TransactionFilter: TransactionFilter,
	TransactionId: TransactionId,
	TransactionProver: TransactionProver,
	TransactionRecord: TransactionRecord,
	TransactionRequest: TransactionRequest,
	TransactionRequestBuilder: TransactionRequestBuilder,
	TransactionResult: TransactionResult,
	TransactionScript: TransactionScript,
	TransactionScriptInputPair: TransactionScriptInputPair,
	TransactionScriptInputPairArray: TransactionScriptInputPairArray,
	TransactionStatus: TransactionStatus,
	TransactionStoreUpdate: TransactionStoreUpdate,
	TransactionSummary: TransactionSummary,
	WebClient: WebClient,
	WebKeystoreApi: WebKeystoreApi,
	Word: Word,
	createAuthFalcon512RpoMultisig: createAuthFalcon512RpoMultisig,
	default: __wbg_init,
	exportStore: exportStore2,
	importStore: importStore,
	initSync: initSync,
	initThreadPool: initThreadPool,
	parallelSumBench: parallelSumBench,
	rayonThreadCount: rayonThreadCount,
	sequentialSumBench: sequentialSumBench,
	setupLogging: setupLogging,
	wbg_rayon_PoolBuilder: wbg_rayon_PoolBuilder,
	wbg_rayon_start_worker: wbg_rayon_start_worker
});

const module$1 = new URL("assets/miden_client_web.wasm", import.meta.url);

export { Account, AccountArray, AccountBuilder, AccountBuilderResult, AccountCode, AccountComponent, AccountComponentCode, AccountDelta, AccountFile, AccountHeader, AccountId, AccountIdArray, AccountInterface, AccountProof, AccountReader, AccountStatus, AccountStorage, AccountStorageDelta, AccountStorageMode, AccountStorageRequirements, AccountType, AccountVaultDelta, Address, AdviceInputs, AdviceMap, AssetVault, AuthFalcon512RpoMultisigConfig, AuthScheme, AuthSecretKey, BasicFungibleFaucetComponent, BlockHeader, CodeBuilder, CommittedNote, ConsumableNoteRecord, Endpoint, ExecutedTransaction, Felt, FeltArray, FetchedAccount, FetchedNote, FlattenedU8Vec, ForeignAccount, ForeignAccountArray, FungibleAsset, FungibleAssetDelta, FungibleAssetDeltaItem, GetProceduresResultItem, InputNote, InputNoteRecord, InputNoteState, InputNotes, IntoUnderlyingByteSource, IntoUnderlyingSink, IntoUnderlyingSource, JsAccountUpdate, JsStateSyncUpdate, JsStorageMapEntry, JsStorageSlot, JsVaultAsset, Library, MerklePath, NetworkId, NetworkType, Note, NoteAndArgs, NoteAndArgsArray, NoteArray, NoteAssets, NoteAttachment, NoteAttachmentKind, NoteAttachmentScheme, NoteConsumability, NoteConsumptionStatus, NoteDetails, NoteDetailsAndTag, NoteDetailsAndTagArray, NoteExecutionHint, NoteExportFormat, NoteFile, NoteFilter, NoteFilterTypes, NoteHeader, NoteId, NoteIdAndArgs, NoteIdAndArgsArray, NoteInclusionProof, NoteLocation, NoteMetadata, NoteRecipient, NoteRecipientArray, NoteScript, NoteStorage, NoteSyncBlock, NoteSyncInfo, NoteTag, NoteType, OutputNote, OutputNoteArray, OutputNoteRecord, OutputNoteState, OutputNotes, Package, PartialNote, Poseidon2, ProcedureThreshold, Program, ProvenTransaction, PublicKey, RpcClient, Rpo256, SerializedInputNoteData, SerializedOutputNoteData, SerializedTransactionData, Signature, SigningInputs, SigningInputsType, SlotAndKeys, SparseMerklePath, StorageMap, StorageMapEntry, StorageMapInfo, StorageMapUpdate, StorageSlot, StorageSlotArray, SyncSummary, TestUtils, TokenSymbol, TransactionArgs, TransactionFilter, TransactionId, TransactionProver, TransactionRecord, TransactionRequest, TransactionRequestBuilder, TransactionResult, TransactionScript, TransactionScriptInputPair, TransactionScriptInputPairArray, TransactionStatus, TransactionStoreUpdate, TransactionSummary, WebClient, WebKeystoreApi, Word, module$1 as __wasm_url, __wbg_init, createAuthFalcon512RpoMultisig, exportStore2 as exportStore, importStore, initSync, initThreadPool, parallelSumBench, rayonThreadCount, sequentialSumBench, setupLogging, wbg_rayon_PoolBuilder, wbg_rayon_start_worker };
//# sourceMappingURL=Cargo-BNYOxQSv-DXrW_YAS.js.map
