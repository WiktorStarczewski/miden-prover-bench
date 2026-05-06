import loadWasm from './wasm.js';
import { AccountArray as AccountArray$1, AccountIdArray as AccountIdArray$1, FeltArray as FeltArray$1, ForeignAccountArray as ForeignAccountArray$1, NoteAndArgsArray as NoteAndArgsArray$1, NoteArray as NoteArray$1, NoteIdAndArgsArray as NoteIdAndArgsArray$1, NoteRecipientArray as NoteRecipientArray$1, OutputNoteArray as OutputNoteArray$1, StorageSlotArray as StorageSlotArray$1, TransactionScriptInputPairArray as TransactionScriptInputPairArray$1 } from './Cargo-F4-uczDo.js';
export { Account, AccountBuilder, AccountBuilderResult, AccountCode, AccountComponent, AccountComponentCode, AccountDelta, AccountFile, AccountHeader, AccountId, AccountInterface, AccountProof, AccountReader, AccountStatus, AccountStorage, AccountStorageDelta, AccountStorageMode, AccountStorageRequirements, AccountVaultDelta, Address, AdviceInputs, AdviceMap, AssetVault, AuthFalcon512RpoMultisigConfig, AuthSecretKey, BasicFungibleFaucetComponent, BlockHeader, CodeBuilder, CommittedNote, ConsumableNoteRecord, Endpoint, ExecutedTransaction, Felt, FetchedAccount, FetchedNote, FlattenedU8Vec, ForeignAccount, FungibleAsset, FungibleAssetDelta, FungibleAssetDeltaItem, GetProceduresResultItem, InputNote, InputNoteRecord, InputNoteState, InputNotes, IntoUnderlyingByteSource, IntoUnderlyingSink, IntoUnderlyingSource, JsAccountUpdate, JsStateSyncUpdate, JsStorageMapEntry, JsStorageSlot, JsVaultAsset, Library, MerklePath, NetworkId, NetworkType, Note, NoteAndArgs, NoteAssets, NoteAttachment, NoteAttachmentKind, NoteAttachmentScheme, NoteConsumability, NoteConsumptionStatus, NoteDetails, NoteDetailsAndTag, NoteDetailsAndTagArray, NoteExecutionHint, NoteExportFormat, NoteFile, NoteFilter, NoteFilterTypes, NoteHeader, NoteId, NoteIdAndArgs, NoteInclusionProof, NoteLocation, NoteMetadata, NoteRecipient, NoteScript, NoteStorage, NoteSyncBlock, NoteSyncInfo, NoteTag, NoteType, OutputNote, OutputNoteRecord, OutputNoteState, OutputNotes, Package, PartialNote, Poseidon2, ProcedureThreshold, Program, ProvenTransaction, PublicKey, RpcClient, Rpo256, SerializedInputNoteData, SerializedOutputNoteData, SerializedTransactionData, Signature, SigningInputs, SigningInputsType, SlotAndKeys, SparseMerklePath, StorageMap, StorageMapEntry, StorageMapInfo, StorageMapUpdate, StorageSlot, SyncSummary, TestUtils, TokenSymbol, TransactionArgs, TransactionFilter, TransactionId, TransactionProver, TransactionRecord, TransactionRequest, TransactionRequestBuilder, TransactionResult, TransactionScript, TransactionScriptInputPair, TransactionStatus, TransactionStoreUpdate, TransactionSummary, WebClient, WebKeystoreApi, Word, createAuthFalcon512RpoMultisig, exportStore, importStore, initSync, sequentialSumBench, setupLogging } from './Cargo-F4-uczDo.js';

const WorkerAction = Object.freeze({
  INIT: "init",
  INIT_MOCK: "initMock",
  INIT_THREAD_POOL: "initThreadPool",
  CALL_METHOD: "callMethod",
  EXECUTE_CALLBACK: "executeCallback",
});

const CallbackType = Object.freeze({
  GET_KEY: "getKey",
  INSERT_KEY: "insertKey",
  SIGN: "sign",
});

const MethodName = Object.freeze({
  CREATE_CLIENT: "createClient",
  APPLY_TRANSACTION: "applyTransaction",
  EXECUTE_TRANSACTION: "executeTransaction",
  PROVE_TRANSACTION: "proveTransaction",
  SUBMIT_NEW_TRANSACTION: "submitNewTransaction",
  SUBMIT_NEW_TRANSACTION_MOCK: "submitNewTransactionMock",
  SUBMIT_NEW_TRANSACTION_WITH_PROVER: "submitNewTransactionWithProver",
  SUBMIT_NEW_TRANSACTION_WITH_PROVER_MOCK: "submitNewTransactionWithProverMock",
  SYNC_STATE: "syncState",
  SYNC_STATE_MOCK: "syncStateMock",
});

/**
 * Sync Lock Module
 *
 * Provides coordination for concurrent syncState() calls using the Web Locks API
 * with an in-process mutex fallback for older browsers.
 *
 * Behavior:
 * - Uses "coalescing": if a sync is in progress, subsequent callers wait and receive
 *   the same result
 * - Web Locks for cross-tab coordination (Chrome 69+, Safari 15.4+)
 * - In-process mutex fallback when Web Locks unavailable
 * - Optional timeout support
 */

/**
 * Check if the Web Locks API is available.
 */
function hasWebLocks() {
  return (
    typeof navigator !== "undefined" &&
    navigator.locks !== undefined &&
    typeof navigator.locks.request === "function"
  );
}

/**
 * Internal state for tracking in-progress syncs and waiters per database.
 */
const syncStates = new Map();

/**
 * Get or create sync state for a database.
 */
function getSyncState(dbId) {
  let state = syncStates.get(dbId);
  if (!state) {
    state = {
      inProgress: false,
      result: null,
      error: null,
      waiters: [],
      releaseLock: null,
      syncGeneration: 0,
    };
    syncStates.set(dbId, state);
  }
  return state;
}

/**
 * Acquire a sync lock for the given database.
 *
 * If a sync is already in progress:
 * - Returns { acquired: false, coalescedResult } after waiting for the result
 *
 * If no sync is in progress:
 * - Returns { acquired: true } and the caller should perform the sync,
 *   then call releaseSyncLock() or releaseSyncLockWithError()
 *
 * @param {string} dbId - The database ID to lock
 * @param {number} timeoutMs - Optional timeout in milliseconds (0 = no timeout)
 * @returns {Promise<{acquired: boolean, coalescedResult?: any}>}
 */
async function acquireSyncLock(dbId, timeoutMs = 0) {
  const state = getSyncState(dbId);

  // If a sync is already in progress, wait for it to complete (coalescing)
  if (state.inProgress) {
    return new Promise((resolve, reject) => {
      let timeoutId;
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          const idx = state.waiters.findIndex((w) => w.resolve === onResult);
          if (idx !== -1) {
            state.waiters.splice(idx, 1);
          }
          reject(new Error("Sync lock acquisition timed out"));
        }, timeoutMs);
      }

      const onResult = (result) => {
        /* v8 ignore next 1 -- timeoutId only set when timeoutMs>0 AND another sync is in progress; combo rare in tests */
        if (timeoutId) clearTimeout(timeoutId);
        resolve({ acquired: false, coalescedResult: result });
      };

      const onError = (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      };

      state.waiters.push({ resolve: onResult, reject: onError });
    });
  }

  // Mark sync as in progress and increment generation
  state.inProgress = true;
  state.result = null;
  state.error = null;
  state.syncGeneration++;
  const currentGeneration = state.syncGeneration;

  // Try to acquire Web Lock if available
  if (hasWebLocks()) {
    const lockName = `miden-sync-${dbId}`;

    return new Promise((resolve, reject) => {
      let timeoutId;
      let timedOut = false;

      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          timedOut = true;
          if (state.syncGeneration === currentGeneration) {
            state.inProgress = false;
            const error = new Error("Sync lock acquisition timed out");
            for (const waiter of state.waiters) {
              waiter.reject(error);
            }
            state.waiters = [];
          }
          reject(new Error("Sync lock acquisition timed out"));
        }, timeoutMs);
      }

      navigator.locks
        .request(lockName, { mode: "exclusive" }, async () => {
          /* v8 ignore next 3 -- race: lock granted after timeout or newer generation */
          if (timedOut || state.syncGeneration !== currentGeneration) {
            return;
          }

          if (timeoutId) clearTimeout(timeoutId);

          return new Promise((releaseLock) => {
            state.releaseLock = releaseLock;
            resolve({ acquired: true });
          });
        })
        .catch((err) => {
          /* v8 ignore next 5 -- catch path requires Web Locks rejection combined with
             optional timeout; tested via "rejects when Web Locks request rejects" but
             the timeoutId-set branch needs Web Locks + timeout simultaneously */
          if (timeoutId) clearTimeout(timeoutId);
          if (state.syncGeneration === currentGeneration) {
            state.inProgress = false;
          }
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    });
  } else {
    // Fallback: no Web Locks, just use in-process state
    return { acquired: true };
  }
}

/**
 * Release the sync lock with a successful result.
 *
 * This notifies all waiting callers with the result and releases the lock.
 *
 * @param {string} dbId - The database ID
 * @param {any} result - The sync result to pass to waiters
 */
function releaseSyncLock(dbId, result) {
  const state = getSyncState(dbId);

  if (!state.inProgress) {
    console.warn("releaseSyncLock called but no sync was in progress");
    return;
  }

  state.result = result;
  state.inProgress = false;

  for (const waiter of state.waiters) {
    waiter.resolve(result);
  }
  state.waiters = [];

  if (state.releaseLock) {
    state.releaseLock();
    state.releaseLock = null;
  }
}

/**
 * Release the sync lock due to an error.
 *
 * This notifies all waiting callers that the sync failed.
 *
 * @param {string} dbId - The database ID
 * @param {Error} error - The error to pass to waiters
 */
function releaseSyncLockWithError(dbId, error) {
  const state = getSyncState(dbId);

  if (!state.inProgress) {
    console.warn("releaseSyncLockWithError called but no sync was in progress");
    return;
  }

  state.error = error;
  state.inProgress = false;

  for (const waiter of state.waiters) {
    waiter.reject(error);
  }
  state.waiters = [];

  if (state.releaseLock) {
    state.releaseLock();
    state.releaseLock = null;
  }
}

/**
 * Shared utility functions for the MidenClient resource classes.
 * Each function accepts a `wasm` parameter (the WASM module) for constructing typed objects.
 */

/**
 * Resolves an AccountRef (string | Account | AccountId) to an AccountId.
 *
 * - Strings starting with `0x`/`0X` are parsed as hex via `AccountId.fromHex()`.
 * - Other strings are parsed as bech32 via `AccountId.fromBech32()`.
 * - Objects with an `.id()` method (Account) are resolved by calling `.id()`.
 * - Otherwise, the value is assumed to be an AccountId pass-through.
 *
 * @param {string | Account | AccountId} ref - The account reference to resolve.
 * @param {object} wasm - The WASM module.
 * @returns {AccountId} The resolved AccountId.
 */
function resolveAccountRef(ref, wasm) {
  if (ref == null) {
    throw new Error("Account reference cannot be null or undefined");
  }
  if (typeof ref === "string") {
    if (ref.startsWith("0x") || ref.startsWith("0X")) {
      return wasm.AccountId.fromHex(ref);
    }
    return wasm.AccountId.fromBech32(ref);
  }
  if (ref && typeof ref.id === "function") {
    return ref.id();
  }
  return ref;
}

/**
 * Resolves an AccountRef to a WASM Address object.
 *
 * - Strings starting with bech32 prefixes (`m`) are parsed via `Address.fromBech32()`.
 * - Strings starting with `0x`/`0X` are parsed as hex AccountId, then wrapped in Address.
 * - Account objects are resolved via `.id()` then wrapped in Address.
 * - AccountId objects are wrapped in Address directly.
 *
 * @param {string | Account | AccountId} ref - The account reference to resolve.
 * @param {object} wasm - The WASM module.
 * @returns {Address} The resolved Address.
 */
function resolveAddress(ref, wasm) {
  if (ref == null) {
    throw new Error("Address reference cannot be null or undefined");
  }
  if (typeof ref === "string") {
    if (ref.startsWith("0x") || ref.startsWith("0X")) {
      const accountId = wasm.AccountId.fromHex(ref);
      return wasm.Address.fromAccountId(accountId, undefined);
    }
    return wasm.Address.fromBech32(ref);
  }
  if (ref && typeof ref.id === "function") {
    const accountId = ref.id();
    return wasm.Address.fromAccountId(accountId, undefined);
  }
  return wasm.Address.fromAccountId(ref, undefined);
}

/**
 * Resolves a NoteVisibility string to a WASM NoteType value.
 *
 * @param {string | undefined} type - "public" or "private". Defaults to "public".
 * @param {object} wasm - The WASM module.
 * @returns {number} The NoteType enum value.
 */
function resolveNoteType(type, wasm) {
  if (type === "private") {
    return wasm.NoteType.Private;
  }
  if (type === "public" || type == null) {
    return wasm.NoteType.Public;
  }
  throw new Error(
    `Unknown note type: "${type}". Expected "public" or "private".`
  );
}

/**
 * Resolves a storage mode string to a WASM AccountStorageMode instance.
 *
 * @param {string | undefined} mode - "private", "public", or "network". Defaults to "private".
 * @param {object} wasm - The WASM module.
 * @returns {AccountStorageMode} The storage mode instance.
 */
