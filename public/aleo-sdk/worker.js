function spawnWorker(url, module, memory, address) {
        return new Promise((resolve) => {
            const worker = new Worker(url, {
                type: "module",
            });

            worker.addEventListener("message", (event) => {
                // This is needed in Node to wait one extra tick, so that way
                // the Worker can fully initialize before we return.
                setTimeout(() => {
                    resolve(worker);

                    // When running in Node, this allows the process to exit
                    // even though the Worker is still running.
                    if (worker.unref) {
                        worker.unref();
                    }
                }, 0);
            }, {
                capture: true,
                once: true,
            });

            worker.postMessage({
                module,
                memory,
                address,
            });
        });
    }

let wasm;

let heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

function isLikeNone(x) {
    return x === undefined || x === null;
}

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

let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
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

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
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

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export3(addHeapObject(e));
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => state.dtor(state.a, state.b));

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

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
 * @param {number} receiver
 */
function runRayonThread(receiver) {
    wasm.runRayonThread(receiver);
}

/**
 * @param {URL} url
 * @param {number} num_threads
 * @returns {Promise<void>}
 */
function initThreadPool(url, num_threads) {
    const ret = wasm.initThreadPool(addHeapObject(url), num_threads);
    return takeObject(ret);
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}
/**
 * Verify an execution. Executions with multiple transitions must have the program source code and
 * verifying keys of imported functions supplied from outside to correctly verify. Also, this does
 * not verify that the state root of the execution is included in the Aleo Network ledger.
 *
 * @param {Execution} execution The function execution to verify
 * @param {VerifyingKey} verifying_key The verifying key for the function
 * @param {Program} program The program that the function execution belongs to
 * @param {String} function_id The name of the function that was executed
 * @param {Object} imports The imports for the program in the form of { "program_id.aleo":"source code", ... }
 * @param {Object} import_verifying_keys The verifying keys for the imports in the form of { "program_id.aleo": [["function, "verifying_key"], ...],  ...}
 * @returns {boolean} True if the execution is valid, false otherwise
 * @param {Execution} execution
 * @param {VerifyingKey} verifying_key
 * @param {Program} program
 * @param {string} function_id
 * @param {object | null | undefined} imports
 * @param {object | null | undefined} imported_verifying_keys
 * @param {number} block_height
 * @returns {boolean}
 */
