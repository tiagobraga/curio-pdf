/**
 * polyfills.js - Polyfills essenciais para compatibilidade total com o QtWebEngine no Ubuntu Touch
 */
(function() {
  // 1. Polyfill para .at() em Array, String e TypedArrays (ES2022)
  function at(n) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  }

  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, 'at', {
      value: at,
      writable: true,
      enumerable: false,
      configurable: true
    });
  }

  if (!String.prototype.at) {
    Object.defineProperty(String.prototype, 'at', {
      value: at,
      writable: true,
      enumerable: false,
      configurable: true
    });
  }

  var typedArrays = [
    typeof Int8Array !== 'undefined' ? Int8Array : null,
    typeof Uint8Array !== 'undefined' ? Uint8Array : null,
    typeof Uint8ClampedArray !== 'undefined' ? Uint8ClampedArray : null,
    typeof Int16Array !== 'undefined' ? Int16Array : null,
    typeof Uint16Array !== 'undefined' ? Uint16Array : null,
    typeof Int32Array !== 'undefined' ? Int32Array : null,
    typeof Uint32Array !== 'undefined' ? Uint32Array : null,
    typeof Float32Array !== 'undefined' ? Float32Array : null,
    typeof Float64Array !== 'undefined' ? Float64Array : null
  ];

  typedArrays.forEach(function(TA) {
    if (TA && !TA.prototype.at) {
      Object.defineProperty(TA.prototype, 'at', {
        value: at,
        writable: true,
        enumerable: false,
        configurable: true
      });
    }
  });

  // 2. Polyfill para Object.hasOwn (ES2022)
  if (!Object.hasOwn) {
    Object.defineProperty(Object, 'hasOwn', {
      value: function(object, property) {
        if (object == null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }
        return Object.prototype.hasOwnProperty.call(Object(object), property);
      },
      writable: true,
      enumerable: false,
      configurable: true
    });
  }

  // 3. Polyfill completo para structuredClone (HTML Spec / ES2022)
  if (typeof globalThis.structuredClone !== 'function') {
    function deepClone(val, hash) {
      hash = hash || new WeakMap();

      if (Object(val) !== val) return val; // primitivos e funções
      if (val instanceof Date) return new Date(val.getTime());
      if (val instanceof RegExp) return new RegExp(val.source, val.flags);
      if (val instanceof Error) return new val.constructor(val.message);

      // Suporte a ImageData nativo (essencial para renderização do PDF.js no Chromium)
      if (typeof ImageData !== 'undefined' && val instanceof ImageData) {
        try {
          return new ImageData(new Uint8ClampedArray(val.data), val.width, val.height);
        } catch (e) {
          return val;
        }
      }

      // Suporte a Blob
      if (typeof Blob !== 'undefined' && val instanceof Blob) {
        return val.slice();
      }

      // TypedArrays e ArrayBuffer
      if (val instanceof ArrayBuffer) {
        return val.slice(0);
      }
      if (ArrayBuffer.isView(val)) {
        if (val instanceof DataView) {
          return new DataView(val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength));
        }
        return new val.constructor(val.buffer.slice(val.byteOffset, val.byteOffset + (val.length * val.BYTES_PER_ELEMENT)));
      }

      // Evitar ciclos de referência
      if (hash.has(val)) return hash.get(val);

      if (val instanceof Map) {
        var copyMap = new Map();
        hash.set(val, copyMap);
        val.forEach(function(v, k) {
          copyMap.set(deepClone(k, hash), deepClone(v, hash));
        });
        return copyMap;
      }

      if (val instanceof Set) {
        var copySet = new Set();
        hash.set(val, copySet);
        val.forEach(function(v) {
          copySet.add(deepClone(v, hash));
        });
        return copySet;
      }

      if (Array.isArray(val)) {
        var copyArr = [];
        hash.set(val, copyArr);
        for (var i = 0; i < val.length; i++) {
          copyArr[i] = deepClone(val[i], hash);
        }
        return copyArr;
      }

      // Se for um objeto com construtor personalizado ou do DOM que não seja plain Object,
      // não criar cópia vazia com Object.create para evitar perder propriedades C++ internas (Illegal invocation)
      var proto = Object.getPrototypeOf(val);
      if (proto !== Object.prototype && proto !== null) {
        // Objeto nativo especializado: retorna a própria referência ou cópia superficial
        return val;
      }

      var copyObj = Object.create(proto);
      hash.set(val, copyObj);
      var keys = Object.keys(val);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        copyObj[key] = deepClone(val[key], hash);
      }
      return copyObj;
    }

    Object.defineProperty(globalThis, 'structuredClone', {
      value: function(value) {
        return deepClone(value);
      },
      writable: true,
      enumerable: false,
      configurable: true
    });
  }

  console.log('[Curió-PDF Polyfills] Polyfills essenciais (at, hasOwn, structuredClone) instalados com sucesso.');
})();