function resolveStorageMode(mode, wasm) {
  switch (mode) {
    case "public":
      return wasm.AccountStorageMode.public();
    case "network":
      return wasm.AccountStorageMode.network();
    case "private":
    case undefined:
    case null:
      return wasm.AccountStorageMode.private();
    default:
      throw new Error(
        `Unknown storage mode: "${mode}". Expected "private", "public", or "network".`
      );
  }
}

/**
 * Resolves an auth scheme string to a WASM `AuthScheme` enum numeric value.
 *
 * The public `AuthScheme` constant exposes SDK-friendly strings
 * (`"falcon"` / `"ecdsa"`), but low-level wasm-bindgen methods such as
 * `AccountComponent.createAuthComponentFromCommitment(commitment, scheme)`
 * expect the numeric variant from the Rust `AuthScheme` enum. This helper
 * bridges the two so callers never touch wasm-bindgen internals directly.
 *
 * `wasm` is optional: when provided (by internal callers who already have
 * the module loaded), the numeric value is read from the binding itself,
 * keeping the mapping robust if wasm-bindgen ever renumbers the enum. When
 * omitted (public callers who don't have a handle to the WASM module), the
 * hardcoded discriminants below are used — these are pinned to the Rust
 * enum order by a cross-check test in `test/account_component.test.ts`.
 *
 * @param {"falcon" | "ecdsa" | undefined} scheme - Defaults to `"falcon"`.
 * @param {object} [wasm] - Optional WASM module handle.
 * @returns {number} The AuthScheme enum numeric value (1 or 2).
 */
function resolveAuthScheme(scheme, wasm) {
  if (scheme === "ecdsa") {
    return wasm?.AuthScheme?.AuthEcdsaK256Keccak ?? 1;
  }
  if (scheme === "falcon" || scheme == null) {
    return wasm?.AuthScheme?.AuthRpoFalcon512 ?? 2;
  }
  throw new Error(
    `Unknown auth scheme: "${scheme}". Expected "falcon" or "ecdsa".`
  );
}

/**
 * Resolves an AccountType value to a boolean `mutable` flag
 * for the underlying WASM `newWallet()` / `importPublicAccountFromSeed()` calls.
 *
 * Accepts the numeric WASM enum values (2 = immutable, 3 = mutable) or the
 * legacy string aliases ("MutableWallet", "ImmutableWallet"). Defaults to
 * mutable when undefined.
 *
 * @param {number | string | undefined} accountType
 * @returns {boolean} Whether the account code is mutable.
 */
function resolveAccountMutability(accountType) {
  if (
    accountType == null ||
    accountType === "MutableWallet" ||
    accountType === 3
  ) {
    return true;
  }
  if (accountType === "ImmutableWallet" || accountType === 2) {
    return false;
  }
  throw new Error(
    `Unknown wallet account type: "${accountType}". Expected AccountType.MutableWallet (3) or AccountType.ImmutableWallet (2).`
  );
}

/**
 * Resolves a NoteInput (string | NoteId | InputNoteRecord | Note) to a hex string.
 *
 * - Strings are passed through unchanged.
 * - NoteId WASM objects are converted via `.toString()`.
 * - InputNoteRecord and Note objects (with an `.id()` method) are resolved via `.id().toString()`.
 *
 * @param {string | object} input - The note reference to resolve.
 * @returns {string} The hex note ID string.
 */
function resolveNoteIdHex(input) {
  if (input == null) {
    throw new Error("Note ID cannot be null or undefined");
  }
  if (typeof input === "string") {
    return input;
  }
  // NoteId WASM object — has toString() but not id() (unlike InputNoteRecord/Note).
  // Check for constructor.fromHex to distinguish from plain objects (which also inherit toString).
  if (
    typeof input.toString === "function" &&
    typeof input.id !== "function" &&
    input.constructor?.fromHex !== undefined
  ) {
    return input.toString();
  }
  // InputNoteRecord, Note, or other object with id() returning NoteId
  if (typeof input.id === "function") {
    return input.id().toString();
  }
  throw new TypeError(
    `Cannot resolve note ID: expected string, NoteId, InputNoteRecord, or Note, got ${typeof input}`
  );
}

/**
 * Resolves a TransactionId reference (string | TransactionId) to a hex string.
 *
 * - Strings are passed through unchanged.
 * - TransactionId WASM objects are converted via `.toHex()`.
 *
 * @param {string | object} input - The transaction ID reference to resolve.
 * @returns {string} The hex transaction ID string.
 */
function resolveTransactionIdHex(input) {
  if (input == null) {
    throw new Error("Transaction ID cannot be null or undefined");
  }
  if (typeof input === "string") {
    return input;
  }
  // TransactionId WASM object — toHex() returns hex
  if (typeof input.toHex === "function") {
    return input.toHex();
  }
  throw new TypeError(
    `Cannot resolve transaction ID: expected string or TransactionId, got ${typeof input}`
  );
}

/**
 * Hashes a seed value. Strings are hashed via SHA-256 to produce a 32-byte Uint8Array.
 * Uint8Array values are passed through unchanged.
 *
 * @param {string | Uint8Array} seed - The seed to hash.
 * @returns {Promise<Uint8Array>} The hashed seed.
 */
async function hashSeed(seed) {
  if (seed instanceof Uint8Array) {
    return seed;
  }
  if (typeof seed === "string") {
    const encoded = new TextEncoder().encode(seed);
    const hash = await crypto.subtle.digest("SHA-256", encoded);
    return new Uint8Array(hash);
  }
  throw new TypeError(
    `Invalid seed type: expected string or Uint8Array, got ${typeof seed}`
  );
}

class AccountsResource {
  #inner;
  #getWasm;
  #client;

  constructor(inner, getWasm, client) {
    this.#inner = inner;
    this.#getWasm = getWasm;
    this.#client = client;
  }

  async create(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();

    const type = opts?.type;

    if (
      type === 0 ||
      type === 1 ||
      type === "FungibleFaucet" ||
      type === "NonFungibleFaucet"
    ) {
      const storageMode = resolveStorageMode(opts.storage ?? "public", wasm);
      const authScheme = resolveAuthScheme(opts.auth, wasm);
      return await this.#inner.newFaucet(
        storageMode,
        type === 1 || type === "NonFungibleFaucet",
        opts.symbol,
        opts.decimals,
        BigInt(opts.maxSupply),
        authScheme
      );
    } else if (
      type === "ImmutableContract" ||
      type === "MutableContract" ||
      opts?.components // Contracts are distinguished from wallets by having components
    ) {
      return await this.#createContract(opts, wasm);
    } else {
      // Default: wallet (mutable or immutable based on type)
      const mutable = resolveAccountMutability(opts?.type);
      const storageMode = resolveStorageMode(opts?.storage ?? "private", wasm);
      const authScheme = resolveAuthScheme(opts?.auth, wasm);
      const seed = opts?.seed ? await hashSeed(opts.seed) : undefined;
      return await this.#inner.newWallet(
        storageMode,
        mutable,
        authScheme,
        seed
      );
    }
  }

  async #createContract(opts, wasm) {
    if (!opts.seed)
      throw new Error("Contract creation requires a 'seed' (Uint8Array)");
    if (!opts.auth)
      throw new Error("Contract creation requires an 'auth' (AuthSecretKey)");

    // Default to immutable when type is omitted (safer for contracts)
    const mutable = opts.type === "MutableContract" || opts.type === 3;
    const accountTypeEnum = mutable
      ? wasm.AccountType.RegularAccountUpdatableCode
      : wasm.AccountType.RegularAccountImmutableCode;
    const storageMode = resolveStorageMode(opts.storage ?? "public", wasm);
    const authComponent =
      wasm.AccountComponent.createAuthComponentFromSecretKey(opts.auth);

    let builder = new wasm.AccountBuilder(opts.seed)
      .accountType(accountTypeEnum)
      .storageMode(storageMode)
      .withAuthComponent(authComponent);

    for (const component of opts.components ?? []) {
      builder = builder.withComponent(component);
    }

    const built = builder.build();
    const account = built.account;

    await this.#inner.newAccountWithSecretKey(account, opts.auth);
    return account;
  }

  async insert({ account, overwrite = false }) {
    this.#client.assertNotTerminated();
    await this.#inner.newAccount(account, overwrite);
  }

  async getOrImport(ref) {
    this.#client.assertNotTerminated();
    return (await this.get(ref)) ?? (await this.import(ref));
  }

  async get(ref) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const id = resolveAccountRef(ref, wasm);
    const account = await this.#inner.getAccount(id);
    return account ?? null;
  }

  async list() {
    this.#client.assertNotTerminated();
    return await this.#inner.getAccounts();
  }

  async getDetails(ref) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const id = resolveAccountRef(ref, wasm);
    const account = await this.#inner.getAccount(id);
    if (!account) {
      throw new Error(`Account not found: ${id.toString()}`);
    }
    const keys = await this.#inner.keystore.getCommitments(id);
    return {
      account,
      vault: account.vault(),
      storage: account.storage(),
      code: account.code() ?? null,
      keys,
    };
  }

  async getBalance(accountRef, tokenRef) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const accountId = resolveAccountRef(accountRef, wasm);
    const faucetId = resolveAccountRef(tokenRef, wasm);
    const reader = this.#inner.accountReader(accountId);
    return await reader.getBalance(faucetId);
  }

  async import(input) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();

    // Early exit for string, Account, and AccountHeader types before property
    // checks, preventing misrouting if a WASM object ever gains a .file or .seed
    // property. Bare AccountId (no .id() method) falls through to the fallback.
    if (typeof input === "string" || typeof input.id === "function") {
      const id = resolveAccountRef(input, wasm);
      await this.#inner.importAccountById(id);
      return await this.#inner.getAccount(id);
    }

    if (input.file) {
      // Extract accountId before importAccountFile — WASM consumes the
      // AccountFile by value, invalidating the JS wrapper after the call.
      const accountId =
        typeof input.file.accountId === "function"
          ? input.file.accountId()
          : null;
      await this.#inner.importAccountFile(input.file);
      if (accountId) {
        return await this.#inner.getAccount(accountId);
      }
      throw new Error(
        "Could not determine account ID from AccountFile. " +
          "Ensure the file contains a valid account."
      );
    }

    if (input.seed) {
      // Import public account from seed
      const authScheme = resolveAuthScheme(input.auth, wasm);
      const mutable = resolveAccountMutability(input.type);
      return await this.#inner.importPublicAccountFromSeed(
        input.seed,
        mutable,
        authScheme
      );
    }

    // Fallback: treat as AccountRef (string, AccountId, Account, AccountHeader)
    const id = resolveAccountRef(input, wasm);
    await this.#inner.importAccountById(id);
    return await this.#inner.getAccount(id);
  }

  async export(ref) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const id = resolveAccountRef(ref, wasm);
    return await this.#inner.exportAccountFile(id);
  }

  async addAddress(ref, addr) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const id = resolveAccountRef(ref, wasm);
    const address = wasm.Address.fromBech32(addr);
    await this.#inner.insertAccountAddress(id, address);
  }

  async removeAddress(ref, addr) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const id = resolveAccountRef(ref, wasm);
    const address = wasm.Address.fromBech32(addr);
    await this.#inner.removeAccountAddress(id, address);
  }
}

class TransactionsResource {
  #inner;
  #getWasm;
  #client;

  constructor(inner, getWasm, client) {
    this.#inner = inner;
    this.#getWasm = getWasm;
    this.#client = client;
  }

  async send(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();

    if (opts.returnNote === true) {
      // returnNote path — build the P2ID note in JS so we can return the Note
      // object to the caller (e.g. for out-of-band delivery to the recipient).
      if (opts.reclaimAfter != null || opts.timelockUntil != null) {
        throw new Error(
          "reclaimAfter and timelockUntil are not supported when returnNote is true"
        );
      }

      const senderId = resolveAccountRef(opts.account, wasm);
      const receiverId = resolveAccountRef(opts.to, wasm);
      const faucetId = resolveAccountRef(opts.token, wasm);
      const noteType = resolveNoteType(opts.type, wasm);

      const note = wasm.Note.createP2IDNote(
        senderId,
        receiverId,
        new wasm.NoteAssets([
          new wasm.FungibleAsset(faucetId, BigInt(opts.amount)),
        ]),
        noteType,
        new wasm.NoteAttachment()
      );

      // NoteArray constructor consumes its elements; use push(&note) to keep
      // `note` valid so we can return it to the caller below.
      const ownOutputs = new wasm.NoteArray();
      ownOutputs.push(note);
      const request = new wasm.TransactionRequestBuilder()
        .withOwnOutputNotes(ownOutputs)
        .build();

      const { txId, result } = await this.#submitOrSubmitWithProver(
        senderId,
        request,
        opts.prover
      );

      if (opts.waitForConfirmation) {
        await this.waitFor(txId.toHex(), { timeout: opts.timeout });
      }

      return { txId, note, result };
    }