function verifyFunctionExecution(execution, verifying_key, program, function_id, imports, imported_verifying_keys, block_height) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        _assertClass(execution, Execution);
        _assertClass(verifying_key, VerifyingKey);
        _assertClass(program, Program);
        const ptr0 = passStringToWasm0(function_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.verifyFunctionExecution(retptr, execution.__wbg_ptr, verifying_key.__wbg_ptr, program.__wbg_ptr, ptr0, len0, isLikeNone(imports) ? 0 : addHeapObject(imports), isLikeNone(imported_verifying_keys) ? 0 : addHeapObject(imported_verifying_keys), block_height);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return r0 !== 0;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Verify a SNARK proof against a verifying key and public inputs.
 *
 * This function verifies a proof produced by an Aleo program that may not be deployed on chain.
 * It directly invokes the Varuna proof verification from snarkVM.
 *
 * @param {VerifyingKey} verifying_key The verifying key for the circuit
 * @param {Array<string>} inputs Array of field element strings representing public inputs (e.g. ["1field", "2field"])
 * @param {Proof} proof The proof to verify
 * @returns {boolean} True if the proof is valid, false otherwise
 * @param {VerifyingKey} verifying_key
 * @param {Array<any>} inputs
 * @param {Proof} proof
 * @returns {boolean}
 */
function snarkVerify(verifying_key, inputs, proof) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        _assertClass(verifying_key, VerifyingKey);
        _assertClass(proof, Proof);
        wasm.snarkVerify(retptr, verifying_key.__wbg_ptr, addHeapObject(inputs), proof.__wbg_ptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return r0 !== 0;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Verify a batch SNARK proof against multiple verifying keys and their corresponding public inputs.
 *
 * This function verifies a batch proof produced by Aleo programs that may not be deployed on chain.
 * Each verifying key is paired with one or more sets of public inputs (instances).
 *
 * @param {Array<string>} verifying_keys Array of verifying key strings, one per circuit
 * @param {Array<Array<Array<string>>>} inputs 3D array of field element strings [circuit_idx][instance_idx][field_idx]
 * @param {Proof} proof The batch proof to verify
 * @returns {boolean} True if the batch proof is valid, false otherwise
 * @param {Array<any>} verifying_keys
 * @param {Array<any>} inputs
 * @param {Proof} proof
 * @returns {boolean}
 */
function snarkVerifyBatch(verifying_keys, inputs, proof) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        _assertClass(proof, Proof);
        wasm.snarkVerifyBatch(retptr, addHeapObject(verifying_keys), addHeapObject(inputs), proof.__wbg_ptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return r0 !== 0;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @param {string} string
 * @returns {Field}
 */
function stringToField(string) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(string, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.stringToField(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return Field.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Set test consensus version heights for testing.
 *
 * @param {string | undefined} heights The block heights at which each consensus version applies. This input should be a simple csv list of block heights and there should be one number for each consensus version. If left undefined, the default test heights will be applied.
 *
 * @example
 * import { getOrInitConsensusVersionTestHeights } from '@provablehq/sdk';
 *
 * Set the consensus version heights.
 * getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12,13");
 * @param {string | null} [heights]
 * @returns {Array<any>}
 */
function getOrInitConsensusVersionTestHeights(heights) {
    var ptr0 = isLikeNone(heights) ? 0 : passStringToWasm0(heights, wasm.__wbindgen_export, wasm.__wbindgen_export2);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.getOrInitConsensusVersionTestHeights(ptr0, len0);
    return takeObject(ret);
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    const mem = getDataViewMemory0();
    for (let i = 0; i < array.length; i++) {
        mem.setUint32(ptr + 4 * i, addHeapObject(array[i]), true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(takeObject(mem.getUint32(i, true)));
    }
    return result;
}
function __wasm_bindgen_func_elem_7201(arg0, arg1) {
    wasm.__wasm_bindgen_func_elem_7201(arg0, arg1);
}

function __wasm_bindgen_func_elem_8569(arg0, arg1, arg2) {
    wasm.__wasm_bindgen_func_elem_8569(arg0, arg1, addHeapObject(arg2));
}

function __wasm_bindgen_func_elem_7473(arg0, arg1, arg2, arg3) {
    wasm.__wasm_bindgen_func_elem_7473(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

const AddressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_address_free(ptr >>> 0, 1));
/**
 * Public address of an Aleo account
 */
class Address {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Address.prototype);
        obj.__wbg_ptr = ptr;
        AddressFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
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
     * Get an address object from a group.
     *
     * @param {Group} group The group object.
     *
     * @returns {Address} The address object.
     * @param {Group} group
     * @returns {Address}
     */
    static fromGroup(group) {
        _assertClass(group, Group);
        var ptr0 = group.__destroy_into_raw();
        const ret = wasm.address_fromGroup(ptr0);
        return Address.__wrap(ret);
    }
    /**
     * Get the left endian boolean array representation of the bits of the address.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.address_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get an address object from an array of fields.
     *
     * @param {Array} fields An array of fields.
     *
     * @returns {Plaintext} The address object.
     * @param {Array<any>} fields
     * @returns {Address}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create an aleo address object from a string representation of an address.
     * The input is automatically lowercased before parsing.
     *
     * @param {string} address String representation of an address
     * @returns {Address} Address
     * @param {string} address
     * @returns {Address}
     */
    static from_string(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.address_from_string(ptr0, len0);
        return Address.__wrap(ret);
    }
    /**
     * Get the left endian byte array representation of the address.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the address to an I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        const ret = wasm.address_toI8Lossy(this.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Cast the address to a U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        const ret = wasm.address_toI8Lossy(this.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Get an address from a series of bits represented as a boolean array.
     *
     * @param {Array} bits A left endian boolean array representing the bits of the address.
     *
     * @returns {Address} The address object.
     * @param {Array<any>} bits
     * @returns {Address}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_fromBitsLe(retptr, addHeapObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the address to an I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        const ret = wasm.address_toI16Lossy(this.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Cast the address to an I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        const ret = wasm.address_toI32Lossy(this.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Cast the address to an I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        const ret = wasm.address_toI64Lossy(this.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Get the plaintext representation of the address.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.address_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Get a string representation of an Aleo address object
     *
     * @returns {string} String representation of the address
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Cast the address to a U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        const ret = wasm.address_toI16Lossy(this.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Cast the address to a U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        const ret = wasm.address_toI32Lossy(this.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Cast the address to a U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        const ret = wasm.address_toI64Lossy(this.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Get an address from a series of bytes.
     *
     * @param {Uint8Array} bytes A left endian byte array representing the address.
     *
     * @returns {Address} The address object.
     * @param {Uint8Array} bytes
     * @returns {Address}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Derive an Aleo address from a view key
     *
     * @param {ViewKey} view_key The view key to derive the address from
     * @returns {Address} Address corresponding to the view key
     * @param {ViewKey} view_key
     * @returns {Address}
     */
    static from_view_key(view_key) {
        _assertClass(view_key, ViewKey);
        const ret = wasm.address_from_view_key(view_key.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Cast the address to an I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        const ret = wasm.address_toI128Lossy(this.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Cast the address to a U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        const ret = wasm.address_toI128Lossy(this.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Get the address of a program based on the program ID.
     *
     * @param {string} program_id The program ID string.
     * @returns {Address} The address corresponding to the program ID.
     * @param {string} program_id
     * @returns {Address}
     */
    static fromProgramId(program_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.address_fromProgramId(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the address to a Scalar with lossy truncation (via x-coordinate).
     * @returns {Scalar}
     */
    toScalarLossy() {
        const ret = wasm.address_toScalarLossy(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Derive an Aleo address from a compute key.
     *
     * @param {ComputeKey} compute_key The compute key to derive the address from
     * @param {ComputeKey} compute_key
     * @returns {Address}
     */
    static from_compute_key(compute_key) {
        _assertClass(compute_key, ComputeKey);
        const ret = wasm.address_from_compute_key(compute_key.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Derive an Aleo address from a private key
     *
     * @param {PrivateKey} private_key The private key to derive the address from
     * @returns {Address} Address corresponding to the private key
     * @param {PrivateKey} private_key
     * @returns {Address}
     */
    static from_private_key(private_key) {
        _assertClass(private_key, PrivateKey);
        const ret = wasm.address_from_private_key(private_key.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Cast the address to a Boolean with lossy truncation (LSB of x-coordinate).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.address_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Verify a signature for a message signed by the address
     *
     * @param {Uint8Array} Byte array representing a message signed by the address
     * @returns {boolean} Boolean representing whether or not the signature is valid
     * @param {Uint8Array} message
     * @param {Signature} signature
     * @returns {boolean}
     */
    verify(message, signature) {
        const ptr0 = passArray8ToWasm0(message, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(signature, Signature);
        const ret = wasm.address_verify(this.__wbg_ptr, ptr0, len0, signature.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Check if the input is a valid Aleo address.
     * String addresses are automatically lowercased before validation.
     *
     * @param {string | Uint8Array} address - Either a string representation of an address
     *        or a Uint8Array of bytes in little-endian format.
     * @returns {boolean} True if the input is a valid address, false otherwise.
     * @param {any} address
     * @returns {boolean}
     */
    static isValid(address) {
        const ret = wasm.address_isValid(addHeapObject(address));
        return ret !== 0;
    }
    /**
     * Cast the address to a Field element (x-coordinate of the underlying group point).
     * @returns {Field}
     */
    toField() {
        const ret = wasm.address_toField(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Get the group representation of the address object.
     * @returns {Group}
     */
    toGroup() {
        const ret = wasm.address_toGroup(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Get the field array representation of the address.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a string representation of an Aleo address object
     *
     * @param {Address} Address
     * @returns {string} String representation of the address
     * @returns {string}
     */
    to_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Address.prototype[Symbol.dispose] = Address.prototype.free;

const AuthorizationFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_authorization_free(ptr >>> 0, 1));
/**
 * Authorization object containing the authorization for a transaction.
 */
class Authorization {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Authorization.prototype);
        obj.__wbg_ptr = ptr;
        AuthorizationFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AuthorizationFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_authorization_free(ptr, 0);
    }
    /**
     * Reconstructs an Authorization object from its string representation.
     *
     * @param {String} authorization The string representation of the Authorization.
     * @param {string} authorization
     * @returns {Authorization}
     */
    static fromString(authorization) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(authorization, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.authorization_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Authorization.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the left-endian byte representation of the Authorization.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.authorization_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the transitions in an Authorization.
     *
     * @returns {Array<Transition>} Array of transition objects
     * @returns {Array<any>}
     */
    transitions() {
        const ret = wasm.authorization_transitions(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Creates an authorization object from a left-endian byte representation of an Authorization.
     *
     * @param {Uint8Array} bytes Left-endian bytes representing the Authorization.
     * @param {Uint8Array} bytes
     * @returns {Authorization}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.authorization_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Authorization.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the function name.
     *
     * @returns {string} The function name.
     * @returns {string}
     */
    functionName() {
        let deferred2_0;
        let deferred2_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.authorization_functionName(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr1 = r0;
            var len1 = r1;
            if (r3) {
                ptr1 = 0; len1 = 0;
                throw takeObject(r2);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Returns `true` if the Authorization is for `credits.aleo/fee_public`.
     * @returns {boolean}
     */
    isFeePublic() {
        const ret = wasm.authorization_isFeePublic(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns `true` if the Authorization is for `credits.aleo/fee_private`.
     * @returns {boolean}
     */
    isFeePrivate() {
        const ret = wasm.authorization_isFeePrivate(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the execution ID for the Authorization.
     *
     * @returns {Field} The execution ID for the Authorization, call toString() after this result to get the string representation.
     * @returns {Field}
     */
    toExecutionId() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.authorization_toExecutionId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Insert a transition into the Authorization.
     *
     * @param {Transition} transition The transition object to insert into the Authorization.
     * @param {Transition} transition
     */
    insertTransition(transition) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(transition, Transition);
            var ptr0 = transition.__destroy_into_raw();
            wasm.authorization_insertTransition(retptr, this.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the number of `Request`s in the Authorization.
     * @returns {number}
     */
    len() {
        const ret = wasm.authorization_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Create a new authorization from a request object.
     *
     * @param {ExecutionRequest} request The ExecutionRequest to build the authorization from.
     * @param {ExecutionRequest} request
     * @returns {Authorization}
     */
    static new(request) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(request, ExecutionRequest);
            var ptr0 = request.__destroy_into_raw();
            wasm.authorization_new(retptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Authorization.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if an Authorization object is the same as another.
     *
     * @param {Authorization} other The Authorization object to determine equality with.
     * @param {Authorization} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, Authorization);
        const ret = wasm.authorization_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Return `true` if the Authorization is empty.
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.authorization_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns `true` if the Authorization is for `credits.aleo/split`.
     * @returns {boolean}
     */
    isSplit() {
        const ret = wasm.authorization_isSplit(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns a new and independent replica of the Authorization.
     * @returns {Authorization}
     */
    replicate() {
        const ret = wasm.authorization_replicate(this.__wbg_ptr);
        return Authorization.__wrap(ret);
    }
    /**
     * Returns the string representation of the Authorization.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.authorization_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Authorization.prototype[Symbol.dispose] = Authorization.prototype.free;

const BHP1024Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bhp1024_free(ptr >>> 0, 1));

class BHP1024 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BHP1024.prototype);
        obj.__wbg_ptr = ptr;
        BHP1024Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BHP1024Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bhp1024_free(ptr, 0);
    }
    /**
     * Returns a BHP hash with an input hasher of 1024 bits.
     * @param {Array<any>} input
     * @returns {Group}
     */
    hashToGroup(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bhp1024_hashToGroup(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns a BHP commitment with an input hasher of 1024 bits and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Group}
     */
    commitToGroup(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.bhp1024_commitToGroup(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a BHP hasher with an input size of 1024 bits.
     */
    constructor() {
        const ret = wasm.bhp1024_new();
        this.__wbg_ptr = ret >>> 0;
        BHP1024Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the BHP hash with an input hasher of 1024 bits.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bhp1024_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a BHP hasher with an input size of 1024 bits with a custom domain separator.
     * @param {string} domain_separator
     * @returns {BHP1024}
     */
    static setup(domain_separator) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.bhp1024_setup(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return BHP1024.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns a BHP commitment with an input hasher of 1024 bits and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Field}
     */
    commit(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.bhp1024_commit(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) BHP1024.prototype[Symbol.dispose] = BHP1024.prototype.free;

const BHP256Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bhp256_free(ptr >>> 0, 1));

class BHP256 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BHP256.prototype);
        obj.__wbg_ptr = ptr;
        BHP256Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BHP256Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bhp256_free(ptr, 0);
    }
    /**
     * Returns a BHP hash with an input hasher of 256 bits.
     * @param {Array<any>} input
     * @returns {Group}
     */
    hashToGroup(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bhp256_hashToGroup(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns a BHP commitment with an input hasher of 256 bits and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Group}
     */
    commitToGroup(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.bhp256_commitToGroup(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a BHP hasher with an input size of 256 bits.
     */
    constructor() {
        const ret = wasm.bhp256_new();
        this.__wbg_ptr = ret >>> 0;
        BHP256Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the BHP hash with an input hasher of 256 bits.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bhp256_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a BHP hasher with an input size of 256 bits with a custom domain separator.
     * @param {string} domain_separator
     * @returns {BHP256}
     */
    static setup(domain_separator) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.bhp256_setup(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return BHP256.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns a BHP commitment with an input hasher of 256 bits and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Field}
     */
    commit(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.bhp256_commit(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) BHP256.prototype[Symbol.dispose] = BHP256.prototype.free;

const BHP512Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bhp512_free(ptr >>> 0, 1));

class BHP512 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BHP512.prototype);
        obj.__wbg_ptr = ptr;
        BHP512Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BHP512Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bhp512_free(ptr, 0);
    }
    /**
     * Returns a BHP hash with an input hasher of 512 bits.
     * @param {Array<any>} input
     * @returns {Group}
     */
    hashToGroup(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bhp512_hashToGroup(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns a BHP commitment with an input hasher of 512 bits and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Group}
     */
    commitToGroup(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.bhp512_commitToGroup(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a BHP hasher with an input size of 512 bits.
     */
    constructor() {
        const ret = wasm.bhp512_new();
        this.__wbg_ptr = ret >>> 0;
        BHP512Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the BHP hash with an input hasher of 512 bits.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bhp512_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a BHP hasher with an input size of 512 bits with a custom domain separator.
     * @param {string} domain_separator
     * @returns {BHP512}
     */
    static setup(domain_separator) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.bhp512_setup(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return BHP512.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns a BHP commitment with an input hasher of 512 bits and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Field}
     */
    commit(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.bhp512_commit(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) BHP512.prototype[Symbol.dispose] = BHP512.prototype.free;

const BHP768Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bhp768_free(ptr >>> 0, 1));

class BHP768 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BHP768.prototype);
        obj.__wbg_ptr = ptr;
        BHP768Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BHP768Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bhp768_free(ptr, 0);
    }
    /**
     * Returns a BHP hash with an input hasher of 768 bits.
     * @param {Array<any>} input
     * @returns {Group}
     */
    hashToGroup(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bhp768_hashToGroup(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns a BHP commitment with an input hasher of 768 bits and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Group}
     */
    commitToGroup(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.bhp768_commitToGroup(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a BHP hasher with an input size of 768 bits.
     */
    constructor() {
        const ret = wasm.bhp768_new();
        this.__wbg_ptr = ret >>> 0;
        BHP768Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the BHP hash with an input hasher of 768 bits.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bhp768_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a BHP hasher with an input size of 768 bits with a custom domain separator.
     * @param {string} domain_separator
     * @returns {BHP768}
     */
    static setup(domain_separator) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.bhp768_setup(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return BHP768.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns a BHP commitment with an input hasher of 768 bits and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Field}
     */
    commit(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.bhp768_commit(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) BHP768.prototype[Symbol.dispose] = BHP768.prototype.free;

const BooleanFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_boolean_free(ptr >>> 0, 1));
/**
 * Boolean element.
 */
class Boolean {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Boolean.prototype);
        obj.__wbg_ptr = ptr;
        BooleanFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BooleanFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_boolean_free(ptr, 0);
    }
    /**
     * Cast the boolean to an Address (strict, via Group). Returns an error if conversion fails.
     * @returns {Address}
     */
    toAddress() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_toAddress(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the left endian boolean array representation of the boolean element.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.boolean_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Creates a boolean object from a string representation ("true"/"false").
     * @param {string} boolean
     * @returns {Boolean}
     */
    static fromString(boolean) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(boolean, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.boolean_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Boolean.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encode the boolean element as a Uint8Array of left endian bytes.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reconstruct a boolean element from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {Boolean}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Boolean.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Create a plaintext from the boolean element.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.boolean_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Create a boolean element from a Uint8Array of left endian bytes.
     * @param {Uint8Array} bytes
     * @returns {Boolean}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Boolean.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast the boolean to a Group element (lossy, via Field with Elligator-2 fallback).
     * This conversion never fails.
     * @returns {Group}
     */
    toGroupLossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_toGroupLossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the boolean to an Address (lossy, via Group with Elligator-2 fallback).
     * @returns {Address}
     */
    toAddressLossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_toAddressLossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Logical OR.
     * @param {Boolean} other
     * @returns {Boolean}
     */
    or(other) {
        _assertClass(other, Boolean);
        const ret = wasm.boolean_or(this.__wbg_ptr, other.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Logical AND.
     * @param {Boolean} other
     * @returns {Boolean}
     */
    and(other) {
        _assertClass(other, Boolean);
        const ret = wasm.boolean_and(this.__wbg_ptr, other.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Creates a Boolean from a native JS bool.
     * @param {boolean} value
     */
    constructor(value) {
        const ret = wasm.boolean_new(value);
        this.__wbg_ptr = ret >>> 0;
        BooleanFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Logical NOR.
     * @param {Boolean} other
     * @returns {Boolean}
     */
    nor(other) {
        _assertClass(other, Boolean);
        const ret = wasm.boolean_nor(this.__wbg_ptr, other.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Logical NOT.
     * @returns {Boolean}
     */
    not() {
        const ret = wasm.boolean_not(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Logical XOR.
     * @param {Boolean} other
     * @returns {Boolean}
     */
    xor(other) {
        _assertClass(other, Boolean);
        const ret = wasm.boolean_xor(this.__wbg_ptr, other.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Logical NAND.
     * @param {Boolean} other
     * @returns {Boolean}
     */
    nand(other) {
        _assertClass(other, Boolean);
        const ret = wasm.boolean_nand(this.__wbg_ptr, other.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Clone the boolean element.
     * @returns {Boolean}
     */
    clone() {
        const ret = wasm.boolean_clone(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Cast the boolean to an I8 (false=0, true=1).
     * @returns {I8}
     */
    toI8() {
        const ret = wasm.boolean_clone(this.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Cast the boolean to a U8 (false=0, true=1).
     * @returns {U8}
     */
    toU8() {
        const ret = wasm.boolean_clone(this.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Check if one boolean element equals another.
     * @param {Boolean} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, Boolean);
        const ret = wasm.boolean_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Generate a random boolean element.
     * @returns {Boolean}
     */
    static random() {
        const ret = wasm.boolean_random();
        return Boolean.__wrap(ret);
    }
    /**
     * Cast the boolean to an I16 (false=0, true=1).
     * @returns {I16}
     */
    toI16() {
        const ret = wasm.boolean_toI16(this.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Cast the boolean to an I32 (false=0, true=1).
     * @returns {I32}
     */
    toI32() {
        const ret = wasm.boolean_toI32(this.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Cast the boolean to an I64 (false=0, true=1).
     * @returns {I64}
     */
    toI64() {
        const ret = wasm.boolean_toI64(this.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Cast the boolean to a U16 (false=0, true=1).
     * @returns {U16}
     */
    toU16() {
        const ret = wasm.boolean_toI16(this.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Cast the boolean to a U32 (false=0, true=1).
     * @returns {U32}
     */
    toU32() {
        const ret = wasm.boolean_toI32(this.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Cast the boolean to a U64 (false=0, true=1).
     * @returns {U64}
     */
    toU64() {
        const ret = wasm.boolean_toI64(this.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Cast the boolean to an I128 (false=0, true=1).
     * @returns {I128}
     */
    toI128() {
        const ret = wasm.boolean_toI128(this.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Cast the boolean to a U128 (false=0, true=1).
     * @returns {U128}
     */
    toU128() {
        const ret = wasm.boolean_toI128(this.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Cast the boolean to a Field element (false=0, true=1). Lossless.
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the boolean to a Group element (strict, via Field x-coordinate recovery).
     * Returns an error if the resulting field is not a valid x-coordinate.
     * @returns {Group}
     */
    toGroup() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_toGroup(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the boolean to a Scalar element (false=0, true=1). Lossless.
     * @returns {Scalar}
     */
    toScalar() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_toScalar(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Scalar.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the string representation of the boolean element.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.boolean_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Boolean.prototype[Symbol.dispose] = Boolean.prototype.free;

const CallbackQueryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_callbackquery_free(ptr >>> 0, 1));
/**
 * A query implementation that delegates state fetching to JS callback functions.
 *
 * Instead of making direct HTTP calls via reqwest, each QueryTrait method
 * calls a JS function that returns a Promise. The JS side handles the actual
 * network request through the configured transport.
 */
class CallbackQuery {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CallbackQueryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_callbackquery_free(ptr, 0);
    }
    /**
     * Create a new CallbackQuery with JS callback functions.
     *
     * @param {Function} get_state_root A function that returns Promise<string> (the state root)
     * @param {Function} get_state_paths A function that takes string[] (commitments) and returns Promise<string[]> (state paths)
     * @param {Function} get_block_height A function that returns Promise<number> (the block height)
     * @param {Function} get_state_root
     * @param {Function} get_state_paths
     * @param {Function} get_block_height
     */
    constructor(get_state_root, get_state_paths, get_block_height) {
        const ret = wasm.callbackquery_new(addHeapObject(get_state_root), addHeapObject(get_state_paths), addHeapObject(get_block_height));
        this.__wbg_ptr = ret >>> 0;
        CallbackQueryFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) CallbackQuery.prototype[Symbol.dispose] = CallbackQuery.prototype.free;

const CiphertextFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ciphertext_free(ptr >>> 0, 1));
/**
 * SnarkVM Ciphertext object. A Ciphertext represents an symmetrically encrypted plaintext. This
 * object provides decryption methods to recover the plaintext from the ciphertext (given the
 * api consumer has the proper decryption materials).
 */
class Ciphertext {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Ciphertext.prototype);
        obj.__wbg_ptr = ptr;
        CiphertextFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CiphertextFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ciphertext_free(ptr, 0);
    }
    /**
     * Get the left endian boolean array representation of the bits of the ciphertext.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.ciphertext_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get a ciphertext object from an array of fields.
     *
     * @param {Array} fields An array of fields.
     *
     * @returns {Ciphertext} The ciphertext object.
     * @param {Array<any>} fields
     * @returns {Ciphertext}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ciphertext_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Ciphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Deserialize a Ciphertext string into a Ciphertext object.
     *
     * @param {string} ciphertext A string representation of the ciphertext.
     *
     * @returns {Ciphertext} The Ciphertext object.
     * @param {string} ciphertext
     * @returns {Ciphertext}
     */
    static fromString(ciphertext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(ciphertext, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.ciphertext_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Ciphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the left endian byte array representation of the ciphertext.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ciphertext_toBytes(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a ciphertext object from a series of bits represented as a boolean array.
     *
     * @param {Array} bits A left endian boolean array representing the bits of the ciphertext.
     *
     * @returns {Ciphertext} The ciphertext object.
     * @param {Array<any>} bits
     * @returns {Ciphertext}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ciphertext_fromBitsLe(retptr, addHeapObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Ciphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Deserialize a left endian byte array into a Ciphertext.
     *
     * @param {Uint8Array} bytes The byte array representing the Ciphertext.
     *
     * @returns {Ciphertext} The Ciphertext object.
     * @param {Uint8Array} bytes
     * @returns {Ciphertext}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ciphertext_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Ciphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypts a ciphertext into plaintext using the given ciphertext view key.
     *
     * @param {Field} transition_view_key The transition view key that was used to encrypt the ciphertext.
     *
     * @returns {Plaintext} The decrypted plaintext.
     * @param {Field} transition_view_key
     * @returns {Plaintext}
     */
    decryptSymmetric(transition_view_key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(transition_view_key, Field);
            var ptr0 = transition_view_key.__destroy_into_raw();
            wasm.ciphertext_decryptSymmetric(retptr, this.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypt a ciphertext using the view key of the transition signer, transition public key, and
     * (program, function, index) tuple.
     *
     * @param {ViewKey} view_key The view key of the transition signer.
     * @param {Group} transition_public_key The transition public key used to encrypt the ciphertext.
     * @param {string} program The program ID associated with the ciphertext.
     * @param {string} function_name The name of the function associated with the encrypted inputs and outputs.
     * @param {u16} index The index of the input or output parameter that was encrypted.
     *
     * @returns {Plaintext} The decrypted plaintext.
     * @param {ViewKey} view_key
     * @param {Group} transition_public_key
     * @param {string} program
     * @param {string} function_name
     * @param {number} index
     * @returns {Plaintext}
     */
    decryptWithTransitionInfo(view_key, transition_public_key, program, function_name, index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(view_key, ViewKey);
            var ptr0 = view_key.__destroy_into_raw();
            _assertClass(transition_public_key, Group);
            var ptr1 = transition_public_key.__destroy_into_raw();
            const ptr2 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len3 = WASM_VECTOR_LEN;
            wasm.ciphertext_decryptWithTransitionInfo(retptr, this.__wbg_ptr, ptr0, ptr1, ptr2, len2, ptr3, len3, index);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypt a ciphertext using the transition view key and a (program, function, index) tuple.
     *
     * @param {Field} transition_view_key The transition view key that was used to encrypt the ciphertext.
     * @param {string} program The program ID associated with the ciphertext.
     * @param {string} function_name The name of the function associated with the encrypted inputs and outputs.
     * @param {u16} index The index of the input or output parameter that was encrypted.
     *
     * @returns {Plaintext} The decrypted plaintext.
     * @param {Field} transition_view_key
     * @param {string} program
     * @param {string} function_name
     * @param {number} index
     * @returns {Plaintext}
     */
    decryptWithTransitionViewKey(transition_view_key, program, function_name, index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(transition_view_key, Field);
            var ptr0 = transition_view_key.__destroy_into_raw();
            const ptr1 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len2 = WASM_VECTOR_LEN;
            wasm.ciphertext_decryptWithTransitionViewKey(retptr, this.__wbg_ptr, ptr0, ptr1, len1, ptr2, len2, index);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypt the ciphertext using the given view key.
     *
     * @param {ViewKey} viewKey The view key of the account that encrypted the ciphertext.
     * @param {Group} nonce The nonce used to encrypt the ciphertext.
     *
     * @returns {Plaintext} The decrypted plaintext.
     * @param {ViewKey} view_key
     * @param {Group} nonce
     * @returns {Plaintext}
     */
    decrypt(view_key, nonce) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(view_key, ViewKey);
            var ptr0 = view_key.__destroy_into_raw();
            _assertClass(nonce, Group);
            var ptr1 = nonce.__destroy_into_raw();
            wasm.ciphertext_decrypt(retptr, this.__wbg_ptr, ptr0, ptr1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Serialize a Ciphertext object into a byte array.
     *
     * @returns {Uint8Array} The serialized Ciphertext.
     * @returns {Uint8Array}
     */
    toBytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ciphertext_toBytes(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the field array representation of the ciphertext.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ciphertext_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Serialize a Ciphertext into a js string.
     *
     * @returns {string} The serialized Ciphertext.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ciphertext_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Ciphertext.prototype[Symbol.dispose] = Ciphertext.prototype.free;

const ComputeKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_computekey_free(ptr >>> 0, 1));

class ComputeKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ComputeKey.prototype);
        obj.__wbg_ptr = ptr;
        ComputeKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ComputeKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_computekey_free(ptr, 0);
    }
    /**
     * Create a new compute key from a private key.
     *
     * @param {PrivateKey} private_key Private key
     *
     * @returns {ComputeKey} Compute key
     * @param {PrivateKey} private_key
     * @returns {ComputeKey}
     */
    static from_private_key(private_key) {
        _assertClass(private_key, PrivateKey);
        const ret = wasm.computekey_from_private_key(private_key.__wbg_ptr);
        return ComputeKey.__wrap(ret);
    }
    /**
     * Get the pr_tag of the compute key.
     *
     * @returns {Group} pr_tag
     * @returns {Group}
     */
    pk_sig() {
        const ret = wasm.address_toGroup(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Get the pr_sig of the compute key.
     *
     * @returns {Group} pr_sig
     * @returns {Group}
     */
    pr_sig() {
        const ret = wasm.computekey_pr_sig(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Get the sk_prf of the compute key.
     *
     * @returns {Scalar} sk_prf
     * @returns {Scalar}
     */
    sk_prf() {
        const ret = wasm.computekey_sk_prf(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the address from the compute key.
     *
     * @returns {Address}
     * @returns {Address}
     */
    address() {
        const ret = wasm.address_from_compute_key(this.__wbg_ptr);
        return Address.__wrap(ret);
    }
}
if (Symbol.dispose) ComputeKey.prototype[Symbol.dispose] = ComputeKey.prototype.free;

const DynamicRecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dynamicrecord_free(ptr >>> 0, 1));
/**
 * A fixed-size representation of an Aleo record. Like static records, a dynamic record
 * contains an owner, nonce, and a version, but instead of storing the full data it only
 * stores the Merkle root of the data, ensuring all dynamic records have a constant size.
 */
class DynamicRecord {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DynamicRecord.prototype);
        obj.__wbg_ptr = ptr;
        DynamicRecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DynamicRecordFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dynamicrecord_free(ptr, 0);
    }
    /**
     * Returns the dynamic record as a little-endian bit array (JS Array of booleans).
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.dynamicrecord_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Creates a DynamicRecord from a RecordPlaintext.
     * @param {RecordPlaintext} record
     * @returns {DynamicRecord}
     */
    static fromRecord(record) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(record, RecordPlaintext);
            wasm.dynamicrecord_fromRecord(retptr, record.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return DynamicRecord.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a DynamicRecord from its string representation.
     * @param {string} s
     * @returns {DynamicRecord}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.dynamicrecord_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return DynamicRecord.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Serializes the dynamic record to a little-endian byte array (Uint8Array).
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.dynamicrecord_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Deserializes a DynamicRecord from a little-endian byte array (Uint8Array).
     * @param {Uint8Array} bytes
     * @returns {DynamicRecord}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.dynamicrecord_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return DynamicRecord.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Returns the Merkle root of the record data as a Field.
     * @returns {Field}
     */
    root() {
        const ret = wasm.dynamicrecord_root(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Returns the nonce of the record as a Group.
     * @returns {Group}
     */
    nonce() {
        const ret = wasm.dynamicrecord_nonce(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Returns the owner address of the dynamic record.
     * @returns {Address}
     */
    owner() {
        const ret = wasm.dynamicrecord_owner(this.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Returns `true` if the dynamic record is a hiding variant (version != 0).
     * @returns {boolean}
     */
    isHiding() {
        const ret = wasm.dynamicrecord_isHiding(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the dynamic record as an array of field elements.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.dynamicrecord_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Converts this DynamicRecord back to a RecordPlaintext.
     * `owner_is_private` controls whether the owner field uses private or public visibility.
     * @param {boolean} owner_is_private
     * @returns {RecordPlaintext}
     */
    toRecord(owner_is_private) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.dynamicrecord_toRecord(retptr, this.__wbg_ptr, owner_is_private);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordPlaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the string representation of the dynamic record.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.dynamicrecord_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) DynamicRecord.prototype[Symbol.dispose] = DynamicRecord.prototype.free;

const EncryptionToolkitFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_encryptiontoolkit_free(ptr >>> 0, 1));
/**
 * EncryptionToolkit provides a set of functions for encrypting, decrypting, and generating individual view keys for records, transitions, and ciphertexts.
 */
class EncryptionToolkit {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EncryptionToolkitFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_encryptiontoolkit_free(ptr, 0);
    }
    /**
     * Generates a transition view key from the view key and the transition public key.
     *
     * @param {ViewKey} view_key The view key of the account that generated the transition.
     * @param {Group} tpk The transition public key.
     *
     * @returns {Field} The transition view key.
     * @param {ViewKey} view_key
     * @param {Group} tpk
     * @returns {Field}
     */
    static generateTvk(view_key, tpk) {
        _assertClass(view_key, ViewKey);
        _assertClass(tpk, Group);
        const ret = wasm.encryptiontoolkit_generateTvk(view_key.__wbg_ptr, tpk.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Decrypt the sender ciphertext associated with a record.
     *
     * @param {ViewKey} view_key View key associated with the record.
     * @param {RecordPlaintext} record Record plaintext associated with a sender.
     * @param {Field} sender_ciphertext Sender ciphertext associated with the record.
     *
     * @returns {Address} address of the sender.
     * @param {ViewKey} view_key
     * @param {RecordPlaintext} record
     * @param {Field} sender_ciphertext
     * @returns {Address}
     */
    static decryptSender(view_key, record, sender_ciphertext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(view_key, ViewKey);
            _assertClass(record, RecordPlaintext);
            _assertClass(sender_ciphertext, Field);
            wasm.encryptiontoolkit_decryptSender(retptr, view_key.__wbg_ptr, record.__wbg_ptr, sender_ciphertext.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Checks if a record ciphertext is owned by the given view key.
     *
     * @param {ViewKey} view_key View key of the owner of the records.
     * @param {Vec<RecordCiphertext>} records The record ciphertexts for which to check ownership.
     *
     * @returns {Vec<RecordCiphertext>} The record ciphertexts that are owned by the view key.
     * @param {ViewKey} view_key
     * @param {RecordCiphertext[]} records
     * @returns {RecordCiphertext[]}
     */
    static checkOwnedRecords(view_key, records) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(view_key, ViewKey);
            const ptr0 = passArrayJsValueToWasm0(records, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.encryptiontoolkit_checkOwnedRecords(retptr, view_key.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 4, 4);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypts a set of record ciphertexts in parallel and stores successful decryptions.
     *
     * @param {ViewKey} view_key The view key of the owner of the records.
     * @param {Vec<RecordCiphertext>} records The record ciphertexts to decrypt.
     *
     * @returns {vec<RecordPlaintext>} The decrypted record plaintexts.
     * @param {ViewKey} view_key
     * @param {RecordCiphertext[]} records
     * @returns {RecordPlaintext[]}
     */
    static decryptOwnedRecords(view_key, records) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(view_key, ViewKey);
            const ptr0 = passArrayJsValueToWasm0(records, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.encryptiontoolkit_decryptOwnedRecords(retptr, view_key.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 4, 4);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypt the sender ciphertext associated with the record with the record view key.
     *
     * @param {Field} record_view_key Record view key associated with the record.
     * @param {Field} sender_ciphertext Sender ciphertext associated with the record.
     *
     * @return {Address} the address of the sender.
     * @param {Field} record_view_key
     * @param {Field} sender_ciphertext
     * @returns {Address}
     */
    static decryptSenderWithRvk(record_view_key, sender_ciphertext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(record_view_key, Field);
            _assertClass(sender_ciphertext, Field);
            wasm.encryptiontoolkit_decryptSenderWithRvk(retptr, record_view_key.__wbg_ptr, sender_ciphertext.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a record view key from the view key.  This can be later be used to decrypt a
     *
     * @param {ViewKey} view_key The view key of the owner of the record.
     * @param {RecordCiphertext} record_ciphertext The record ciphertext used to derive the record view key.
     *
     * @returns {Field} The record view key.
     * @param {ViewKey} view_key
     * @param {RecordCiphertext} record_ciphertext
     * @returns {Field}
     */
    static generateRecordViewKey(view_key, record_ciphertext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(view_key, ViewKey);
            _assertClass(record_ciphertext, RecordCiphertext);
            wasm.encryptiontoolkit_generateRecordViewKey(retptr, view_key.__wbg_ptr, record_ciphertext.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypts a transition using the transition view key.  The ciphertext inputs and outputs
     * can only be decrypted if the transition view key was generated by the transaction signer.
     *
     * @param {Transition} transition The transition to decrypt.
     * @param {Field} transition_vk The transition view key.
     *
     * @returns {Transition} The decrypted transition.
     * @param {Transition} transition
     * @param {Field} transition_vk
     * @returns {Transition}
     */
    static decryptTransitionWithVk(transition, transition_vk) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(transition, Transition);
            _assertClass(transition_vk, Field);
            wasm.encryptiontoolkit_decryptTransitionWithVk(retptr, transition.__wbg_ptr, transition_vk.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transition.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypts a record ciphertext using the record view key.  Decryption only succeeds
     * if the record view key was generated from the view key of the record owner.
     *
     * @param {Field} record_vk The record view key.
     * @param {RecordCiphertext} record_ciphertext The record ciphertext to decrypt.
     *
     * @returns {RecordPlaintext} The decrypted record plaintext.
     * @param {Field} record_vk
     * @param {RecordCiphertext} record_ciphertext
     * @returns {RecordPlaintext}
     */
    static decryptRecordWithRVk(record_vk, record_ciphertext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(record_vk, Field);
            _assertClass(record_ciphertext, RecordCiphertext);
            wasm.encryptiontoolkit_decryptRecordWithRVk(retptr, record_vk.__wbg_ptr, record_ciphertext.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordPlaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) EncryptionToolkit.prototype[Symbol.dispose] = EncryptionToolkit.prototype.free;

const ExecutionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_execution_free(ptr >>> 0, 1));
/**
 * Execution of an Aleo program.
 */
class Execution {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Execution.prototype);
        obj.__wbg_ptr = ptr;
        ExecutionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExecutionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_execution_free(ptr, 0);
    }
    /**
     * Creates an execution object from a string representation of an execution.
     *
     * @returns {Execution | Error} The wasm representation of an execution object.
     * @param {string} execution
     * @returns {Execution}
     */
    static fromString(execution) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(execution, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.execution_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Execution.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the transitions present in the execution.
     *
     * @returns Array<Transition> the array of transitions present in the execution.
     * @returns {Array<any>}
     */
    transitions() {
        const ret = wasm.execution_transitions(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Returns the global state root of the execution.
     *
     * @returns {Execution | Error} The global state root used in the execution.
     * @returns {string}
     */
    globalStateRoot() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.execution_globalStateRoot(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the proof of the execution.
     *
     * @returns {string} The execution proof.
     * @returns {string}
     */
    proof() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.execution_proof(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the string representation of the execution.
     *
     * @returns {string} The string representation of the execution.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.execution_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Execution.prototype[Symbol.dispose] = Execution.prototype.free;

const ExecutionRequestFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_executionrequest_free(ptr >>> 0, 1));

class ExecutionRequest {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ExecutionRequest.prototype);
        obj.__wbg_ptr = ptr;
        ExecutionRequestFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExecutionRequestFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_executionrequest_free(ptr, 0);
    }
    /**
     * Returns the network ID.
     * @returns {number}
     */
    network_id() {
        const ret = wasm.executionrequest_networkId(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the program ID.
     * @returns {string}
     */
    program_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionrequest_program_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Builds a request object from a string representation of a request.
     *
     * @param {string} request String representation of the request.
     * @param {string} request
     * @returns {ExecutionRequest}
     */
    static fromString(request) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(request, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.executionrequest_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExecutionRequest.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the bytes representation of the request.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionrequest_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Alias for `sk_tag` (camelCase).
     * @returns {Field}
     */
    skTag() {
        const ret = wasm.executionrequest_skTag(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Alias for `to_tpk` (camelCase).
     * @returns {Group}
     */
    toTpk() {
        const ret = wasm.executionrequest_toTpk(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Creates an request object from a bytes representation of an request.
     * @param {Uint8Array} bytes
     * @returns {ExecutionRequest}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionrequest_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExecutionRequest.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the function name.
     * @returns {string}
     */
    function_name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionrequest_functionName(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Alias for `input_ids` (camelCase).
     * @returns {Array<any>}
     */
    inputIds() {
        const ret = wasm.executionrequest_inputIds(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Alias for `network_id` (camelCase).
     * @returns {number}
     */
    networkId() {
        const ret = wasm.executionrequest_networkId(this.__wbg_ptr);
        return ret;
    }
    /**
     * Alias for `program_id` (camelCase).
     * @returns {string}
     */
    programId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionrequest_programId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Alias for `function_name` (camelCase).
     * @returns {string}
     */
    functionName() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionrequest_functionName(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Builds a request from externally-signed data using externally-supplied record view keys.
     *
     * For record inputs, the caller provides `record_view_keys` and `gammas` directly.
     * The method uses these to compute commitment, serial number, tag, and InputID for each record.
     *
     * @param {string} program_id The id of the program.
     * @param {string} function_name The function name.
     * @param {string[]} inputs The inputs to the function.
     * @param {string[]} input_types The input types of the function.
     * @param {Signature} signature The externally-computed signature.
     * @param {Field} tvk The transition view key.
     * @param {Address} signer The signer address.
     * @param {Field} sk_tag The tag secret key.
     * @param {Field[] | undefined} record_view_keys Pre-computed record view keys (required when there are record inputs).
     * @param {Group[] | undefined} gammas An array of gammas (required when there are record inputs).
     * @param {string} program_id
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {Array<any>} input_types
     * @param {Signature} signature
     * @param {Field} tvk
     * @param {Address} signer
     * @param {Field} sk_tag
     * @param {Array<any> | null} [record_view_keys]
     * @param {Array<any> | null} [gammas]
     * @returns {ExecutionRequest}
     */
    static fromExternallySignedData(program_id, function_name, inputs, input_types, signature, tvk, signer, sk_tag, record_view_keys, gammas) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            _assertClass(signature, Signature);
            var ptr2 = signature.__destroy_into_raw();
            _assertClass(tvk, Field);
            var ptr3 = tvk.__destroy_into_raw();
            _assertClass(signer, Address);
            var ptr4 = signer.__destroy_into_raw();
            _assertClass(sk_tag, Field);
            var ptr5 = sk_tag.__destroy_into_raw();
            wasm.executionrequest_fromExternallySignedData(retptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), addHeapObject(input_types), ptr2, ptr3, ptr4, ptr5, isLikeNone(record_view_keys) ? 0 : addHeapObject(record_view_keys), isLikeNone(gammas) ? 0 : addHeapObject(gammas));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExecutionRequest.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Computes the function ID and serialized input data for a program function call.
     * This is a helper for external signing wallets and other applications that need to compute
     * publicly computable inputs for the `Request::sign` function.
     *
     * @param {string} program_id The id of the program.
     * @param {string} function_name The function name.
     * @param {string[]} input_types The input types of the function as strings.
     * @param {string[]} inputs The inputs to the function as strings.
     * @param {boolean} is_root Flag to indicate if this is the top level function in the call graph.
     * @param {Field | undefined} program_checksum The program checksum (required if the program has a constructor).
     * @param {ViewKey | undefined} view_key The view key of the signer to compute a record's tag and h values.
     *
     * @returns {ExternalSigningInput}
     * @param {string} program_id
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {Array<any>} input_types
     * @param {boolean} is_root
     * @param {Field | null} [program_checksum]
     * @param {ViewKey | null} [view_key]
     * @returns {object}
     */
    static computeExternalSigningInputs(program_id, function_name, inputs, input_types, is_root, program_checksum, view_key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            let ptr2 = 0;
            if (!isLikeNone(program_checksum)) {
                _assertClass(program_checksum, Field);
                ptr2 = program_checksum.__destroy_into_raw();
            }
            let ptr3 = 0;
            if (!isLikeNone(view_key)) {
                _assertClass(view_key, ViewKey);
                ptr3 = view_key.__destroy_into_raw();
            }
            wasm.executionrequest_computeExternalSigningInputs(retptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), addHeapObject(input_types), is_root, ptr2, ptr3);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the signer commitment `scm`.
     * @returns {Field}
     */
    scm() {
        const ret = wasm.executionrequest_scm(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Returns the transition commitment `tcm`.
     * @returns {Field}
     */
    tcm() {
        const ret = wasm.executionrequest_tcm(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Returns the transition view key `tvk`.
     * @returns {Field}
     */
    tvk() {
        const ret = wasm.executionrequest_tvk(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Builds a request from externally-signed data using a view key to derive record view keys.
     *
     * For record inputs, the method computes `record_view_key = (nonce * view_key).to_x_coordinate()`
     * for each record, then uses it with the supplied `gammas` to compute commitment, serial number,
     * tag, and InputID.
     *
     * @param {string} program_id The id of the program.
     * @param {string} function_name The function name.
     * @param {string[]} inputs The inputs to the function.
     * @param {string[]} input_types The input types of the function.
     * @param {Signature} signature The externally-computed signature.
     * @param {Field} tvk The transition view key.
     * @param {Address} signer The signer address.
     * @param {Field} sk_tag The tag secret key.
     * @param {ViewKey} view_key The view key of the signer.
     * @param {Group[] | undefined} gammas An array of gammas (required when there are record inputs).
     * @param {string} program_id
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {Array<any>} input_types
     * @param {Signature} signature
     * @param {Field} tvk
     * @param {Address} signer
     * @param {Field} sk_tag
     * @param {ViewKey} view_key
     * @param {Array<any> | null} [gammas]
     * @returns {ExecutionRequest}
     */
    static fromExternallySignedDataWithViewKey(program_id, function_name, inputs, input_types, signature, tvk, signer, sk_tag, view_key, gammas) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            _assertClass(signature, Signature);
            var ptr2 = signature.__destroy_into_raw();
            _assertClass(tvk, Field);
            var ptr3 = tvk.__destroy_into_raw();
            _assertClass(signer, Address);
            var ptr4 = signer.__destroy_into_raw();
            _assertClass(sk_tag, Field);
            var ptr5 = sk_tag.__destroy_into_raw();
            _assertClass(view_key, ViewKey);
            var ptr6 = view_key.__destroy_into_raw();
            wasm.executionrequest_fromExternallySignedDataWithViewKey(retptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), addHeapObject(input_types), ptr2, ptr3, ptr4, ptr5, ptr6, isLikeNone(gammas) ? 0 : addHeapObject(gammas));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExecutionRequest.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Builds a request from externally-signed data with pre-computed input IDs.
     *
     * Each element of `input_ids` is either:
     * - A `Field` for constant, public, or private inputs (the input hash).
     * - A JS Array `[Field, Group, Field, Field, Field]` for record inputs
     *   (commitment, gamma, record_view_key, serial_number, tag).
     *
     * The `input_types` array is used to determine the InputID variant for scalar fields.
     *
     * @param {string} program_id The id of the program.
     * @param {string} function_name The function name.
     * @param {string[]} inputs The inputs to the function.
     * @param {string[]} input_types The input types of the function.
     * @param {Signature} signature The externally-computed signature.
     * @param {Field} tvk The transition view key.
     * @param {Address} signer The signer address.
     * @param {Field} sk_tag The tag secret key.
     * @param {(Field | [Field, Group, Field, Field, Field])[]} input_ids Pre-computed input IDs.
     * @param {string} program_id
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {Array<any>} input_types
     * @param {Signature} signature
     * @param {Field} tvk
     * @param {Address} signer
     * @param {Field} sk_tag
     * @param {Array<any>} input_ids
     * @returns {ExecutionRequest}
     */
    static fromExternallySignedDataWithInputIds(program_id, function_name, inputs, input_types, signature, tvk, signer, sk_tag, input_ids) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            _assertClass(signature, Signature);
            var ptr2 = signature.__destroy_into_raw();
            _assertClass(tvk, Field);
            var ptr3 = tvk.__destroy_into_raw();
            _assertClass(signer, Address);
            var ptr4 = signer.__destroy_into_raw();
            _assertClass(sk_tag, Field);
            var ptr5 = sk_tag.__destroy_into_raw();
            wasm.executionrequest_fromExternallySignedDataWithInputIds(retptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), addHeapObject(input_types), ptr2, ptr3, ptr4, ptr5, addHeapObject(input_ids));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExecutionRequest.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new request by signing over a program ID and set of inputs.
     *
     * @param {PrivateKey} private_key The private key of the signer.
     * @param {string} program_id The id of the program to create the signature for.
     * @param {string} function_name The function name to create the signature for.
     * @param {string[]} inputs The inputs to the function.
     * @param {string[]} input_types The input types of the function.
     * @param {Field | undefined} root_tvk The tvk of the function at the top of the call graph. This is undefined if this request is built for the top-level call or if there is only one function in the call graph.
     * @param {Field | undefined} program_checksum The checksum of the program. This is undefined if the call is not dynamic.
     * @param {boolean} is_root Flag to indicate if this is the top level function in the call graph.
     * @param {boolean} is_dynamic Flag to indicate if this is a dynamic call.
     * @param {PrivateKey} private_key
     * @param {string} program_id
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {Array<any>} input_types
     * @param {Field | null | undefined} root_tvk
     * @param {Field | null | undefined} program_checksum
     * @param {boolean} is_root
     * @param {boolean} is_dynamic
     * @returns {ExecutionRequest}
     */
    static sign(private_key, program_id, function_name, inputs, input_types, root_tvk, program_checksum, is_root, is_dynamic) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(private_key, PrivateKey);
            var ptr0 = private_key.__destroy_into_raw();
            const ptr1 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len2 = WASM_VECTOR_LEN;
            let ptr3 = 0;
            if (!isLikeNone(root_tvk)) {
                _assertClass(root_tvk, Field);
                ptr3 = root_tvk.__destroy_into_raw();
            }
            let ptr4 = 0;
            if (!isLikeNone(program_checksum)) {
                _assertClass(program_checksum, Field);
                ptr4 = program_checksum.__destroy_into_raw();
            }
            wasm.executionrequest_sign(retptr, ptr0, ptr1, len1, ptr2, len2, addHeapObject(inputs), addHeapObject(input_types), ptr3, ptr4, is_root, is_dynamic);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExecutionRequest.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the function inputs as an array of strings.
     * @returns {Array<any>}
     */
    inputs() {
        const ret = wasm.executionrequest_inputs(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Returns the request signer.
     * @returns {Address}
     */
    signer() {
        const ret = wasm.address_toGroup(this.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Returns the tag secret key `sk_tag`.
     * @returns {Field}
     */
    sk_tag() {
        const ret = wasm.executionrequest_skTag(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Returns the transition public key `tpk`.
     * @returns {Group}
     */
    to_tpk() {
        const ret = wasm.executionrequest_toTpk(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Verify the input types within a request.
     *
     * @param {string[]} input_types The input types within the request.
     * @param {boolean} is_root Flag to indicate whether this request is the first function in the call graph.
     * @param {Field | undefined} program_checksum The checksum of the program. This is undefined if the call is not dynamic.
     * @param {Array<any>} input_types
     * @param {boolean} is_root
     * @param {Field | null} [program_checksum]
     * @returns {boolean}
     */
    verify(input_types, is_root, program_checksum) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            let ptr0 = 0;
            if (!isLikeNone(program_checksum)) {
                _assertClass(program_checksum, Field);
                ptr0 = program_checksum.__destroy_into_raw();
            }
            wasm.executionrequest_verify(retptr, this.__wbg_ptr, addHeapObject(input_types), is_root, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the input IDs for the transition.
     *
     * Each element is either a WASM `Field` (for constant/public/private/external_record inputs)
     * or a JS Array `[Field, Group, Field, Field, Field]` (for record inputs: commitment, gamma,
     * record_view_key, serial_number, tag).
     * @returns {Array<any>}
     */
    input_ids() {
        const ret = wasm.executionrequest_input_ids(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Returns the signature for the transition.
     * @returns {Signature}
     */
    signature() {
        const ret = wasm.executionrequest_signature(this.__wbg_ptr);
        return Signature.__wrap(ret);
    }
    /**
     * Returns the request as a string.
     *
     * @returns {string} String representation of the request.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionrequest_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) ExecutionRequest.prototype[Symbol.dispose] = ExecutionRequest.prototype.free;

const ExecutionResponseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_executionresponse_free(ptr >>> 0, 1));
/**
 * Webassembly Representation of an Aleo function execution response
 *
 * This object is returned by the execution of an Aleo function off-chain. It provides methods for
 * retrieving the outputs of the function execution.
 */
class ExecutionResponse {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ExecutionResponse.prototype);
        obj.__wbg_ptr = ptr;
        ExecutionResponseFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExecutionResponseFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_executionresponse_free(ptr, 0);
    }
    /**
     * Get the outputs of the executed function
     *
     * @returns {Array} Array of strings representing the outputs of the function
     * @returns {Array<any>}
     */
    getOutputs() {
        const ret = wasm.executionresponse_getOutputs(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Returns the program
     * @returns {Program}
     */
    getProgram() {
        const ret = wasm.executionresponse_getProgram(this.__wbg_ptr);
        return Program.__wrap(ret);
    }
    /**
     * Returns the execution object if present, null if otherwise.
     *
     * @returns {Execution | undefined} The execution object if present, null if otherwise
     * @returns {Execution | undefined}
     */
    getExecution() {
        const ret = wasm.executionresponse_getExecution(this.__wbg_ptr);
        return ret === 0 ? undefined : Execution.__wrap(ret);
    }
    /**
     * Returns the function identifier
     * @returns {string}
     */
    getFunctionId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionresponse_getFunctionId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the proving_key if the proving key was cached in the Execution response.
     * Note the proving key is removed from the response object after the first call to this
     * function. Subsequent calls will return null.
     *
     * @returns {ProvingKey | undefined} The proving key
     * @returns {ProvingKey | undefined}
     */
    getProvingKey() {
        const ret = wasm.executionresponse_getProvingKey(this.__wbg_ptr);
        return ret === 0 ? undefined : ProvingKey.__wrap(ret);
    }
    /**
     * Returns the verifying_key associated with the program
     *
     * @returns {VerifyingKey} The verifying key
     * @returns {VerifyingKey}
     */
    getVerifyingKey() {
        const ret = wasm.executionresponse_getVerifyingKey(this.__wbg_ptr);
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the program keys if present
     * @returns {KeyPair}
     */
    getKeys() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.executionresponse_getKeys(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return KeyPair.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) ExecutionResponse.prototype[Symbol.dispose] = ExecutionResponse.prototype.free;

const FieldFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_field_free(ptr >>> 0, 1));
/**
 * Field element.
 */
class Field {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Field.prototype);
        obj.__wbg_ptr = ptr;
        FieldFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof Field)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FieldFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_field_free(ptr, 0);
    }
    /**
     * Cast the field element to an Address (strict, via Group x-coordinate recovery).
     * Returns an error if the field is not a valid x-coordinate on the curve.
     * @returns {Address}
     */
    toAddress() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.field_toAddress(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the left endian boolean array representation of the field element.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.field_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Cast the field element to a Boolean (strict).
     * Returns an error if the field is not zero or one.
     * @returns {Boolean}
     */
    toBoolean() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.field_toBoolean(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Boolean.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a field object from a string representation of a field element.
     * @param {string} field
     * @returns {Field}
     */
    static fromString(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(field, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.field_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encode the field element as a Uint8Array of left endian bytes.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.field_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the field to an I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        const ret = wasm.field_toI8Lossy(this.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Cast the field to a U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        const ret = wasm.field_toI8Lossy(this.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Reconstruct a field element from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {Field}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.field_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast the field to an I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        const ret = wasm.field_toI16Lossy(this.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Cast the field to an I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        const ret = wasm.field_toI32Lossy(this.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Cast the field to an I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        const ret = wasm.field_toI64Lossy(this.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Create a plaintext from the field element.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.field_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast the field to a U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        const ret = wasm.field_toI16Lossy(this.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Cast the field to a U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        const ret = wasm.field_toI32Lossy(this.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Cast the field to a U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        const ret = wasm.field_toI64Lossy(this.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Create a field element from a Uint8Array of left endian bytes.
     * @param {Uint8Array} bytes
     * @returns {Field}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.field_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast the field to an I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        const ret = wasm.field_toI128Lossy(this.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Cast the field to a U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        const ret = wasm.field_toI128Lossy(this.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Cast the field element to a Group element with lossy conversion.
     *
     * Uses the snarkVM cast_lossy path: tries x-coordinate recovery first,
     * falls back to the generator for field == 1, and applies Elligator-2
     * otherwise. This conversion never fails.
     * @returns {Group}
     */
    toGroupLossy() {
        const ret = wasm.field_toAddressLossy(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Cast the field element to a Scalar with lossy truncation.
     * @returns {Scalar}
     */
    toScalarLossy() {
        const ret = wasm.field_toScalarLossy(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Cast the field element to an Address with lossy conversion (via Group, Elligator-2 fallback).
     * @returns {Address}
     */
    toAddressLossy() {
        const ret = wasm.field_toAddressLossy(this.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Cast the field element to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.field_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Initializes a new field as a domain separator.
     * @param {string} domain
     * @returns {Field}
     */
    static newDomainSeparator(domain) {
        const ptr0 = passStringToWasm0(domain, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.field_newDomainSeparator(ptr0, len0);
        return Field.__wrap(ret);
    }
    /**
     * Add two field elements.
     * @param {Field} other
     * @returns {Field}
     */
    add(other) {
        _assertClass(other, Field);
        const ret = wasm.field_add(this.__wbg_ptr, other.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Get the multiplicative identity of the field.
     * @returns {Field}
     */
    static one() {
        const ret = wasm.field_one();
        return Field.__wrap(ret);
    }
    /**
     * Power of a field element.
     * @param {Field} other
     * @returns {Field}
     */
    pow(other) {
        _assertClass(other, Field);
        const ret = wasm.field_pow(this.__wbg_ptr, other.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Get the additive identity element of the field.
     * @returns {Field}
     */
    static zero() {
        const ret = wasm.field_zero();
        return Field.__wrap(ret);
    }
    /**
     * Clone the field element.
     * @returns {Field}
     */
    clone() {
        const ret = wasm.field_clone(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Divide two field elements.
     * @param {Field} other
     * @returns {Field}
     */
    divide(other) {
        _assertClass(other, Field);
        const ret = wasm.field_divide(this.__wbg_ptr, other.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Double the field element.
     * @returns {Field}
     */
    double() {
        const ret = wasm.field_double(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Check if one field element equals another.
     * @param {Field} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, Field);
        const ret = wasm.field_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Generate a random field element.
     * @returns {Field}
     */
    static random() {
        const ret = wasm.field_random();
        return Field.__wrap(ret);
    }
    /**
     * Invert the field element.
     * @returns {Field}
     */
    inverse() {
        const ret = wasm.field_inverse(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Multiply two field elements.
     * @param {Field} other
     * @returns {Field}
     */
    multiply(other) {
        _assertClass(other, Field);
        const ret = wasm.field_multiply(this.__wbg_ptr, other.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Subtract two field elements.
     * @param {Field} other
     * @returns {Field}
     */
    subtract(other) {
        _assertClass(other, Field);
        const ret = wasm.field_subtract(this.__wbg_ptr, other.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Cast the field element to a Group element (strict).
     *
     * Attempts to recover the group element from the field as an x-coordinate.
     * Returns an error if the field is not a valid x-coordinate on the curve.
     * @returns {Group}
     */
    toGroup() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.field_toGroup(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the string representation of the field element.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.field_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Field.prototype[Symbol.dispose] = Field.prototype.free;

const GraphKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_graphkey_free(ptr >>> 0, 1));

class GraphKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(GraphKey.prototype);
        obj.__wbg_ptr = ptr;
        GraphKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GraphKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_graphkey_free(ptr, 0);
    }
    /**
     * Create a new graph key from a string representation of a graph key
     *
     * @param {string} graph_key String representation of a graph key
     * @returns {GraphKey} Graph key
     * @param {string} graph_key
     * @returns {GraphKey}
     */
    static from_string(graph_key) {
        const ptr0 = passStringToWasm0(graph_key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.graphkey_from_string(ptr0, len0);
        return GraphKey.__wrap(ret);
    }
    /**
     * Get a string representation of a graph key
     *
     * @returns {string} String representation of a graph key
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.graphkey_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Create a new graph key from a view key.
     *
     * @param {ViewKey} view_key View key
     * @returns {GraphKey} Graph key
     * @param {ViewKey} view_key
     * @returns {GraphKey}
     */
    static from_view_key(view_key) {
        _assertClass(view_key, ViewKey);
        const ret = wasm.graphkey_from_view_key(view_key.__wbg_ptr);
        return GraphKey.__wrap(ret);
    }
    /**
     * Get the sk_tag of the graph key. Used to determine ownership of records.
     * @returns {Field}
     */
    sk_tag() {
        const ret = wasm.field_clone(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Get a string representation of a graph key
     *
     * @returns {string} String representation of a graph key
     * @returns {string}
     */
    to_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.graphkey_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) GraphKey.prototype[Symbol.dispose] = GraphKey.prototype.free;

const GroupFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_group_free(ptr >>> 0, 1));
/**
 * Elliptic curve element.
 */
class Group {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Group.prototype);
        obj.__wbg_ptr = ptr;
        GroupFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof Group)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GroupFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_group_free(ptr, 0);
    }
    /**
     * Generate the group element from the x coordinate of the group.
     * @param {Field} field
     * @returns {Group}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.group_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the group element to an Address (lossless — Address wraps Group).
     * @returns {Address}
     */
    toAddress() {
        const ret = wasm.address_toGroup(this.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Get the left endian boolean array representation of the group element.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.address_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Creates a group object from a string representation of a group element.
     * @param {string} group
     * @returns {Group}
     */
    static fromString(group) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(group, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.group_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encode the group element as a Uint8Array of left endian bytes.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.group_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the group to an I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        const ret = wasm.address_toI8Lossy(this.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Cast the group to a U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        const ret = wasm.address_toI8Lossy(this.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Reconstruct a group element from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {Group}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.group_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast the group to an I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        const ret = wasm.address_toI16Lossy(this.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Cast the group to an I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        const ret = wasm.address_toI32Lossy(this.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Cast the group to an I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        const ret = wasm.address_toI64Lossy(this.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Create a plaintext element from a group element.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.group_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast the group to a U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        const ret = wasm.address_toI16Lossy(this.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Cast the group to a U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        const ret = wasm.address_toI32Lossy(this.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Cast the group to a U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        const ret = wasm.address_toI64Lossy(this.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Create a group element from a Uint8Array of left endian bytes.
     * @param {Uint8Array} bytes
     * @returns {Group}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.group_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast the group to an I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        const ret = wasm.address_toI128Lossy(this.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Cast the group to a U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        const ret = wasm.address_toI128Lossy(this.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Multiply a group element by a scalar element.
     * @param {Scalar} scalar
     * @returns {Group}
     */
    scalarMultiply(scalar) {
        _assertClass(scalar, Scalar);
        const ret = wasm.group_scalarMultiply(this.__wbg_ptr, scalar.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Cast the group element to a Scalar with lossy truncation (via x-coordinate).
     * @returns {Scalar}
     */
    toScalarLossy() {
        const ret = wasm.address_toScalarLossy(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the x-coordinate of the group element.
     * @returns {Field}
     */
    toXCoordinate() {
        const ret = wasm.address_toField(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Cast the group element to a Boolean with lossy truncation (LSB of x-coordinate).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.address_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Generate the group element from a string representation of the x coordinate of the group.
     * @param {string} field
     * @returns {Group}
     */
    static fromFieldString(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(field, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.group_fromFieldString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Add two group elements.
     * @param {Group} other
     * @returns {Group}
     */
    add(other) {
        _assertClass(other, Group);
        const ret = wasm.group_add(this.__wbg_ptr, other.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Get the group identity element under the group operation (i.e. the point at infinity.)
     * @returns {Group}
     */
    static zero() {
        const ret = wasm.group_zero();
        return Group.__wrap(ret);
    }
    /**
     * Clone the group element.
     * @returns {Group}
     */
    clone() {
        const ret = wasm.address_toGroup(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Double the group element.
     * @returns {Group}
     */
    double() {
        const ret = wasm.group_double(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Check if one group element equals another.
     * @param {Group} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, Group);
        const ret = wasm.group_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Generate a random group element.
     * @returns {Group}
     */
    static random() {
        const ret = wasm.group_random();
        return Group.__wrap(ret);
    }
    /**
     * Get the inverse of the group element. This is the reflection of the point about the axis
     * of symmetry i.e. (x,y) -> (x, -y).
     * @returns {Group}
     */
    inverse() {
        const ret = wasm.group_inverse(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Subtract two group elements (equivalently: add the inverse of an element).
     * @param {Group} other
     * @returns {Group}
     */
    subtract(other) {
        _assertClass(other, Group);
        const ret = wasm.group_subtract(this.__wbg_ptr, other.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Cast the group element to a Field (returns x-coordinate).
     * This is an alias for `toXCoordinate()`.
     * @returns {Field}
     */
    toField() {
        const ret = wasm.address_toField(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Get the generator of the group.
     * @returns {Group}
     */
    static generator() {
        const ret = wasm.group_generator();
        return Group.__wrap(ret);
    }
    /**
     * Get the field array representation of the group.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the string representation of the group element.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.group_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Group.prototype[Symbol.dispose] = Group.prototype.free;

const I128Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_i128_free(ptr >>> 0, 1));

class I128 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(I128.prototype);
        obj.__wbg_ptr = ptr;
        I128Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        I128Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_i128_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {I128}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i128_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.i128_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {I128}
     */
    absChecked() {
        const ret = wasm.i128_absChecked(this.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {I128}
     */
    absWrapped() {
        const ret = wasm.i128_absWrapped(this.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {I128} other
     * @returns {I128}
     */
    addWrapped(other) {
        _assertClass(other, I128);
        const ret = wasm.i128_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {I128} other
     * @returns {I128}
     */
    divWrapped(other) {
        _assertClass(other, I128);
        const ret = wasm.i128_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {I128}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {I128}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.i128_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {I128} other
     * @returns {I128}
     */
    mulWrapped(other) {
        _assertClass(other, I128);
        const ret = wasm.i128_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {I128} other
     * @returns {I128}
     */
    remWrapped(other) {
        _assertClass(other, I128);
        const ret = wasm.i128_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {I128} other
     * @returns {I128}
     */
    subWrapped(other) {
        _assertClass(other, I128);
        const ret = wasm.i128_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {I128}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.i128_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {I128}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {I128}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI128Lossy(field.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.i128_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {I128}
     */
    neg() {
        const ret = wasm.i128_neg(this.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {I128} other
     * @returns {I128}
     */
    rem(other) {
        _assertClass(other, I128);
        const ret = wasm.i128_rem(this.__wbg_ptr, other.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {I128}
     */
    clone() {
        const ret = wasm.i128_clone(this.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {I128} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, I128);
        const ret = wasm.i128_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {I128}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.i128_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {I128}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.i128_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {I128}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.i128_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return I128.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.i128_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) I128.prototype[Symbol.dispose] = I128.prototype.free;

const I16Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_i16_free(ptr >>> 0, 1));

class I16 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(I16.prototype);
        obj.__wbg_ptr = ptr;
        I16Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        I16Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_i16_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {I16}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i16_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.i16_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {I16}
     */
    absChecked() {
        const ret = wasm.i16_absChecked(this.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {I16}
     */
    absWrapped() {
        const ret = wasm.i16_absWrapped(this.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {I16} other
     * @returns {I16}
     */
    addWrapped(other) {
        _assertClass(other, I16);
        const ret = wasm.i16_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {I16} other
     * @returns {I16}
     */
    divWrapped(other) {
        _assertClass(other, I16);
        const ret = wasm.i16_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {I16}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {I16}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.i16_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {I16} other
     * @returns {I16}
     */
    mulWrapped(other) {
        _assertClass(other, I16);
        const ret = wasm.i16_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {I16} other
     * @returns {I16}
     */
    remWrapped(other) {
        _assertClass(other, I16);
        const ret = wasm.i16_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {I16} other
     * @returns {I16}
     */
    subWrapped(other) {
        _assertClass(other, I16);
        const ret = wasm.i16_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {I16}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.i16_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {I16}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {I16}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI16Lossy(field.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.i16_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {I16}
     */
    neg() {
        const ret = wasm.i16_neg(this.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {I16} other
     * @returns {I16}
     */
    rem(other) {
        _assertClass(other, I16);
        const ret = wasm.i16_rem(this.__wbg_ptr, other.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {I16}
     */
    clone() {
        const ret = wasm.i16_clone(this.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {I16} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, I16);
        const ret = wasm.i16_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {I16}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.i16_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {I16}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.i16_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {I16}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.i16_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return I16.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.i16_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) I16.prototype[Symbol.dispose] = I16.prototype.free;

const I32Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_i32_free(ptr >>> 0, 1));

class I32 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(I32.prototype);
        obj.__wbg_ptr = ptr;
        I32Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        I32Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_i32_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {I32}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i32_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.i32_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {I32}
     */
    absChecked() {
        const ret = wasm.i32_absChecked(this.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {I32}
     */
    absWrapped() {
        const ret = wasm.i32_absWrapped(this.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {I32} other
     * @returns {I32}
     */
    addWrapped(other) {
        _assertClass(other, I32);
        const ret = wasm.i32_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {I32} other
     * @returns {I32}
     */
    divWrapped(other) {
        _assertClass(other, I32);
        const ret = wasm.i32_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {I32}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {I32}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.i32_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {I32} other
     * @returns {I32}
     */
    mulWrapped(other) {
        _assertClass(other, I32);
        const ret = wasm.i32_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {I32} other
     * @returns {I32}
     */
    remWrapped(other) {
        _assertClass(other, I32);
        const ret = wasm.i32_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {I32} other
     * @returns {I32}
     */
    subWrapped(other) {
        _assertClass(other, I32);
        const ret = wasm.i32_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {I32}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.i32_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {I32}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {I32}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI32Lossy(field.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.i32_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {I32}
     */
    neg() {
        const ret = wasm.i32_neg(this.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {I32} other
     * @returns {I32}
     */
    rem(other) {
        _assertClass(other, I32);
        const ret = wasm.i32_rem(this.__wbg_ptr, other.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {I32}
     */
    clone() {
        const ret = wasm.i32_clone(this.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {I32} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, I32);
        const ret = wasm.i32_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {I32}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.i32_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {I32}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.i32_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {I32}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.i32_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return I32.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.i32_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) I32.prototype[Symbol.dispose] = I32.prototype.free;

const I64Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_i64_free(ptr >>> 0, 1));

class I64 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(I64.prototype);
        obj.__wbg_ptr = ptr;
        I64Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        I64Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_i64_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {I64}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i64_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.i64_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {I64}
     */
    absChecked() {
        const ret = wasm.i64_absChecked(this.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {I64}
     */
    absWrapped() {
        const ret = wasm.i64_absWrapped(this.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {I64} other
     * @returns {I64}
     */
    addWrapped(other) {
        _assertClass(other, I64);
        const ret = wasm.i64_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {I64} other
     * @returns {I64}
     */
    divWrapped(other) {
        _assertClass(other, I64);
        const ret = wasm.i64_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {I64}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {I64}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.i64_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {I64} other
     * @returns {I64}
     */
    mulWrapped(other) {
        _assertClass(other, I64);
        const ret = wasm.i64_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {I64} other
     * @returns {I64}
     */
    remWrapped(other) {
        _assertClass(other, I64);
        const ret = wasm.i64_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {I64} other
     * @returns {I64}
     */
    subWrapped(other) {
        _assertClass(other, I64);
        const ret = wasm.i64_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {I64}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.i64_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {I64}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {I64}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI64Lossy(field.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.i64_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {I64}
     */
    neg() {
        const ret = wasm.i64_neg(this.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {I64} other
     * @returns {I64}
     */
    rem(other) {
        _assertClass(other, I64);
        const ret = wasm.i64_rem(this.__wbg_ptr, other.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {I64}
     */
    clone() {
        const ret = wasm.i64_clone(this.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {I64} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, I64);
        const ret = wasm.i64_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {I64}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.i64_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {I64}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.i64_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {I64}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.i64_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return I64.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.i64_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) I64.prototype[Symbol.dispose] = I64.prototype.free;

const I8Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_i8_free(ptr >>> 0, 1));

class I8 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(I8.prototype);
        obj.__wbg_ptr = ptr;
        I8Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        I8Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_i8_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {I8}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i8_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.i8_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {I8}
     */
    absChecked() {
        const ret = wasm.i8_absChecked(this.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {I8}
     */
    absWrapped() {
        const ret = wasm.i8_absWrapped(this.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {I8} other
     * @returns {I8}
     */
    addWrapped(other) {
        _assertClass(other, I8);
        const ret = wasm.i8_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {I8} other
     * @returns {I8}
     */
    divWrapped(other) {
        _assertClass(other, I8);
        const ret = wasm.i8_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {I8}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {I8}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.i8_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {I8} other
     * @returns {I8}
     */
    mulWrapped(other) {
        _assertClass(other, I8);
        const ret = wasm.i8_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {I8} other
     * @returns {I8}
     */
    remWrapped(other) {
        _assertClass(other, I8);
        const ret = wasm.i8_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {I8} other
     * @returns {I8}
     */
    subWrapped(other) {
        _assertClass(other, I8);
        const ret = wasm.i8_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {I8}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.i8_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {I8}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {I8}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI8Lossy(field.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.i8_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {I8}
     */
    neg() {
        const ret = wasm.i8_neg(this.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {I8} other
     * @returns {I8}
     */
    rem(other) {
        _assertClass(other, I8);
        const ret = wasm.i8_rem(this.__wbg_ptr, other.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {I8}
     */
    clone() {
        const ret = wasm.i8_clone(this.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {I8} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, I8);
        const ret = wasm.i8_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {I8}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.i8_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {I8}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.i8_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {I8}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.i8_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return I8.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.i8_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) I8.prototype[Symbol.dispose] = I8.prototype.free;

const KeyPairFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_keypair_free(ptr >>> 0, 1));
/**
 * Key pair object containing both the function proving and verifying keys
 */
class KeyPair {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(KeyPair.prototype);
        obj.__wbg_ptr = ptr;
        KeyPairFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KeyPairFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_keypair_free(ptr, 0);
    }
    /**
     * Get the proving key. This method will remove the proving key from the key pair
     *
     * @returns {ProvingKey}
     * @returns {ProvingKey}
     */
    provingKey() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.keypair_provingKey(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ProvingKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the verifying key. This method will remove the verifying key from the key pair
     *
     * @returns {VerifyingKey}
     * @returns {VerifyingKey}
     */
    verifyingKey() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.keypair_verifyingKey(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return VerifyingKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create new key pair from proving and verifying keys
     *
     * @param {ProvingKey} proving_key Proving key corresponding to a function in an Aleo program
     * @param {VerifyingKey} verifying_key Verifying key corresponding to a function in an Aleo program
     * @returns {KeyPair} Key pair object containing both the function proving and verifying keys
     * @param {ProvingKey} proving_key
     * @param {VerifyingKey} verifying_key
     */
    constructor(proving_key, verifying_key) {
        _assertClass(proving_key, ProvingKey);
        var ptr0 = proving_key.__destroy_into_raw();
        _assertClass(verifying_key, VerifyingKey);
        var ptr1 = verifying_key.__destroy_into_raw();
        const ret = wasm.keypair_new(ptr0, ptr1);
        this.__wbg_ptr = ret >>> 0;
        KeyPairFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) KeyPair.prototype[Symbol.dispose] = KeyPair.prototype.free;

const MetadataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_metadata_free(ptr >>> 0, 1));

class Metadata {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Metadata.prototype);
        obj.__wbg_ptr = ptr;
        MetadataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MetadataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_metadata_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_metadata_name(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set name(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_metadata_name(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get locator() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_metadata_locator(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set locator(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_metadata_locator(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get prover() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_metadata_prover(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set prover(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_metadata_prover(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get verifier() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_metadata_verifier(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set verifier(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_metadata_verifier(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get verifyingKey() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_metadata_verifyingKey(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set verifyingKey(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_metadata_verifyingKey(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {Metadata}
     */
    static fee_public() {
        const ret = wasm.metadata_fee_public();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static bond_public() {
        const ret = wasm.metadata_bond_public();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static fee_private() {
        const ret = wasm.metadata_fee_private();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static unbond_public() {
        const ret = wasm.metadata_unbond_public();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static bond_validator() {
        const ret = wasm.metadata_bond_validator();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static transfer_public() {
        const ret = wasm.metadata_transfer_public();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static transfer_private() {
        const ret = wasm.metadata_transfer_private();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static claim_unbond_public() {
        const ret = wasm.metadata_claim_unbond_public();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static set_validator_state() {
        const ret = wasm.metadata_set_validator_state();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static transfer_public_as_signer() {
        const ret = wasm.metadata_transfer_public_as_signer();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static transfer_private_to_public() {
        const ret = wasm.metadata_transfer_private_to_public();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static transfer_public_to_private() {
        const ret = wasm.metadata_transfer_public_to_private();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static join() {
        const ret = wasm.metadata_join();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Metadata}
     */
    static split() {
        const ret = wasm.metadata_split();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    static baseUrl() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.metadata_baseUrl(retptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Metadata}
     */
    static inclusion() {
        const ret = wasm.metadata_inclusion();
        return Metadata.__wrap(ret);
    }
}
if (Symbol.dispose) Metadata.prototype[Symbol.dispose] = Metadata.prototype.free;

const OfflineQueryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_offlinequery_free(ptr >>> 0, 1));
/**
 * An offline query object used to insert the global state root and state paths needed to create
 * a valid inclusion proof offline.
 */
class OfflineQuery {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(OfflineQuery.prototype);
        obj.__wbg_ptr = ptr;
        OfflineQueryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OfflineQueryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_offlinequery_free(ptr, 0);
    }
    /**
     * Create an offline query object from a json string representation.
     *
     * @param {string} JSON string representation of the offline query object.
     * @param {string} s
     * @returns {OfflineQuery}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.offlinequery_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return OfflineQuery.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Add a new state path to the offline query object.
     *
     * @param {string} commitment: The commitment corresponding to a record input.
     * @param {string} state_path: The state path corresponding to the commitment.
     * @param {string} commitment
     * @param {string} state_path
     */
    addStatePath(commitment, state_path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(commitment, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(state_path, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            wasm.offlinequery_addStatePath(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Add a new block height to the offline query object.
     *
     * @param {u32} block_height The block height to add.
     * @param {number} block_height
     */
    addBlockHeight(block_height) {
        wasm.offlinequery_addBlockHeight(this.__wbg_ptr, block_height);
    }
    /**
     * Creates a new offline query object. The state root is required to be passed in as a string
     *
     * @param {u32} block_height The block height.
     * @param {string} state_root The state root of the current network.
     *
     * @returns {OfflineQuery} The newly created offline query object.
     * @param {number} block_height
     * @param {string} state_root
     */
    constructor(block_height, state_root) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(state_root, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.offlinequery_new(retptr, block_height, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            OfflineQueryFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a json string representation of the offline query object.
     *
     * @returns {string} JSON string representation of the offline query object.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.offlinequery_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) OfflineQuery.prototype[Symbol.dispose] = OfflineQuery.prototype.free;

const Pedersen128Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pedersen128_free(ptr >>> 0, 1));

class Pedersen128 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Pedersen128.prototype);
        obj.__wbg_ptr = ptr;
        Pedersen128Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Pedersen128Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pedersen128_free(ptr, 0);
    }
    /**
     * Returns a Pedersen commitment for the given (up to) 128-bit input and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Group}
     */
    commitToGroup(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.pedersen128_commitToGroup(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Pedersen hasher for a given (up to) 128-bit input.
     */
    constructor() {
        const ret = wasm.pedersen128_new();
        this.__wbg_ptr = ret >>> 0;
        Pedersen128Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the Pedersen hash for a given (up to) 128-bit input.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.pedersen128_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Pedersen hasher for a given (up to) 128-bit input with a custom domain separator.
     * @param {string} domain_separator
     * @returns {Pedersen128}
     */
    static setup(domain_separator) {
        const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.pedersen128_setup(ptr0, len0);
        return Pedersen128.__wrap(ret);
    }
    /**
     * Returns a Pedersen commitment for the given (up to) 128-bit input and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Field}
     */
    commit(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.pedersen128_commit(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) Pedersen128.prototype[Symbol.dispose] = Pedersen128.prototype.free;

const Pedersen64Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pedersen64_free(ptr >>> 0, 1));

class Pedersen64 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Pedersen64.prototype);
        obj.__wbg_ptr = ptr;
        Pedersen64Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Pedersen64Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pedersen64_free(ptr, 0);
    }
    /**
     * Returns a Pedersen commitment for the given (up to) 64-bit input and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Group}
     */
    commitToGroup(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.pedersen64_commitToGroup(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Pedersen hasher for a given (up to) 64-bit input.
     */
    constructor() {
        const ret = wasm.pedersen64_new();
        this.__wbg_ptr = ret >>> 0;
        Pedersen64Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the Pedersen hash for a given (up to) 64-bit input.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.pedersen64_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Pedersen64 hasher for a given (up to) 64-bit input with a custom domain separator.
     * @param {string} domain_separator
     * @returns {Pedersen64}
     */
    static setup(domain_separator) {
        const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.pedersen64_setup(ptr0, len0);
        return Pedersen64.__wrap(ret);
    }
    /**
     * Returns a Pedersen commitment for the given (up to) 64-bit input and randomizer.
     * @param {Array<any>} input
     * @param {Scalar} randomizer
     * @returns {Field}
     */
    commit(input, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(randomizer, Scalar);
            var ptr0 = randomizer.__destroy_into_raw();
            wasm.pedersen64_commit(retptr, this.__wbg_ptr, addHeapObject(input), ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) Pedersen64.prototype[Symbol.dispose] = Pedersen64.prototype.free;

const PlaintextFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_plaintext_free(ptr >>> 0, 1));
/**
 * SnarkVM Plaintext object. Plaintext is a fundamental monadic type used to represent Aleo
 * primitive types (boolean, field, group, i8, i16, i32, i64, i128, u8, u16, u32, u64, u128,
 * scalar, and signature), struct types, and array types.
 *
 * In the context of a web or NodeJS application, this type is useful for turning an Aleo type into
 * a JS value, object, or array that might be necessary for performing computations within the
 * application.
 *
 * @example
 * // Get the bond state of an existing address.
 * const bondState = await fetch(https://api.provable.com/v2/mainnet/program/credits.aleo/mapping/bond_state/aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f);
 * // Convert the bond state to a Plaintext object.
 * const bondStatePlaintext = Plaintext.fromString(bond_state);
 * // Convert the Plaintext object to a JS object.
 * const bondStateObject = bond_state_plaintext.toObject();
 * // Check if the bond state matches the expected object.
 * const expectedObject = { validator: "aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f", microcredits: 100000000u64 };
 * assert( JSON.stringify(bondStateObject) === JSON.stringify(expectedObject) );
 */
class Plaintext {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Plaintext.prototype);
        obj.__wbg_ptr = ptr;
        PlaintextFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PlaintextFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_plaintext_free(ptr, 0);
    }
    /**
     * Get the little endian boolean array representation of the bits of the plaintext.
     *
     * @returns {Array} The little endian boolean array representation of the bits of the plaintext.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.plaintext_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get a plaintext object from an array of fields.
     *
     * @param {Array} fields An array of fields.
     *
     * @returns {Plaintext} The plaintext object.
     * @param {Array<any>} fields
     * @returns {Plaintext}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a plaintext object from a string representation of a plaintext.
     *
     * @param {string} plaintext The string representation of the plaintext.
     *
     * @returns {Plaintext} The plaintext object.
     * @param {string} plaintext
     * @returns {Plaintext}
     */
    static fromString(plaintext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(plaintext, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.plaintext_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the little endian byte array representation of the plaintext.
     *
     * @returns {Uint8Array} The little endian byte array representation of the plaintext.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a plaintext object from a series of bits represented as a boolean array.
     *
     * @param {Array} bits A little endian boolean array representing the bits plaintext.
     *
     * @returns {Plaintext} The plaintext object.
     * @param {Array<any>} bits
     * @returns {Plaintext}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_fromBitsLe(retptr, addHeapObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a plaintext object from a series of bytes.
     *
     * @param {Uint8Array} bytes A little endian byte array representing the plaintext.
     *
     * @returns {Plaintext} The plaintext object.
     * @param {Uint8Array} bytes
     * @returns {Plaintext}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the raw field array representation of the plaintext.
     *
     * @returns {Array} The raw field array representation of the plaintext.
     * @returns {Array<any>}
     */
    toFieldsRaw() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_toFieldsRaw(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Gives the type of the plaintext.
     *
     * @returns {string} The type of the plaintext.
     * @returns {string}
     */
    plaintextType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_plaintextType(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get the raw big endian boolean array representation of the bits of the plaintext.
     *
     * @returns {Array} The raw big endian boolean array representation of the bits of the plaintext.
     * @returns {Array<any>}
     */
    toBitsRawBe() {
        const ret = wasm.plaintext_toBitsRawBe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get the raw little endian boolean array representation of the bits of the plaintext.
     *
     * @returns {Array} The raw little endian boolean array representation of the bits of the plaintext.
     * @returns {Array<any>}
     */
    toBitsRawLe() {
        const ret = wasm.plaintext_toBitsRawLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get the raw big endian byte array representation of the plaintext.
     *
     * @returns {Uint8Array} The raw big endian byte array representation of the plaintext.
     * @returns {Uint8Array}
     */
    toBytesRawBe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_toBytesRawBe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the raw little endian byte array representation of the plaintext.
     *
     * @returns {Uint8Array} The raw little endian byte array representation of the plaintext.
     * @returns {Uint8Array}
     */
    toBytesRawLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_toBytesRawLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encrypt a plaintext with a transition view key.
     *
     * @param {Field} transition_view_key The transition view key of the transition
     * associated with the plaintext.
     *
     * @returns {Ciphertext} The encrypted ciphertext.
     * @param {Field} transition_view_key
     * @returns {Ciphertext}
     */
    encryptSymmetric(transition_view_key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(transition_view_key, Field);
            wasm.plaintext_encryptSymmetric(retptr, this.__wbg_ptr, transition_view_key.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Ciphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Find plaintext member if the plaintext is a struct. Returns `null` if the plaintext is not
     * a struct or the member does not exist.
     *
     * @param {string} name The name of the plaintext member to find.
     *
     * @returns {Plaintext} The plaintext member.
     * @param {string} name
     * @returns {Plaintext}
     */
    find(name) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.plaintext_find(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encrypt a plaintext with an address and randomizer.
     *
     * @param {Address} address The address to encrypt the plaintext for.
     * @param {Scalar} randomizer The randomizer to use for encryption.
     *
     * @returns {Ciphertext} The encrypted ciphertext.
     * @param {Address} address
     * @param {Scalar} randomizer
     * @returns {Ciphertext}
     */
    encrypt(address, randomizer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(address, Address);
            _assertClass(randomizer, Scalar);
            wasm.plaintext_encrypt(retptr, this.__wbg_ptr, address.__wbg_ptr, randomizer.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Ciphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the field array representation of the plaintext.
     *
     * @returns {Array} The field array representation of the plaintext.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Attempt to convert the plaintext to a JS object.
     *
     * @returns {Object} The JS object representation of the plaintext.
     * @returns {any}
     */
    toObject() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_toObject(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the string representation of the plaintext.
     *
     * @returns {string} The string representation of the plaintext.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.plaintext_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Plaintext.prototype[Symbol.dispose] = Plaintext.prototype.free;

const Poseidon2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_poseidon2_free(ptr >>> 0, 1));

class Poseidon2 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Poseidon2.prototype);
        obj.__wbg_ptr = ptr;
        Poseidon2Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

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
     * Returns the Poseidon hash with an input rate of 2 on the affine curve.
     * @param {Array<any>} input
     * @returns {Group}
     */
    hashToGroup(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon2_hashToGroup(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the Poseidon hash with an input rate of 2 on the scalar field.
     * @param {Array<any>} input
     * @returns {Scalar}
     */
    hashToScalar(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon2_hashToScalar(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Scalar.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Poseidon hasher with an input rate of 2.
     */
    constructor() {
        const ret = wasm.poseidon2_new();
        this.__wbg_ptr = ret >>> 0;
        Poseidon2Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the Poseidon hash with an input rate of 2.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon2_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Poseidon hasher with an input rate of 2 and a custom domain separator.
     * @param {string} domain_separator
     * @returns {Poseidon2}
     */
    static setup(domain_separator) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.poseidon2_setup(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Poseidon2.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the extended Poseidon hash with an input rate of 2.
     * @param {Array<any>} input
     * @param {number} num_outputs
     * @returns {Array<any>}
     */
    hashMany(input, num_outputs) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon2_hashMany(retptr, this.__wbg_ptr, addHeapObject(input), num_outputs);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) Poseidon2.prototype[Symbol.dispose] = Poseidon2.prototype.free;

const Poseidon4Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_poseidon4_free(ptr >>> 0, 1));

class Poseidon4 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Poseidon4.prototype);
        obj.__wbg_ptr = ptr;
        Poseidon4Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Poseidon4Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_poseidon4_free(ptr, 0);
    }
    /**
     * Returns the Poseidon hash with an input rate of 4 on the affine curve.
     * @param {Array<any>} input
     * @returns {Group}
     */
    hashToGroup(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon4_hashToGroup(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the Poseidon hash with an input rate of 4 on the scalar field.
     * @param {Array<any>} input
     * @returns {Scalar}
     */
    hashToScalar(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon4_hashToScalar(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Scalar.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Poseidon hasher with an input rate of 4.
     */
    constructor() {
        const ret = wasm.poseidon4_new();
        this.__wbg_ptr = ret >>> 0;
        Poseidon4Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the Poseidon hash with an input rate of 4.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon4_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Poseidon hasher with an input rate of 4 and a custom domain separator.
     * @param {string} domain_separator
     * @returns {Poseidon4}
     */
    static setup(domain_separator) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.poseidon4_setup(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Poseidon4.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the extended Poseidon hash with an input rate of 4.
     * @param {Array<any>} input
     * @param {number} num_outputs
     * @returns {Array<any>}
     */
    hashMany(input, num_outputs) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon4_hashMany(retptr, this.__wbg_ptr, addHeapObject(input), num_outputs);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) Poseidon4.prototype[Symbol.dispose] = Poseidon4.prototype.free;

const Poseidon8Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_poseidon8_free(ptr >>> 0, 1));

class Poseidon8 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Poseidon8.prototype);
        obj.__wbg_ptr = ptr;
        Poseidon8Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Poseidon8Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_poseidon8_free(ptr, 0);
    }
    /**
     * Returns the Poseidon hash with an input rate of 8 on the affine curve.
     * @param {Array<any>} input
     * @returns {Group}
     */
    hashToGroup(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon8_hashToGroup(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the Poseidon hash with an input rate of 8 on the scalar field.
     * @param {Array<any>} input
     * @returns {Scalar}
     */
    hashToScalar(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon8_hashToScalar(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Scalar.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Poseidon hasher with an input rate of 8.
     */
    constructor() {
        const ret = wasm.poseidon8_new();
        this.__wbg_ptr = ret >>> 0;
        Poseidon8Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the Poseidon hash with an input rate of 8.
     * @param {Array<any>} input
     * @returns {Field}
     */
    hash(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon8_hash(retptr, this.__wbg_ptr, addHeapObject(input));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a Poseidon hasher with an input rate of 8 and a custom domain separator.
     * @param {string} domain_separator
     * @returns {Poseidon8}
     */
    static setup(domain_separator) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(domain_separator, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.poseidon8_setup(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Poseidon8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the extended Poseidon hash with an input rate of 8.
     * @param {Array<any>} input
     * @param {number} num_outputs
     * @returns {Array<any>}
     */
    hashMany(input, num_outputs) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.poseidon8_hashMany(retptr, this.__wbg_ptr, addHeapObject(input), num_outputs);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) Poseidon8.prototype[Symbol.dispose] = Poseidon8.prototype.free;

const PrivateKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_privatekey_free(ptr >>> 0, 1));
/**
 * Private key of an Aleo account
 */
class PrivateKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PrivateKey.prototype);
        obj.__wbg_ptr = ptr;
        PrivateKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PrivateKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_privatekey_free(ptr, 0);
    }
    /**
     * Sign an instance of a valid Aleo data type or record.
     *
     * @param {String} message The string representation of the Aleo datatype or record to sign.
     * @returns {Signature} Signature of the message.
     * @param {string} message
     * @returns {Signature}
     */
    signValue(message) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(message, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekey_signValue(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Signature.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the address corresponding to the private key
     *
     * @returns {Address}
     * @returns {Address}
     */
    to_address() {
        const ret = wasm.privatekey_to_address(this.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Get a private key from a string representation of a private key
     *
     * @param {string} seed String representation of a private key
     * @returns {PrivateKey}
     * @param {string} private_key
     * @returns {PrivateKey}
     */
    static from_string(private_key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(private_key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekey_from_string(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return PrivateKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte representation of a private key
     *
     * @returns {Uint8Array} Byte representation of a private key
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.privatekey_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the view key corresponding to the private key
     *
     * @returns {ViewKey}
     * @returns {ViewKey}
     */
    to_view_key() {
        const ret = wasm.privatekey_to_view_key(this.__wbg_ptr);
        return ViewKey.__wrap(ret);
    }
    /**
     * Get a string representation of the private key. This function should be used very carefully
     * as it exposes the private key plaintext
     *
     * @returns {string} String representation of a private key
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.privatekey_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get a private key from a byte representation
     *
     * @param {Uint8Array} bytes Byte representation of a private key
     * @returns {PrivateKey} Private key
     * @param {Uint8Array} bytes
     * @returns {PrivateKey}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekey_fromBytesLe(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return PrivateKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a new randomly generated private key ciphertext using a secret. The secret is sensitive
     * and will be needed to decrypt the private key later, so it should be stored securely
     *
     * @param {string} secret Secret used to encrypt the private key
     * @returns {PrivateKeyCiphertext} Ciphertext representation of the private key
     * @param {string} secret
     * @returns {PrivateKeyCiphertext}
     */
    static newEncrypted(secret) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(secret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekey_newEncrypted(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return PrivateKeyCiphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encrypt an existing private key with a secret. The secret is sensitive and will be needed to
     * decrypt the private key later, so it should be stored securely
     *
     * @param {string} secret Secret used to encrypt the private key
     * @returns {PrivateKeyCiphertext} Ciphertext representation of the private key
     * @param {string} secret
     * @returns {PrivateKeyCiphertext}
     */
    toCiphertext(secret) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(secret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekey_toCiphertext(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return PrivateKeyCiphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a private key from a series of unchecked bytes
     *
     * @param {Uint8Array} seed Unchecked 32 byte long Uint8Array acting as the seed for the private key
     * @returns {PrivateKey}
     * @param {Uint8Array} seed
     * @returns {PrivateKey}
     */
    static from_seed_unchecked(seed) {
        const ptr0 = passArray8ToWasm0(seed, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.privatekey_from_seed_unchecked(ptr0, len0);
        return PrivateKey.__wrap(ret);
    }
    /**
     * Get private key from a private key ciphertext and secret originally used to encrypt it
     *
     * @param {PrivateKeyCiphertext} ciphertext Ciphertext representation of the private key
     * @param {string} secret Secret originally used to encrypt the private key
     * @returns {PrivateKey} Private key
     * @param {PrivateKeyCiphertext} ciphertext
     * @param {string} secret
     * @returns {PrivateKey}
     */
    static fromPrivateKeyCiphertext(ciphertext, secret) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(ciphertext, PrivateKeyCiphertext);
            const ptr0 = passStringToWasm0(secret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekey_fromPrivateKeyCiphertext(retptr, ciphertext.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return PrivateKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Generate a new private key using a cryptographically secure random number generator
     *
     * @returns {PrivateKey}
     */
    constructor() {
        const ret = wasm.privatekey_new();
        this.__wbg_ptr = ret >>> 0;
        PrivateKeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Sign a message with the private key
     *
     * @param {Uint8Array} Byte array representing a message signed by the address
     * @returns {Signature} Signature generated by signing the message with the address
     * @param {Uint8Array} message
     * @returns {Signature}
     */
    sign(message) {
        const ptr0 = passArray8ToWasm0(message, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.privatekey_sign(this.__wbg_ptr, ptr0, len0);
        return Signature.__wrap(ret);
    }
    /**
     * Get a string representation of the private key. This function should be used very carefully
     * as it exposes the private key plaintext
     *
     * @returns {string} String representation of a private key
     * @returns {string}
     */
    to_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.privatekey_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) PrivateKey.prototype[Symbol.dispose] = PrivateKey.prototype.free;

const PrivateKeyCiphertextFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_privatekeyciphertext_free(ptr >>> 0, 1));
/**
 * Private Key in ciphertext form
 */
class PrivateKeyCiphertext {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PrivateKeyCiphertext.prototype);
        obj.__wbg_ptr = ptr;
        PrivateKeyCiphertextFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PrivateKeyCiphertextFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_privatekeyciphertext_free(ptr, 0);
    }
    /**
     * Creates a PrivateKeyCiphertext from a string
     *
     * @param {string} ciphertext Ciphertext string
     * @returns {PrivateKeyCiphertext} Private key ciphertext
     * @param {string} ciphertext
     * @returns {PrivateKeyCiphertext}
     */
    static fromString(ciphertext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(ciphertext, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekeyciphertext_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return PrivateKeyCiphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encrypt a private key using a secret string. The secret is sensitive and will be needed to
     * decrypt the private key later, so it should be stored securely
     *
     * @param {PrivateKey} private_key Private key to encrypt
     * @param {string} secret Secret to encrypt the private key with
     * @returns {PrivateKeyCiphertext} Private key ciphertext
     * @param {PrivateKey} private_key
     * @param {string} secret
     * @returns {PrivateKeyCiphertext}
     */
    static encryptPrivateKey(private_key, secret) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(private_key, PrivateKey);
            const ptr0 = passStringToWasm0(secret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekey_toCiphertext(retptr, private_key.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return PrivateKeyCiphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypts a private ciphertext using a secret string. This must be the same secret used to
     * encrypt the private key
     *
     * @param {string} secret Secret used to encrypt the private key
     * @returns {PrivateKey} Private key
     * @param {string} secret
     * @returns {PrivateKey}
     */
    decryptToPrivateKey(secret) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(secret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.privatekeyciphertext_decryptToPrivateKey(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return PrivateKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the ciphertext string
     *
     * @returns {string} Ciphertext string
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ciphertext_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) PrivateKeyCiphertext.prototype[Symbol.dispose] = PrivateKeyCiphertext.prototype.free;

const ProgramFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_program_free(ptr >>> 0, 1));
/**
 * Webassembly Representation of an Aleo program
 */
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
    /**
     * Create a program from a program string
     *
     * @param {string} program Aleo program source code
     * @returns {Program} Program object
     * @param {string} program
     * @returns {Program}
     */
    static fromString(program) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.program_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Program.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get program_imports
     *
     * @returns {Array} The program imports
     *
     * @example
     *
     * const DOUBLE_TEST = "import multiply_test.aleo;
     *
     * program double_test.aleo;
     *
     * function double_it:
     *     input r0 as u32.private;
     *     call multiply_test.aleo/multiply 2u32 r0 into r1;
     *     output r1 as u32.private;";
     *
     * const expected_imports = [
     *    "multiply_test.aleo"
     * ];
     *
     * const program = aleo_wasm.Program.fromString(DOUBLE_TEST_PROGRAM);
     * const imports = program.getImports();
     * console.log(imports === expected_imports); // Output should be "true"
     * @returns {Array<any>}
     */
    getImports() {
        const ret = wasm.program_getImports(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get the checksum of the program.
     *
     * @returns {Uint8Array} The checksum of the program as a 32-byte Uint8Array
     * @returns {Uint8Array}
     */
    toChecksum() {
        const ret = wasm.program_toChecksum(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get a the list of a program's mappings and the names/types of their keys and values.
     *
     * @returns {Array} - An array of objects representing the mappings in the program
     * @example
     * const expected_mappings = [
     *    {
     *       name: "account",
     *       key_name: "owner",
     *       key_type: "address",
     *       value_name: "microcredits",
     *       value_type: "u64"
     *    }
     * ]
     *
     * const credits_program = aleo_wasm.Program.getCreditsProgram();
     * const credits_mappings = credits_program.getMappings();
     * console.log(credits_mappings === expected_mappings); // Output should be "true"
     * @returns {Array<any>}
     */
    getMappings() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.program_getMappings(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Determine if a function is present in the program
     *
     * @param {string} functionName Name of the function to check for
     * @returns {boolean} True if the program is valid, false otherwise
     * @param {string} function_name
     * @returns {boolean}
     */
    hasFunction(function_name) {
        const ptr0 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.program_hasFunction(this.__wbg_ptr, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Get javascript array of functions names in the program
     *
     * @returns {Array} Array of all function names present in the program
     *
     * @example
     * const expected_functions = [
     *   "mint",
     *   "transfer_private",
     *   "transfer_private_to_public",
     *   "transfer_public",
     *   "transfer_public_to_private",
     *   "join",
     *   "split",
     *   "fee"
     * ]
     *
     * const credits_program = aleo_wasm.Program.getCreditsProgram();
     * const credits_functions = credits_program.getFunctions();
     * console.log(credits_functions === expected_functions); // Output should be "true"
     * @returns {Array<any>}
     */
    getFunctions() {
        const ret = wasm.program_getFunctions(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get a javascript object representation of a program record and its types
     *
     * @param {string} record_name Name of the record to get members for
     * @returns {Object} Object containing the record name, type, and members
     *
     * @example
     *
     * const expected_record = {
     *     type: "record",
     *     record: "Credits",
     *     members: [
     *       {
     *         name: "owner",
     *         type: "address",
     *         visibility: "private"
     *       },
     *       {
     *         name: "microcredits",
     *         type: "u64",
     *         visibility: "private"
     *       }
     *     ];
     *  };
     *
     * const credits_program = aleo_wasm.Program.getCreditsProgram();
     * const credits_record = credits_program.getRecordMembers("Credits");
     * console.log(credits_record === expected_record); // Output should be "true"
     * @param {string} record_name
     * @returns {object}
     */
    getRecordMembers(record_name) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(record_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.program_getRecordMembers(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a javascript object representation of a program struct and its types
     *
     * @param {string} struct_name Name of the struct to get members for
     * @returns {Array} Array containing the struct members
     *
     * @example
     *
     * const STRUCT_PROGRAM = "program token_issue.aleo;
     *
     * struct token_metadata:
     *     network as u32;
     *     version as u32;
     *
     * struct token:
     *     token_id as u32;
     *     metadata as token_metadata;
     *
     * function no_op:
     *    input r0 as u64;
     *    output r0 as u64;"
     *
     * const expected_struct_members = [
     *    {
     *      name: "token_id",
     *      type: "u32",
     *    },
     *    {
     *      name: "metadata",
     *      type: "struct",
     *      struct_id: "token_metadata",
     *      members: [
     *       {
     *         name: "network",
     *         type: "u32",
     *       }
     *       {
     *         name: "version",
     *         type: "u32",
     *       }
     *     ]
     *   }
     * ];
     *
     * const program = aleo_wasm.Program.fromString(STRUCT_PROGRAM);
     * const struct_members = program.getStructMembers("token");
     * console.log(struct_members === expected_struct_members); // Output should be "true"
     * @param {string} struct_name
     * @returns {Array<any>}
     */
    getStructMembers(struct_name) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(struct_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.program_getStructMembers(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the credits.aleo program
     *
     * @returns {Program} The credits.aleo program
     * @returns {Program}
     */
    static getCreditsProgram() {
        const ret = wasm.program_getCreditsProgram();
        return Program.__wrap(ret);
    }
    /**
     * Get a javascript object representation of the function inputs and types. This can be used
     * to generate a web form to capture user inputs for an execution of a function.
     *
     * @param {string} function_name Name of the function to get inputs for
     * @returns {Array} Array of function inputs
     *
     * @example
     * const expected_inputs = [
     *     {
     *       type:"record",
     *       visibility:"private",
     *       record:"credits",
     *       members:[
     *         {
     *           name:"microcredits",
     *           type:"u64",
     *           visibility:"private"
     *         }
     *       ],
     *       register:"r0"
     *     },
     *     {
     *       type:"address",
     *       visibility:"private",
     *       register:"r1"
     *     },
     *     {
     *       type:"u64",
     *       visibility:"private",
     *       register:"r2"
     *     }
     * ];
     *
     * const credits_program = aleo_wasm.Program.getCreditsProgram();
     * const transfer_function_inputs = credits_program.getFunctionInputs("transfer_private");
     * console.log(transfer_function_inputs === expected_inputs); // Output should be "true"
     * @param {string} function_name
     * @returns {Array<any>}
     */
    getFunctionInputs(function_name) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.program_getFunctionInputs(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the id of the program
     *
     * @returns {string} The id of the program
     * @returns {string}
     */
    id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.program_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get a unique address of the program
     *
     * @returns {Address} The address of the program
     * @returns {Address}
     */
    address() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.program_address(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Determine equality with another program
     *
     * @param {Program} other The other program to compare
     * @returns {boolean} True if the programs are equal, false otherwise
     * @param {Program} other
     * @returns {boolean}
     */
    isEqual(other) {
        _assertClass(other, Program);
        const ret = wasm.program_isEqual(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get a string representation of the program
     *
     * @returns {string} String containing the program source code
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.program_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Program.prototype[Symbol.dispose] = Program.prototype.free;

const ProgramManagerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_programmanager_free(ptr >>> 0, 1));

class ProgramManager {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProgramManagerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_programmanager_free(ptr, 0);
    }
    /**
     * Synthesize proving and verifying keys for a program
     *
     * @param {string} program The program source code of the program to synthesize keys for
     * @param {string} function_id The function to synthesize keys for
     * @param {Array} inputs The inputs to the function
     * @param {Object | undefined} imports The imports for the program
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {string} function_id
     * @param {Array<any>} inputs
     * @param {object | null} [imports]
     * @param {number | null} [edition]
     * @returns {Promise<KeyPair>}
     */
    static synthesizeKeyPair(private_key, program, function_id, inputs, imports, edition) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(function_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.programmanager_synthesizeKeyPair(private_key.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), isLikeNone(imports) ? 0 : addHeapObject(imports), isLikeNone(edition) ? 0xFFFFFF : edition);
        return takeObject(ret);
    }
    /**
     * @param {ProvingKey} proving_key
     */
    static loadInclusionProver(proving_key) {
        _assertClass(proving_key, ProvingKey);
        var ptr0 = proving_key.__destroy_into_raw();
        wasm.programmanager_loadInclusionProver(ptr0);
    }
    /**
     * Create a `ProvingRequest` object. This object creates authorizations for the top level
     * function and associated fee function. This object can be sent directly to a remote prover
     * OR used to extract both execution and fee authorizations.
     *
     * @param private_key The private key of the signer.
     * @param program The program source code containing the function to authorize.
     * @param function_name The function to authorize.
     * @param inputs A javascript array of inputs to the function.
     * @param base_fee_credits The base fee to be paid for the authorization
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
     * @param url The url of the Aleo network node to send the transaction to
     * @param broadcast (optional) Flag to indicate if the transaction should be broadcast
     * @returns {Authorization}
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {number} base_fee_credits
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null | undefined} fee_record
     * @param {object | null | undefined} imports
     * @param {boolean} broadcast
     * @param {boolean} unchecked
     * @param {number | null | undefined} edition
     * @param {boolean} use_fee_master
     * @returns {Promise<ProvingRequest>}
     */
    static buildProvingRequest(private_key, program, function_name, inputs, base_fee_credits, priority_fee_credits, fee_record, imports, broadcast, unchecked, edition, use_fee_master) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr2 = fee_record.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildProvingRequest(private_key.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), base_fee_credits, priority_fee_credits, ptr2, isLikeNone(imports) ? 0 : addHeapObject(imports), broadcast, unchecked, isLikeNone(edition) ? 0xFFFFFF : edition, use_fee_master);
        return takeObject(ret);
    }
    /**
     * Build a proving request from a `Request` object. By default this method currently uses the feemaster.
     *
     * @param {ExecutionRequest} request The execution request to build the authorization from.
     * @param {string} program The program source code containing the function to authorize.
     * @param {boolean} unchecked Whether or not to generate an unchecked authorization.
     * @param {boolean} broadcast Whether or not to broadcast the transaction.
     * @param {number | undefined} edition The edition of the program.
     * @param {object | undefined} imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
     * @param {PrivateKey | undefined} [private_key] Optional private key of the signer. If not provided, functions which call other programs may not succeed.
     * @param {ExecutionRequest} request
     * @param {string} program
     * @param {boolean} unchecked
     * @param {boolean} broadcast
     * @param {number | null} [edition]
     * @param {object | null} [imports]
     * @param {PrivateKey | null} [private_key]
     * @returns {Promise<ProvingRequest>}
     */
    static buildProvingRequestFromExecutionRequest(request, program, unchecked, broadcast, edition, imports, private_key) {
        _assertClass(request, ExecutionRequest);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        let ptr1 = 0;
        if (!isLikeNone(private_key)) {
            _assertClass(private_key, PrivateKey);
            ptr1 = private_key.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildProvingRequestFromExecutionRequest(request.__wbg_ptr, ptr0, len0, unchecked, broadcast, isLikeNone(edition) ? 0xFFFFFF : edition, isLikeNone(imports) ? 0 : addHeapObject(imports), ptr1);
        return takeObject(ret);
    }
    /**
     * Join two records together to create a new record with an amount of credits equal to the sum
     * of the credits of the two original records
     *
     * @param private_key The private key of the sender
     * @param record_1 The first record to combine
     * @param record_2 The second record to combine
     * @param priority_fee_credits The opptional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param url The url of the Aleo network node to send the transaction to
     * @param join_proving_key (optional) Provide a proving key to use for the join function
     * @param join_verifying_key (optional) Provide a verifying key to use for the join function
     * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
     * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
     * @returns {Transaction} Transaction object
     * @param {PrivateKey} private_key
     * @param {RecordPlaintext} record_1
     * @param {RecordPlaintext} record_2
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @param {string | null} [url]
     * @param {ProvingKey | null} [join_proving_key]
     * @param {VerifyingKey | null} [join_verifying_key]
     * @param {ProvingKey | null} [fee_proving_key]
     * @param {VerifyingKey | null} [fee_verifying_key]
     * @param {QueryOption | null} [query]
     * @returns {Promise<Transaction>}
     */
    static buildJoinTransaction(private_key, record_1, record_2, priority_fee_credits, fee_record, url, join_proving_key, join_verifying_key, fee_proving_key, fee_verifying_key, query) {
        _assertClass(private_key, PrivateKey);
        _assertClass(record_1, RecordPlaintext);
        var ptr0 = record_1.__destroy_into_raw();
        _assertClass(record_2, RecordPlaintext);
        var ptr1 = record_2.__destroy_into_raw();
        let ptr2 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr2 = fee_record.__destroy_into_raw();
        }
        var ptr3 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len3 = WASM_VECTOR_LEN;
        let ptr4 = 0;
        if (!isLikeNone(join_proving_key)) {
            _assertClass(join_proving_key, ProvingKey);
            ptr4 = join_proving_key.__destroy_into_raw();
        }
        let ptr5 = 0;
        if (!isLikeNone(join_verifying_key)) {
            _assertClass(join_verifying_key, VerifyingKey);
            ptr5 = join_verifying_key.__destroy_into_raw();
        }
        let ptr6 = 0;
        if (!isLikeNone(fee_proving_key)) {
            _assertClass(fee_proving_key, ProvingKey);
            ptr6 = fee_proving_key.__destroy_into_raw();
        }
        let ptr7 = 0;
        if (!isLikeNone(fee_verifying_key)) {
            _assertClass(fee_verifying_key, VerifyingKey);
            ptr7 = fee_verifying_key.__destroy_into_raw();
        }
        let ptr8 = 0;
        if (!isLikeNone(query)) {
            _assertClass(query, QueryOption);
            ptr8 = query.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildJoinTransaction(private_key.__wbg_ptr, ptr0, ptr1, priority_fee_credits, ptr2, ptr3, len3, ptr4, ptr5, ptr6, ptr7, ptr8);
        return takeObject(ret);
    }
    /**
     * Split an Aleo credits record into two separate records. This function does not require a fee.
     *
     * @param private_key The private key of the sender
     * @param split_amount The amount of the credit split. This amount will be subtracted from the
     * value of the record and two new records will be created with the split amount and the remainder
     * @param amount_record The record to split
     * @param url The url of the Aleo network node to send the transaction to
     * @param split_proving_key (optional) Provide a proving key to use for the split function
     * @param split_verifying_key (optional) Provide a verifying key to use for the split function
     * @returns {Transaction} Transaction object
     * @param {PrivateKey} private_key
     * @param {number} split_amount
     * @param {RecordPlaintext} amount_record
     * @param {string | null} [url]
     * @param {ProvingKey | null} [split_proving_key]
     * @param {VerifyingKey | null} [split_verifying_key]
     * @param {QueryOption | null} [query]
     * @returns {Promise<Transaction>}
     */
    static buildSplitTransaction(private_key, split_amount, amount_record, url, split_proving_key, split_verifying_key, query) {
        _assertClass(private_key, PrivateKey);
        _assertClass(amount_record, RecordPlaintext);
        var ptr0 = amount_record.__destroy_into_raw();
        var ptr1 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(split_proving_key)) {
            _assertClass(split_proving_key, ProvingKey);
            ptr2 = split_proving_key.__destroy_into_raw();
        }
        let ptr3 = 0;
        if (!isLikeNone(split_verifying_key)) {
            _assertClass(split_verifying_key, VerifyingKey);
            ptr3 = split_verifying_key.__destroy_into_raw();
        }
        let ptr4 = 0;
        if (!isLikeNone(query)) {
            _assertClass(query, QueryOption);
            ptr4 = query.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildSplitTransaction(private_key.__wbg_ptr, split_amount, ptr0, ptr1, len1, ptr2, ptr3, ptr4);
        return takeObject(ret);
    }
    /**
     * Deploy an Aleo program without synthesizing keys and generating certificates.
     * Intended for use with Leo Devnode.
     *
     * @param private_key The private key of the sender
     * @param program The source code of the program being deployed
     * @param imports A javascript object holding the source code of any imported programs in the
     * form \{"program_name1": "program_source_code", "program_name2": "program_source_code", ..\}.
     * Note that all imported programs must be deployed on chain before the main program in order
     * for the deployment to succeed
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param url The url of the Aleo network node to send the transaction to
     * @param imports (optional) Provide a list of imports to use for the program deployment in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
     * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
     * @returns {Transaction}
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @param {string | null} [url]
     * @param {object | null} [imports]
     * @returns {Promise<Transaction>}
     */
    static buildDevnodeDeploymentTransaction(private_key, program, priority_fee_credits, fee_record, url, imports) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        let ptr1 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr1 = fee_record.__destroy_into_raw();
        }
        var ptr2 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len2 = WASM_VECTOR_LEN;
        const ret = wasm.programmanager_buildDevnodeDeploymentTransaction(private_key.__wbg_ptr, ptr0, len0, priority_fee_credits, ptr1, ptr2, len2, isLikeNone(imports) ? 0 : addHeapObject(imports));
        return takeObject(ret);
    }
    /**
     * Upgrade a deployed Aleo program without synthesizing keys and generating certificates.
     * Intended for use with Leo Devnode.
     *
     * @param private_key The private key of the sender
     * @param program The source code of the upgraded program
     * @param imports A javascript object holding the source code of any imported programs in the
     * form \{"program_name1": "program_source_code", "program_name2": "program_source_code", ..\}.
     * Note that all imported programs must be deployed on chain before the main program in order
     * for the deployment to succeed
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param url The url of the Aleo network node to send the transaction to
     * @param imports (optional) Provide a list of imports to use for the program deployment in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
     * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
     * @returns {Transaction}
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @param {string | null} [url]
     * @param {object | null} [imports]
     * @returns {Promise<Transaction>}
     */
    static buildDevnodeUpgradeTransaction(private_key, program, priority_fee_credits, fee_record, url, imports) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        let ptr1 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr1 = fee_record.__destroy_into_raw();
        }
        var ptr2 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len2 = WASM_VECTOR_LEN;
        const ret = wasm.programmanager_buildDevnodeUpgradeTransaction(private_key.__wbg_ptr, ptr0, len0, priority_fee_credits, ptr1, ptr2, len2, isLikeNone(imports) ? 0 : addHeapObject(imports));
        return takeObject(ret);
    }
    /**
     * Estimate the component of the deployment cost which comes from the fee for the program name.
     * Note that this cost does not represent the entire cost of deployment. It is additional to
     * the cost of the size (in bytes) of the deployment.
     *
     * Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
     *
     * @param name The name of the program to be deployed
     * @returns {u64}
     * @param {string} name
     * @returns {bigint}
     */
    static estimateProgramNameCost(name) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.programmanager_estimateProgramNameCost(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getBigInt64(retptr + 8 * 0, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            return BigInt.asUintN(64, r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Estimate the fee for a program deployment
     *
     * Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
     *
     * @param program The source code of the program being deployed
     * @param imports (optional) Provide a list of imports to use for the deployment fee estimation
     * in the form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @returns {u64}
     * @param {string} program
     * @param {object | null} [imports]
     * @returns {Promise<bigint>}
     */
    static estimateDeploymentFee(program, imports) {
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.programmanager_estimateDeploymentFee(ptr0, len0, isLikeNone(imports) ? 0 : addHeapObject(imports));
        return takeObject(ret);
    }
    /**
     * Deploy an Aleo program
     *
     * @param private_key The private key of the sender
     * @param program The source code of the program being deployed
     * @param imports A javascript object holding the source code of any imported programs in the
     * form \{"program_name1": "program_source_code", "program_name2": "program_source_code", ..\}.
     * Note that all imported programs must be deployed on chain before the main program in order
     * for the deployment to succeed
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param url The url of the Aleo network node to send the transaction to
     * @param imports (optional) Provide a list of imports to use for the program deployment in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
     * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
     * @returns {Transaction}
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @param {string | null} [url]
     * @param {object | null} [imports]
     * @param {ProvingKey | null} [fee_proving_key]
     * @param {VerifyingKey | null} [fee_verifying_key]
     * @param {OfflineQuery | null} [offline_query]
     * @returns {Promise<Transaction>}
     */
    static buildDeploymentTransaction(private_key, program, priority_fee_credits, fee_record, url, imports, fee_proving_key, fee_verifying_key, offline_query) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        let ptr1 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr1 = fee_record.__destroy_into_raw();
        }
        var ptr2 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len2 = WASM_VECTOR_LEN;
        let ptr3 = 0;
        if (!isLikeNone(fee_proving_key)) {
            _assertClass(fee_proving_key, ProvingKey);
            ptr3 = fee_proving_key.__destroy_into_raw();
        }
        let ptr4 = 0;
        if (!isLikeNone(fee_verifying_key)) {
            _assertClass(fee_verifying_key, VerifyingKey);
            ptr4 = fee_verifying_key.__destroy_into_raw();
        }
        let ptr5 = 0;
        if (!isLikeNone(offline_query)) {
            _assertClass(offline_query, OfflineQuery);
            ptr5 = offline_query.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildDeploymentTransaction(private_key.__wbg_ptr, ptr0, len0, priority_fee_credits, ptr1, ptr2, len2, isLikeNone(imports) ? 0 : addHeapObject(imports), ptr3, ptr4, ptr5);
        return takeObject(ret);
    }
    /**
     * Upgrade an Aleo program
     *
     * @param private_key The private key of the sender
     * @param program The source code of the program being upgraded
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param url The url of the Aleo network node to send the transaction to
     * @param imports (optional) Provide a list of imports to use for the program deployment in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * Note that all imported programs must be deployed on chain before the main program in order
     * for the deployment to succeed
     * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
     * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
     * @returns {Transaction}
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @param {string | null} [url]
     * @param {object | null} [imports]
     * @param {ProvingKey | null} [fee_proving_key]
     * @param {VerifyingKey | null} [fee_verifying_key]
     * @param {OfflineQuery | null} [offline_query]
     * @returns {Promise<Transaction>}
     */
    static buildUpgradeTransaction(private_key, program, priority_fee_credits, fee_record, url, imports, fee_proving_key, fee_verifying_key, offline_query) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        let ptr1 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr1 = fee_record.__destroy_into_raw();
        }
        var ptr2 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len2 = WASM_VECTOR_LEN;
        let ptr3 = 0;
        if (!isLikeNone(fee_proving_key)) {
            _assertClass(fee_proving_key, ProvingKey);
            ptr3 = fee_proving_key.__destroy_into_raw();
        }
        let ptr4 = 0;
        if (!isLikeNone(fee_verifying_key)) {
            _assertClass(fee_verifying_key, VerifyingKey);
            ptr4 = fee_verifying_key.__destroy_into_raw();
        }
        let ptr5 = 0;
        if (!isLikeNone(offline_query)) {
            _assertClass(offline_query, OfflineQuery);
            ptr5 = offline_query.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildUpgradeTransaction(private_key.__wbg_ptr, ptr0, len0, priority_fee_credits, ptr1, ptr2, len2, isLikeNone(imports) ? 0 : addHeapObject(imports), ptr3, ptr4, ptr5);
        return takeObject(ret);
    }
    /**
     * Generate an execution transaction without a proof.
     * Intended for use with the Leo devnode tool.
     *
     * @param private_key The private key of the sender
     * @param program The source code of the program being executed
     * @param function The name of the function to execute
     * @param inputs A javascript array of inputs to the function
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param url The url of the Aleo network node to send the transaction to
     * If this is set to 'true' the keys synthesized (or passed in as optional parameters via the
     * `proving_key` and `verifying_key` arguments) will be stored in the ProgramManager's memory
     * and used for subsequent transactions. If this is set to 'false' the proving and verifying
     * keys will be deallocated from memory after the transaction is executed.
     * @param imports (optional) Provide a list of imports to use for the function execution in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @param proving_key (optional) Provide a verifying key to use for the function execution
     * @param verifying_key (optional) Provide a verifying key to use for the function execution
     * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
     * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
     * @param offline_query An offline query object to use if building a transaction without an internet connection.
     * @param edition The edition of the program to execute. Defaults to the latest found on the network, or 1 if the program does not exist on the network.
     * @returns {Transaction}
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {string} _function
     * @param {Array<any>} inputs
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @param {string | null} [url]
     * @param {object | null} [imports]
     * @param {number | null} [edition]
     * @returns {Promise<Transaction>}
     */
    static buildDevnodeExecutionTransaction(private_key, program, _function, inputs, priority_fee_credits, fee_record, url, imports, edition) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(_function, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr2 = fee_record.__destroy_into_raw();
        }
        var ptr3 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len3 = WASM_VECTOR_LEN;
        const ret = wasm.programmanager_buildDevnodeExecutionTransaction(private_key.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), priority_fee_credits, ptr2, ptr3, len3, isLikeNone(imports) ? 0 : addHeapObject(imports), isLikeNone(edition) ? 0xFFFFFF : edition);
        return takeObject(ret);
    }
    /**
     * Estimate the finalize fee component for executing a function. This fee is additional to the
     * size of the execution of the program in bytes. If the function does not have a finalize
     * step, then the finalize fee is 0.
     *
     * Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
     *
     * @param program The program containing the function to estimate the finalize fee for
     * @param function The function to estimate the finalize fee for
     * @returns {u64} Fee in microcredits
     * @param {string} program
     * @param {string} _function
     * @returns {bigint}
     */
    static estimateFinalizeFee(program, _function) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(_function, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            wasm.programmanager_estimateFinalizeFee(retptr, ptr0, len0, ptr1, len1);
            var r0 = getDataViewMemory0().getBigInt64(retptr + 8 * 0, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            return BigInt.asUintN(64, r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Execute an authorization.
     *
     * @param authorization The authorization to execute.
     * @param fee_authorization The fee authorization to execute.
     * @param program The program authorized to be executed.
     * @param imports The imports of the program being executed.
     * @param url The url to get the inclusion proving information from.
     * @param offline_query Optional offline query object if building a Transaction offline.
     * @param {Authorization} authorization
     * @param {Authorization | null | undefined} fee_authorization
     * @param {string} program
     * @param {ProvingKey | null} [proving_key]
     * @param {VerifyingKey | null} [verifying_key]
     * @param {ProvingKey | null} [fee_proving_key]
     * @param {VerifyingKey | null} [fee_verifying_key]
     * @param {object | null} [imports]
     * @param {string | null} [url]
     * @param {QueryOption | null} [query]
     * @returns {Promise<Transaction>}
     */
    static executeAuthorization(authorization, fee_authorization, program, proving_key, verifying_key, fee_proving_key, fee_verifying_key, imports, url, query) {
        _assertClass(authorization, Authorization);
        var ptr0 = authorization.__destroy_into_raw();
        let ptr1 = 0;
        if (!isLikeNone(fee_authorization)) {
            _assertClass(fee_authorization, Authorization);
            ptr1 = fee_authorization.__destroy_into_raw();
        }
        const ptr2 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        let ptr3 = 0;
        if (!isLikeNone(proving_key)) {
            _assertClass(proving_key, ProvingKey);
            ptr3 = proving_key.__destroy_into_raw();
        }
        let ptr4 = 0;
        if (!isLikeNone(verifying_key)) {
            _assertClass(verifying_key, VerifyingKey);
            ptr4 = verifying_key.__destroy_into_raw();
        }
        let ptr5 = 0;
        if (!isLikeNone(fee_proving_key)) {
            _assertClass(fee_proving_key, ProvingKey);
            ptr5 = fee_proving_key.__destroy_into_raw();
        }
        let ptr6 = 0;
        if (!isLikeNone(fee_verifying_key)) {
            _assertClass(fee_verifying_key, VerifyingKey);
            ptr6 = fee_verifying_key.__destroy_into_raw();
        }
        var ptr7 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len7 = WASM_VECTOR_LEN;
        let ptr8 = 0;
        if (!isLikeNone(query)) {
            _assertClass(query, QueryOption);
            ptr8 = query.__destroy_into_raw();
        }
        const ret = wasm.programmanager_executeAuthorization(ptr0, ptr1, ptr2, len2, ptr3, ptr4, ptr5, ptr6, isLikeNone(imports) ? 0 : addHeapObject(imports), ptr7, len7, ptr8);
        return takeObject(ret);
    }
    /**
     * Estimate Fee for Aleo function execution. Note if "cache" is set to true, the proving and
     * verifying keys will be stored in the ProgramManager's memory and used for subsequent
     * program executions.
     *
     * @param program The source code of the program to estimate the execution fee for.
     * @param function The name of the function to estimate the execution fee for.
     * @param imports (optional) Provide a list of imports to use for the fee estimation in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @param edition {
     * @returns {u64} Fee in microcredits
     * @param {string} program
     * @param {string} _function
     * @param {object | null} [imports]
     * @param {number | null} [edition]
     * @returns {bigint}
     */
    static estimateExecutionFee(program, _function, imports, edition) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(_function, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            wasm.programmanager_estimateExecutionFee(retptr, ptr0, len0, ptr1, len1, isLikeNone(imports) ? 0 : addHeapObject(imports), isLikeNone(edition) ? 0xFFFFFF : edition);
            var r0 = getDataViewMemory0().getBigInt64(retptr + 8 * 0, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            return BigInt.asUintN(64, r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Execute an arbitrary function locally
     *
     * @param {PrivateKey} private_key The private key of the sender
     * @param {string} program The source code of the program being executed
     * @param {string} function The name of the function to execute
     * @param {Array} inputs A javascript array of inputs to the function
     * @param {boolean} prove_execution If true, the execution will be proven and an execution object
     * containing the proof and the encrypted inputs and outputs needed to verify the proof offline
     * will be returned.
     * @param {boolean} cache Cache the proving and verifying keys in the Execution response.
     * If this is set to 'true' the keys synthesized will be stored in the Execution Response
     * and the `ProvingKey` and `VerifyingKey` can be retrieved from the response via the `.getKeys()`
     * method.
     * @param {Object | undefined} imports (optional) Provide a list of imports to use for the function execution in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @param {ProvingKey | undefined} proving_key (optional) Provide a verifying key to use for the function execution
     * @param {VerifyingKey | undefined} verifying_key (optional) Provide a verifying key to use for the function execution
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {string} _function
     * @param {Array<any>} inputs
     * @param {boolean} prove_execution
     * @param {boolean} cache
     * @param {object | null} [imports]
     * @param {ProvingKey | null} [proving_key]
     * @param {VerifyingKey | null} [verifying_key]
     * @param {string | null} [url]
     * @param {QueryOption | null} [query]
     * @param {number | null} [edition]
     * @returns {Promise<ExecutionResponse>}
     */
    static executeFunctionOffline(private_key, program, _function, inputs, prove_execution, cache, imports, proving_key, verifying_key, url, query, edition) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(_function, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(proving_key)) {
            _assertClass(proving_key, ProvingKey);
            ptr2 = proving_key.__destroy_into_raw();
        }
        let ptr3 = 0;
        if (!isLikeNone(verifying_key)) {
            _assertClass(verifying_key, VerifyingKey);
            ptr3 = verifying_key.__destroy_into_raw();
        }
        var ptr4 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len4 = WASM_VECTOR_LEN;
        let ptr5 = 0;
        if (!isLikeNone(query)) {
            _assertClass(query, QueryOption);
            ptr5 = query.__destroy_into_raw();
        }
        const ret = wasm.programmanager_executeFunctionOffline(private_key.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), prove_execution, cache, isLikeNone(imports) ? 0 : addHeapObject(imports), ptr2, ptr3, ptr4, len4, ptr5, isLikeNone(edition) ? 0xFFFFFF : edition);
        return takeObject(ret);
    }
    /**
     * Compute the query requirements for a function execution without making
     * any network calls. Returns the commitments that need state paths and
     * whether the function has dynamic record inputs.
     *
     * This enables the JS layer to pre-fetch state data via its configured
     * transport and construct an OfflineQuery, so that the subsequent WASM
     * execution call never makes its own network requests.
     *
     * @param {string} program The source code of the program
     * @param {string} function_name The name of the function to execute
     * @param {Array} inputs The inputs to the function
     * @param {PrivateKey} private_key The private key (used to derive the view key for commitment computation)
     * @param {RecordPlaintext | undefined} fee_record Optional fee record to include in commitment computation
     * @returns {Object} An object with { commitments: string[], hasDynamicInputs: boolean }
     * @param {string} program
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {PrivateKey} private_key
     * @param {RecordPlaintext | null} [fee_record]
     * @returns {any}
     */
    static computeQueryRequirements(program, function_name, inputs, private_key, fee_record) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            _assertClass(private_key, PrivateKey);
            let ptr2 = 0;
            if (!isLikeNone(fee_record)) {
                _assertClass(fee_record, RecordPlaintext);
                ptr2 = fee_record.__destroy_into_raw();
            }
            wasm.programmanager_computeQueryRequirements(retptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), private_key.__wbg_ptr, ptr2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Estimate Fee for an Authorization.
     *
     * @param authorization Authorization to estimate the fee for.
     * @param program The program the Authorization is for.
     * @param imports Provide a list of imports to use for the fee estimation in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @param offline_query The offline query object used to insert the global state root and state paths needed to create
     * a valid inclusion proof offline.
     * @param edition: Optional edition to estimate the fee for.
     * @returns {u64} Fee in microcredits
     * @param {Authorization} authorization
     * @param {string} program
     * @param {object | null} [imports]
     * @param {number | null} [edition]
     * @returns {bigint}
     */
    static estimateFeeForAuthorization(authorization, program, imports, edition) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(authorization, Authorization);
            const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.programmanager_estimateFeeForAuthorization(retptr, authorization.__wbg_ptr, ptr0, len0, isLikeNone(imports) ? 0 : addHeapObject(imports), isLikeNone(edition) ? 0xFFFFFF : edition);
            var r0 = getDataViewMemory0().getBigInt64(retptr + 8 * 0, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            return BigInt.asUintN(64, r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Execute Aleo function and create an Aleo execution transaction
     *
     * @param private_key The private key of the sender
     * @param program The source code of the program being executed
     * @param function The name of the function to execute
     * @param inputs A javascript array of inputs to the function
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param url The url of the Aleo network node to send the transaction to
     * If this is set to 'true' the keys synthesized (or passed in as optional parameters via the
     * `proving_key` and `verifying_key` arguments) will be stored in the ProgramManager's memory
     * and used for subsequent transactions. If this is set to 'false' the proving and verifying
     * keys will be deallocated from memory after the transaction is executed.
     * @param imports (optional) Provide a list of imports to use for the function execution in the
     * form of a javascript object where the keys are a string of the program name and the values
     * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
     * @param proving_key (optional) Provide a verifying key to use for the function execution
     * @param verifying_key (optional) Provide a verifying key to use for the function execution
     * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
     * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
     * @param offline_query An offline query object to use if building a transaction without an internet connection.
     * @param edition The edition of the program to execute. Defaults to the latest found on the network, or 1 if the program does not exist on the network.
     * @returns {Transaction}
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {string} _function
     * @param {Array<any>} inputs
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @param {string | null} [url]
     * @param {object | null} [imports]
     * @param {ProvingKey | null} [proving_key]
     * @param {VerifyingKey | null} [verifying_key]
     * @param {ProvingKey | null} [fee_proving_key]
     * @param {VerifyingKey | null} [fee_verifying_key]
     * @param {QueryOption | null} [query]
     * @param {number | null} [edition]
     * @returns {Promise<Transaction>}
     */
    static buildExecutionTransaction(private_key, program, _function, inputs, priority_fee_credits, fee_record, url, imports, proving_key, verifying_key, fee_proving_key, fee_verifying_key, query, edition) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(_function, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr2 = fee_record.__destroy_into_raw();
        }
        var ptr3 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len3 = WASM_VECTOR_LEN;
        let ptr4 = 0;
        if (!isLikeNone(proving_key)) {
            _assertClass(proving_key, ProvingKey);
            ptr4 = proving_key.__destroy_into_raw();
        }
        let ptr5 = 0;
        if (!isLikeNone(verifying_key)) {
            _assertClass(verifying_key, VerifyingKey);
            ptr5 = verifying_key.__destroy_into_raw();
        }
        let ptr6 = 0;
        if (!isLikeNone(fee_proving_key)) {
            _assertClass(fee_proving_key, ProvingKey);
            ptr6 = fee_proving_key.__destroy_into_raw();
        }
        let ptr7 = 0;
        if (!isLikeNone(fee_verifying_key)) {
            _assertClass(fee_verifying_key, VerifyingKey);
            ptr7 = fee_verifying_key.__destroy_into_raw();
        }
        let ptr8 = 0;
        if (!isLikeNone(query)) {
            _assertClass(query, QueryOption);
            ptr8 = query.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildExecutionTransaction(private_key.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), priority_fee_credits, ptr2, ptr3, len3, isLikeNone(imports) ? 0 : addHeapObject(imports), ptr4, ptr5, ptr6, ptr7, ptr8, isLikeNone(edition) ? 0xFFFFFF : edition);
        return takeObject(ret);
    }
    /**
     * Send credits from one Aleo account to another
     *
     * @param private_key The private key of the sender
     * @param amount_credits The amount of credits to send
     * @param recipient The recipient of the transaction
     * @param transfer_type The type of the transfer (options: "private", "public", "private_to_public", "public_to_private")
     * @param amount_record The record to fund the amount from
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @param url The url of the Aleo network node to send the transaction to
     * @param transfer_verifying_key (optional) Provide a verifying key to use for the transfer
     * function
     * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
     * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
     * @returns {Transaction}
     * @param {PrivateKey} private_key
     * @param {number} amount_credits
     * @param {string} recipient
     * @param {string} transfer_type
     * @param {RecordPlaintext | null | undefined} amount_record
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @param {string | null} [url]
     * @param {ProvingKey | null} [transfer_proving_key]
     * @param {VerifyingKey | null} [transfer_verifying_key]
     * @param {ProvingKey | null} [fee_proving_key]
     * @param {VerifyingKey | null} [fee_verifying_key]
     * @param {QueryOption | null} [query]
     * @returns {Promise<Transaction>}
     */
    static buildTransferTransaction(private_key, amount_credits, recipient, transfer_type, amount_record, priority_fee_credits, fee_record, url, transfer_proving_key, transfer_verifying_key, fee_proving_key, fee_verifying_key, query) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(recipient, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(transfer_type, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(amount_record)) {
            _assertClass(amount_record, RecordPlaintext);
            ptr2 = amount_record.__destroy_into_raw();
        }
        let ptr3 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr3 = fee_record.__destroy_into_raw();
        }
        var ptr4 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len4 = WASM_VECTOR_LEN;
        let ptr5 = 0;
        if (!isLikeNone(transfer_proving_key)) {
            _assertClass(transfer_proving_key, ProvingKey);
            ptr5 = transfer_proving_key.__destroy_into_raw();
        }
        let ptr6 = 0;
        if (!isLikeNone(transfer_verifying_key)) {
            _assertClass(transfer_verifying_key, VerifyingKey);
            ptr6 = transfer_verifying_key.__destroy_into_raw();
        }
        let ptr7 = 0;
        if (!isLikeNone(fee_proving_key)) {
            _assertClass(fee_proving_key, ProvingKey);
            ptr7 = fee_proving_key.__destroy_into_raw();
        }
        let ptr8 = 0;
        if (!isLikeNone(fee_verifying_key)) {
            _assertClass(fee_verifying_key, VerifyingKey);
            ptr8 = fee_verifying_key.__destroy_into_raw();
        }
        let ptr9 = 0;
        if (!isLikeNone(query)) {
            _assertClass(query, QueryOption);
            ptr9 = query.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildTransferTransaction(private_key.__wbg_ptr, amount_credits, ptr0, len0, ptr1, len1, ptr2, priority_fee_credits, ptr3, ptr4, len4, ptr5, ptr6, ptr7, ptr8, ptr9);
        return takeObject(ret);
    }
    /**
     * Create an `Authorization` for `credits.aleo/fee_public` or `credits.aleo/fee_private`.
     * This object requires an associated execution or deployment ID. This can be gained from
     * any previously created authorization by calling (authorization.toExecutionId()).
     *
     * @param private_key The private key of the signer.
     * @param deployment_or_execution_id The id of the deployment or execution to authorize the fee program for.
     * @param base_fee_credits The base fee to be paid for the authorization
     * @param priority_fee_credits The optional priority fee to be paid for the transaction
     * @param fee_record The record to spend the fee from
     * @returns {Authorization}
     * @param {PrivateKey} private_key
     * @param {string} deployment_or_execution_id
     * @param {number} base_fee_credits
     * @param {number} priority_fee_credits
     * @param {RecordPlaintext | null} [fee_record]
     * @returns {Promise<Authorization>}
     */
    static authorizeFee(private_key, deployment_or_execution_id, base_fee_credits, priority_fee_credits, fee_record) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(deployment_or_execution_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        let ptr1 = 0;
        if (!isLikeNone(fee_record)) {
            _assertClass(fee_record, RecordPlaintext);
            ptr1 = fee_record.__destroy_into_raw();
        }
        const ret = wasm.programmanager_authorizeFee(private_key.__wbg_ptr, ptr0, len0, base_fee_credits, priority_fee_credits, ptr1);
        return takeObject(ret);
    }
    /**
     * Build an authorization from a `Request` object.
     *
     * @param {ExecutionRequest} request The execution request to build the authorization from.
     * @param {string} program The program source code containing the function to authorize.
     * @param {boolean} unchecked Whether or not to generate an unchecked authorization.
     * @param {number | undefined} edition The edition of the program.
     * @param {object | undefined} imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
     * @param {PrivateKey | undefined} [private_key] Optional private key of the signer. If not provided, functions which call other programs may not succeed.
     * @param {ExecutionRequest} request
     * @param {string} program
     * @param {boolean} unchecked
     * @param {number | null} [edition]
     * @param {object | null} [imports]
     * @param {PrivateKey | null} [private_key]
     * @returns {Promise<Authorization>}
     */
    static buildAuthorizationFromExecutionRequest(request, program, unchecked, edition, imports, private_key) {
        _assertClass(request, ExecutionRequest);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        let ptr1 = 0;
        if (!isLikeNone(private_key)) {
            _assertClass(private_key, PrivateKey);
            ptr1 = private_key.__destroy_into_raw();
        }
        const ret = wasm.programmanager_buildAuthorizationFromExecutionRequest(request.__wbg_ptr, ptr0, len0, unchecked, isLikeNone(edition) ? 0xFFFFFF : edition, isLikeNone(imports) ? 0 : addHeapObject(imports), ptr1);
        return takeObject(ret);
    }
    /**
     * Create an execution `Authorization` without generating a circuit. Use this function when
     * fast delegated proving is needed.
     *
     * @param private_key The private key of the signer.
     * @param program The program source code containing the function to authorize.
     * @param function_name The function to authorize.
     * @param inputs A javascript array of inputs to the function.
     * @param imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {object | null} [imports]
     * @param {number | null} [edition]
     * @returns {Promise<Authorization>}
     */
    static buildAuthorizationUnchecked(private_key, program, function_name, inputs, imports, edition) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.programmanager_buildAuthorizationUnchecked(private_key.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), isLikeNone(imports) ? 0 : addHeapObject(imports), isLikeNone(edition) ? 0xFFFFFF : edition);
        return takeObject(ret);
    }
    /**
     * Create an execution `Authorization` for a given program:function tuple with specified inputs.
     *
     * @param private_key The private key of the signer.
     * @param program The program source code containing the function to authorize.
     * @param function_name The function to authorize.
     * @param inputs A javascript array of inputs to the function.
     * @param imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
     * @param {PrivateKey} private_key
     * @param {string} program
     * @param {string} function_name
     * @param {Array<any>} inputs
     * @param {object | null} [imports]
     * @param {number | null} [edition]
     * @returns {Promise<Authorization>}
     */
    static authorize(private_key, program, function_name, inputs, imports, edition) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passStringToWasm0(program, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(function_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.programmanager_authorize(private_key.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(inputs), isLikeNone(imports) ? 0 : addHeapObject(imports), isLikeNone(edition) ? 0xFFFFFF : edition);
        return takeObject(ret);
    }
}
if (Symbol.dispose) ProgramManager.prototype[Symbol.dispose] = ProgramManager.prototype.free;

const ProofFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_proof_free(ptr >>> 0, 1));
/**
 * SNARK proof for verification of program execution
 */
class Proof {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Proof.prototype);
        obj.__wbg_ptr = ptr;
        ProofFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProofFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_proof_free(ptr, 0);
    }
    /**
     * Construct a new proof from a byte array
     *
     * @param {Uint8Array} bytes Byte array representation of a proof
     * @returns {Proof}
     * @param {Uint8Array} bytes
     * @returns {Proof}
     */
    static fromBytes(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.proof_fromBytes(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Proof.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a proof from string
     *
     * @param {string} string String representation of the proof
     * @returns {Proof}
     * @param {string} string
     * @returns {Proof}
     */
    static fromString(string) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(string, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.proof_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Proof.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Return the byte representation of a proof
     *
     * @returns {Uint8Array} Byte array representation of a proof
     * @returns {Uint8Array}
     */
    toBytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.proof_toBytes(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a string representation of the proof
     *
     * @returns {string} String representation of the proof
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.proof_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Proof.prototype[Symbol.dispose] = Proof.prototype.free;

const ProvingKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_provingkey_free(ptr >>> 0, 1));
/**
 * Proving key for a function within an Aleo program
 */
class ProvingKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ProvingKey.prototype);
        obj.__wbg_ptr = ptr;
        ProvingKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProvingKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_provingkey_free(ptr, 0);
    }
    /**
     * Construct a new proving key from a byte array
     *
     * @param {Uint8Array} bytes Byte array representation of a proving key
     * @returns {ProvingKey}
     * @param {Uint8Array} bytes
     * @returns {ProvingKey}
     */
    static fromBytes(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.provingkey_fromBytes(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ProvingKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a proving key from string
     *
     * @param {string} String representation of the proving key
     * @param {string} string
     * @returns {ProvingKey}
     */
    static fromString(string) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(string, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.provingkey_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ProvingKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a copy of the proving key
     *
     * @returns {ProvingKey} A copy of the proving key
     * @returns {ProvingKey}
     */
    copy() {
        const ret = wasm.provingkey_copy(this.__wbg_ptr);
        return ProvingKey.__wrap(ret);
    }
    /**
     * Return the checksum of the proving key
     *
     * @returns {string} Checksum of the proving key
     * @returns {string}
     */
    checksum() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.provingkey_checksum(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Return the byte representation of a proving key
     *
     * @returns {Uint8Array} Byte array representation of a proving key
     * @returns {Uint8Array}
     */
    toBytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.provingkey_toBytes(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a string representation of the proving key
     *
     * @returns {string} String representation of the proving key
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.provingkey_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Verify if the proving key is for the join function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("join_proving_key.bin");
     * provingKey.isJoinProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the join function, false if otherwise
     * @returns {boolean}
     */
    isJoinProver() {
        const ret = wasm.provingkey_isJoinProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the split function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("split_proving_key.bin");
     * provingKey.isSplitProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the split function, false if otherwise
     * @returns {boolean}
     */
    isSplitProver() {
        const ret = wasm.provingkey_isSplitProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the inclusion function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("inclusion_proving_key.bin");
     * provingKey.isInclusionProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the inclusion function, false if otherwise
     * @returns {boolean}
     */
    isInclusionProver() {
        const ret = wasm.provingkey_isInclusionProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the fee_public function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("fee_public_proving_key.bin");
     * provingKey.isFeePublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the fee_public function, false if otherwise
     * @returns {boolean}
     */
    isFeePublicProver() {
        const ret = wasm.provingkey_isFeePublicProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the bond_public function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("bond_public_proving_key.bin");
     * provingKey.isBondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the bond_public function, false if otherwise
     * @returns {boolean}
     */
    isBondPublicProver() {
        const ret = wasm.provingkey_isBondPublicProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the fee_private function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("fee_private_proving_key.bin");
     * provingKey.isFeePrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the fee_private function, false if otherwise
     * @returns {boolean}
     */
    isFeePrivateProver() {
        const ret = wasm.provingkey_isFeePrivateProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the unbond_public function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("unbond_public.bin");
     * provingKey.isUnbondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the unbond_public_prover function, false if otherwise
     * @returns {boolean}
     */
    isUnbondPublicProver() {
        const ret = wasm.provingkey_isUnbondPublicProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the bond_validator function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("bond_validator_proving_key.bin");
     * provingKey.isBondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the bond_validator function, false if otherwise
     * @returns {boolean}
     */
    isBondValidatorProver() {
        const ret = wasm.provingkey_isBondValidatorProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the transfer_public function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("transfer_public_proving_key.bin");
     * provingKey.isTransferPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the transfer_public function, false if otherwise
     * @returns {boolean}
     */
    isTransferPublicProver() {
        const ret = wasm.provingkey_isTransferPublicProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the transfer_private function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("transfer_private_proving_key.bin");
     * provingKey.isTransferPrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the transfer_private function, false if otherwise
     * @returns {boolean}
     */
    isTransferPrivateProver() {
        const ret = wasm.provingkey_isTransferPrivateProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the claim_unbond function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("claim_unbond_proving_key.bin");
     * provingKey.isClaimUnbondProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the claim_unbond function, false if otherwise
     * @returns {boolean}
     */
    isClaimUnbondPublicProver() {
        const ret = wasm.provingkey_isClaimUnbondPublicProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the set_validator_state function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("set_validator_set_proving_key.bin");
     * provingKey.isSetValidatorStateProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the set_validator_state function, false if otherwise
     * @returns {boolean}
     */
    isSetValidatorStateProver() {
        const ret = wasm.provingkey_isSetValidatorStateProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the transfer_public_as_signer function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("transfer_public_as_signer_proving_key.bin");
     * provingKey.isTransferPublicAsSignerProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the transfer_public function, false if otherwise
     * @returns {boolean}
     */
    isTransferPublicAsSignerProver() {
        const ret = wasm.provingkey_isTransferPublicAsSignerProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the transfer_private_to_public function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("transfer_private_to_public_proving_key.bin");
     * provingKey.isTransferPrivateToPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the transfer_private_to_public function, false if otherwise
     * @returns {boolean}
     */
    isTransferPrivateToPublicProver() {
        const ret = wasm.provingkey_isTransferPrivateToPublicProver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verify if the proving key is for the transfer_public_to_private function
     *
     * @example
     * const provingKey = ProvingKey.fromBytes("transfer_public_to_private_proving_key.bin");
     * provingKey.isTransferPublicToPrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
     *
     * @returns {boolean} returns true if the proving key is for the transfer_public_to_private function, false if otherwise
     * @returns {boolean}
     */
    isTransferPublicToPrivateProver() {
        const ret = wasm.provingkey_isTransferPublicToPrivateProver(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) ProvingKey.prototype[Symbol.dispose] = ProvingKey.prototype.free;

const ProvingRequestFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_provingrequest_free(ptr >>> 0, 1));
/**
 * Represents a proving request to a prover.
 */
class ProvingRequest {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ProvingRequest.prototype);
        obj.__wbg_ptr = ptr;
        ProvingRequestFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProvingRequestFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_provingrequest_free(ptr, 0);
    }
    /**
     * Creates a ProvingRequest from a string representation.
     *
     * @param {Uint8Array} request String representation of the ProvingRequest.
     * @param {string} request
     * @returns {ProvingRequest}
     */
    static fromString(request) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(request, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.provingrequest_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ProvingRequest.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a left-endian byte representation of the ProvingRequest.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.provingrequest_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the Authorization of the main function in the ProvingRequest.
     * @returns {Authorization}
     */
    authorization() {
        const ret = wasm.provingrequest_authorization(this.__wbg_ptr);
        return Authorization.__wrap(ret);
    }
    /**
     * Creates a ProvingRequest from a left-endian byte representation of the ProvingRequest.
     *
     * @param {Uint8Array} bytes Left-endian bytes representing the proving request.
     * @param {Uint8Array} bytes
     * @returns {ProvingRequest}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.provingrequest_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ProvingRequest.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the fee Authorization in the ProvingRequest.
     * @returns {Authorization | undefined}
     */
    feeAuthorization() {
        const ret = wasm.provingrequest_feeAuthorization(this.__wbg_ptr);
        return ret === 0 ? undefined : Authorization.__wrap(ret);
    }
    /**
     * Creates a new ProvingRequest from a function Authorization and an optional fee Authorization.
     *
     * @param {Authorization} authorization An Authorization for a function.
     * @param {Authorization} fee_authorization The authorization for the `credits.aleo/fee_public` or `credits.aleo/fee_private` function that pays the fee for the execution of the main function.
     * @param {boolean} broadcast Flag that indicates whether the remote proving service should attempt to submit the transaction on the caller's behalf.
     * @param {Authorization} authorization
     * @param {Authorization | null | undefined} fee_authorization
     * @param {boolean} broadcast
     * @returns {ProvingRequest}
     */
    static new(authorization, fee_authorization, broadcast) {
        _assertClass(authorization, Authorization);
        var ptr0 = authorization.__destroy_into_raw();
        let ptr1 = 0;
        if (!isLikeNone(fee_authorization)) {
            _assertClass(fee_authorization, Authorization);
            ptr1 = fee_authorization.__destroy_into_raw();
        }
        const ret = wasm.provingrequest_new(ptr0, ptr1, broadcast);
        return ProvingRequest.__wrap(ret);
    }
    /**
     * Check if a ProvingRequest is the same as another ProvingRequest.
     * @param {ProvingRequest} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, ProvingRequest);
        const ret = wasm.provingrequest_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the broadcast flag set in the ProvingRequest.
     * @returns {boolean}
     */
    broadcast() {
        const ret = wasm.provingrequest_broadcast(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Creates a string representation of the ProvingRequest.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.provingrequest_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) ProvingRequest.prototype[Symbol.dispose] = ProvingRequest.prototype.free;

const QueryOptionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_queryoption_free(ptr >>> 0, 1));
/**
 * A unified query type that wraps either an OfflineQuery (pre-fetched state)
 * or a CallbackQuery (on-demand JS transport delegation).
 *
 * Construct from JavaScript using the static factory methods:
 * - `QueryOption.offlineQuery(offlineQuery)` for pre-fetched state
 * - `QueryOption.callbackQuery(callbackQuery)` for on-demand JS callbacks
 */
class QueryOption {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(QueryOption.prototype);
        obj.__wbg_ptr = ptr;
        QueryOptionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QueryOptionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_queryoption_free(ptr, 0);
    }
    /**
     * Create a QueryOption from an OfflineQuery.
     * @param {OfflineQuery} query
     * @returns {QueryOption}
     */
    static offlineQuery(query) {
        _assertClass(query, OfflineQuery);
        var ptr0 = query.__destroy_into_raw();
        const ret = wasm.queryoption_offlineQuery(ptr0);
        return QueryOption.__wrap(ret);
    }
    /**
     * Create a QueryOption from a CallbackQuery.
     * @param {CallbackQuery} query
     * @returns {QueryOption}
     */
    static callbackQuery(query) {
        _assertClass(query, CallbackQuery);
        var ptr0 = query.__destroy_into_raw();
        const ret = wasm.queryoption_callbackQuery(ptr0);
        return QueryOption.__wrap(ret);
    }
}
if (Symbol.dispose) QueryOption.prototype[Symbol.dispose] = QueryOption.prototype.free;

const RecordCiphertextFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_recordciphertext_free(ptr >>> 0, 1));
/**
 * Encrypted Aleo record
 */
class RecordCiphertext {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RecordCiphertext.prototype);
        obj.__wbg_ptr = ptr;
        RecordCiphertextFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof RecordCiphertext)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RecordCiphertextFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_recordciphertext_free(ptr, 0);
    }
    /**
     * Get the left endian boolean array representation of the record ciphertext bits.
     *
     * returns {Array} Left endian boolean array representation of the bits of the record ciphertext.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.recordciphertext_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Create a record ciphertext from a string
     *
     * @param {string} record String representation of a record ciphertext
     * @returns {RecordCiphertext} Record ciphertext
     * @param {string} record
     * @returns {RecordCiphertext}
     */
    static fromString(record) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(record, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.recordciphertext_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordCiphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the left endian byte array representation of the record ciphertext.
     *
     * @returns {Uint8Array} Left endian byte array representation of the record ciphertext.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordciphertext_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a record ciphertext object from a series of bytes.
     *
     * @param {Uint8Array} bytes A left endian byte array representing the record ciphertext.
     *
     * @returns {RecordCiphertext}
     * @param {Uint8Array} bytes
     * @returns {RecordCiphertext}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordciphertext_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordCiphertext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Generate the record view key. The record view key can only decrypt record if the
     * supplied view key belongs to the record owner.
     *
     * @param {ViewKey} view_key View key used to generate the record view key
     *
     * @returns {Group} record view key
     * @param {ViewKey} view_key
     * @returns {Field}
     */
    recordViewKey(view_key) {
        _assertClass(view_key, ViewKey);
        const ret = wasm.recordciphertext_recordViewKey(this.__wbg_ptr, view_key.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Decrypt the record ciphertext into plaintext using a record view key.
     *
     * @param {Field} record_vk Record view key used to decrypt the record.
     *
     * @returns {RecordPlaintext}
     * @param {Field} record_vk
     * @returns {RecordPlaintext}
     */
    decryptWithRecordViewKey(record_vk) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(record_vk, Field);
            var ptr0 = record_vk.__destroy_into_raw();
            wasm.recordciphertext_decryptWithRecordViewKey(retptr, this.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordPlaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the tag of the record using the graph key.
     *
     * @param {GraphKey} graph key of the account associatd with the record.
     * @param {Field} commitment of the record.
     *
     * @returns {Field} tag of the record.
     * @param {GraphKey} graph_key
     * @param {Field} commitment
     * @returns {Field}
     */
    static tag(graph_key, commitment) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(graph_key, GraphKey);
            _assertClass(commitment, Field);
            var ptr0 = commitment.__destroy_into_raw();
            wasm.recordciphertext_tag(retptr, graph_key.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Clone the RecordCiphertext WASM object.
     *
     * @returns {RecordCiphertext} A clone of the RecordCiphertext WASM object.
     * @returns {RecordCiphertext}
     */
    clone() {
        const ret = wasm.recordciphertext_clone(this.__wbg_ptr);
        return RecordCiphertext.__wrap(ret);
    }
    /**
     * Get the record nonce.
     *
     * @returns {Group} The record nonce.
     * @returns {Group}
     */
    nonce() {
        const ret = wasm.recordciphertext_nonce(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Decrypt the record ciphertext into plaintext using the view key. The record will only
     * decrypt if the record was encrypted by the account corresponding to the view key
     *
     * @param {ViewKey} view_key View key used to decrypt the ciphertext
     * @returns {RecordPlaintext} Record plaintext object
     * @param {ViewKey} view_key
     * @returns {RecordPlaintext}
     */
    decrypt(view_key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(view_key, ViewKey);
            wasm.recordciphertext_decrypt(retptr, this.__wbg_ptr, view_key.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordPlaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Determines if the account corresponding to the view key is the owner of the record
     *
     * @param {ViewKey} view_key View key used to decrypt the ciphertext
     * @returns {boolean}
     * @param {ViewKey} view_key
     * @returns {boolean}
     */
    isOwner(view_key) {
        _assertClass(view_key, ViewKey);
        const ret = wasm.recordciphertext_isOwner(this.__wbg_ptr, view_key.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the field array representation of the record ciphertext.
     *
     * @returns {Array} Field array representation of the record ciphertext.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordciphertext_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Return the string representation of the record ciphertext
     *
     * @returns {string} String representation of the record ciphertext
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordciphertext_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) RecordCiphertext.prototype[Symbol.dispose] = RecordCiphertext.prototype.free;

const RecordPlaintextFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_recordplaintext_free(ptr >>> 0, 1));
/**
 * Plaintext representation of an Aleo record
 */
class RecordPlaintext {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RecordPlaintext.prototype);
        obj.__wbg_ptr = ptr;
        RecordPlaintextFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RecordPlaintextFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_recordplaintext_free(ptr, 0);
    }
    /**
     * @param {string} program_id
     * @param {string} record_name
     * @param {string} record_view_key
     * @returns {Field}
     */
    commitment(program_id, record_name, record_view_key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(record_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(record_view_key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len2 = WASM_VECTOR_LEN;
            wasm.recordplaintext_commitment(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the record entry matching a key.
     *
     * @param {string} input The key to retrieve the value in the record data field.
     *
     * @returns {Plaintext} The plaintext value corresponding to the key.
     * @param {string} input
     * @returns {Plaintext}
     */
    getMember(input) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(input, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.recordplaintext_getMember(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the left endian boolean array representation of the record plaintext bits.
     *
     * @returns {Array} Boolean array representation of the record plaintext bits.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.recordplaintext_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Return a record plaintext from a string.
     *
     * @param {string} record String representation of a plaintext representation of an Aleo record.
     *
     * @returns {RecordPlaintext} Record plaintext
     * @param {string} record
     * @returns {RecordPlaintext}
     */
    static fromString(record) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(record, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.recordplaintext_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordPlaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the left endian byte array representation of the record plaintext.
     *
     * @returns {Uint8Array} Byte array representation of the record plaintext.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordplaintext_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the amount of microcredits in the record
     *
     * @returns {u64} Amount of microcredits in the record
     * @returns {bigint}
     */
    microcredits() {
        const ret = wasm.recordplaintext_microcredits(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Get a representation of a record as a javascript object for usage in client side
     * computations. Note that this is not a reversible operation and exists for the convenience
     * of discovering and using properties of the record.
     *
     * The conversion guide is as follows:
     * - u8, u16, u32, i8, i16 i32 --> Number
     * - u64, u128, i64, i128 --> BigInt
     * - Address, Field, Group, Scalar --> String.
     *
     * Address, Field, Group, and Scalar will all be converted to their bech32 string
     * representation. These string representations can be converted back to their respective wasm
     * types using the fromString method on the Address, Field, Group, and Scalar objects in this
     * library.
     *
     * @example
     * # Create a wasm record from a record string.
     * let record_plaintext_wasm = RecordPlainext.from_string("{
     *   owner: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
     *   metadata: {
     *     player1: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
     *     player2: aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6.private,
     *     nonce: 660310649780728486489183263981322848354071976582883879926426319832534836534field.private
     *   },
     *   id: 1953278585719525811355617404139099418855053112960441725284031425961000152405field.private,
     *   positions: 50794271u64.private,
     *   attempts: 0u64.private,
     *   hits: 0u64.private,
     *   _nonce: 5668100912391182624073500093436664635767788874314097667746354181784048204413group.public
     * }");
     *
     * let expected_object = {
     *   owner: "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48",
     *   metadata: {
     *     player1: "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48",
     *     player2: "aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6",
     *     nonce: "660310649780728486489183263981322848354071976582883879926426319832534836534field"
     *   },
     *   id: "1953278585719525811355617404139099418855053112960441725284031425961000152405field",
     *   positions: 50794271,
     *   attempts: 0,
     *   hits: 0,
     *   _nonce: "5668100912391182624073500093436664635767788874314097667746354181784048204413group"
     * };
     *
     * # Create the expected object
     * let record_plaintext_object = record_plaintext_wasm.to_js_object();
     * assert(JSON.stringify(record_plaintext_object) == JSON.stringify(expected_object));
     *
     * @returns {Object} Javascript object representation of the record
     * @returns {object}
     */
    toJsObject() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordplaintext_toJsObject(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a record plaintext object from a series of bytes.
     *
     * @param {Uint8Array} bytes A left endian byte array representing the record plaintext.
     *
     * @returns {RecordPlaintext} The record plaintext.
     * @param {Uint8Array} bytes
     * @returns {RecordPlaintext}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordplaintext_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordPlaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypt the sender ciphertext associated with the record.
     *
     * @param {ViewKey} view_key View key associated with the record.
     * @param {Field} sender_ciphertext Sender ciphertext associated with the record.
     *
     * @returns {Address} address of the sender.
     * @param {ViewKey} view_key
     * @param {Field} sender_ciphertext
     * @returns {Address}
     */
    decryptSender(view_key, sender_ciphertext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(view_key, ViewKey);
            _assertClass(sender_ciphertext, Field);
            wasm.recordplaintext_decryptSender(retptr, this.__wbg_ptr, view_key.__wbg_ptr, sender_ciphertext.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Generate the record view key. The record view key can only decrypt the record if the
     * supplied view key belongs to the record owner.
     *
     * @param {ViewKey} view_key View key used to generate the record view key
     *
     * @returns {Group} record view key
     * @param {ViewKey} view_key
     * @returns {Field}
     */
    recordViewKey(view_key) {
        _assertClass(view_key, ViewKey);
        const ret = wasm.recordplaintext_recordViewKey(this.__wbg_ptr, view_key.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Attempt to get the serial number of a record to determine whether or not is has been spent
     *
     * @param {PrivateKey} private_key Private key of the account that owns the record
     * @param {string} program_id Program ID of the program that the record is associated with
     * @param {string} record_name Name of the record
     * @param {string} record_view_key The string representation of the record view key.
     *
     * @returns {string} Serial number of the record
     * @param {PrivateKey} private_key
     * @param {string} program_id
     * @param {string} record_name
     * @param {string} record_view_key
     * @returns {string}
     */
    serialNumberString(private_key, program_id, record_name, record_view_key) {
        let deferred5_0;
        let deferred5_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(private_key, PrivateKey);
            const ptr0 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(record_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(record_view_key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len2 = WASM_VECTOR_LEN;
            wasm.recordplaintext_serialNumberString(retptr, this.__wbg_ptr, private_key.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr4 = r0;
            var len4 = r1;
            if (r3) {
                ptr4 = 0; len4 = 0;
                throw takeObject(r2);
            }
            deferred5_0 = ptr4;
            deferred5_1 = len4;
            return getStringFromWasm0(ptr4, len4);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred5_0, deferred5_1, 1);
        }
    }
    /**
     * Get the tag of the record using the graph key.
     * @param {GraphKey} graph_key
     * @param {Field} commitment
     * @returns {Field}
     */
    tag(graph_key, commitment) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(graph_key, GraphKey);
            _assertClass(commitment, Field);
            var ptr0 = commitment.__destroy_into_raw();
            wasm.recordplaintext_tag(retptr, this.__wbg_ptr, graph_key.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Clone the RecordPlaintext WASM object.
     *
     * @returns {RecordPlaintext} A clone of the RecordPlaintext WASM object.
     * @returns {RecordPlaintext}
     */
    clone() {
        const ret = wasm.recordplaintext_clone(this.__wbg_ptr);
        return RecordPlaintext.__wrap(ret);
    }
    /**
     * Compute the record's gamma value.
     *
     * @param {string} program_id The program id that produced the record.
     * @param {string} record_name The name of the record within the program.
     * @param {PrivateKey} private_key The private key that created the record.
     * @returns {Group} The computed value of gamma.
     * @param {string} program_id
     * @param {string} record_name
     * @param {PrivateKey} private_key
     * @returns {Group}
     */
    gamma(program_id, record_name, private_key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(program_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(record_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            _assertClass(private_key, PrivateKey);
            wasm.recordplaintext_gamma(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, private_key.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the nonce of the record. This can be used to uniquely identify a record.
     *
     * @returns {string} Nonce of the record
     * @returns {string}
     */
    nonce() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordplaintext_nonce(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get the owner of the record.
     *
     * @returns {Address} Address of the owner of the record.
     * @returns {Address}
     */
    owner() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordplaintext_owner(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the field array representation of the record plaintext.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordplaintext_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the record plaintext string
     *
     * @returns {string} String representation of the record plaintext
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.recordplaintext_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) RecordPlaintext.prototype[Symbol.dispose] = RecordPlaintext.prototype.free;

const ScalarFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_scalar_free(ptr >>> 0, 1));
/**
 * Scalar field element.
 */
class Scalar {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Scalar.prototype);
        obj.__wbg_ptr = ptr;
        ScalarFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ScalarFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_scalar_free(ptr, 0);
    }
    /**
     * Cast the scalar to an Address (strict, via Field x-coordinate recovery).
     * Returns an error if the resulting field is not a valid x-coordinate on the curve.
     * @returns {Address}
     */
    toAddress() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toAddress(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the left endian boolean array representation of the scalar element.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.scalar_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Cast the scalar to a Boolean (strict).
     * Returns an error if the scalar is not zero or one.
     * @returns {Boolean}
     */
    toBoolean() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toBoolean(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Boolean.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a scalar object from a string representation of a scalar element.
     * @param {string} group
     * @returns {Scalar}
     */
    static fromString(group) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(group, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.scalar_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Scalar.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encode the scalar element as a Uint8Array of left endian bytes.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to an I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to a U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reconstruct a scalar element from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {Scalar}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Scalar.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast the scalar to an I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to an I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to an I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a plaintext element from a scalar element.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.scalar_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast the scalar to a U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to a U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to a U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a scalar element from a Uint8Array of left endian bytes.
     * @param {Uint8Array} bytes
     * @returns {Scalar}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Scalar.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast the scalar to an I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to a U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to a Group element with lossy conversion (via Field, Elligator-2 fallback).
     * @returns {Group}
     */
    toGroupLossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toGroupLossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to an Address with lossy conversion (via Group, Elligator-2 fallback).
     * @returns {Address}
     */
    toAddressLossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toAddressLossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Address.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.scalar_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Add two scalar elements.
     * @param {Scalar} other
     * @returns {Scalar}
     */
    add(other) {
        _assertClass(other, Scalar);
        const ret = wasm.scalar_add(this.__wbg_ptr, other.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the multiplicative identity of the scalar field.
     * @returns {Scalar}
     */
    static one() {
        const ret = wasm.scalar_one();
        return Scalar.__wrap(ret);
    }
    /**
     * Power of a scalar element.
     * @param {Scalar} other
     * @returns {Scalar}
     */
    pow(other) {
        _assertClass(other, Scalar);
        const ret = wasm.scalar_pow(this.__wbg_ptr, other.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the additive identity of the scalar field.
     * @returns {Scalar}
     */
    static zero() {
        const ret = wasm.field_zero();
        return Scalar.__wrap(ret);
    }
    /**
     * Clone the scalar element.
     * @returns {Scalar}
     */
    clone() {
        const ret = wasm.field_clone(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Divide two scalar elements.
     * @param {Scalar} other
     * @returns {Scalar}
     */
    divide(other) {
        _assertClass(other, Scalar);
        const ret = wasm.scalar_divide(this.__wbg_ptr, other.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Double the scalar element.
     * @returns {Scalar}
     */
    double() {
        const ret = wasm.scalar_double(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Check if one scalar element equals another.
     * @param {Scalar} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, Scalar);
        const ret = wasm.field_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Generate a random scalar element.
     * @returns {Scalar}
     */
    static random() {
        const ret = wasm.scalar_random();
        return Scalar.__wrap(ret);
    }
    /**
     * Invert the scalar element.
     * @returns {Scalar}
     */
    inverse() {
        const ret = wasm.scalar_inverse(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Multiply two scalar elements.
     * @param {Scalar} other
     * @returns {Scalar}
     */
    multiply(other) {
        _assertClass(other, Scalar);
        const ret = wasm.scalar_multiply(this.__wbg_ptr, other.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Subtract two scalar elements.
     * @param {Scalar} other
     * @returns {Scalar}
     */
    subtract(other) {
        _assertClass(other, Scalar);
        const ret = wasm.scalar_subtract(this.__wbg_ptr, other.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Cast the scalar element to a field element.
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast the scalar to a Group element (strict, via Field x-coordinate recovery).
     * Returns an error if the resulting field is not a valid x-coordinate on the curve.
     * @returns {Group}
     */
    toGroup() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toGroup(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Group.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the string representation of the scalar element.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scalar_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Scalar.prototype[Symbol.dispose] = Scalar.prototype.free;

const SignatureFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_signature_free(ptr >>> 0, 1));
/**
 * Cryptographic signature of a message signed by an Aleo account
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
     * Sign an instance of a valid Aleo data type or record.
     *
     * @param {PrivateKey} private_key The private key used to sign the message.
     * @param {String} message The string representation of the Aleo datatype or record to sign.
     * @returns {Signature} Signature of the message.
     * @param {PrivateKey} private_key
     * @param {string} message
     * @returns {Signature}
     */
    static signValue(private_key, message) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(private_key, PrivateKey);
            const ptr0 = passStringToWasm0(message, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.signature_signValue(retptr, private_key.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Signature.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get an address from a signature.
     *
     * @returns {Address} Address object
     * @returns {Address}
     */
    to_address() {
        const ret = wasm.signature_to_address(this.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Get the left endian boolean array representation of the bits of the signature.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.signature_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get a signature from a string representation of a signature
     *
     * @param {string} signature String representation of a signature
     * @returns {Signature} Signature
     * @param {string} signature
     * @returns {Signature}
     */
    static from_string(signature) {
        const ptr0 = passStringToWasm0(signature, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signature_from_string(ptr0, len0);
        return Signature.__wrap(ret);
    }
    /**
     * Get the left endian byte array representation of the signature.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.signature_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a signature from a series of bits represented as a boolean array.
     *
     * @param {Array} bits A left endian boolean array representing the bits of the signature.
     *
     * @returns {Signature} The signature object.
     * @param {Array<any>} bits
     * @returns {Signature}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.signature_fromBitsLe(retptr, addHeapObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Signature.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the plaintext representation of the signature.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.signature_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Get a string representation of a signature
     *
     * @returns {string} String representation of a signature
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.signature_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Verify a signature over an Aleo datatype or record by an address.
     *
     * @param {Address} address The address used to verify the signature.
     * @param {String} message The message to verify, which must be the string representation of a valid Aleo datatype or record.
     * @returns {boolean} True if the signature is valid, false otherwise.
     * @param {Address} address
     * @param {string} message
     * @returns {boolean}
     */
    verifyValue(address, message) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(address, Address);
            const ptr0 = passStringToWasm0(message, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.signature_verifyValue(retptr, this.__wbg_ptr, address.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a signature from a series of bytes.
     *
     * @param {Uint8Array} bytes A left endian byte array representing the signature.
     *
     * @returns {Signature} The signature object.
     * @param {Uint8Array} bytes
     * @returns {Signature}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.signature_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Signature.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Sign a message with a private key
     *
     * @param {PrivateKey} private_key The private key to sign the message with
     * @param {Uint8Array} message Byte representation of the message to sign
     * @returns {Signature} Signature of the message
     * @param {PrivateKey} private_key
     * @param {Uint8Array} message
     * @returns {Signature}
     */
    static sign(private_key, message) {
        _assertClass(private_key, PrivateKey);
        const ptr0 = passArray8ToWasm0(message, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signature_sign(private_key.__wbg_ptr, ptr0, len0);
        return Signature.__wrap(ret);
    }
    /**
     * Verify a signature of a message with an address
     *
     * @param {Address} address The address to verify the signature with
     * @param {Uint8Array} message Byte representation of the message to verify
     * @returns {boolean} True if the signature is valid, false otherwise
     * @param {Address} address
     * @param {Uint8Array} message
     * @returns {boolean}
     */
    verify(address, message) {
        _assertClass(address, Address);
        const ptr0 = passArray8ToWasm0(message, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signature_verify(this.__wbg_ptr, address.__wbg_ptr, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Get the response of a signature.
     * @returns {Scalar}
     */
    response() {
        const ret = wasm.signature_response(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the challenge of a signature.
     * @returns {Scalar}
     */
    challenge() {
        const ret = wasm.field_clone(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the field array representation of the signature.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.signature_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a string representation of a signature
     *
     * @returns {string} String representation of a signature
     * @returns {string}
     */
    to_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.signature_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Signature.prototype[Symbol.dispose] = Signature.prototype.free;

const TransactionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transaction_free(ptr >>> 0, 1));
/**
 * Webassembly Representation of an Aleo transaction
 *
 * This object is created when generating an on-chain function deployment or execution and is the
 * object that should be submitted to the Aleo Network in order to deploy or execute a function.
 */
class Transaction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Transaction.prototype);
        obj.__wbg_ptr = ptr;
        TransactionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transaction_free(ptr, 0);
    }
    /**
     * Returns the transaction's total fee.
     * @returns {bigint}
     */
    feeAmount() {
        const ret = wasm.transaction_feeAmount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Returns true if the transaction is an execution transaction.
     *
     * @returns {boolean} True if the transaction is an execution transaction
     * @returns {boolean}
     */
    isExecute() {
        const ret = wasm.transaction_isExecute(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Find a record in the transaction by the record's commitment.
     * @param {Field} commitment
     * @returns {RecordCiphertext | undefined}
     */
    findRecord(commitment) {
        _assertClass(commitment, Field);
        const ret = wasm.transaction_findRecord(this.__wbg_ptr, commitment.__wbg_ptr);
        return ret === 0 ? undefined : RecordCiphertext.__wrap(ret);
    }
    /**
     * Create a transaction from a string
     *
     * @param {string} transaction String representation of a transaction
     * @returns {Transaction}
     * @param {string} transaction
     * @returns {Transaction}
     */
    static fromString(transaction) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(transaction, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.transaction_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the transaction as a Uint8Array of left endian bytes.
     *
     * @returns {Uint8Array} Uint8Array representation of the transaction
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the transitions in a transaction.
     *
     * @returns {Array<Transition>} Array of transition objects
     * @returns {Array<any>}
     */
    transitions() {
        const ret = wasm.transaction_transitions(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Create a transaction from a Uint8Array of left endian bytes.
     *
     * @param {Uint8Array} Uint8Array of left endian bytes encoding a Transaction.
     * @returns {Transaction}
     * @param {Uint8Array} bytes
     * @returns {Transaction}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the record plaintext present in a transaction owned by a specific view key.
     *
     * @param {ViewKey} view_key View key used to decrypt the ciphertext
     *
     * @returns {Array<RecordPlaintext>} Array of record plaintext objects
     * @param {ViewKey} view_key
     * @returns {Array<any>}
     */
    ownedRecords(view_key) {
        _assertClass(view_key, ViewKey);
        const ret = wasm.transaction_ownedRecords(this.__wbg_ptr, view_key.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get the verifying keys in a transaction.
     *
     * @returns {Array<Object>} Array of verifying keys.
     * @returns {Array<any>}
     */
    verifyingKeys() {
        const ret = wasm.transaction_verifyingKeys(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Returns the transaction's base fee.
     * @returns {bigint}
     */
    baseFeeAmount() {
        const ret = wasm.transaction_baseFeeAmount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Returns the program deployed within the transaction if the transaction is a deployment
     * transaction.
     *
     * @returns {Program | undefined} The program deployed within the transaction.
     * @returns {Program | undefined}
     */
    deployedProgram() {
        const ret = wasm.transaction_deployedProgram(this.__wbg_ptr);
        return ret === 0 ? undefined : Program.__wrap(ret);
    }
    /**
     * Get the type of the transaction (will return "deploy" or "execute")
     *
     * @returns {string} Transaction type
     * @returns {string}
     */
    transactionType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_transactionType(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns true if the transaction contains the given commitment.
     *
     * @param {boolean} True if the transaction contains the given commitment.
     * @param {Field} commitment
     * @returns {boolean}
     */
    constainsCommitment(commitment) {
        _assertClass(commitment, Field);
        const ret = wasm.transaction_constainsCommitment(this.__wbg_ptr, commitment.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the transaction's priority fee.
     *
     * returns {bigint} The transaction's priority fee.
     * @returns {bigint}
     */
    priorityFeeAmount() {
        const ret = wasm.transaction_priorityFeeAmount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Returns true if the transaction contains the given serial number.
     *
     * @param {boolean} True if the transaction contains the given serial number.
     * @param {Field} serial_number
     * @returns {boolean}
     */
    constainsSerialNumber(serial_number) {
        _assertClass(serial_number, Field);
        const ret = wasm.transaction_constainsSerialNumber(this.__wbg_ptr, serial_number.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the id of the transaction. This is the merkle root of the transaction's inclusion proof.
     *
     * This value can be used to query the status of the transaction on the Aleo Network to see
     * if it was successful. If successful, the transaction will be included in a block and this
     * value can be used to lookup the transaction data on-chain.
     *
     * @returns {string} TransactionId
     * @returns {string}
     */
    id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns true if the transaction is a fee transaction.
     *
     * @returns {boolean} True if the transaction is a fee transaction
     * @returns {boolean}
     */
    isFee() {
        const ret = wasm.transaction_isFee(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the records present in a transaction and their commitments.
     *
     * @returns {Array<{commitment: Field, record: RecordCiphertext}>} Array of record ciphertext objects
     * @returns {Array<any>}
     */
    records() {
        const ret = wasm.transaction_records(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get a summary of the transaction within a javascript object.
     *
     * If the transaction is an execution transaction, this function will return a list of the
     * transitions and their inputs and outputs.
     *
     * If the transaction is a deployment transaction, this function will return the program id and
     * a list of the functions and their verifying keys, constraint, and variable counts.
     *
     * @param {boolean} convert_to_js If true the inputs and outputs will be converted to JS objects,
     * if false the inputs and outputs will be in wasm format.
     *
     * @returns {Object} Transaction summary
     * @param {boolean} convert_to_js
     * @returns {object}
     */
    summary(convert_to_js) {
        const ret = wasm.transaction_summary(this.__wbg_ptr, convert_to_js);
        return takeObject(ret);
    }
    /**
     * Returns the execution within the transaction (if present).
     *
     * @returns {Execution | undefined} The execution within the transaction.
     * @returns {Execution | undefined}
     */
    execution() {
        const ret = wasm.transaction_execution(this.__wbg_ptr);
        return ret === 0 ? undefined : Execution.__wrap(ret);
    }
    /**
     * Returns true if the transaction is a deployment transaction.
     *
     * @returns {boolean} True if the transaction is a deployment transaction
     * @returns {boolean}
     */
    isDeploy() {
        const ret = wasm.transaction_isDeploy(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the transaction as a string. If you want to submit this transaction to the Aleo Network
     * this function will create the string that should be submitted in the `POST` data.
     *
     * @returns {string} String representation of the transaction
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Transaction.prototype[Symbol.dispose] = Transaction.prototype.free;

const TransitionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transition_free(ptr >>> 0, 1));

class Transition {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Transition.prototype);
        obj.__wbg_ptr = ptr;
        TransitionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransitionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transition_free(ptr, 0);
    }
    /**
     * Get the program ID of the transition.
     * @returns {string}
     */
    programId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transition_programId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Find a record in the transition by the record's commitment.
     * @param {Field} commitment
     * @returns {RecordCiphertext | undefined}
     */
    findRecord(commitment) {
        _assertClass(commitment, Field);
        const ret = wasm.transition_findRecord(this.__wbg_ptr, commitment.__wbg_ptr);
        return ret === 0 ? undefined : RecordCiphertext.__wrap(ret);
    }
    /**
     * Create a transition from a string
     *
     * @param {string} transition String representation of a transition
     * @returns {Transition}
     * @param {string} transition
     * @returns {Transition}
     */
    static fromString(transition) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(transition, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.transition_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transition.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the transition as a Uint8Array of left endian bytes.
     *
     * @returns {Uint8Array} Uint8Array representation of the transition
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transition_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a transition from a Uint8Array of left endian bytes.
     *
     * @param {Uint8Array} Uint8Array of left endian bytes encoding a Transition.
     * @returns {Transition}
     * @param {Uint8Array} bytes
     * @returns {Transition}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transition_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transition.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the function name of the transition.
     * @returns {string}
     */
    functionName() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transition_functionName(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get the record plaintext present in a transition owned by a specific view key.
     *
     * @param {ViewKey} view_key The view key of the record owner.
     *
     * @returns {Array<RecordPlaintext>} Array of record plaintext objects
     * @param {ViewKey} view_key
     * @returns {Array<any>}
     */
    ownedRecords(view_key) {
        _assertClass(view_key, ViewKey);
        const ret = wasm.transition_ownedRecords(this.__wbg_ptr, view_key.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Decrypt the transition using the transition view key.
     *
     * @param {Field} tvk The transition view key.
     *
     * @returns {Transition} The transition with public values for inputs and outputs.
     * @param {Field} tvk
     * @returns {Transition}
     */
    decryptTransition(tvk) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(tvk, Field);
            wasm.transition_decryptTransition(retptr, this.__wbg_ptr, tvk.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transition.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns true if the transition contains the given commitment.
     *
     * @param {boolean} True if the transition contains the given commitment.
     * @param {Field} commitment
     * @returns {boolean}
     */
    containsCommitment(commitment) {
        _assertClass(commitment, Field);
        const ret = wasm.transition_containsCommitment(this.__wbg_ptr, commitment.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Check if the transition contains a serial number.
     *
     * @param {Field} serial_number The serial number to check for
     *
     * @returns {bool} True if the transition contains a serial number, false otherwise
     * @param {Field} serial_number
     * @returns {boolean}
     */
    containsSerialNumber(serial_number) {
        _assertClass(serial_number, Field);
        const ret = wasm.transition_containsSerialNumber(this.__wbg_ptr, serial_number.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the transition ID
     *
     * @returns {string} The transition ID
     * @returns {string}
     */
    id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transition_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get the transition signer commitment of the transition.
     *
     * @returns {Field} Transition signer commitment
     * @returns {Field}
     */
    scm() {
        const ret = wasm.transition_scm(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Get the transition commitment of the transition.
     *
     * @returns {Field} Transition commitment
     * @returns {Field}
     */
    tcm() {
        const ret = wasm.transition_tcm(this.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Get the transition public key of the transition.
     *
     * @returns {Group} Transition public key
     * @returns {Group}
     */
    tpk() {
        const ret = wasm.address_toGroup(this.__wbg_ptr);
        return Group.__wrap(ret);
    }
    /**
     * Get the transition view key of the transition.
     *
     * @param {ViewKey} view_key The view key of the transition signer.
     *
     * @returns {Field} Transition view key
     * @param {ViewKey} view_key
     * @returns {Field}
     */
    tvk(view_key) {
        _assertClass(view_key, ViewKey);
        const ret = wasm.transition_tvk(this.__wbg_ptr, view_key.__wbg_ptr);
        return Field.__wrap(ret);
    }
    /**
     * Get the inputs of the transition.
     *
     * @param {bool} convert_to_js If true the inputs will be converted to JS objects, if false
     * the inputs will be in wasm format.
     *
     * @returns {Array} Array of inputs
     * @param {boolean} convert_to_js
     * @returns {Array<any>}
     */
    inputs(convert_to_js) {
        const ret = wasm.transition_inputs(this.__wbg_ptr, convert_to_js);
        return takeObject(ret);
    }
    /**
     * Get the outputs of the transition.
     *
     * @param {bool} convert_to_js If true the outputs will be converted to JS objects, if false
     * the outputs will be in wasm format.
     *
     * @returns {Array} Array of outputs
     * @param {boolean} convert_to_js
     * @returns {Array<any>}
     */
    outputs(convert_to_js) {
        const ret = wasm.transition_outputs(this.__wbg_ptr, convert_to_js);
        return takeObject(ret);
    }
    /**
     * Get the records present in a transition and their commitments.
     *
     * @returns {Array<{commitment: Field, record: RecordCiphertext}>} Array of record ciphertext objects
     * @returns {Array<any>}
     */
    records() {
        const ret = wasm.transition_records(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get the transition as a string. If you want to submit this transition to the Aleo Network
     * this function will create the string that should be submitted in the `POST` data.
     *
     * @returns {string} String representation of the transition
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transition_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Transition.prototype[Symbol.dispose] = Transition.prototype.free;

const U128Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_u128_free(ptr >>> 0, 1));

class U128 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(U128.prototype);
        obj.__wbg_ptr = ptr;
        U128Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        U128Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_u128_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {U128}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i128_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.u128_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {U128}
     */
    absChecked() {
        const ret = wasm.i128_clone(this.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {U128}
     */
    absWrapped() {
        const ret = wasm.i128_clone(this.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {U128} other
     * @returns {U128}
     */
    addWrapped(other) {
        _assertClass(other, U128);
        const ret = wasm.i128_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {U128} other
     * @returns {U128}
     */
    divWrapped(other) {
        _assertClass(other, U128);
        const ret = wasm.u128_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {U128}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {U128}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.u128_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {U128} other
     * @returns {U128}
     */
    mulWrapped(other) {
        _assertClass(other, U128);
        const ret = wasm.i128_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {U128} other
     * @returns {U128}
     */
    remWrapped(other) {
        _assertClass(other, U128);
        const ret = wasm.u128_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {U128} other
     * @returns {U128}
     */
    subWrapped(other) {
        _assertClass(other, U128);
        const ret = wasm.i128_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {U128}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.u128_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {U128}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i128_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {U128}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI128Lossy(field.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.u128_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {U128}
     */
    neg() {
        const ret = wasm.u128_neg(this.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {U128} other
     * @returns {U128}
     */
    rem(other) {
        _assertClass(other, U128);
        const ret = wasm.u128_rem(this.__wbg_ptr, other.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {U128}
     */
    clone() {
        const ret = wasm.i128_clone(this.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {U128} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, U128);
        const ret = wasm.i128_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {U128}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.u128_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {U128}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.u128_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {U128}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.u128_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return U128.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.u128_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u128_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) U128.prototype[Symbol.dispose] = U128.prototype.free;

const U16Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_u16_free(ptr >>> 0, 1));

class U16 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(U16.prototype);
        obj.__wbg_ptr = ptr;
        U16Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        U16Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_u16_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {U16}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i16_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.i16_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {U16}
     */
    absChecked() {
        const ret = wasm.i16_clone(this.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {U16}
     */
    absWrapped() {
        const ret = wasm.i16_clone(this.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {U16} other
     * @returns {U16}
     */
    addWrapped(other) {
        _assertClass(other, U16);
        const ret = wasm.i16_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {U16} other
     * @returns {U16}
     */
    divWrapped(other) {
        _assertClass(other, U16);
        const ret = wasm.u16_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {U16}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {U16}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.u16_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {U16} other
     * @returns {U16}
     */
    mulWrapped(other) {
        _assertClass(other, U16);
        const ret = wasm.i16_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {U16} other
     * @returns {U16}
     */
    remWrapped(other) {
        _assertClass(other, U16);
        const ret = wasm.u16_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {U16} other
     * @returns {U16}
     */
    subWrapped(other) {
        _assertClass(other, U16);
        const ret = wasm.i16_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {U16}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.u16_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {U16}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {U16}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI16Lossy(field.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.i16_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {U16}
     */
    neg() {
        const ret = wasm.u16_neg(this.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {U16} other
     * @returns {U16}
     */
    rem(other) {
        _assertClass(other, U16);
        const ret = wasm.u16_rem(this.__wbg_ptr, other.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {U16}
     */
    clone() {
        const ret = wasm.i16_clone(this.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {U16} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, U16);
        const ret = wasm.i16_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {U16}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.u16_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {U16}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.u16_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {U16}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.u16_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return U16.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i16_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.i16_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u16_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) U16.prototype[Symbol.dispose] = U16.prototype.free;

const U32Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_u32_free(ptr >>> 0, 1));

class U32 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(U32.prototype);
        obj.__wbg_ptr = ptr;
        U32Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        U32Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_u32_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {U32}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i32_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.u32_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {U32}
     */
    absChecked() {
        const ret = wasm.i32_clone(this.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {U32}
     */
    absWrapped() {
        const ret = wasm.i32_clone(this.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {U32} other
     * @returns {U32}
     */
    addWrapped(other) {
        _assertClass(other, U32);
        const ret = wasm.i32_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {U32} other
     * @returns {U32}
     */
    divWrapped(other) {
        _assertClass(other, U32);
        const ret = wasm.u32_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {U32}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {U32}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.u32_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {U32} other
     * @returns {U32}
     */
    mulWrapped(other) {
        _assertClass(other, U32);
        const ret = wasm.i32_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {U32} other
     * @returns {U32}
     */
    remWrapped(other) {
        _assertClass(other, U32);
        const ret = wasm.u32_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {U32} other
     * @returns {U32}
     */
    subWrapped(other) {
        _assertClass(other, U32);
        const ret = wasm.i32_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {U32}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.u32_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {U32}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i32_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {U32}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI32Lossy(field.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.u32_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {U32}
     */
    neg() {
        const ret = wasm.u16_neg(this.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {U32} other
     * @returns {U32}
     */
    rem(other) {
        _assertClass(other, U32);
        const ret = wasm.u32_rem(this.__wbg_ptr, other.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {U32}
     */
    clone() {
        const ret = wasm.i32_clone(this.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {U32} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, U32);
        const ret = wasm.i32_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {U32}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.u32_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {U32}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.u32_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {U32}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.u32_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return U32.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.u32_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u32_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) U32.prototype[Symbol.dispose] = U32.prototype.free;

const U64Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_u64_free(ptr >>> 0, 1));

class U64 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(U64.prototype);
        obj.__wbg_ptr = ptr;
        U64Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        U64Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_u64_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {U64}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i64_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.u64_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {U64}
     */
    absChecked() {
        const ret = wasm.i64_clone(this.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {U64}
     */
    absWrapped() {
        const ret = wasm.i64_clone(this.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {U64} other
     * @returns {U64}
     */
    addWrapped(other) {
        _assertClass(other, U64);
        const ret = wasm.i64_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {U64} other
     * @returns {U64}
     */
    divWrapped(other) {
        _assertClass(other, U64);
        const ret = wasm.u64_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {U64}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {U64}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.u64_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {U64} other
     * @returns {U64}
     */
    mulWrapped(other) {
        _assertClass(other, U64);
        const ret = wasm.i64_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {U64} other
     * @returns {U64}
     */
    remWrapped(other) {
        _assertClass(other, U64);
        const ret = wasm.u64_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {U64} other
     * @returns {U64}
     */
    subWrapped(other) {
        _assertClass(other, U64);
        const ret = wasm.i64_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {U64}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.u64_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {U64}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i64_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {U64}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI64Lossy(field.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.u64_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {U64}
     */
    neg() {
        const ret = wasm.u16_neg(this.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {U64} other
     * @returns {U64}
     */
    rem(other) {
        _assertClass(other, U64);
        const ret = wasm.u64_rem(this.__wbg_ptr, other.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {U64}
     */
    clone() {
        const ret = wasm.i64_clone(this.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {U64} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, U64);
        const ret = wasm.i64_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {U64}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.u64_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {U64}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.u64_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {U64}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.u64_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return U64.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.u64_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u64_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) U64.prototype[Symbol.dispose] = U64.prototype.free;

const U8Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_u8_free(ptr >>> 0, 1));

class U8 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(U8.prototype);
        obj.__wbg_ptr = ptr;
        U8Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        U8Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_u8_free(ptr, 0);
    }
    /**
     * Attempt to construct the integer from a field element.
     * @param {Field} field
     * @returns {U8}
     */
    static fromField(field) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(field, Field);
            wasm.i8_fromField(retptr, field.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the boolean array representation of the integer.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.i8_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Checked absolute value.
     * @returns {U8}
     */
    absChecked() {
        const ret = wasm.i8_clone(this.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Wrapped absolute value.
     * @returns {U8}
     */
    absWrapped() {
        const ret = wasm.i8_clone(this.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Wrapped addition with another integer.
     * @param {U8} other
     * @returns {U8}
     */
    addWrapped(other) {
        _assertClass(other, U8);
        const ret = wasm.i8_addWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Wrapped division.
     * @param {U8} other
     * @returns {U8}
     */
    divWrapped(other) {
        _assertClass(other, U8);
        const ret = wasm.u8_divWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Atttempt to construct the integer from a list of field elements.
     * @param {Array<any>} fields
     * @returns {U8}
     */
    static fromFields(fields) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_fromFields(retptr, addHeapObject(fields));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a string representation.
     * @param {string} s
     * @returns {U8}
     */
    static fromString(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.u8_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Wrapped multiplication with another integer.
     * @param {U8} other
     * @returns {U8}
     */
    mulWrapped(other) {
        _assertClass(other, U8);
        const ret = wasm.i8_mulWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Get the remainder from an integer division which wraps if there's an overflow.
     * @param {U8} other
     * @returns {U8}
     */
    remWrapped(other) {
        _assertClass(other, U8);
        const ret = wasm.u8_remWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Wrapped subtraction with another integer.
     * @param {U8} other
     * @returns {U8}
     */
    subWrapped(other) {
        _assertClass(other, U8);
        const ret = wasm.i8_subWrapped(this.__wbg_ptr, other.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Construct an integer from a byte array representation.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I8 with lossy truncation.
     * @returns {I8}
     */
    toI8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U8 with lossy truncation.
     * @returns {U8}
     */
    toU8Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI8Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a boolean array representation.
     * @param {Array<any>} bits
     * @returns {U8}
     */
    static fromBitsLe(bits) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_fromBitsLe(retptr, addBorrowedObject(bits));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I16 with lossy truncation.
     * @returns {I16}
     */
    toI16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I32 with lossy truncation.
     * @returns {I32}
     */
    toI32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to I64 with lossy truncation.
     * @returns {I64}
     */
    toI64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
     * @returns {Plaintext}
     */
    toPlaintext() {
        const ret = wasm.u8_toPlaintext(this.__wbg_ptr);
        return Plaintext.__wrap(ret);
    }
    /**
     * Cast to U16 with lossy truncation.
     * @returns {U16}
     */
    toU16Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI16Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U16.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U32 with lossy truncation.
     * @returns {U32}
     */
    toU32Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI32Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U32.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U64 with lossy truncation.
     * @returns {U64}
     */
    toU64Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI64Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U64.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the byte array representation of the integer.
     * @param {Uint8Array} bytes
     * @returns {U8}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_fromBytesLe(retptr, addBorrowedObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U8.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Cast to I128 with lossy truncation.
     * @returns {I128}
     */
    toI128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return I128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Cast to U128 with lossy truncation.
     * @returns {U128}
     */
    toU128Lossy() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toI128Lossy(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return U128.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Construct an integer from a field element with lossy truncation.
     * @param {Field} field
     * @returns {U8}
     */
    static fromFieldLossy(field) {
        _assertClass(field, Field);
        const ret = wasm.field_toI8Lossy(field.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
     * @returns {Boolean}
     */
    toBooleanLossy() {
        const ret = wasm.i8_toBooleanLossy(this.__wbg_ptr);
        return Boolean.__wrap(ret);
    }
    /**
     * Negate the integer (e.g., 5 → -5).
     * @returns {U8}
     */
    neg() {
        const ret = wasm.u16_neg(this.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Get the remainder from integer division.
     * @param {U8} other
     * @returns {U8}
     */
    rem(other) {
        _assertClass(other, U8);
        const ret = wasm.u8_rem(this.__wbg_ptr, other.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Clone the integer in wasm memory.
     * @returns {U8}
     */
    clone() {
        const ret = wasm.i8_clone(this.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Check equality with another integer.
     * @param {U8} other
     * @returns {boolean}
     */
    equals(other) {
        _assertClass(other, U8);
        const ret = wasm.i8_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exponentiate the integer with a u8 exponent.
     * @param {U8} exponent
     * @returns {U8}
     */
    powU8(exponent) {
        _assertClass(exponent, U8);
        const ret = wasm.u8_powU8(this.__wbg_ptr, exponent.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u16 exponent.
     * @param {U16} exponent
     * @returns {U8}
     */
    powU16(exponent) {
        _assertClass(exponent, U16);
        const ret = wasm.u8_powU16(this.__wbg_ptr, exponent.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Exponentiate the integer with a u32 exponent.
     * @param {U32} exponent
     * @returns {U8}
     */
    powU32(exponent) {
        _assertClass(exponent, U32);
        const ret = wasm.u8_powU32(this.__wbg_ptr, exponent.__wbg_ptr);
        return U8.__wrap(ret);
    }
    /**
     * Convert the integer to a Field element (lossless).
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.i8_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Convert the integer to a Scalar value.
     * @returns {Scalar}
     */
    toScalar() {
        const ret = wasm.i8_toScalar(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get the string representation of the integer.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.u8_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) U8.prototype[Symbol.dispose] = U8.prototype.free;

const ValueFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_value_free(ptr >>> 0, 1));
/**
 * Aleo Value type. Value is the fundamental type representing program function inputs and outputs
 * in Aleo. It wraps three variants: Plaintext, Record, and Future.
 *
 * @example
 * // Parse a plaintext value from a string.
 * const value = Value.fromString("100u64");
 * console.log(value.valueType()); // "plaintext"
 * console.log(value.isPlaintext()); // true
 *
 * // Extract the inner Plaintext.
 * const plaintext = value.toPlaintext();
 * console.log(plaintext.toString()); // "100u64"
 */
class Value {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Value.prototype);
        obj.__wbg_ptr = ptr;
        ValueFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ValueFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_value_free(ptr, 0);
    }
    /**
     * Returns the little-endian boolean array representation of the bits.
     *
     * @returns {Array} Boolean array of bits in little-endian order.
     * @returns {Array<any>}
     */
    toBitsLe() {
        const ret = wasm.value_toBitsLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Returns the type of the value variant as a string.
     *
     * Possible values: "plaintext", "record", "future", "dynamic_record", or "dynamic_future".
     *
     * @returns {string} The variant type name.
     * @returns {string}
     */
    valueType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.value_valueType(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Creates a Value from its string representation.
     *
     * @param {string} value The string representation of the value.
     * @returns {Value} The Value object.
     * @param {string} value
     * @returns {Value}
     */
    static fromString(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(value, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.value_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Value.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the little-endian byte array representation of the value.
     *
     * @returns {Uint8Array} The little-endian byte array.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.value_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns true if the value is a Plaintext variant.
     *
     * @returns {boolean}
     * @returns {boolean}
     */
    isPlaintext() {
        const ret = wasm.value_isPlaintext(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Extracts the inner Plaintext from a Plaintext variant.
     *
     * @returns {Plaintext} The inner Plaintext value.
     * @throws If the value is not a Plaintext variant.
     * @returns {Plaintext}
     */
    toPlaintext() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.value_toPlaintext(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Plaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a Value from a little-endian byte array.
     *
     * @param {Uint8Array} bytes A little-endian byte array.
     * @returns {Value} The Value object.
     * @param {Uint8Array} bytes
     * @returns {Value}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.value_fromBytesLe(retptr, addHeapObject(bytes));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Value.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the raw field array representation of the value.
     *
     * @returns {Array} Array of raw Field elements.
     * @returns {Array<any>}
     */
    toFieldsRaw() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.value_toFieldsRaw(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a Value from a Plaintext object.
     *
     * @param {Plaintext} plaintext The Plaintext to wrap.
     * @returns {Value} A Value wrapping the Plaintext.
     * @param {Plaintext} plaintext
     * @returns {Value}
     */
    static fromPlaintext(plaintext) {
        _assertClass(plaintext, Plaintext);
        const ret = wasm.value_fromPlaintext(plaintext.__wbg_ptr);
        return Value.__wrap(ret);
    }
    /**
     * Returns the raw big-endian boolean array representation of the bits.
     *
     * @returns {Array} Raw boolean array of bits in big-endian order.
     * @returns {Array<any>}
     */
    toBitsRawBe() {
        const ret = wasm.value_toBitsRawBe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Returns the raw little-endian boolean array representation of the bits.
     *
     * @returns {Array} Raw boolean array of bits in little-endian order.
     * @returns {Array<any>}
     */
    toBitsRawLe() {
        const ret = wasm.value_toBitsRawLe(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Extracts the inner Record from a Record variant as a RecordPlaintext.
     *
     * @returns {RecordPlaintext} The inner record.
     * @throws If the value is not a Record variant.
     * @returns {RecordPlaintext}
     */
    toRecordPlaintext() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.value_toRecordPlaintext(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return RecordPlaintext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Creates a Value from a RecordPlaintext object.
     *
     * @param {RecordPlaintext} record The RecordPlaintext to wrap.
     * @returns {Value} A Value wrapping the Record.
     * @param {RecordPlaintext} record
     * @returns {Value}
     */
    static fromRecordPlaintext(record) {
        _assertClass(record, RecordPlaintext);
        const ret = wasm.value_fromRecordPlaintext(record.__wbg_ptr);
        return Value.__wrap(ret);
    }
    /**
     * Returns true if the value is a Future variant.
     *
     * Note: There is no `toFuture()` method because the Future type does not have a WASM wrapper.
     * Use `toString()` or `toBytesLe()` to serialize a Future value.
     *
     * @returns {boolean}
     * @returns {boolean}
     */
    isFuture() {
        const ret = wasm.value_isFuture(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns true if the value is a Record variant.
     *
     * @returns {boolean}
     * @returns {boolean}
     */
    isRecord() {
        const ret = wasm.value_isRecord(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the field array representation of the value.
     *
     * @returns {Array} Array of Field elements.
     * @returns {Array<any>}
     */
    toFields() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.value_toFields(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the string representation of the value.
     *
     * @returns {string} The string representation of the value.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.value_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Value.prototype[Symbol.dispose] = Value.prototype.free;

const VerifyingKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_verifyingkey_free(ptr >>> 0, 1));
/**
 * Verifying key for a function within an Aleo program
 */
class VerifyingKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(VerifyingKey.prototype);
        obj.__wbg_ptr = ptr;
        VerifyingKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VerifyingKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_verifyingkey_free(ptr, 0);
    }
    /**
     * Construct a new verifying key from a byte array
     *
     * @param {Uint8Array} bytes Byte representation of a verifying key
     * @returns {VerifyingKey}
     * @param {Uint8Array} bytes
     * @returns {VerifyingKey}
     */
    static fromBytes(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.verifyingkey_fromBytes(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return VerifyingKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a verifying key from string
     *
     * @param {String} string String representation of a verifying key
     * @returns {VerifyingKey}
     * @param {string} string
     * @returns {VerifyingKey}
     */
    static fromString(string) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(string, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.verifyingkey_fromString(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return VerifyingKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the number of constraints associated with the circuit
     *
     * @returns {number} The number of constraints
     * @returns {number}
     */
    numConstraints() {
        const ret = wasm.verifyingkey_numConstraints(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Verify a batch SNARK proof against multiple verifying keys and their corresponding public inputs.
     *
     * @param {Array<string>} verifying_keys Array of verifying key strings, one per circuit
     * @param {Array<Array<Array<string>>>} inputs 3D array of field element strings [circuit_idx][instance_idx][field_idx]
     * @param {Proof} proof The batch proof to verify
     * @returns {boolean} True if the batch proof is valid, false otherwise
     * @param {Array<any>} verifying_keys
     * @param {Array<any>} inputs
     * @param {Proof} proof
     * @returns {boolean}
     */
    static verifyBatch(verifying_keys, inputs, proof) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(proof, Proof);
            wasm.verifyingkey_verifyBatch(retptr, addHeapObject(verifying_keys), addHeapObject(inputs), proof.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a copy of the verifying key
     *
     * @returns {VerifyingKey} A copy of the verifying key
     * @returns {VerifyingKey}
     */
    copy() {
        const ret = wasm.verifyingkey_copy(this.__wbg_ptr);
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Verify a SNARK proof against this verifying key and public inputs.
     *
     * @param {Array<string>} inputs Array of field element strings representing public inputs (e.g. ["1field", "2field"])
     * @param {Proof} proof The proof to verify
     * @returns {boolean} True if the proof is valid, false otherwise
     * @param {Array<any>} inputs
     * @param {Proof} proof
     * @returns {boolean}
     */
    verify(inputs, proof) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(proof, Proof);
            wasm.verifyingkey_verify(retptr, this.__wbg_ptr, addHeapObject(inputs), proof.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the checksum of the verifying key
     *
     * @returns {string} Checksum of the verifying key
     * @returns {string}
     */
    checksum() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.verifyingkey_checksum(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Create a byte array from a verifying key
     *
     * @returns {Uint8Array} Byte representation of a verifying key
     * @returns {Uint8Array}
     */
    toBytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.verifyingkey_toBytes(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a string representation of the verifying key
     *
     * @returns {String} String representation of the verifying key
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.verifyingkey_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the verifying key for the join function
     *
     * @returns {VerifyingKey} Verifying key for the join function
     * @returns {VerifyingKey}
     */
    static joinVerifier() {
        const ret = wasm.verifyingkey_joinVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the split function
     *
     * @returns {VerifyingKey} Verifying key for the split function
     * @returns {VerifyingKey}
     */
    static splitVerifier() {
        const ret = wasm.verifyingkey_splitVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Verifies the verifying key is for the join function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isJoinVerifier() {
        const ret = wasm.verifyingkey_isJoinVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verifies the verifying key is for the split function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isSplitVerifier() {
        const ret = wasm.verifyingkey_isSplitVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the verifying key for the inclusion function
     *
     * @returns {VerifyingKey} Verifying key for the inclusion function
     * @returns {VerifyingKey}
     */
    static inclusionVerifier() {
        const ret = wasm.verifyingkey_inclusionVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the fee_public function
     *
     * @returns {VerifyingKey} Verifying key for the fee_public function
     * @returns {VerifyingKey}
     */
    static feePublicVerifier() {
        const ret = wasm.verifyingkey_feePublicVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the bond_public function
     *
     * @returns {VerifyingKey} Verifying key for the bond_public function
     * @returns {VerifyingKey}
     */
    static bondPublicVerifier() {
        const ret = wasm.verifyingkey_bondPublicVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the fee_private function
     *
     * @returns {VerifyingKey} Verifying key for the fee_private function
     * @returns {VerifyingKey}
     */
    static feePrivateVerifier() {
        const ret = wasm.verifyingkey_feePrivateVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Verifies the verifying key is for the inclusion function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isInclusionVerifier() {
        const ret = wasm.verifyingkey_isInclusionVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verifies the verifying key is for the fee_public function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isFeePublicVerifier() {
        const ret = wasm.verifyingkey_isFeePublicVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the verifying key for the unbond_public function
     *
     * @returns {VerifyingKey} Verifying key for the unbond_public function
     * @returns {VerifyingKey}
     */
    static unbondPublicVerifier() {
        const ret = wasm.verifyingkey_unbondPublicVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the bond_validator function
     *
     * @returns {VerifyingKey} Verifying key for the bond_validator function
     * @returns {VerifyingKey}
     */
    static bondValidatorVerifier() {
        const ret = wasm.verifyingkey_bondValidatorVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the bond_public function
     *
     * @returns {VerifyingKey} Verifying key for the bond_public function
     * @returns {boolean}
     */
    isBondPublicVerifier() {
        const ret = wasm.verifyingkey_isBondPublicVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verifies the verifying key is for the fee_private function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isFeePrivateVerifier() {
        const ret = wasm.verifyingkey_isFeePrivateVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the verifying key for the transfer_public function
     *
     * @returns {VerifyingKey} Verifying key for the transfer_public function
     * @returns {VerifyingKey}
     */
    static transferPublicVerifier() {
        const ret = wasm.verifyingkey_transferPublicVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Verifies the verifying key is for the unbond_public function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isUnbondPublicVerifier() {
        const ret = wasm.verifyingkey_isUnbondPublicVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the verifying key for the transfer_private function
     *
     * @returns {VerifyingKey} Verifying key for the transfer_private function
     * @returns {VerifyingKey}
     */
    static transferPrivateVerifier() {
        const ret = wasm.verifyingkey_transferPrivateVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the bond_validator function
     *
     * @returns {VerifyingKey} Verifying key for the bond_validator function
     * @returns {boolean}
     */
    isBondValidatorVerifier() {
        const ret = wasm.verifyingkey_isBondValidatorVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verifies the verifying key is for the transfer_public function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isTransferPublicVerifier() {
        const ret = wasm.verifyingkey_isTransferPublicVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the verifying key for the claim_delegator function
     *
     * @returns {VerifyingKey} Verifying key for the claim_unbond_public function
     * @returns {VerifyingKey}
     */
    static claimUnbondPublicVerifier() {
        const ret = wasm.verifyingkey_claimUnbondPublicVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Verifies the verifying key is for the transfer_private function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isTransferPrivateVerifier() {
        const ret = wasm.verifyingkey_isTransferPrivateVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the verifying key for the set_validator_state function
     *
     * @returns {VerifyingKey} Verifying key for the set_validator_state function
     * @returns {VerifyingKey}
     */
    static setValidatorStateVerifier() {
        const ret = wasm.verifyingkey_setValidatorStateVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Verifies the verifying key is for the claim_delegator function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isClaimUnbondPublicVerifier() {
        const ret = wasm.verifyingkey_isClaimUnbondPublicVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verifies the verifying key is for the set_validator_state function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isSetValidatorStateVerifier() {
        const ret = wasm.verifyingkey_isSetValidatorStateVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the verifying key for the transfer_public_as_signer function
     *
     * @returns {VerifyingKey} Verifying key for the transfer_public_as_signer function
     * @returns {VerifyingKey}
     */
    static transferPublicAsSignerVerifier() {
        const ret = wasm.verifyingkey_transferPublicAsSignerVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the transfer_private_to_public function
     *
     * @returns {VerifyingKey} Verifying key for the transfer_private_to_public function
     * @returns {VerifyingKey}
     */
    static transferPrivateToPublicVerifier() {
        const ret = wasm.verifyingkey_transferPrivateToPublicVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Returns the verifying key for the transfer_public_to_private function
     *
     * @returns {VerifyingKey} Verifying key for the transfer_public_to_private function
     * @returns {VerifyingKey}
     */
    static transferPublicToPrivateVerifier() {
        const ret = wasm.verifyingkey_transferPublicToPrivateVerifier();
        return VerifyingKey.__wrap(ret);
    }
    /**
     * Verifies the verifying key is for the transfer_public_as_signer function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isTransferPublicAsSignerVerifier() {
        const ret = wasm.verifyingkey_isTransferPublicAsSignerVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verifies the verifying key is for the transfer_private_to_public function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isTransferPrivateToPublicVerifier() {
        const ret = wasm.verifyingkey_isTransferPrivateToPublicVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Verifies the verifying key is for the transfer_public_to_private function
     *
     * @returns {bool}
     * @returns {boolean}
     */
    isTransferPublicToPrivateVerifier() {
        const ret = wasm.verifyingkey_isTransferPublicToPrivateVerifier(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) VerifyingKey.prototype[Symbol.dispose] = VerifyingKey.prototype.free;

const ViewKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_viewkey_free(ptr >>> 0, 1));

class ViewKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ViewKey.prototype);
        obj.__wbg_ptr = ptr;
        ViewKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ViewKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_viewkey_free(ptr, 0);
    }
    /**
     * Get the address corresponding to a view key
     *
     * @returns {Address} Address
     * @returns {Address}
     */
    to_address() {
        const ret = wasm.address_from_view_key(this.__wbg_ptr);
        return Address.__wrap(ret);
    }
    /**
     * Create a new view key from a string representation of a view key
     *
     * @param {string} view_key String representation of a view key
     * @returns {ViewKey} View key
     * @param {string} view_key
     * @returns {ViewKey}
     */
    static from_string(view_key) {
        const ptr0 = passStringToWasm0(view_key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.viewkey_from_string(ptr0, len0);
        return ViewKey.__wrap(ret);
    }
    /**
     * Get the underlying bytes of a view key.
     *
     * @returns {Uint8Array} Left endian byte array representation of the view key.
     * @returns {Uint8Array}
     */
    toBytesLe() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.viewkey_toBytesLe(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a string representation of a view key
     *
     * @returns {string} String representation of a view key
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.viewkey_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get a ViewKey from a series of bytes.
     *
     * @param {Uint8Array} bytes A left endian byte array representing the view key.
     *
     * @returns {ViewKey} The view key object.
     * @param {Uint8Array} bytes
     * @returns {ViewKey}
     */
    static fromBytesLe(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.viewkey_fromBytesLe(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ViewKey.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new view key from a private key
     *
     * @param {PrivateKey} private_key Private key
     * @returns {ViewKey} View key
     * @param {PrivateKey} private_key
     * @returns {ViewKey}
     */
    static from_private_key(private_key) {
        _assertClass(private_key, PrivateKey);
        const ret = wasm.viewkey_from_private_key(private_key.__wbg_ptr);
        return ViewKey.__wrap(ret);
    }
    /**
     * Decrypt a record ciphertext with a view key
     *
     * @param {string} ciphertext String representation of a record ciphertext
     * @returns {string} String representation of a record plaintext
     * @param {string} ciphertext
     * @returns {string}
     */
    decrypt(ciphertext) {
        let deferred3_0;
        let deferred3_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(ciphertext, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.viewkey_decrypt(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr2 = r0;
            var len2 = r1;
            if (r3) {
                ptr2 = 0; len2 = 0;
                throw takeObject(r2);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Cast the view key to a field.
     * @returns {Field}
     */
    toField() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.viewkey_toField(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Field.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the underlying scalar of a view key.
     * @returns {Scalar}
     */
    to_scalar() {
        const ret = wasm.field_clone(this.__wbg_ptr);
        return Scalar.__wrap(ret);
    }
    /**
     * Get a string representation of a view key
     *
     * @returns {string} String representation of a view key
     * @returns {string}
     */
    to_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.viewkey_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) ViewKey.prototype[Symbol.dispose] = ViewKey.prototype.free;

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
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
}

function __wbg_get_imports(memory) {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg___wbindgen_boolean_get_6d5a1ee65bab5f68 = function(arg0) {
        const v = getObject(arg0);
        const ret = typeof(v) === 'boolean' ? v : undefined;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg___wbindgen_debug_string_df47ffb5e35e6763 = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_is_function_ee8a6c5833c90377 = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'function';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_object_c818261d21f283a4 = function(arg0) {
        const val = getObject(arg0);
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_string_fbb76cb2940daafd = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'string';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_undefined_2d472862bd29a478 = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_memory_27faa6e0e73716bd = function() {
        const ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg___wbindgen_module_66f1f22805762dd9 = function() {
        const ret = __wbg_init.__wbindgen_wasm_module;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg___wbindgen_number_get_a20bf9b85341449d = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg___wbindgen_rethrow_ea38273dafc473e6 = function(arg0) {
        throw takeObject(arg0);
    };
    imports.wbg.__wbg___wbindgen_string_get_e4f06c90489ad01b = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_throw_b855445ff6a94295 = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg__wbg_cb_unref_2454a539ea5790d9 = function(arg0) {
        getObject(arg0)._wbg_cb_unref();
    };
    imports.wbg.__wbg_abort_e7eb059f72f9ed0c = function(arg0) {
        getObject(arg0).abort();
    };
    imports.wbg.__wbg_address_new = function(arg0) {
        const ret = Address.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_append_b577eb3a177bc0fa = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_apply_04097a755e1e4a1e = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).apply(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_arrayBuffer_b375eccb84b4ddf3 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).arrayBuffer();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_async_e87317718510d1c4 = function(arg0) {
        const ret = getObject(arg0).async;
        return ret;
    };
    imports.wbg.__wbg_authorization_new = function(arg0) {
        const ret = Authorization.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_buffer_83ef46cd84885a60 = function(arg0) {
        const ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_call_525440f72fbfc0ea = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_call_e762c39fa8ea36bf = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_ciphertext_new = function(arg0) {
        const ret = Ciphertext.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_clearTimeout_5a54f8841c30079a = function(arg0) {
        const ret = clearTimeout(takeObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_crypto_574e78ad8b13b65f = function(arg0) {
        const ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_data_ee4306d069f24f2d = function(arg0) {
        const ret = getObject(arg0).data;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_done_2042aa2670fb1db1 = function(arg0) {
        const ret = getObject(arg0).done;
        return ret;
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_export4(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_executionresponse_new = function(arg0) {
        const ret = ExecutionResponse.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_fetch_f1856afdb49415d1 = function(arg0) {
        const ret = fetch(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_fetch_f8ba0e29a9d6de0d = function(arg0, arg1) {
        const ret = getObject(arg0).fetch(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_field_new = function(arg0) {
        const ret = Field.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_field_unwrap = function(arg0) {
        const ret = Field.__unwrap(takeObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_from_a4ad7cbddd0d7135 = function(arg0) {
        const ret = Array.from(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_get_7bed016f185add81 = function(arg0, arg1) {
        const ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_get_efcb449f58ec27c2 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_group_new = function(arg0) {
        const ret = Group.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_group_unwrap = function(arg0) {
        const ret = Group.__unwrap(takeObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_has_787fafc980c3ccdb = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.has(getObject(arg0), getObject(arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_headers_b87d7eaba61c3278 = function(arg0) {
        const ret = getObject(arg0).headers;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_Promise_001fdd42afa1b7ef = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Promise;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Response_f4f3e87e07f3135c = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Response;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8Array_20c8e73002f7af98 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_isArray_96e0af9891d0945d = function(arg0) {
        const ret = Array.isArray(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_iterator_e5822695327a3c39 = function() {
        const ret = Symbol.iterator;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_keypair_new = function(arg0) {
        const ret = KeyPair.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_keys_b4d27b02ad14f4be = function(arg0) {
        const ret = Object.keys(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_69bca3cb64fc8748 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_length_cdd215e10d9dd507 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_log_78f898e0b3066062 = function(arg0, arg1) {
        console.log(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(arg0) {
        const ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_1acc0b6eea89d040 = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_2531773dac38ebb3 = function() { return handleError(function () {
        const ret = new AbortController();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_3c3d849046688a66 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wasm_bindgen_func_elem_7473(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            const ret = new Promise(cb0);
            return addHeapObject(ret);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_new_4768a01acc2de787 = function() { return handleError(function (arg0, arg1) {
        const ret = new Worker(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_5a79be3ab53b8aa5 = function(arg0) {
        const ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_76221876a34390ff = function(arg0) {
        const ret = new Int32Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_9edf9838a2def39c = function() { return handleError(function () {
        const ret = new Headers();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_e17d9f43105b08be = function() {
        const ret = new Array();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_f3e768bd20ab7547 = function() { return handleError(function () {
        const ret = new XMLHttpRequest();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_from_slice_92f4d78ca282a2d2 = function(arg0, arg1) {
        const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_no_args_ee98eee5275000a4 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_with_length_01aa0dc35aa13543 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_with_length_31d2669cb75c5215 = function(arg0) {
        const ret = new Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_with_str_and_init_0ae7728b6ec367b1 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_next_020810e0ae8ebcb0 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).next();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_next_2c826fe5dfec6b6a = function(arg0) {
        const ret = getObject(arg0).next;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_node_905d3e251edff8a2 = function(arg0) {
        const ret = getObject(arg0).node;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_of_3192b3b018b8f660 = function(arg0, arg1, arg2) {
        const ret = Array.of(getObject(arg0), getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_open_2024059c832360cf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        getObject(arg0).open(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), arg5 !== 0);
    }, arguments) };
    imports.wbg.__wbg_overrideMimeType_254a6b64025fe2fd = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).overrideMimeType(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_plaintext_new = function(arg0) {
        const ret = Plaintext.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_postMessage_f34857ca078c8536 = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).postMessage(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_process_dc0fbacc7c1c06f7 = function(arg0) {
        const ret = getObject(arg0).process;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_prototypesetcall_2a6620b6922694b2 = function(arg0, arg1, arg2) {
        Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), getObject(arg2));
    };
    imports.wbg.__wbg_provingrequest_new = function(arg0) {
        const ret = ProvingRequest.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_push_df81a39d04db858c = function(arg0, arg1) {
        const ret = getObject(arg0).push(getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_queueMicrotask_34d692c25c47d05b = function(arg0) {
        const ret = getObject(arg0).queueMicrotask;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_queueMicrotask_9d76cacb20c84d58 = function(arg0) {
        queueMicrotask(getObject(arg0));
    };
    imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).randomFillSync(takeObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_recordciphertext_new = function(arg0) {
        const ret = RecordCiphertext.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_recordciphertext_unwrap = function(arg0) {
        const ret = RecordCiphertext.__unwrap(takeObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_recordplaintext_new = function(arg0) {
        const ret = RecordPlaintext.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_require_60cc747a6bc5215a = function() { return handleError(function () {
        const ret = module.require;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_resolve_caf97c30b83f7053 = function(arg0) {
        const ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_responseText_d80ed2074210c2e1 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg1).responseText;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_response_5d5eaee5f929ee4a = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).response;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_send_2e90b7c1fa1cdaf6 = function() { return handleError(function (arg0) {
        getObject(arg0).send();
    }, arguments) };
    imports.wbg.__wbg_setTimeout_db2dbaeefb6f39c7 = function() { return handleError(function (arg0, arg1) {
        const ret = setTimeout(getObject(arg0), arg1);
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_set_body_3c365989753d61f4 = function(arg0, arg1) {
        getObject(arg0).body = getObject(arg1);
    };
    imports.wbg.__wbg_set_c213c871859d6500 = function(arg0, arg1, arg2) {
        getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
    };
    imports.wbg.__wbg_set_c2abbebe8b9ebee1 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_credentials_f621cd2d85c0c228 = function(arg0, arg1) {
        getObject(arg0).credentials = __wbindgen_enum_RequestCredentials[arg1];
    };
    imports.wbg.__wbg_set_headers_6926da238cd32ee4 = function(arg0, arg1) {
        getObject(arg0).headers = getObject(arg1);
    };
    imports.wbg.__wbg_set_method_c02d8cbbe204ac2d = function(arg0, arg1, arg2) {
        getObject(arg0).method = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_mode_52ef73cfa79639cb = function(arg0, arg1) {
        getObject(arg0).mode = __wbindgen_enum_RequestMode[arg1];
    };
    imports.wbg.__wbg_set_onmessage_d57c4b653d57594f = function(arg0, arg1) {
        getObject(arg0).onmessage = getObject(arg1);
    };
    imports.wbg.__wbg_set_signal_dda2cf7ccb6bee0f = function(arg0, arg1) {
        getObject(arg0).signal = getObject(arg1);
    };
    imports.wbg.__wbg_signal_4db5aa055bf9eb9a = function(arg0) {
        const ret = getObject(arg0).signal;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_signature_new = function(arg0) {
        const ret = Signature.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_spawnWorker_16cedfb6613c80ac = function(arg0, arg1, arg2, arg3) {
        const ret = spawnWorker(getObject(arg0), getObject(arg1), getObject(arg2), arg3 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_89e1d9ac6a1b250e = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_8b530f326a9e48ac = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_6fdf4b64710cc91b = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_b45bfc5a37f6cfa2 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_status_83225b765fbb895b = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).status;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_status_de7eed5a7a5bfd5d = function(arg0) {
        const ret = getObject(arg0).status;
        return ret;
    };
    imports.wbg.__wbg_stringify_b5fb28f6465d9c3e = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_subarray_480600f3d6a9f26c = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_4f46f6544e6b4a28 = function(arg0, arg1) {
        const ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_70d05cf780a18d77 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_transaction_new = function(arg0) {
        const ret = Transaction.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_transition_new = function(arg0) {
        const ret = Transition.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_url_b36d2a5008eb056f = function(arg0, arg1) {
        const ret = getObject(arg1).url;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_value_692627309814bb8c = function(arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_value_e323024c868b5146 = function(arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_verifyingkey_new = function(arg0) {
        const ret = VerifyingKey.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_versions_c01dfd4722a88165 = function(arg0) {
        const ret = getObject(arg0).versions;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_waitAsync_2c4b633ebb554615 = function() {
        const ret = Atomics.waitAsync;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_waitAsync_95332bf1b4fe4c52 = function(arg0, arg1, arg2) {
        const ret = Atomics.waitAsync(getObject(arg0), arg1 >>> 0, arg2);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_2ddd8a25ff58642a = function(arg0, arg1) {
        // Cast intrinsic for `I128 -> Externref`.
        const ret = (BigInt.asUintN(64, arg0) | (arg1 << BigInt(64)));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function(arg0) {
        // Cast intrinsic for `U64 -> Externref`.
        const ret = BigInt.asUintN(64, arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_711d7deea8fc39ca = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 356, function: Function { arguments: [Externref], shim_idx: 357, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_7200, __wasm_bindgen_func_elem_8569);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_9ae0607507abb057 = function(arg0) {
        // Cast intrinsic for `I64 -> Externref`.
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_cada7727142cd213 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 356, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 357, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_7200, __wasm_bindgen_func_elem_8569);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_cb9088102bce6b30 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
        const ret = getArrayU8FromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_cdf07f87b2615f8c = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 356, function: Function { arguments: [], shim_idx: 462, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_7200, __wasm_bindgen_func_elem_7201);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_e7b45dd881f38ce3 = function(arg0, arg1) {
        // Cast intrinsic for `U128 -> Externref`.
        const ret = (BigInt.asUintN(64, arg0) | (BigInt.asUintN(64, arg1) << BigInt(64)));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_link_b9f45ffe079ef2c1 = function(arg0) {
        const val = `onmessage = function (ev) {
            let [ia, index, value] = ev.data;
            ia = new Int32Array(ia.buffer);
            let result = Atomics.wait(ia, index, value);
            postMessage(result);
        };
        `;
        const ret = typeof URL.createObjectURL === 'undefined' ? "data:application/javascript," + encodeURIComponent(val) : URL.createObjectURL(new Blob([val], { type: "text/javascript" }));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.memory = memory || new WebAssembly.Memory({initial:168,maximum:65536,shared:true});

    return imports;
}

function __wbg_finalize_init(instance, module, thread_stack_size) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;

    if (typeof thread_stack_size !== 'undefined' && (typeof thread_stack_size !== 'number' || thread_stack_size === 0 || thread_stack_size % 65536 !== 0)) { throw 'invalid stack size' }
    wasm.__wbindgen_start(thread_stack_size);
    return wasm;
}

function initSync(module, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size;
    if (typeof module !== 'undefined') {
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
    if (typeof module_or_path !== 'undefined') {
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

var exports$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Address: Address,
    Authorization: Authorization,
    BHP1024: BHP1024,
    BHP256: BHP256,
    BHP512: BHP512,
    BHP768: BHP768,
    Boolean: Boolean,
    CallbackQuery: CallbackQuery,
    Ciphertext: Ciphertext,
    ComputeKey: ComputeKey,
    DynamicRecord: DynamicRecord,
    EncryptionToolkit: EncryptionToolkit,
    Execution: Execution,
    ExecutionRequest: ExecutionRequest,
    ExecutionResponse: ExecutionResponse,
    Field: Field,
    GraphKey: GraphKey,
    Group: Group,
    I128: I128,
    I16: I16,
    I32: I32,
    I64: I64,
    I8: I8,
    KeyPair: KeyPair,
    Metadata: Metadata,
    OfflineQuery: OfflineQuery,
    Pedersen128: Pedersen128,
    Pedersen64: Pedersen64,
    Plaintext: Plaintext,
    Poseidon2: Poseidon2,
    Poseidon4: Poseidon4,
    Poseidon8: Poseidon8,
    PrivateKey: PrivateKey,
    PrivateKeyCiphertext: PrivateKeyCiphertext,
    Program: Program,
    ProgramManager: ProgramManager,
    Proof: Proof,
    ProvingKey: ProvingKey,
    ProvingRequest: ProvingRequest,
    QueryOption: QueryOption,
    RecordCiphertext: RecordCiphertext,
    RecordPlaintext: RecordPlaintext,
    Scalar: Scalar,
    Signature: Signature,
    Transaction: Transaction,
    Transition: Transition,
    U128: U128,
    U16: U16,
    U32: U32,
    U64: U64,
    U8: U8,
    Value: Value,
    VerifyingKey: VerifyingKey,
    ViewKey: ViewKey,
    default: __wbg_init,
    getOrInitConsensusVersionTestHeights: getOrInitConsensusVersionTestHeights,
    initSync: initSync,
    initThreadPool: initThreadPool,
    runRayonThread: runRayonThread,
    snarkVerify: snarkVerify,
    snarkVerifyBatch: snarkVerifyBatch,
    stringToField: stringToField,
    verifyFunctionExecution: verifyFunctionExecution
});

new URL("aleo_wasm.wasm", import.meta.url);

                async function init(options) {
                    await __wbg_init({
                        module_or_path: await options.module,
                        memory: options.memory,
                    });
                    return exports$1;
                }

async function initializeWorker() {
    // Wait for the main thread to send us the Module, Memory, and Rayon thread pointer.
    function waitForEvent() {
        return new Promise((resolve) => {
            addEventListener("message", (event) => {
                resolve(event.data);
            }, {
                capture: true,
                once: true,
            });
        });
    }

    const { module, memory, address } = await waitForEvent();

    // Runs the Wasm inside of the Worker, but using the main thread's Module and Memory.
    const exports$1 = await init({ module, memory });

    // Tells the main thread that we're finished initializing.
    postMessage(null);

    // This will hang the Worker while running the Rayon thread.
    exports$1.runRayonThread(address);

    // When the Rayon thread is finished, close the Worker.
    close();
}

await initializeWorker();
//# sourceMappingURL=worker.js.map