    // Default path — note built in WASM with optional reclaim/timelock
    const { accountId, request } = await this.#buildSendRequest(opts, wasm);
    const { txId, result } = await this.#submitOrSubmitWithProver(
      accountId,
      request,
      opts.prover
    );

    if (opts.waitForConfirmation) {
      await this.waitFor(txId.toHex(), { timeout: opts.timeout });
    }

    return { txId, note: null, result };
  }

  async mint(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const { accountId, request } = await this.#buildMintRequest(opts, wasm);

    const { txId, result } = await this.#submitOrSubmitWithProver(
      accountId,
      request,
      opts.prover
    );

    if (opts.waitForConfirmation) {
      await this.waitFor(txId.toHex(), { timeout: opts.timeout });
    }

    return { txId, result };
  }

  async consume(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const { accountId, request } = await this.#buildConsumeRequest(opts, wasm);

    const { txId, result } = await this.#submitOrSubmitWithProver(
      accountId,
      request,
      opts.prover
    );

    if (opts.waitForConfirmation) {
      await this.waitFor(txId.toHex(), { timeout: opts.timeout });
    }

    return { txId, result };
  }

  async consumeAll(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();

    // getConsumableNotes takes AccountId by value (consumed by WASM).
    // Save hex so we can reconstruct for submitNewTransaction.
    const accountId = resolveAccountRef(opts.account, wasm);
    const accountIdHex = accountId.toString();
    const consumable = await this.#inner.getConsumableNotes(accountId);

    if (!consumable || consumable.length === 0) {
      return { txId: null, consumed: 0, remaining: 0 };
    }

    const total = consumable.length;
    const toConsume =
      opts.maxNotes != null ? consumable.slice(0, opts.maxNotes) : consumable;

    if (toConsume.length === 0) {
      return { txId: null, consumed: 0, remaining: total };
    }

    const notes = toConsume.map((c) => c.inputNoteRecord().toNote());

    const request = await this.#inner.newConsumeTransactionRequest(notes);

    const { txId, result } = await this.#submitOrSubmitWithProver(
      wasm.AccountId.fromHex(accountIdHex),
      request,
      opts.prover
    );

    if (opts.waitForConfirmation) {
      await this.waitFor(txId.toHex(), { timeout: opts.timeout });
    }

    return {
      txId,
      consumed: toConsume.length,
      remaining: total - toConsume.length,
      result,
    };
  }

  async swap(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const { accountId, request } = await this.#buildSwapRequest(opts, wasm);

    const { txId, result } = await this.#submitOrSubmitWithProver(
      accountId,
      request,
      opts.prover
    );

    if (opts.waitForConfirmation) {
      await this.waitFor(txId.toHex(), { timeout: opts.timeout });
    }

    return { txId, result };
  }

  async preview(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();

    let accountId;
    let request;

    switch (opts.operation) {
      case "send": {
        ({ accountId, request } = await this.#buildSendRequest(opts, wasm));
        break;
      }
      case "mint": {
        ({ accountId, request } = await this.#buildMintRequest(opts, wasm));
        break;
      }
      case "consume": {
        ({ accountId, request } = await this.#buildConsumeRequest(opts, wasm));
        break;
      }
      case "swap": {
        ({ accountId, request } = await this.#buildSwapRequest(opts, wasm));
        break;
      }
      case "custom": {
        accountId = resolveAccountRef(opts.account, wasm);
        request = opts.request;
        break;
      }
      default:
        throw new Error(`Unknown preview operation: ${opts.operation}`);
    }

    return await this.#inner.executeForSummary(accountId, request);
  }

  async execute(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const accountId = resolveAccountRef(opts.account, wasm);

    let builder = new wasm.TransactionRequestBuilder().withCustomScript(
      opts.script
    );

    if (opts.foreignAccounts?.length) {
      const accounts = opts.foreignAccounts.map((fa) => {
        // Distinguish { id: AccountRef, storage? } wrapper objects from WASM types
        // (Account/AccountHeader expose .id() as a method, wrappers have .id as a property)
        const isWrapper =
          fa !== null &&
          typeof fa === "object" &&
          "id" in fa &&
          typeof fa.id !== "function";
        const id = resolveAccountRef(isWrapper ? fa.id : fa, wasm);
        const storage =
          isWrapper && fa.storage
            ? fa.storage
            : new wasm.AccountStorageRequirements();
        return wasm.ForeignAccount.public(id, storage);
      });
      builder = builder.withForeignAccounts(
        new wasm.ForeignAccountArray(accounts)
      );
    }

    const request = builder.build();
    const { txId, result } = await this.#submitOrSubmitWithProver(
      accountId,
      request,
      opts.prover
    );

    if (opts.waitForConfirmation) {
      await this.waitFor(txId.toHex(), { timeout: opts.timeout });
    }

    return { txId, result };
  }

  async executeProgram(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const accountId = resolveAccountRef(opts.account, wasm);

    let foreignAccountsArray = new wasm.ForeignAccountArray();
    if (opts.foreignAccounts?.length) {
      const accounts = opts.foreignAccounts.map((fa) => {
        const isWrapper =
          fa !== null &&
          typeof fa === "object" &&
          "id" in fa &&
          typeof fa.id !== "function";
        const id = resolveAccountRef(isWrapper ? fa.id : fa, wasm);
        const storage =
          isWrapper && fa.storage
            ? fa.storage
            : new wasm.AccountStorageRequirements();
        return wasm.ForeignAccount.public(id, storage);
      });
      foreignAccountsArray = new wasm.ForeignAccountArray(accounts);
    }

    return await this.#inner.executeProgram(
      accountId,
      opts.script,
      opts.adviceInputs ?? new wasm.AdviceInputs(),
      foreignAccountsArray
    );
  }

  async submit(account, request, opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const accountId = resolveAccountRef(account, wasm);
    return await this.#submitOrSubmitWithProver(
      accountId,
      request,
      opts?.prover
    );
  }

  async list(query) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();

    let filter;
    if (!query) {
      filter = wasm.TransactionFilter.all();
    } else if (query.status === "uncommitted") {
      filter = wasm.TransactionFilter.uncommitted();
    } else if (query.ids) {
      const txIds = query.ids.map((id) =>
        wasm.TransactionId.fromHex(resolveTransactionIdHex(id))
      );
      filter = wasm.TransactionFilter.ids(txIds);
    } else if (query.expiredBefore !== undefined) {
      filter = wasm.TransactionFilter.expiredBefore(query.expiredBefore);
    } else {
      filter = wasm.TransactionFilter.all();
    }

    return await this.#inner.getTransactions(filter);
  }

  /**
   * Polls for transaction confirmation.
   *
   * @param {string | TransactionId} txId - Transaction ID hex string or TransactionId object.
   * @param {WaitOptions} [opts] - Polling options.
   * @param {number} [opts.timeout=60000] - Wall-clock polling timeout in
   *   milliseconds. This is NOT a block height — it controls how long the
   *   client waits before giving up. Set to 0 to disable the timeout and poll
   *   indefinitely until the transaction is committed or discarded.
   * @param {number} [opts.interval=5000] - Polling interval in ms.
   * @param {function} [opts.onProgress] - Called with the current status on
   *   each poll iteration ("pending", "submitted", or "committed").
   */
  async waitFor(txId, opts) {
    this.#client.assertNotTerminated();
    const hex = resolveTransactionIdHex(txId);
    const timeout = opts?.timeout ?? 60_000;
    const interval = opts?.interval ?? 5_000;
    const start = Date.now();

    const wasm = await this.#getWasm();

    while (true) {
      const elapsed = Date.now() - start;
      if (timeout > 0 && elapsed >= timeout) {
        throw new Error(
          `Transaction confirmation timed out after ${timeout}ms`
        );
      }

      try {
        await this.#inner.syncStateWithTimeout(0);
      } catch {
        // Sync may fail transiently; continue polling
      }

      // Recreate filter each iteration — WASM consumes it by value
      const filter = wasm.TransactionFilter.ids([
        wasm.TransactionId.fromHex(hex),
      ]);
      const txs = await this.#inner.getTransactions(filter);

      if (txs && txs.length > 0) {
        const tx = txs[0];
        const status = tx.transactionStatus?.();

        if (status) {
          if (status.isCommitted()) {
            opts?.onProgress?.("committed");
            return;
          }
          if (status.isDiscarded()) {
            throw new Error(`Transaction rejected: ${hex}`);
          }
        }

        opts?.onProgress?.("submitted");
      } else {
        opts?.onProgress?.("pending");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  // ── Shared request builders ──

  async #buildSendRequest(opts, wasm) {
    const accountId = resolveAccountRef(opts.account, wasm);
    const targetId = resolveAccountRef(opts.to, wasm);
    const faucetId = resolveAccountRef(opts.token, wasm);
    const noteType = resolveNoteType(opts.type, wasm);
    const amount = BigInt(opts.amount);

    const request = await this.#inner.newSendTransactionRequest(
      accountId,
      targetId,
      faucetId,
      noteType,
      amount,
      opts.reclaimAfter,
      opts.timelockUntil
    );
    return { accountId, request };
  }

  async #buildMintRequest(opts, wasm) {
    const accountId = resolveAccountRef(opts.account, wasm);
    const targetId = resolveAccountRef(opts.to, wasm);
    const noteType = resolveNoteType(opts.type, wasm);
    const amount = BigInt(opts.amount);

    // WASM signature: newMintTransactionRequest(target, faucet, noteType, amount)
    const request = await this.#inner.newMintTransactionRequest(
      targetId,
      accountId,
      noteType,
      amount
    );
    return { accountId, request };
  }

  async #buildConsumeRequest(opts, wasm) {
    const accountId = resolveAccountRef(opts.account, wasm);
    const noteInputs = Array.isArray(opts.notes) ? opts.notes : [opts.notes];

    const isDirectNote = (input) =>
      input !== null &&
      typeof input === "object" &&
      typeof input.id === "function" &&
      typeof input.toNote !== "function";

    const hasDirectNotes = noteInputs.some(isDirectNote);

    if (hasDirectNotes) {
      // At least one raw Note object — use NoteAndArgs builder path
      // (the only WASM path that accepts unauthenticated notes not in the store).
      const resolvedNotes = await Promise.all(
        noteInputs.map(async (input) => {
          if (isDirectNote(input)) return input;
          if (input && typeof input.toNote === "function")
            return input.toNote();
          return await this.#resolveNoteInput(input);
        })
      );

      const noteAndArgsArr = resolvedNotes.map(
        (note) => new wasm.NoteAndArgs(note, null)
      );
      const request = new wasm.TransactionRequestBuilder()
        .withInputNotes(new wasm.NoteAndArgsArray(noteAndArgsArr))
        .build();
      return { accountId, request };
    }

    // Standard path: all inputs are IDs or records — look up from store.
    const notes = await Promise.all(
      noteInputs.map((input) => this.#resolveNoteInput(input))
    );
    const request = await this.#inner.newConsumeTransactionRequest(notes);
    return { accountId, request };
  }

  async #buildSwapRequest(opts, wasm) {
    const accountId = resolveAccountRef(opts.account, wasm);
    const offeredFaucetId = resolveAccountRef(opts.offer.token, wasm);
    const requestedFaucetId = resolveAccountRef(opts.request.token, wasm);
    const noteType = resolveNoteType(opts.type, wasm);
    const paybackNoteType = resolveNoteType(
      opts.paybackType ?? opts.type,
      wasm
    );

    const request = await this.#inner.newSwapTransactionRequest(
      accountId,
      offeredFaucetId,
      BigInt(opts.offer.amount),
      requestedFaucetId,
      BigInt(opts.request.amount),
      noteType,
      paybackNoteType
    );
    return { accountId, request };
  }

  async #resolveNoteInput(input) {
    if (typeof input === "string") {
      const record = await this.#inner.getInputNote(input);
      if (!record) {
        throw new Error(`Note not found: ${input}`);
      }
      return record.toNote();
    }
    // InputNoteRecord — unwrap to Note
    if (input && typeof input.toNote === "function") {
      return input.toNote();
    }
    // NoteId — has toString() but not toNote() or id() (unlike InputNoteRecord/Note).
    // Check for constructor.fromHex to distinguish from plain objects.
    if (
      input &&
      typeof input.toString === "function" &&
      typeof input.toNote !== "function" &&
      typeof input.id !== "function" &&
      input.constructor?.fromHex !== undefined
    ) {
      const hex = input.toString();
      const record = await this.#inner.getInputNote(hex);
      if (!record) {
        throw new Error(`Note not found: ${hex}`);
      }
      return record.toNote();
    }
    // Assume it's already a Note object
    return input;
  }

  async #submitOrSubmitWithProver(accountId, request, perCallProver) {
    const result = await this.#inner.executeTransaction(accountId, request);
    const prover = perCallProver ?? this.#client.defaultProver;
    // Use proveTransactionWithProver (by-reference) when a prover is
    // provided, so the JS-side handle is NOT consumed by wasm-bindgen.
    // Passing the prover by value would transfer ownership and invalidate
    // the JS object after one call, causing silent fallback to local
    // proving on reuse.
    const proven = prover
      ? await this.#inner.proveTransactionWithProver(result, prover)
      : await this.#inner.proveTransaction(result);
    const txId = result.id();
    const height = await this.#inner.submitProvenTransaction(proven, result);
    await this.#inner.applyTransaction(result, height);
    return { txId, result };
  }
}

class NotesResource {
  #inner;
  #getWasm;
  #client;

  constructor(inner, getWasm, client) {
    this.#inner = inner;
    this.#getWasm = getWasm;
    this.#client = client;
  }

  async list(query) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const filter = buildNoteFilter(query, wasm);
    return await this.#inner.getInputNotes(filter);
  }

  async get(noteId) {
    this.#client.assertNotTerminated();
    const result = await this.#inner.getInputNote(resolveNoteIdHex(noteId));
    return result ?? null;
  }

  async listSent(query) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const filter = buildNoteFilter(query, wasm);
    return await this.#inner.getOutputNotes(filter);
  }

  async listAvailable(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const accountId = resolveAccountRef(opts.account, wasm);
    const consumable = await this.#inner.getConsumableNotes(accountId);
    return consumable.map((c) => c.inputNoteRecord());
  }

  async import(noteFile) {
    this.#client.assertNotTerminated();
    return await this.#inner.importNoteFile(noteFile);
  }

  async export(noteId, opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();
    const format = opts?.format ?? wasm.NoteExportFormat.Full;
    return await this.#inner.exportNoteFile(resolveNoteIdHex(noteId), format);
  }

  async fetchPrivate(opts) {
    this.#client.assertNotTerminated();
    if (opts?.mode === "all") {
      await this.#inner.fetchAllPrivateNotes();
    } else {
      await this.#inner.fetchPrivateNotes();
    }
  }

  async sendPrivate(opts) {
    this.#client.assertNotTerminated();
    const wasm = await this.#getWasm();

    let note;
    const input = opts.note;
    // Check if input is a Note object (has .id() and .assets() but not .toNote())
    if (
      input &&
      typeof input === "object" &&
      typeof input.id === "function" &&
      typeof input.assets === "function" &&
      typeof input.toNote !== "function"
    ) {
      note = input;
    } else {
      const noteHex = resolveNoteIdHex(input);
      const noteRecord = await this.#inner.getInputNote(noteHex);
      if (!noteRecord) {
        throw new Error(`Note not found: ${noteHex}`);
      }
      note = noteRecord.toNote();
    }

    const address = resolveAddress(opts.to, wasm);
    await this.#inner.sendPrivateNote(note, address);
  }
}

function buildNoteFilter(query, wasm) {
  if (!query) {
    return new wasm.NoteFilter(wasm.NoteFilterTypes.All, undefined);
  }

  if (query.ids) {
    const noteIds = query.ids.map((id) =>
      wasm.NoteId.fromHex(resolveNoteIdHex(id))
    );
    return new wasm.NoteFilter(wasm.NoteFilterTypes.List, noteIds);
  }

  if (query.status) {
    const statusMap = {
      consumed: wasm.NoteFilterTypes.Consumed,
      committed: wasm.NoteFilterTypes.Committed,
      expected: wasm.NoteFilterTypes.Expected,
      processing: wasm.NoteFilterTypes.Processing,
      unverified: wasm.NoteFilterTypes.Unverified,
    };
    const filterType = statusMap[query.status];
    if (filterType === undefined) {
      throw new Error(`Unknown note status: ${query.status}`);
    }
    return new wasm.NoteFilter(filterType, undefined);
  }

  return new wasm.NoteFilter(wasm.NoteFilterTypes.All, undefined);
}

class TagsResource {
  #inner;
  #client;

  constructor(inner, getWasm, client) {
    this.#inner = inner;
    this.#client = client;
  }

  async add(tag) {
    this.#client.assertNotTerminated();
    await this.#inner.addTag(String(tag));
  }

  async remove(tag) {
    this.#client.assertNotTerminated();
    await this.#inner.removeTag(String(tag));
  }

  async list() {
    this.#client.assertNotTerminated();
    const tags = await this.#inner.listTags();
    return Array.from(tags).map((t) => {
      const n = Number(t);
      if (Number.isNaN(n)) {
        throw new Error(`Invalid tag value: ${t}`);
      }
      return n;
    });
  }
}

class SettingsResource {
  #inner;
  #client;

  constructor(inner, _getWasm, client) {
    this.#inner = inner;
    this.#client = client;
  }

  async get(key) {
    this.#client.assertNotTerminated();
    const value = await this.#inner.getSetting(key);
    return value === undefined ? null : value;
  }

  async set(key, value) {
    this.#client.assertNotTerminated();
    await this.#inner.setSetting(key, value);
  }

  async remove(key) {
    this.#client.assertNotTerminated();
    await this.#inner.removeSetting(key);
  }

  async listKeys() {
    this.#client.assertNotTerminated();
    return await this.#inner.listSettingKeys();
  }
}

class CompilerResource {
  #inner;
  #getWasm;
  #client;

  constructor(inner, getWasm, client = null) {
    this.#inner = inner;
    this.#getWasm = getWasm;
    this.#client = client;
  }

  /**
   * Compiles MASM code + slots into an AccountComponent ready for accounts.create().
   *
   * @param {{ code: string, slots: StorageSlot[], supportAllTypes?: boolean }} opts
   * @returns {Promise<AccountComponent>}
   */
  async component({ code, slots = [], supportAllTypes = true }) {
    this.#client?.assertNotTerminated();
    const wasm = await this.#getWasm();
    const builder = this.#inner.createCodeBuilder();
    const compiled = builder.compileAccountComponentCode(code);
    const component = wasm.AccountComponent.compile(compiled, slots);
    return supportAllTypes ? component.withSupportsAllTypes() : component;
  }

  /**
   * Compiles a transaction script, optionally linking named libraries inline.
   *
   * @param {{ code: string, libraries?: Array<{ namespace: string, code: string, linking?: "dynamic" | "static" }> }} opts
   * @returns {Promise<TransactionScript>}
   */
  async txScript({ code, libraries = [] }) {
    this.#client?.assertNotTerminated();
    // Ensure WASM is initialized (result unused — only #inner needs it)
    await this.#getWasm();
    const builder = this.#inner.createCodeBuilder();
    linkLibraries(builder, libraries);
    return builder.compileTxScript(code);
  }

  /**
   * Compiles a note script, optionally linking named libraries inline.
   *
   * @param {{ code: string, libraries?: Array<{ namespace: string, code: string, linking?: "dynamic" | "static" }> }} opts
   * @returns {Promise<NoteScript>}
   */
  async noteScript({ code, libraries = [] }) {
    this.#client?.assertNotTerminated();
    await this.#getWasm();
    const builder = this.#inner.createCodeBuilder();
    linkLibraries(builder, libraries);
    return builder.compileNoteScript(code);
  }
}

// Builds and links each library entry against `builder`. Inline
// `{ namespace, code, linking? }` entries are built via `buildLibrary` and
// linked according to `linking` (defaulting to dynamic, matching tutorial
// behavior). Pre-built library objects are linked dynamically.
function linkLibraries(builder, libraries) {
  for (const lib of libraries) {
    if (lib && typeof lib.namespace === "string") {
      const built = builder.buildLibrary(lib.namespace, lib.code);
      if (lib.linking === "static") {
        builder.linkStaticLibrary(built);
      } else {
        builder.linkDynamicLibrary(built);
      }
    } else {
      builder.linkDynamicLibrary(lib);
    }
  }
}

class KeystoreResource {
  #inner;
  #client;

  constructor(inner, client) {
    this.#inner = inner;
    this.#client = client;
  }

  async insert(accountId, secretKey) {
    this.#client.assertNotTerminated();
    const ks = this.#inner.keystore;
    return await ks.insert(accountId, secretKey);
  }

  async get(pubKeyCommitment) {
    this.#client.assertNotTerminated();
    const ks = this.#inner.keystore;
    return await ks.get(pubKeyCommitment);
  }

  async remove(pubKeyCommitment) {
    this.#client.assertNotTerminated();
    const ks = this.#inner.keystore;
    return await ks.remove(pubKeyCommitment);
  }

  async getCommitments(accountId) {
    this.#client.assertNotTerminated();
    const ks = this.#inner.keystore;
    return await ks.getCommitments(accountId);
  }

  async getAccountId(pubKeyCommitment) {
    this.#client.assertNotTerminated();
    const ks = this.#inner.keystore;
    return await ks.getAccountId(pubKeyCommitment);
  }
}

/**
 * MidenClient wraps the existing proxy-wrapped WebClient with a resource-based API.
 *
 * Resource classes receive the proxy client and call its methods, handling all type
 * conversions (string -> AccountId, number -> BigInt, string -> enum).
 */
class MidenClient {
  // Injected by index.js to resolve circular imports
  static _WasmWebClient = null;
  static _MockWasmWebClient = null;
  static _getWasmOrThrow = null;

  #inner;
  #getWasm;
  #terminated = false;
  #defaultProver = null;
  #isMock = false;

  constructor(inner, getWasm, defaultProver) {
    this.#inner = inner;
    this.#getWasm = getWasm;
    this.#defaultProver = defaultProver ?? null;

    this.accounts = new AccountsResource(inner, getWasm, this);
    this.transactions = new TransactionsResource(inner, getWasm, this);
    this.notes = new NotesResource(inner, getWasm, this);
    this.tags = new TagsResource(inner, getWasm, this);
    this.settings = new SettingsResource(inner, getWasm, this);
    this.compile = new CompilerResource(inner, getWasm, this);
    this.keystore = new KeystoreResource(inner, this);
  }

  /**
   * Escape hatch: returns the proxied JS WebClient that backs this
   * MidenClient. The proxy forwards missing properties to the underlying
   * wasm-bindgen `WebClient`, so callers can reach lower-level methods like
   * `executeTransaction`, `proveTransaction[WithProver]`,
   * `submitProvenTransaction`, `applyTransaction`,
   * `newSendTransactionRequest`, `newConsumeTransactionRequest`, etc.
   *
   * Intended for advanced consumers that need to split the bundled
   * execute → prove → submit → apply pipeline across contexts — for example,
   * a Chrome MV3 extension that runs `executeTransaction` in its service
   * worker, dispatches the prove step to a `chrome.offscreen` document
   * (where wasm-bindgen-rayon can spawn a real thread pool), then runs
   * `submitProvenTransaction` + `applyTransaction` back in the SW.
   *
   * Stability: marked `@internal`. The shape of `#inner` is intentionally
   * not part of the documented public API and may change between SDK
   * versions. If you depend on this method, pin the SDK version and
   * test the lower-level surface carefully on each upgrade. If your use
   * case is common enough to warrant a stable public API, file an issue.
   *
   * @internal
   * @returns {object} The proxied JS WebClient with wasm-bindgen fallback.
   */
  _getInnerWebClient() {
    this.assertNotTerminated();
    return this.#inner;
  }

  /**
   * Creates and initializes a new MidenClient.
   *
   * If no `rpcUrl` is provided, defaults to testnet with full configuration
   * (RPC, prover, note transport, autoSync).
   *
   * @param {ClientOptions} [options] - Client configuration options.
   * @returns {Promise<MidenClient>} A fully initialized client.
   */
  static async create(options) {
    if (!options?.rpcUrl) {
      return MidenClient.createTestnet(options);
    }

    const getWasm = MidenClient._getWasmOrThrow;
    const WebClientClass = MidenClient._WasmWebClient;

    if (!WebClientClass || !getWasm) {
      throw new Error(
        "MidenClient not initialized. Import from the SDK package entry point."
      );
    }

    const seed = options?.seed ? await hashSeed(options.seed) : undefined;

    const rpcUrl = resolveRpcUrl(options?.rpcUrl);
    const noteTransportUrl = resolveNoteTransportUrl(options?.noteTransportUrl);

    let inner;
    if (options?.keystore) {
      inner = await WebClientClass.createClientWithExternalKeystore(
        rpcUrl,
        noteTransportUrl,
        seed,
        options?.storeName,
        options.keystore.getKey,
        options.keystore.insertKey,
        options.keystore.sign
      );
    } else {
      inner = await WebClientClass.createClient(
        rpcUrl,
        noteTransportUrl,
        seed,
        options?.storeName
      );
    }

    let defaultProver = null;
    if (options?.proverUrl) {
      const wasm = await getWasm();
      defaultProver = resolveProver(options.proverUrl, wasm);
    }

    const client = new MidenClient(inner, getWasm, defaultProver);

    if (options?.autoSync) {
      await client.sync();
    }

    return client;
  }

  /**
   * Creates a client preconfigured for testnet use.
   *
   * Defaults: rpcUrl "testnet", proverUrl "testnet", noteTransportUrl "testnet", autoSync true.
   * All defaults can be overridden via options.
   *
   * @param {ClientOptions} [options] - Options to override defaults.
   * @returns {Promise<MidenClient>} A fully initialized testnet client.
   */
  static async createTestnet(options) {
    return MidenClient.create({
      rpcUrl: "testnet",
      proverUrl: "testnet",
      noteTransportUrl: "testnet",
      autoSync: true,
      ...options,
    });
  }

  /**
   * Creates a client preconfigured for devnet use.
   *
   * Defaults: rpcUrl "devnet", proverUrl "devnet", noteTransportUrl "devnet", autoSync true.
   * All defaults can be overridden via options.
   *
   * @param {ClientOptions} [options] - Options to override defaults.
   * @returns {Promise<MidenClient>} A fully initialized devnet client.
   */
  static async createDevnet(options) {
    return MidenClient.create({
      rpcUrl: "devnet",
      proverUrl: "devnet",
      noteTransportUrl: "devnet",
      autoSync: true,
      ...options,
    });
  }

  /**
   * Resolves once the WASM module is initialized and safe to use.
   *
   * Idempotent and shared across callers: the underlying loader memoizes the
   * in-flight promise, so concurrent `ready()` calls await the same
   * initialization and post-init callers resolve immediately from a cached
   * module. Safe to call from `MidenProvider`, tutorial helpers, and any
   * other consumer simultaneously.
   *
   * Useful on the `/lazy` entry (e.g. Next.js / Capacitor), where no
   * top-level await runs at import time. On the default (eager) entry this
   * is redundant — importing the module already awaits WASM — but calling it
   * is still harmless.
   *
   * @returns {Promise<void>} Resolves when WASM is initialized.
   */
  static async ready() {
    const getWasm = MidenClient._getWasmOrThrow;
    if (!getWasm) {
      throw new Error(
        "MidenClient not initialized. Import from the SDK package entry point."
      );
    }
    await getWasm();
  }

  /**
   * Creates a mock client for testing.
   *
   * @param {MockOptions} [options] - Mock client options.
   * @returns {Promise<MidenClient>} A mock client.
   */
  static async createMock(options) {
    const getWasm = MidenClient._getWasmOrThrow;
    const MockWebClientClass = MidenClient._MockWasmWebClient;

    if (!MockWebClientClass || !getWasm) {
      throw new Error(
        "MidenClient not initialized. Import from the SDK package entry point."
      );
    }

    const seed = options?.seed ? await hashSeed(options.seed) : undefined;

    const inner = await MockWebClientClass.createClient(
      options?.serializedMockChain,
      options?.serializedNoteTransport,
      seed
    );

    const client = new MidenClient(inner, getWasm, null);
    client.#isMock = true;
    return client;
  }

  /** Returns the client-level default prover (set from ClientOptions.proverUrl). */
  get defaultProver() {
    return this.#defaultProver;
  }

  /**
   * Syncs the client state with the Miden node.
   *
   * @param {object} [opts] - Sync options.
   * @param {number} [opts.timeout] - Timeout in milliseconds (0 = no timeout).
   * @returns {Promise<SyncSummary>} The sync summary.
   */
  async sync(opts) {
    this.assertNotTerminated();
    return await this.#inner.syncStateWithTimeout(opts?.timeout ?? 0);
  }

  /**
   * Returns the current sync height.
   *
   * @returns {Promise<number>} The current sync height.
   */
  async getSyncHeight() {
    this.assertNotTerminated();
    return await this.#inner.getSyncHeight();
  }

  /**
   * Resolves once every serialized WASM call that was already on the
   * internal `_serializeWasmCall` chain when `waitForIdle()` was called
   * (execute, submit, prove, apply, sync, or account creation) has
   * settled. Use this from callers that need to perform a non-WASM-side
   * action — e.g. clearing an in-memory auth key on wallet lock — after
   * the kernel finishes, so its auth callback doesn't race with the key
   * being cleared.
   *
   * Does NOT wait for calls enqueued after `waitForIdle()` returns —
   * intentional, so a caller can drain and proceed without being blocked
   * indefinitely by concurrent workload.
   *
   * Caveat for `syncState`: `syncStateWithTimeout` awaits the sync lock
   * (`acquireSyncLock`, which uses Web Locks) BEFORE putting its WASM
   * call onto the chain, so a `syncState` that is queued on the sync
   * lock — but has not yet begun its WASM phase — is not visible to
   * `waitForIdle` and will not be awaited. Other methods (`newWallet`,
   * `executeTransaction`, etc.) route through the chain synchronously
   * on call and are always observed.
   *
   * Safe to call at any time; returns immediately if nothing was in
   * flight.
   *
   * @returns {Promise<void>}
   */
  async waitForIdle() {
    this.assertNotTerminated();
    await this.#inner.waitForIdle();
  }

  /**
   * Returns the raw JS value that the most recent sign-callback invocation
   * threw, or `null` if the last sign call succeeded (or no call has
   * happened yet).
   *
   * Useful for recovering structured metadata (e.g. a `reason: 'locked'`
   * property) that the kernel-level `auth::request` diagnostic would
   * otherwise erase. Call immediately after catching a failed
   * `transactions.submit` / `transactions.send` / `transactions.consume`.
   *
   * @returns {any} The raw thrown value, or `null`.
   */
  lastAuthError() {
    this.assertNotTerminated();
    return this.#inner.lastAuthError();
  }

  /**
   * Terminates the underlying Web Worker. After this, all method calls will throw.
   */
  terminate() {
    this.#terminated = true;
    this.#inner.terminate?.();
  }

  [Symbol.dispose]() {
    this.terminate();
  }

  async [Symbol.asyncDispose]() {
    this.terminate();
  }

  /**
   * Returns the identifier of the underlying store (e.g. IndexedDB database name, file path).
   *
   * @returns {string} The store identifier.
   */
  storeIdentifier() {
    this.assertNotTerminated();
    return this.#inner.storeIdentifier();
  }

  // ── Mock-only methods ──

  /** Advances the mock chain by one block. Only available on mock clients. */
  proveBlock() {
    this.assertNotTerminated();
    this.#assertMock("proveBlock");
    return this.#inner.proveBlock();
  }

  /** Returns true if this client uses a mock chain. */
  usesMockChain() {
    return this.#isMock;
  }

  /** Serializes the mock chain state for snapshot/restore in tests. */
  serializeMockChain() {
    this.assertNotTerminated();
    this.#assertMock("serializeMockChain");
    return this.#inner.serializeMockChain();
  }

  /** Serializes the mock note transport node state. */
  serializeMockNoteTransportNode() {
    this.assertNotTerminated();
    this.#assertMock("serializeMockNoteTransportNode");
    return this.#inner.serializeMockNoteTransportNode();
  }

  // ── Internal ──

  /** @internal Throws if the client has been terminated. */
  assertNotTerminated() {
    if (this.#terminated) {
      throw new Error("Client terminated");
    }
  }

  #assertMock(method) {
    if (!this.#isMock) {
      throw new Error(`${method}() is only available on mock clients`);
    }
  }
}

const RPC_URLS = {
  testnet: "https://rpc.testnet.miden.io",
  devnet: "https://rpc.devnet.miden.io",
  localhost: "http://localhost:57291",
  local: "http://localhost:57291",
};

/**
 * Resolves an rpcUrl shorthand or raw URL into a concrete endpoint string.
 *
 * @param {string | undefined} rpcUrl - "testnet", "devnet", "localhost", "local", or a raw URL.
 * @returns {string | undefined} A fully qualified URL, or undefined to use the SDK default.
 */
function resolveRpcUrl(rpcUrl) {
  if (!rpcUrl) return undefined;
  return RPC_URLS[rpcUrl.trim().toLowerCase()] ?? rpcUrl;
}

const PROVER_URLS = {
  devnet: "https://tx-prover.devnet.miden.io",
  testnet: "https://tx-prover.testnet.miden.io",
};

const NOTE_TRANSPORT_URLS = {
  testnet: "https://transport.miden.io",
  devnet: "https://transport.devnet.miden.io",
};

/**
 * Resolves a noteTransportUrl shorthand or raw URL into a concrete endpoint string.
 *
 * @param {string | undefined} noteTransportUrl - "testnet", "devnet", or a raw URL.
 * @returns {string | undefined} A fully qualified URL, or undefined if omitted.
 */
function resolveNoteTransportUrl(noteTransportUrl) {
  if (!noteTransportUrl) return undefined;
  return (
    NOTE_TRANSPORT_URLS[noteTransportUrl.trim().toLowerCase()] ??
    noteTransportUrl
  );
}

/**
 * Resolves a proverUrl shorthand or raw URL into a TransactionProver.
 *
 * @param {string} proverUrl - "local", "devnet", "testnet", or a raw URL.
 * @param {object} wasm - Loaded WASM module.
 * @returns {object} A TransactionProver instance.
 */
function resolveProver(proverUrl, wasm) {
  const normalized = proverUrl.trim().toLowerCase();
  if (normalized === "local") {
    return wasm.TransactionProver.newLocalProver();
  }
  const remoteUrl = PROVER_URLS[normalized] ?? proverUrl;
  return wasm.TransactionProver.newRemoteProver(remoteUrl, undefined);
}

// Module-level WASM reference, set by index.js after initialization
let _wasm = null;
let _WebClient = null;

function _setWasm(wasm) {
  _wasm = wasm;
}

function _setWebClient(WebClientClass) {
  _WebClient = WebClientClass;
}

function getWasm() {
  if (!_wasm) {
    throw new Error(
      "WASM not initialized. Ensure the SDK is loaded before calling standalone utilities."
    );
  }
  return _wasm;
}

/**
 * Creates a P2ID (Pay-to-ID) note.
 *
 * @param {NoteOptions} opts - Note creation options.
 * @returns {Note} The created note.
 */
function createP2IDNote(opts) {
  const wasm = getWasm();
  const sender = resolveAccountRef(opts.from, wasm);
  const target = resolveAccountRef(opts.to, wasm);
  const noteAssets = buildNoteAssets(opts.assets, wasm);
  const noteType = resolveNoteType(opts.type, wasm);
  const attachment = opts.attachment
    ? new wasm.NoteAttachment(opts.attachment)
    : new wasm.NoteAttachment([]);

  return wasm.Note.createP2IDNote(
    sender,
    target,
    noteAssets,
    noteType,
    attachment
  );
}

/**
 * Creates a P2IDE (Pay-to-ID with Expiration) note.
 *
 * @param {P2IDEOptions} opts - Note creation options with timelock/reclaim.
 * @returns {Note} The created note.
 */
function createP2IDENote(opts) {
  const wasm = getWasm();
  const sender = resolveAccountRef(opts.from, wasm);
  const target = resolveAccountRef(opts.to, wasm);
  const noteAssets = buildNoteAssets(opts.assets, wasm);
  const noteType = resolveNoteType(opts.type, wasm);
  const attachment = opts.attachment
    ? new wasm.NoteAttachment(opts.attachment)
    : new wasm.NoteAttachment([]);

  return wasm.Note.createP2IDENote(
    sender,
    target,
    noteAssets,
    opts.reclaimAfter,
    opts.timelockUntil,
    noteType,
    attachment
  );
}

/**
 * Builds a swap tag for note matching.
 *
 * @param {BuildSwapTagOptions} opts - Swap tag options.
 * @returns {NoteTag} The computed swap tag.
 */
function buildSwapTag(opts) {
  const wasm = getWasm();
  if (!_WebClient || typeof _WebClient.buildSwapTag !== "function") {
    throw new Error(
      "WebClient.buildSwapTag is not available. Ensure the SDK is fully loaded."
    );
  }
  const noteType = resolveNoteType(opts.type, wasm);
  const offeredFaucetId = resolveAccountRef(opts.offer.token, wasm);
  const requestedFaucetId = resolveAccountRef(opts.request.token, wasm);

  return _WebClient.buildSwapTag(
    noteType,
    offeredFaucetId,
    BigInt(opts.offer.amount),
    requestedFaucetId,
    BigInt(opts.request.amount)
  );
}

function buildNoteAssets(assets, wasm) {
  const assetArray = Array.isArray(assets) ? assets : [assets];
  const fungibleAssets = assetArray.map((asset) => {
    const faucetId = resolveAccountRef(asset.token, wasm);
    return new wasm.FungibleAsset(faucetId, BigInt(asset.amount));
  });
  return new wasm.NoteAssets(fungibleAssets);
}

/**
 * Non-consuming wrappers for wasm-bindgen-generated array classes.
 *
 * The default wasm-bindgen-generated constructor for an exported `Vec<T>`
 * parameter (e.g. `pub fn new(elements: Option<Vec<Note>>) -> Self`) takes
 * each input element by value: the Rust-side value is moved out of the
 * caller's JS handle. The handle is left dangling — its `__wbg_ptr` field
 * is unchanged so the JS object looks fine, but any subsequent method call
 * panics inside WASM with the opaque `"null pointer passed to rust"`
 * error from wasm-bindgen.
 *
 * That's a footgun for JS users, who don't expect "this object can no
 * longer be used" semantics from a constructor like
 * `new NoteArray([note])`. So we wrap each affected array with a class
 * that builds the same array via `push(&T)` — which already borrows +
 * clones — leaving the originals fully usable afterwards.
 *
 * The wrapper extends the wasm-bindgen base class, so `instanceof` checks
 * (including `_assertClass(...)` in other auto-generated wasm-bindgen
 * methods) keep working transparently.
 */


function makeSafeArray(Base) {
  return class extends Base {
    constructor(elements) {
      super(); // empty Rust Vec — no consume
      if (Array.isArray(elements)) {
        for (const el of elements) {
          // push(&T) on Base borrows and clones — input handles stay valid.
          this.push(el);
        }
      }
    }
  };
}

const AccountArray = makeSafeArray(AccountArray$1);
const AccountIdArray = makeSafeArray(AccountIdArray$1);
const FeltArray = makeSafeArray(FeltArray$1);
const ForeignAccountArray = makeSafeArray(ForeignAccountArray$1);
const NoteAndArgsArray = makeSafeArray(NoteAndArgsArray$1);
const NoteArray = makeSafeArray(NoteArray$1);
const NoteIdAndArgsArray = makeSafeArray(NoteIdAndArgsArray$1);
const NoteRecipientArray = makeSafeArray(NoteRecipientArray$1);
const OutputNoteArray = makeSafeArray(OutputNoteArray$1);
const StorageSlotArray = makeSafeArray(StorageSlotArray$1);
const TransactionScriptInputPairArray = makeSafeArray(
  TransactionScriptInputPairArray$1
);

const AccountType = Object.freeze({
  // WASM-compatible numeric values — usable with AccountBuilder directly
  FungibleFaucet: 0,
  NonFungibleFaucet: 1,
  RegularAccountImmutableCode: 2,
  RegularAccountUpdatableCode: 3,
  // SDK-friendly aliases (same numeric values as their WASM equivalents)
  MutableWallet: 3,
  ImmutableWallet: 2,
  ImmutableContract: 2,
  MutableContract: 3,
});

const AuthScheme = Object.freeze({
  Falcon: "falcon",
  ECDSA: "ecdsa",
});

const NoteVisibility = Object.freeze({
  Public: "public",
  Private: "private",
});

const StorageMode = Object.freeze({
  Public: "public",
  Private: "private",
  Network: "network",
});

const Linking = Object.freeze({
  Dynamic: "dynamic",
  Static: "static",
});

// Method classification sets — used by scripts/check-method-classification.js to ensure
// every WASM export is explicitly categorised. Update when adding new WASM methods.
//
// Note on `SYNC_METHODS`: the classifier is "synchronous in JS" — i.e.
// `pub fn ...` in Rust, not `pub async fn ...`. Two sub-cases:
//   1. Factory methods that return a non-Promise value (`accountReader`
//      returns `AccountReader`; the transaction-request builders return
//      `TransactionRequestBuilder`; `createCodeBuilder` returns a builder).
//      Wrapping these in `_serializeWasmCall` would turn their return
//      value into `Promise<T>` and break callers that use the result
//      immediately (e.g. `const reader = client.accountReader(id);
//      await reader.nonce();`).
//   2. Sync methods that still take `&mut self` in Rust (`proveBlock`,
//      `serializeMockChain`, `setDebugMode`). Safe to opt out because JS
//      is single-threaded — the event loop cannot interleave another
//      call during their synchronous execution, so the RefCell borrow
//      is always released before any other borrow can start.
// Do NOT move a sync-in-JS method into `WRITE_METHODS` / `READ_METHODS`
// just because it takes `&mut self` or `&self`; wrapping changes its
// return shape and breaks every caller.
const SYNC_METHODS = new Set([
  "accountReader",
  "buildSwapTag",
  "createCodeBuilder",
  "lastAuthError",
  "newConsumeTransactionRequest",
  "newMintTransactionRequest",
  "newSendTransactionRequest",
  "newSwapTransactionRequest",
  "proveBlock",
  "serializeMockChain",
  "serializeMockNoteTransportNode",
  "setDebugMode",
  "storeIdentifier",
  "usesMockChain",
]);

const MOCK_STORE_NAME = "mock_client_db";

const buildTypedArraysExport = (exportObject) => {
  return Object.entries(exportObject).reduce(
    (exports$1, [exportName, _export]) => {
      if (exportName.endsWith("Array")) {
        exports$1[exportName] = _export;
      }
      return exports$1;
    },
    {}
  );
};

const deserializeError = (errorLike) => {
  if (!errorLike) {
    return new Error("Unknown error received from worker");
  }
  const { name, message, stack, cause, ...rest } = errorLike;
  const reconstructedError = new Error(message ?? "Unknown worker error");
  reconstructedError.name = name ?? reconstructedError.name;
  if (stack) {
    reconstructedError.stack = stack;
  }
  if (cause) {
    reconstructedError.cause = deserializeError(cause);
  }
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) {
      reconstructedError[key] = value;
    }
  });
  return reconstructedError;
};

const MidenArrays = {};

let wasmModule = null;
let wasmLoadPromise = null;
let webClientStaticsCopied = false;

const ensureWasm = async () => {
  if (wasmModule) {
    return wasmModule;
  }
  if (!wasmLoadPromise) {
    wasmLoadPromise = loadWasm().then((module) => {
      wasmModule = module;
      if (module) {
        Object.assign(MidenArrays, buildTypedArraysExport(module));
        if (!webClientStaticsCopied && module.WebClient) {
          copyWebClientStatics(module.WebClient);
          webClientStaticsCopied = true;
        }
        // Set WASM module for standalone utilities
        _setWasm(module);
      }
      return module;
    });
  }
  return wasmLoadPromise;
};

const getWasmOrThrow = async () => {
  const module = await ensureWasm();
  if (!module) {
    throw new Error(
      "Miden WASM bindings are unavailable in this environment (SSR is disabled)."
    );
  }
  return module;
};
/**
 * WebClient is a wrapper around the underlying WASM WebClient object.
 *
 * This wrapper serves several purposes:
 *
 * 1. It creates a dedicated web worker to offload computationally heavy tasks
 *    (such as creating accounts, executing transactions, submitting transactions, etc.)
 *    from the main thread, helping to prevent UI freezes in the browser.
 *
 * 2. It defines methods that mirror the API of the underlying WASM WebClient,
 *    with the intention of executing these functions via the web worker. This allows us
 *    to maintain the same API and parameters while benefiting from asynchronous, worker-based computation.
 *
 * 3. It employs a Proxy to forward any calls not designated for web worker computation
 *    directly to the underlying WASM WebClient instance.
 *
 * Additionally, the wrapper provides a static createClient function. This static method
 * instantiates the WebClient object and ensures that the necessary createClient calls are
 * performed both in the main thread and within the worker thread. This dual initialization
 * correctly passes user parameters (RPC URL and seed) to both the main-thread
 * WASM WebClient and the worker-side instance.
 *
 * Because of this implementation, the only breaking change for end users is in the way the
 * web client is instantiated. Users should now use the WebClient.createClient static call.
 */
/**
 * Create a Proxy that forwards missing properties to the underlying WASM
 * WebClient.
 *
 * Async proxy-fallback methods (every WASM method that borrows the
 * WebClient's RefCell — reads included, since `&self` and `&mut self` both
 * trip wasm-bindgen's "recursive use of an object detected" panic if
 * another borrow is live) are routed through `_serializeWasmCall` so they
 * queue on the same chain as the explicitly-wrapped methods.
 *
 * `SYNC_METHODS` opts out: they are synchronous in JS and wrapping them
 * would change their return type to `Promise<T>`, which is a breaking
 * change for consumers that use them as plain getters or builders.
 */
function createClientProxy(instance) {
  return new Proxy(instance, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }
      if (target.wasmWebClient && prop in target.wasmWebClient) {
        const value = target.wasmWebClient[prop];
        if (typeof value === "function") {
          if (typeof prop === "string" && SYNC_METHODS.has(prop)) {
            return value.bind(target.wasmWebClient);
          }
          return (...args) =>
            target._serializeWasmCall(() =>
              value.apply(target.wasmWebClient, args)
            );
        }
        return value;
      }
      return undefined;
    },
  });
}

class WebClient {
  /**
   * Controls which worker variant is spawned when a WebClient is constructed.
   *
   * - `"auto"` (default): pick `classic` on Safari/WKWebView (where module
   *   workers have a very slow cold start), `module` everywhere else.
   * - `"module"`: always use the `.mjs` ES-module worker. Required for webpack
   *   5 / Next.js consumers so the asset tracer can see the WASM URL.
   * - `"classic"`: always use the `.js` classic-script worker. Required on
   *   Safari/WKWebView. Set this if your consumer bundler (or your host app)
   *   does not support module workers.
   *
   * Set before the first `WebClient.createClient(...)` call.
   */
  static workerMode = "auto";

  /**
   * Decide between the module and classic worker variants based on
   * `WebClient.workerMode` and (when `auto`) the current user agent.
   * @returns {boolean} true when the classic script should be used.
   * @private
   */
  static _shouldUseClassicWorker() {
    const mode = WebClient.workerMode;
    if (mode === "module") return false;
    if (mode === "classic") return true;
    // auto: classic on Safari/WKWebView, module everywhere else.
    const ua =
      typeof navigator !== "undefined" && navigator.userAgent
        ? navigator.userAgent
        : "";
    // Chromium-based browsers (Chrome, Edge, Brave, Opera, Chromium-based
    // Android WebView) handle module workers fine.
    if (/Chrome\/|Chromium\//.test(ua)) return false;
    // Safari (desktop + iOS) and WKWebView-without-Chrome (e.g. Capacitor host)
    // both have AppleWebKit but no Chrome/Chromium in the UA. Prefer classic.
    if (/AppleWebKit/.test(ua)) return true;
    // Firefox, jsdom, node without navigator, etc. — module worker is fine.
    return false;
  }

  /**
   * Create a WebClient wrapper.
   *
   * @param {string | undefined} rpcUrl - RPC endpoint URL used by the client.
   * @param {Uint8Array | undefined} seed - Optional seed for account initialization.
   * @param {string | undefined} storeName - Optional name for the store to be used by the client.
   * @param {(pubKey: Uint8Array) => Promise<Uint8Array | null | undefined> | Uint8Array | null | undefined} [getKeyCb]
   *   - Callback to retrieve the secret key bytes for a given public key. The `pubKey`
   *   parameter is the serialized public key (from `PublicKey.serialize()`). Return the
   *   corresponding secret key as a `Uint8Array`, or `null`/`undefined` if not found. The
   *   return value may be provided synchronously or via a `Promise`.
   * @param {(pubKey: Uint8Array, AuthSecretKey: Uint8Array) => Promise<void> | void} [insertKeyCb]
   *   - Callback to persist a secret key. `pubKey` is the serialized public key, and
   *   `authSecretKey` is the serialized secret key (from `AuthSecretKey.serialize()`). May return
   *   `void` or a `Promise<void>`.
   * @param {(pubKey: Uint8Array, signingInputs: Uint8Array) => Promise<Uint8Array> | Uint8Array} [signCb]
   *   - Callback to produce serialized signature bytes for the provided inputs. `pubKey` is the
   *   serialized public key, and `signingInputs` is a `Uint8Array` produced by
   *   `SigningInputs.serialize()`. Must return a `Uint8Array` containing the serialized
   *   signature, either directly or wrapped in a `Promise`.
   * @param {string | undefined} [logLevel] - Optional log verbosity level
   *   ("error", "warn", "info", "debug", "trace", "off", or "none").
   *   When set, Rust tracing output is routed to the browser console.
   */
  constructor(
    rpcUrl,
    noteTransportUrl,
    seed,
    storeName,
    getKeyCb,
    insertKeyCb,
    signCb,
    logLevel
  ) {
    this.rpcUrl = rpcUrl;
    this.noteTransportUrl = noteTransportUrl;
    this.seed = seed;
    this.storeName = storeName;
    this.getKeyCb = getKeyCb;
    this.insertKeyCb = insertKeyCb;
    this.signCb = signCb;
    this.logLevel = logLevel;

    // Check if Web Workers are available.
    if (typeof Worker !== "undefined") {
      console.log("WebClient: Web Workers are available.");
      // Pick between the module and classic worker variants at runtime — see
      // `WebClient.workerMode` below. Both branches keep the
      // `new Worker(new URL("...", import.meta.url), ...)` form fully literal:
      // webpack 5's new-worker detector is PURELY SYNTACTIC and only triggers
      // a proper worker sub-compilation (with asset+chunk tracing into the
      // Cargo glue and the sibling WASM) when it sees that exact pattern
      // spelled inline. Hoisting either URL into a variable downgrades the
      // detection to a plain "copy file as asset" — which in turn makes the
      // worker's `await import("./Cargo-*.js")` 404 because webpack never
      // emitted a chunk for it. The bit of duplication here is load-bearing.
      //
      // - module (`.module.js` with `{ type: "module" }`): `import.meta.url`
      //   inside the Cargo glue is preserved so webpack/Vite can resolve the
      //   WASM URL statically. Preferred everywhere EXCEPT Safari/WKWebView.
      // - classic (`.js`, no options): self-contained async IIFE with
      //   `import.meta.url` rewritten to `self.location.href`; the only form
      //   Safari/WKWebView can cold-start in a reasonable time.
      if (WebClient._shouldUseClassicWorker()) {
        this.worker = new Worker(
          new URL("./workers/web-client-methods-worker.js", import.meta.url)
        );
      } else {
        this.worker = new Worker(
          new URL(
            "./workers/web-client-methods-worker.module.js",
            import.meta.url
          ),
          { type: "module" }
        );
      }

      // Map to track pending worker requests.
      this.pendingRequests = new Map();

      // Promises to track when the worker script is loaded and ready.
      this.loaded = new Promise((resolve) => {
        this.loadedResolver = resolve;
      });

      // Create a promise that resolves when the worker signals that it is fully initialized.
      this.ready = new Promise((resolve) => {
        this.readyResolver = resolve;
      });

      // Listen for messages from the worker.
      this.worker.addEventListener("message", async (event) => {
        const data = event.data;

        // Worker script loaded.
        if (data.loaded) {
          this.loadedResolver();
          return;
        }

        // Worker ready.
        if (data.ready) {
          this.readyResolver();
          return;
        }

        if (data.action === WorkerAction.EXECUTE_CALLBACK) {
          const { callbackType, args, requestId } = data;
          try {
            const callbackMapping = {
              [CallbackType.GET_KEY]: this.getKeyCb,
              [CallbackType.INSERT_KEY]: this.insertKeyCb,
              [CallbackType.SIGN]: this.signCb,
            };
            if (!callbackMapping[callbackType]) {
              throw new Error(`Callback ${callbackType} not available`);
            }
            const callbackFunction = callbackMapping[callbackType];
            let result = callbackFunction.apply(this, args);
            if (result instanceof Promise) {
              result = await result;
            }

            this.worker.postMessage({
              callbackResult: result,
              callbackRequestId: requestId,
            });
          } catch (error) {
            this.worker.postMessage({
              callbackError: error.message,
              callbackRequestId: requestId,
            });
          }
          return;
        }

        // Handle responses for method calls.
        const { requestId, error, result, methodName } = data;
        if (requestId && this.pendingRequests.has(requestId)) {
          const { resolve, reject } = this.pendingRequests.get(requestId);
          this.pendingRequests.delete(requestId);
          if (error) {
            const workerError =
              error instanceof Error ? error : deserializeError(error);
            console.error(
              `WebClient: Error from worker in ${methodName}:`,
              workerError
            );
            reject(workerError);
          } else {
            resolve(result);
          }
        }
      });

      // Once the worker script has loaded, initialize the worker.
      this.loaded.then(() => this.initializeWorker());
    } else {
      console.log("WebClient: Web Workers are not available.");
      // Worker not available; set up fallback values.
      this.worker = null;
      this.pendingRequests = null;
      this.loaded = Promise.resolve();
      this.ready = Promise.resolve();
    }

    // Lazy initialize the underlying WASM WebClient when first requested.
    this.wasmWebClient = null;
    this.wasmWebClientPromise = null;

    // Promise chain to serialize direct WASM calls that require exclusive
    // (&mut self) access. Without this, concurrent calls on the same client
    // would panic with "recursive use of an object detected" due to
    // wasm-bindgen's internal RefCell.
    this._wasmCallChain = Promise.resolve();
  }

  /**
   * Serialize a WASM call that requires exclusive (&mut self) access.
   * Concurrent calls are queued and executed one at a time.
   *
   * Wraps both the direct (in-thread) path and the worker-dispatched path.
   * On the worker path this is redundant with the worker's own message queue,
   * but harmless (the chain resolves immediately on the main thread once the
   * worker's postMessage returns). On the direct path it is load-bearing —
   * without it, concurrent main-thread callers would panic with
   * "recursive use of an object detected" (wasm-bindgen's internal RefCell).
   *
   * @param {() => Promise<any>} fn - The async function to execute.
   * @returns {Promise<any>} The result of fn.
   */
  _serializeWasmCall(fn) {
    const result = this._wasmCallChain.catch(() => {}).then(fn);
    this._wasmCallChain = result.catch(() => {});
    return result;
  }

  /**
   * Returns a promise that resolves once every serialized WASM call that
   * was already on `_wasmCallChain` when `waitForIdle()` was called has
   * settled. Use this from callers that need to perform a non-WASM-side
   * action (e.g. clear an in-memory auth key) AFTER any in-flight
   * execute / submit / sync has completed, so the WASM kernel's auth
   * callback doesn't race with the key being cleared.
   *
   * Does NOT wait for calls enqueued after `waitForIdle()` returns —
   * this is intentional, so a caller can drain and then proceed without
   * being blocked indefinitely by a concurrent workload.
   *
   * Caveat for `syncState`: `syncStateWithTimeout` awaits
   * `acquireSyncLock` (Web Locks) BEFORE wrapping its WASM call in
   * `_serializeWasmCall`, so a sync that is queued on the sync lock but
   * has not yet reached its WASM phase is not on the chain and will not
   * be awaited. Every other serialized method (`executeTransaction`,
   * `newWallet`, `submitNewTransaction`, `proveTransaction`,
   * `applyTransaction`, and the proxy-fallback reads) routes through
   * the chain synchronously on call and is always observed.
   *
   * @returns {Promise<void>}
   */
  async waitForIdle() {
    // Chain on `_wasmCallChain`; by the time this resolves, any in-flight
    // serialized call has settled. Catch so the chain state doesn't leak.
    await this._wasmCallChain.catch(() => {});
  }

  // TODO: This will soon conflict with some changes in main.
  // More context here:
  // https://github.com/0xMiden/miden-client/pull/1645?notification_referrer_id=NT_kwHOA1yg7NoAJVJlcG9zaXRvcnk7NjU5MzQzNzAyO0lzc3VlOzM3OTY4OTU1Nzk&notifications_query=is%3Aunread#discussion_r2696075480
  initializeWorker() {
    // Pass `numThreads` to the worker so it can call `wasm.initThreadPool(n)`
    // inside its OWN WASM instance — the SDK worker's instance is separate
    // from the main thread's, and rayon's global pool is per-instance.
    // Default: navigator.hardwareConcurrency (or 1 if unavailable for any
    // reason — e.g. the page isn't crossOriginIsolated, in which case the
    // worker will skip pool init and parallelism falls back to sequential).
    let numThreads = 1;
    try {
      if (
        typeof self !== "undefined" &&
        self.crossOriginIsolated &&
        navigator?.hardwareConcurrency
      ) {
        numThreads = navigator.hardwareConcurrency;
      }
    } catch {}
    this.worker.postMessage({
      action: WorkerAction.INIT,
      args: [
        this.rpcUrl,
        this.noteTransportUrl,
        this.seed,
        this.storeName,
        !!this.getKeyCb,
        !!this.insertKeyCb,
        !!this.signCb,
        this.logLevel,
        numThreads,
      ],
    });
  }

  async getWasmWebClient() {
    if (this.wasmWebClient) {
      return this.wasmWebClient;
    }
    if (!this.wasmWebClientPromise) {
      this.wasmWebClientPromise = (async () => {
        const wasm = await getWasmOrThrow();
        const client = new wasm.WebClient();
        this.wasmWebClient = client;
        return client;
      })();
    }
    return this.wasmWebClientPromise;
  }

  /**
   * Factory method to create and initialize a WebClient instance.
   * This method is async so you can await the asynchronous call to createClient().
   *
   * @param {string} rpcUrl - The RPC URL.
   * @param {string} noteTransportUrl - The note transport URL (optional).
   * @param {string} seed - The seed for the account.
   * @param {string | undefined} network - Optional name for the store. Setting this allows multiple clients to be used in the same browser.
   * @param {string | undefined} logLevel - Optional log verbosity level ("error", "warn", "info", "debug", "trace", "off", or "none").
   * @returns {Promise<WebClient>} The fully initialized WebClient.
   */
  static async createClient(rpcUrl, noteTransportUrl, seed, network, logLevel) {
    // Construct the instance (synchronously).
    const instance = new WebClient(
      rpcUrl,
      noteTransportUrl,
      seed,
      network,
      undefined,
      undefined,
      undefined,
      logLevel
    );

    // Set up logging on the main thread before creating the client.
    if (logLevel) {
      const wasm = await getWasmOrThrow();
      wasm.setupLogging(logLevel);
    }

    // Wait for the underlying wasmWebClient to be initialized.
    const wasmWebClient = await instance.getWasmWebClient();
    await wasmWebClient.createClient(rpcUrl, noteTransportUrl, seed, network);

    // Wait for the worker to be ready
    await instance.ready;

    return createClientProxy(instance);
  }

  /**
   * Factory method to create and initialize a WebClient instance with a remote keystore.
   * This method is async so you can await the asynchronous call to createClientWithExternalKeystore().
   *
   * @param {string} rpcUrl - The RPC URL.
   * @param {string | undefined} noteTransportUrl - The note transport URL (optional).
   * @param {string | undefined} seed - The seed for the account.
   * @param {string | undefined} storeName - Optional name for the store. Setting this allows multiple clients to be used in the same browser.
   * @param {Function | undefined} getKeyCb - The get key callback.
   * @param {Function | undefined} insertKeyCb - The insert key callback.
   * @param {Function | undefined} signCb - The sign callback.
   * @param {string | undefined} logLevel - Optional log verbosity level ("error", "warn", "info", "debug", "trace", "off", or "none").
   * @returns {Promise<WebClient>} The fully initialized WebClient.
   */
  static async createClientWithExternalKeystore(
    rpcUrl,
    noteTransportUrl,
    seed,
    storeName,
    getKeyCb,
    insertKeyCb,
    signCb,
    logLevel
  ) {
    // Construct the instance (synchronously).
    const instance = new WebClient(
      rpcUrl,
      noteTransportUrl,
      seed,
      storeName,
      getKeyCb,
      insertKeyCb,
      signCb,
      logLevel
    );

    // Set up logging on the main thread before creating the client.
    if (logLevel) {
      const wasm = await getWasmOrThrow();
      wasm.setupLogging(logLevel);
    }

    // Wait for the underlying wasmWebClient to be initialized.
    const wasmWebClient = await instance.getWasmWebClient();
    await wasmWebClient.createClientWithExternalKeystore(
      rpcUrl,
      noteTransportUrl,
      seed,
      storeName,
      getKeyCb,
      insertKeyCb,
      signCb
    );

    await instance.ready;
    return createClientProxy(instance);
  }

  /**
   * Call a method via the worker.
   * @param {string} methodName - Name of the method to call.
   * @param  {...any} args - Arguments for the method.
   * @returns {Promise<any>}
   */
  async callMethodWithWorker(methodName, ...args) {
    await this.ready;
    // Create a unique request ID.
    const requestId = `${methodName}-${Date.now()}-${Math.random()}`;
    return new Promise((resolve, reject) => {
      // Save the resolve and reject callbacks in the pendingRequests map.
      this.pendingRequests.set(requestId, { resolve, reject });
      // Send the method call request to the worker.
      this.worker.postMessage({
        action: WorkerAction.CALL_METHOD,
        methodName,
        args,
        requestId,
      });
    });
  }

  // ----- Explicitly Wrapped Methods (Worker-Forwarded) -----

  async newWallet(storageMode, mutable, authSchemeId, seed) {
    return this._serializeWasmCall(async () => {
      const wasmWebClient = await this.getWasmWebClient();
      return await wasmWebClient.newWallet(
        storageMode,
        mutable,
        authSchemeId,
        seed
      );
    });
  }

  async newFaucet(
    storageMode,
    nonFungible,
    tokenSymbol,
    decimals,
    maxSupply,
    authSchemeId
  ) {
    return this._serializeWasmCall(async () => {
      const wasmWebClient = await this.getWasmWebClient();
      return await wasmWebClient.newFaucet(
        storageMode,
        nonFungible,
        tokenSymbol,
        decimals,
        maxSupply,
        authSchemeId
      );
    });
  }

  async newAccount(account, overwrite) {
    return this._serializeWasmCall(async () => {
      const wasmWebClient = await this.getWasmWebClient();
      return await wasmWebClient.newAccount(account, overwrite);
    });
  }

  async newAccountWithSecretKey(account, secretKey) {
    return this._serializeWasmCall(async () => {
      const wasmWebClient = await this.getWasmWebClient();
      return await wasmWebClient.newAccountWithSecretKey(account, secretKey);
    });
  }

  async submitNewTransaction(accountId, transactionRequest) {
    return this._serializeWasmCall(async () => {
      try {
        if (!this.worker) {
          const wasmWebClient = await this.getWasmWebClient();
          return await wasmWebClient.submitNewTransaction(
            accountId,
            transactionRequest
          );
        }

        const wasm = await getWasmOrThrow();
        const serializedTransactionRequest = transactionRequest.serialize();
        const result = await this.callMethodWithWorker(
          MethodName.SUBMIT_NEW_TRANSACTION,
          accountId.toString(),
          serializedTransactionRequest
        );

        const transactionResult = wasm.TransactionResult.deserialize(
          new Uint8Array(result.serializedTransactionResult)
        );

        return transactionResult.id();
      } catch (error) {
        console.error("INDEX.JS: Error in submitNewTransaction:", error);
        throw error;
      }
    });
  }

  async submitNewTransactionWithProver(accountId, transactionRequest, prover) {
    return this._serializeWasmCall(async () => {
      try {
        if (!this.worker) {
          const wasmWebClient = await this.getWasmWebClient();
          return await wasmWebClient.submitNewTransactionWithProver(
            accountId,
            transactionRequest,
            prover
          );
        }

        const wasm = await getWasmOrThrow();
        const serializedTransactionRequest = transactionRequest.serialize();
        const proverPayload = prover.serialize();
        const result = await this.callMethodWithWorker(
          MethodName.SUBMIT_NEW_TRANSACTION_WITH_PROVER,
          accountId.toString(),
          serializedTransactionRequest,
          proverPayload
        );

        const transactionResult = wasm.TransactionResult.deserialize(
          new Uint8Array(result.serializedTransactionResult)
        );

        return transactionResult.id();
      } catch (error) {
        console.error(
          "INDEX.JS: Error in submitNewTransactionWithProver:",
          error
        );
        throw error;
      }
    });
  }

  async executeTransaction(accountId, transactionRequest) {
    return this._serializeWasmCall(async () => {
      try {
        if (!this.worker) {
          const wasmWebClient = await this.getWasmWebClient();
          return await wasmWebClient.executeTransaction(
            accountId,
            transactionRequest
          );
        }

        const wasm = await getWasmOrThrow();
        const serializedTransactionRequest = transactionRequest.serialize();
        const serializedResultBytes = await this.callMethodWithWorker(
          MethodName.EXECUTE_TRANSACTION,
          accountId.toString(),
          serializedTransactionRequest
        );

        return wasm.TransactionResult.deserialize(
          new Uint8Array(serializedResultBytes)
        );
      } catch (error) {
        console.error("INDEX.JS: Error in executeTransaction:", error);
        throw error;
      }
    });
  }

  async proveTransaction(transactionResult, prover) {
    return this._serializeWasmCall(async () => {
      try {
        if (!this.worker) {
          const wasmWebClient = await this.getWasmWebClient();
          return prover
            ? await wasmWebClient.proveTransactionWithProver(
                transactionResult,
                prover
              )
            : await wasmWebClient.proveTransaction(transactionResult);
        }

        const wasm = await getWasmOrThrow();
        const serializedTransactionResult = transactionResult.serialize();
        const proverPayload = prover ? prover.serialize() : null;

        const serializedProvenBytes = await this.callMethodWithWorker(
          MethodName.PROVE_TRANSACTION,
          serializedTransactionResult,
          proverPayload
        );

        return wasm.ProvenTransaction.deserialize(
          new Uint8Array(serializedProvenBytes)
        );
      } catch (error) {
        console.error("INDEX.JS: Error in proveTransaction:", error);
        throw error;
      }
    });
  }

  // Delegates to `proveTransaction`, which already routes through
  // `_serializeWasmCall` and dispatches to the WASM `proveTransactionWithProver`
  // binding when `prover` is present. Kept as a wrapper (rather than elided)
  // so the method classification lint sees an explicit match for the WASM
  // method name.
  async proveTransactionWithProver(transactionResult, prover) {
    return this.proveTransaction(transactionResult, prover);
  }

  async applyTransaction(transactionResult, submissionHeight) {
    return this._serializeWasmCall(async () => {
      try {
        if (!this.worker) {
          const wasmWebClient = await this.getWasmWebClient();
          return await wasmWebClient.applyTransaction(
            transactionResult,
            submissionHeight
          );
        }

        const wasm = await getWasmOrThrow();
        const serializedTransactionResult = transactionResult.serialize();
        const serializedUpdateBytes = await this.callMethodWithWorker(
          MethodName.APPLY_TRANSACTION,
          serializedTransactionResult,
          submissionHeight
        );

        return wasm.TransactionStoreUpdate.deserialize(
          new Uint8Array(serializedUpdateBytes)
        );
      } catch (error) {
        console.error("INDEX.JS: Error in applyTransaction:", error);
        throw error;
      }
    });
  }

  /**
   * Syncs the client state with the node.
   *
   * This method coordinates concurrent sync calls using the Web Locks API when available,
   * with an in-process mutex fallback for older browsers. If a sync is already in progress,
   * subsequent callers will wait and receive the same result (coalescing behavior).
   *
   * @returns {Promise<SyncSummary>} The sync summary
   */
  async syncState() {
    return this.syncStateWithTimeout(0);
  }

  /**
   * Syncs the client state with the node with an optional timeout.
   *
   * This method coordinates concurrent sync calls using the Web Locks API when available,
   * with an in-process mutex fallback for older browsers. If a sync is already in progress,
   * subsequent callers will wait and receive the same result (coalescing behavior).
   *
   * @param {number} timeoutMs - Timeout in milliseconds (0 = no timeout)
   * @returns {Promise<SyncSummary>} The sync summary
   */
  async syncStateWithTimeout(timeoutMs = 0) {
    // Use storeName as the database ID for lock coordination
    const dbId = this.storeName || "default";

    try {
      // Acquire the sync lock (coordinates concurrent calls)
      const lockHandle = await acquireSyncLock(dbId, timeoutMs);

      if (!lockHandle.acquired) {
        // We're coalescing - return the result from the in-progress sync
        return lockHandle.coalescedResult;
      }

      // We acquired the lock - perform the sync. Wrap the actual WASM
      // call in _serializeWasmCall so it can't race with any other
      // mutating method (executeTransaction, submitNewTransaction, etc.)
      // on the same WebClient. The outer coalescing lock stays in place
      // so concurrent syncState callers still share one in-flight sync.
      try {
        const result = await this._serializeWasmCall(async () => {
          if (!this.worker) {
            const wasmWebClient = await this.getWasmWebClient();
            return await wasmWebClient.syncStateImpl();
          }
          const wasm = await getWasmOrThrow();
          const serializedSyncSummaryBytes = await this.callMethodWithWorker(
            MethodName.SYNC_STATE
          );
          return wasm.SyncSummary.deserialize(
            new Uint8Array(serializedSyncSummaryBytes)
          );
        });

        // Release the lock with the result
        releaseSyncLock(dbId, result);
        return result;
      } catch (error) {
        // Release the lock with the error
        releaseSyncLockWithError(dbId, error);
        throw error;
      }
    } catch (error) {
      console.error("INDEX.JS: Error in syncState:", error);
      throw error;
    }
  }

  /**
   * Terminates the underlying Web Worker used by this WebClient instance.
   *
   * Call this method when you're done using a WebClient to free up browser
   * resources. Each WebClient instance uses a dedicated Web Worker for
   * computationally intensive operations. Terminating releases that thread.
   *
   * After calling terminate(), the WebClient should not be used.
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

class MockWebClient extends WebClient {
  constructor(seed, logLevel) {
    super(
      null,
      null,
      seed,
      MOCK_STORE_NAME,
      undefined,
      undefined,
      undefined,
      logLevel
    );
  }

  initializeWorker() {
    this.worker.postMessage({
      action: WorkerAction.INIT_MOCK,
      args: [this.seed, this.logLevel],
    });
  }

  /**
   * Factory method to create a WebClient with a mock chain for testing purposes.
   *
   * @param serializedMockChain - Serialized mock chain data (optional). Will use an empty chain if not provided.
   * @param serializedMockNoteTransportNode - Serialized mock note transport node data (optional). Will use a new instance if not provided.
   * @param seed - The seed for the account (optional).
   * @returns A promise that resolves to a MockWebClient.
   */
  static async createClient(
    serializedMockChain,
    serializedMockNoteTransportNode,
    seed,
    logLevel
  ) {
    // Construct the instance (synchronously).
    const instance = new MockWebClient(seed, logLevel);

    // Set up logging on the main thread before creating the client.
    if (logLevel) {
      const wasm = await getWasmOrThrow();
      wasm.setupLogging(logLevel);
    }

    // Wait for the underlying wasmWebClient to be initialized.
    const wasmWebClient = await instance.getWasmWebClient();
    await wasmWebClient.createMockClient(
      seed,
      serializedMockChain,
      serializedMockNoteTransportNode
    );

    // Wait for the worker to be ready
    await instance.ready;

    return createClientProxy(instance);
  }

  /**
   * Syncs the mock client state.
   *
   * This method coordinates concurrent sync calls using the Web Locks API when available,
   * with an in-process mutex fallback for older browsers. If a sync is already in progress,
   * subsequent callers will wait and receive the same result (coalescing behavior).
   *
   * @returns {Promise<SyncSummary>} The sync summary
   */
  async syncState() {
    return this.syncStateWithTimeout(0);
  }

  /**
   * Syncs the mock client state with an optional timeout.
   *
   * @param {number} timeoutMs - Timeout in milliseconds (0 = no timeout)
   * @returns {Promise<SyncSummary>} The sync summary
   */
  async syncStateWithTimeout(timeoutMs = 0) {
    const dbId = this.storeName || "mock";

    try {
      const lockHandle = await acquireSyncLock(dbId, timeoutMs);

      if (!lockHandle.acquired) {
        return lockHandle.coalescedResult;
      }

      try {
        let result;
        const wasmWebClient = await this.getWasmWebClient();

        if (!this.worker) {
          result = await wasmWebClient.syncStateImpl();
        } else {
          let serializedMockChain = wasmWebClient.serializeMockChain().buffer;
          let serializedMockNoteTransportNode =
            wasmWebClient.serializeMockNoteTransportNode().buffer;

          const wasm = await getWasmOrThrow();

          const serializedSyncSummaryBytes = await this.callMethodWithWorker(
            MethodName.SYNC_STATE_MOCK,
            serializedMockChain,
            serializedMockNoteTransportNode
          );

          result = wasm.SyncSummary.deserialize(
            new Uint8Array(serializedSyncSummaryBytes)
          );
        }

        releaseSyncLock(dbId, result);
        return result;
      } catch (error) {
        releaseSyncLockWithError(dbId, error);
        throw error;
      }
    } catch (error) {
      console.error("INDEX.JS: Error in syncState:", error);
      throw error;
    }
  }

  async submitNewTransaction(accountId, transactionRequest) {
    try {
      if (!this.worker) {
        return await super.submitNewTransaction(accountId, transactionRequest);
      }

      const wasmWebClient = await this.getWasmWebClient();
      const wasm = await getWasmOrThrow();
      const serializedTransactionRequest = transactionRequest.serialize();
      const serializedMockChain = wasmWebClient.serializeMockChain().buffer;
      const serializedMockNoteTransportNode =
        wasmWebClient.serializeMockNoteTransportNode().buffer;

      const result = await this.callMethodWithWorker(
        MethodName.SUBMIT_NEW_TRANSACTION_MOCK,
        accountId.toString(),
        serializedTransactionRequest,
        serializedMockChain,
        serializedMockNoteTransportNode
      );

      const newMockChain = new Uint8Array(result.serializedMockChain);
      const newMockNoteTransportNode = result.serializedMockNoteTransportNode
        ? new Uint8Array(result.serializedMockNoteTransportNode)
        : undefined;

      const transactionResult = wasm.TransactionResult.deserialize(
        new Uint8Array(result.serializedTransactionResult)
      );

      if (!(this instanceof MockWebClient)) {
        return transactionResult.id();
      }

      this.wasmWebClient = new wasm.WebClient();
      this.wasmWebClientPromise = Promise.resolve(this.wasmWebClient);
      await this.wasmWebClient.createMockClient(
        this.seed,
        newMockChain,
        newMockNoteTransportNode
      );

      return transactionResult.id();
    } catch (error) {
      console.error("INDEX.JS: Error in submitNewTransaction:", error);
      throw error;
    }
  }

  async submitNewTransactionWithProver(accountId, transactionRequest, prover) {
    try {
      if (!this.worker) {
        return await super.submitNewTransactionWithProver(
          accountId,
          transactionRequest,
          prover
        );
      }

      const wasmWebClient = await this.getWasmWebClient();
      const wasm = await getWasmOrThrow();
      const serializedTransactionRequest = transactionRequest.serialize();
      const proverPayload = prover.serialize();
      const serializedMockChain = wasmWebClient.serializeMockChain().buffer;
      const serializedMockNoteTransportNode =
        wasmWebClient.serializeMockNoteTransportNode().buffer;

      const result = await this.callMethodWithWorker(
        MethodName.SUBMIT_NEW_TRANSACTION_WITH_PROVER_MOCK,
        accountId.toString(),
        serializedTransactionRequest,
        proverPayload,
        serializedMockChain,
        serializedMockNoteTransportNode
      );

      const newMockChain = new Uint8Array(result.serializedMockChain);
      const newMockNoteTransportNode = result.serializedMockNoteTransportNode
        ? new Uint8Array(result.serializedMockNoteTransportNode)
        : undefined;

      const transactionResult = wasm.TransactionResult.deserialize(
        new Uint8Array(result.serializedTransactionResult)
      );

      if (!(this instanceof MockWebClient)) {
        return transactionResult.id();
      }

      this.wasmWebClient = new wasm.WebClient();
      this.wasmWebClientPromise = Promise.resolve(this.wasmWebClient);
      await this.wasmWebClient.createMockClient(
        this.seed,
        newMockChain,
        newMockNoteTransportNode
      );

      return transactionResult.id();
    } catch (error) {
      console.error(
        "INDEX.JS: Error in submitNewTransactionWithProver:",
        error
      );
      throw error;
    }
  }
}

function copyWebClientStatics(WasmWebClient) {
  if (!WasmWebClient) {
    return;
  }
  Object.getOwnPropertyNames(WasmWebClient).forEach((prop) => {
    if (
      typeof WasmWebClient[prop] === "function" &&
      prop !== "constructor" &&
      prop !== "prototype"
    ) {
      WebClient[prop] = WasmWebClient[prop];
    }
  });
}

// Wire MidenClient dependencies (resolves circular import)
MidenClient._WasmWebClient = WebClient;
MidenClient._MockWasmWebClient = MockWebClient;
MidenClient._getWasmOrThrow = getWasmOrThrow;
_setWebClient(WebClient);

export { AccountArray, AccountIdArray, AccountType, AuthScheme, CompilerResource, FeltArray, ForeignAccountArray, Linking, MidenArrays, MidenClient, MockWebClient as MockWasmWebClient, NoteAndArgsArray, NoteArray, NoteIdAndArgsArray, NoteRecipientArray, NoteVisibility, OutputNoteArray, StorageMode, StorageSlotArray, TransactionScriptInputPairArray, WebClient as WasmWebClient, buildSwapTag, createP2IDENote, createP2IDNote, getWasmOrThrow, resolveAuthScheme };
//# sourceMappingURL=index.js.map
