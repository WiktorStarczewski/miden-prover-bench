/* tslint:disable */
/* eslint-disable */
/**
 * Specifies which procedures an account accepts, and by extension which notes it can consume.
 */

type AddressInterface = "BasicWallet";
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */

type ReadableStreamType = "bytes";

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
export class Account {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the code commitment for this account.
     */
    code(): AccountCode;
    /**
     * Restores an account from its serialized bytes.
     */
    static deserialize(bytes: Uint8Array): Account;
    /**
     * Returns the public key commitments derived from the account's authentication scheme.
     */
    getPublicKeyCommitments(): Word[];
    /**
     * Returns the account identifier.
     */
    id(): AccountId;
    /**
     * Returns true if the account is a faucet.
     */
    isFaucet(): boolean;
    /**
     * Returns true if this is a network-owned account.
     */
    isNetwork(): boolean;
    /**
     * Returns true if the account has not yet been committed to the chain.
     */
    isNew(): boolean;
    /**
     * Returns true if the account storage is private.
     */
    isPrivate(): boolean;
    /**
     * Returns true if the account exposes public storage.
     */
    isPublic(): boolean;
    /**
     * Returns true if the account is a regular account (immutable or updatable code).
     */
    isRegularAccount(): boolean;
    /**
     * Returns true if the account can update its code.
     */
    isUpdatable(): boolean;
    /**
     * Returns the account nonce, which is incremented on every state update.
     */
    nonce(): Felt;
    /**
     * Serializes the account into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns the account storage commitment.
     */
    storage(): AccountStorage;
    /**
     * Returns the commitment to the account header, storage, and code.
     */
    to_commitment(): Word;
    /**
     * Returns the vault commitment for this account.
     */
    vault(): AssetVault;
}

export class AccountArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): Account;
    length(): number;
    constructor(elements?: Account[] | null);
    push(element: Account): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: Account): void;
}

export class AccountBuilder {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Sets the account type (regular, faucet, etc.).
     *
     * Accepts either a numeric WASM enum value (0–3) or a string name
     * (`"FungibleFaucet"`, `"NonFungibleFaucet"`,
     * `"RegularAccountImmutableCode"`, `"RegularAccountUpdatableCode"`).
     */
    accountType(account_type: any): AccountBuilder;
    /**
     * Builds the account and returns it together with the derived seed.
     */
    build(): AccountBuilderResult;
    /**
     * Creates a new account builder from a 32-byte initial seed.
     */
    constructor(init_seed: Uint8Array);
    /**
     * Sets the storage mode (public/private) for the account.
     */
    storageMode(storage_mode: AccountStorageMode): AccountBuilder;
    /**
     * Adds an authentication component to the account.
     */
    withAuthComponent(account_component: AccountComponent): AccountBuilder;
    withBasicWalletComponent(): AccountBuilder;
    /**
     * Adds a component to the account.
     */
    withComponent(account_component: AccountComponent): AccountBuilder;
    /**
     * Adds a no-auth component to the account (for public accounts).
     */
    withNoAuthComponent(): AccountBuilder;
}

export class AccountBuilderResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the built account.
     */
    readonly account: Account;
    /**
     * Returns the seed used to derive the account ID.
     */
    readonly seed: Word;
}

/**
 * A public interface of an account.
 *
 * Account's public interface consists of a set of callable procedures, each committed to by its
 * root hash and paired with storage bounds (offset and size).
 *
 * The full interface commitment hashes every procedure root together with its storage bounds so
 * that the account code uniquely captures the set of available calls.
 */
export class AccountCode {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the code commitment for the account.
     */
    commitment(): Word;
    /**
     * Returns true if the account code exports a procedure with the given MAST root.
     */
    hasProcedure(mast_root: Word): boolean;
}

export class AccountComponent {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Compiles account code with the given storage slots using the provided assembler.
     */
    static compile(account_code: AccountComponentCode, storage_slots: StorageSlot[]): AccountComponent;
    static createAuthComponentFromCommitment(commitment: Word, auth_scheme: AuthScheme): AccountComponent;
    /**
     * Builds an auth component from a secret key, inferring the auth scheme from the key type.
     */
    static createAuthComponentFromSecretKey(secret_key: AuthSecretKey): AccountComponent;
    /**
     * Creates an account component from a compiled library and storage slots.
     */
    static fromLibrary(library: Library, storage_slots: StorageSlot[]): AccountComponent;
    /**
     * Creates an account component from a compiled package and storage slots.
     */
    static fromPackage(_package: Package, storage_slots: StorageSlotArray): AccountComponent;
    /**
     * Returns the hex-encoded MAST root for a procedure by name.
     *
     * Matches by full path, relative path, or local name (after the last `::`).
     * When matching by local name, if multiple procedures share the same local
     * name across modules, the first match is returned.
     */
    getProcedureHash(procedure_name: string): string;
    /**
     * Returns all procedures exported by this component.
     */
    getProcedures(): GetProceduresResultItem[];
    /**
     * Marks the component as supporting all account types.
     */
    withSupportsAllTypes(): AccountComponent;
}

/**
 * A Library that has been assembled for use as component code.
 */
export class AccountComponentCode {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the underlying Library
     */
    asLibrary(): Library;
}

/**
 * `AccountDelta` stores the differences between two account states.
 *
 * The differences are represented as follows:
 * - `storage`: an `AccountStorageDelta` that contains the changes to the account storage.
 * - `vault`: an `AccountVaultDelta` object that contains the changes to the account vault.
 * - `nonce`: if the nonce of the account has changed, the new nonce is stored here.
 */
export class AccountDelta {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Deserializes an account delta from bytes.
     */
    static deserialize(bytes: Uint8Array): AccountDelta;
    /**
     * Returns the affected account ID.
     */
    id(): AccountId;
    /**
     * Returns true if there are no changes.
     */
    isEmpty(): boolean;
    /**
     * Returns the nonce change.
     */
    nonceDelta(): Felt;
    /**
     * Serializes the account delta into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns the storage delta.
     */
    storage(): AccountStorageDelta;
    /**
     * Returns the vault delta.
     */
    vault(): AccountVaultDelta;
}

export class AccountFile {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account data.
     */
    account(): Account;
    /**
     * Returns the account ID.
     */
    accountId(): AccountId;
    /**
     * Returns the number of auth secret keys included.
     */
    authSecretKeyCount(): number;
    /**
     * Deserializes a byte array into an `AccountFile`
     */
    static deserialize(bytes: Uint8Array): AccountFile;
    /**
     * Serializes the `AccountFile` into a byte array
     */
    serialize(): Uint8Array;
}

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
export class AccountHeader {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the code commitment.
     */
    codeCommitment(): Word;
    /**
     * Returns the account ID.
     */
    id(): AccountId;
    /**
     * Returns the current nonce.
     */
    nonce(): Felt;
    /**
     * Returns the storage commitment.
     */
    storageCommitment(): Word;
    /**
     * Returns the full account commitment.
     */
    to_commitment(): Word;
    /**
     * Returns the vault commitment.
     */
    vaultCommitment(): Word;
}

/**
 * Uniquely identifies a specific account.
 *
 * A Miden account ID is a 120-bit value derived from the commitments to account code and storage,
 * and a random user-provided seed.
 */
export class AccountId {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Given a bech32 encoded string, return the matching Account ID for it.
     */
    static fromBech32(bech_32_encoded_id: string): AccountId;
    /**
     * Builds an account ID from its hex string representation.
     *
     * Returns an error if the provided string is not a valid hex-encoded account ID.
     */
    static fromHex(hex: string): AccountId;
    /**
     * Builds an account ID from its prefix and suffix field elements.
     *
     * This is useful when the account ID components are stored separately (e.g., in storage
     * maps) and need to be recombined into an `AccountId`.
     *
     * Returns an error if the provided felts do not form a valid account ID.
     */
    static fromPrefixSuffix(prefix: Felt, suffix: Felt): AccountId;
    /**
     * Returns true if the ID refers to a faucet.
     */
    isFaucet(): boolean;
    /**
     * Returns true if the ID is reserved for network accounts.
     */
    isNetwork(): boolean;
    /**
     * Returns true if the account uses private storage.
     */
    isPrivate(): boolean;
    /**
     * Returns true if the account uses public storage.
     */
    isPublic(): boolean;
    /**
     * Returns true if the ID refers to a regular account.
     */
    isRegularAccount(): boolean;
    /**
     * Returns the prefix field element storing metadata about version, type, and storage mode.
     */
    prefix(): Felt;
    /**
     * Returns the suffix field element derived from the account seed.
     */
    suffix(): Felt;
    /**
     * Will turn the Account ID into its bech32 string representation.
     */
    toBech32(network_id: NetworkId, account_interface: AccountInterface): string;
    /**
     * Returns the canonical hex representation of the account ID.
     */
    toString(): string;
}

export class AccountIdArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): AccountId;
    length(): number;
    constructor(elements?: AccountId[] | null);
    push(element: AccountId): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: AccountId): void;
}

export enum AccountInterface {
    /**
     * Basic wallet address interface.
     */
    BasicWallet = 0,
}

/**
 * Proof of existence of an account's state at a specific block number, as returned by the node.
 *
 * For public accounts, this includes the account header, storage slot values, account code,
 * and optionally storage map entries for the requested storage maps.
 * For private accounts, only the account commitment and merkle proof are available.
 */
export class AccountProof {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account code, if available (public accounts only).
     */
    accountCode(): AccountCode | undefined;
    /**
     * Returns the account commitment (hash of the full state).
     */
    accountCommitment(): Word;
    /**
     * Returns the account header, if available (public accounts only).
     */
    accountHeader(): AccountHeader | undefined;
    /**
     * Returns the account ID.
     */
    accountId(): AccountId;
    /**
     * Returns the block number at which this proof was retrieved.
     */
    blockNum(): number;
    /**
     * Returns storage map entries for a given slot name, if available.
     *
     * Returns `undefined` if the account is private, the slot was not requested in the
     * storage requirements, or the slot is not a map.
     *
     * Each entry contains a `key` and `value` as `Word` objects.
     */
    getStorageMapEntries(slot_name: string): StorageMapEntry[] | undefined;
    /**
     * Returns the names of all storage slots that have map details available.
     *
     * This can be used to discover which storage maps were included in the proof response.
     * Returns `undefined` if the account is private.
     */
    getStorageMapSlotNames(): string[] | undefined;
    /**
     * Returns the value of a storage slot by name, if available.
     *
     * For `Value` slots, this returns the stored word.
     * For `Map` slots, this returns the map root commitment.
     *
     * Returns `undefined` if the account is private or the slot name is not found.
     */
    getStorageSlotValue(slot_name: string): Word | undefined;
    /**
     * Returns whether a storage map slot had too many entries to return inline.
     *
     * When this returns `true`, use `RpcClient.syncStorageMaps()` to fetch the full
     * storage map data.
     *
     * Returns `undefined` if the slot was not found or the account is private.
     */
    hasStorageMapTooManyEntries(slot_name: string): boolean | undefined;
    /**
     * Returns the number of storage slots, if available (public accounts only).
     */
    numStorageSlots(): number | undefined;
}

/**
 * Provides lazy access to account data.
 *
 * `AccountReader` executes queries lazily - each method call fetches fresh data
 * from storage, ensuring you always see the current state.
 */
export class AccountReader {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account ID.
     */
    accountId(): AccountId;
    /**
     * Retrieves the addresses associated with this account.
     */
    addresses(): Promise<Address[]>;
    /**
     * Retrieves the code commitment (hash of the account code).
     */
    codeCommitment(): Promise<Word>;
    /**
     * Retrieves the account commitment (hash of the full state).
     */
    commitment(): Promise<Word>;
    /**
     * Retrieves the balance of a fungible asset in the account's vault.
     *
     * Returns 0 if the asset is not present in the vault.
     */
    getBalance(faucet_id: AccountId): Promise<bigint>;
    /**
     * Retrieves a storage slot value by name.
     *
     * For `Value` slots, returns the stored word.
     * For `Map` slots, returns the map root.
     */
    getStorageItem(slot_name: string): Promise<Word>;
    /**
     * Retrieves a value from a storage map slot by name and key.
     */
    getStorageMapItem(slot_name: string, key: Word): Promise<Word>;
    /**
     * Retrieves the account header.
     */
    header(): Promise<AccountHeader>;
    /**
     * Retrieves the current account nonce.
     */
    nonce(): Promise<Felt>;
    /**
     * Retrieves the account status.
     */
    status(): Promise<AccountStatus>;
    /**
     * Retrieves the storage commitment (root of the storage tree).
     */
    storageCommitment(): Promise<Word>;
    /**
     * Retrieves the vault root (root of the asset vault tree).
     */
    vaultRoot(): Promise<Word>;
}

/**
 * Represents the status of an account tracked by the client.
 *
 * The status of an account may change by local or external factors.
 */
export class AccountStatus {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns `true` if the account is locked.
     *
     * A locked account has a local state that doesn't match the node's state,
     * rendering it unusable for transactions.
     */
    isLocked(): boolean;
    /**
     * Returns `true` if the account is new and hasn't been used yet.
     */
    isNew(): boolean;
    /**
     * Returns the account seed if available.
     *
     * The seed is available for:
     * - New accounts (stored in the New status)
     * - Locked private accounts with nonce=0 (preserved for reconstruction)
     */
    seed(): Word | undefined;
    /**
     * Returns the status as a string representation.
     */
    toString(): string;
}

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
export class AccountStorage {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the commitment to the full account storage.
     */
    commitment(): Word;
    /**
     * Returns the value stored at the given slot name, if any.
     */
    getItem(slot_name: string): Word | undefined;
    /**
     * Get all key-value pairs from the map slot identified by `slot_name`.
     * Returns `undefined` if the slot isn't a map or doesn't exist.
     * Returns `[]` if the map exists but is empty.
     */
    getMapEntries(slot_name: string): JsStorageMapEntry[] | undefined;
    /**
     * Returns the value for a key in the map stored at the given slot, if any.
     */
    getMapItem(slot_name: string, key: Word): Word | undefined;
    /**
     * Returns the names of all storage slots on this account.
     */
    getSlotNames(): string[];
}

/**
 * `AccountStorageDelta` stores the differences between two states of account storage.
 *
 * The delta consists of two maps:
 * - A map containing the updates to value storage slots. The keys in this map are indexes of the
 *   updated storage slots and the values are the new values for these slots.
 * - A map containing updates to storage maps. The keys in this map are indexes of the updated
 *   storage slots and the values are corresponding storage map delta objects.
 */
export class AccountStorageDelta {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Deserializes a storage delta from bytes.
     */
    static deserialize(bytes: Uint8Array): AccountStorageDelta;
    /**
     * Returns true if no storage slots are changed.
     */
    isEmpty(): boolean;
    /**
     * Serializes the storage delta into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns the new values for modified storage slots.
     */
    values(): Word[];
}

/**
 * Storage visibility mode for an account.
 */
export class AccountStorageMode {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the storage mode as a string.
     */
    asStr(): string;
    /**
     * Creates a network storage mode.
     */
    static network(): AccountStorageMode;
    /**
     * Creates a private storage mode.
     */
    static private(): AccountStorageMode;
    /**
     * Creates a public storage mode.
     */
    static public(): AccountStorageMode;
    /**
     * Parses a storage mode from its string representation.
     */
    static tryFromStr(s: string): AccountStorageMode;
}

export class AccountStorageRequirements {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Builds storage requirements from a list of slot/key pairs.
     */
    static fromSlotAndKeysArray(slots_and_keys: SlotAndKeys[]): AccountStorageRequirements;
    /**
     * Creates empty storage requirements.
     */
    constructor();
}

export enum AccountType {
    FungibleFaucet = 0,
    NonFungibleFaucet = 1,
    RegularAccountImmutableCode = 2,
    RegularAccountUpdatableCode = 3,
}

/**
 * `AccountVaultDelta` stores the difference between the initial and final account vault states.
 *
 * The difference is represented as follows:
 * - `fungible`: a binary tree map of fungible asset balance changes in the account vault.
 * - `non_fungible`: a binary tree map of non-fungible assets that were added to or removed from
 *   the account vault.
 */
export class AccountVaultDelta {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the fungible assets that increased.
     */
    addedFungibleAssets(): FungibleAsset[];
    /**
     * Deserializes a vault delta from bytes.
     */
    static deserialize(bytes: Uint8Array): AccountVaultDelta;
    /**
     * Returns the fungible portion of the delta.
     */
    fungible(): FungibleAssetDelta;
    /**
     * Returns true if no assets are changed.
     */
    isEmpty(): boolean;
    /**
     * Returns the fungible assets that decreased.
     */
    removedFungibleAssets(): FungibleAsset[];
    /**
     * Serializes the vault delta into bytes.
     */
    serialize(): Uint8Array;
}

/**
 * Representation of a Miden address (account ID plus routing parameters).
 */
export class Address {
    private constructor();
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account ID embedded in the address.
     */
    accountId(): AccountId;
    /**
     * Deserializes a byte array into an `Address`.
     */
    static deserialize(bytes: Uint8Array): Address;
    /**
     * Builds an address from an account ID and optional interface.
     */
    static fromAccountId(account_id: AccountId, _interface?: string | null): Address;
    /**
     * Builds an address from a bech32-encoded string.
     */
    static fromBech32(bech32: string): Address;
    /**
     * Returns the address interface.
     */
    interface(): AddressInterface;
    /**
     * Encodes the address using the provided network prefix.
     */
    toBech32(network_id: NetworkId): string;
    /**
     * Converts the address into a note tag.
     */
    toNoteTag(): NoteTag;
}

/**
 * Advice inputs provided to a transaction or note script.
 */
export class AdviceInputs {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns mapped values for a given key if present.
     */
    mappedValues(key: Word): Felt[] | undefined;
    /**
     * `wasm_bindgen` requires an explicit constructor; `#[derive(Default)]` alone
     * is not callable from JS.
     */
    constructor();
    /**
     * Returns the stack inputs as a vector of felts.
     */
    stack(): Felt[];
}

/**
 * Map of advice values keyed by words for script execution.
 */
export class AdviceMap {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Inserts a value for the given key, returning any previous value.
     */
    insert(key: Word, value: FeltArray): Felt[] | undefined;
    /**
     * Creates an empty advice map.
     */
    constructor();
}

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
export class AssetVault {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the fungible assets contained in this vault.
     */
    fungibleAssets(): FungibleAsset[];
    /**
     * Returns the balance for the given fungible faucet, or zero if absent.
     */
    getBalance(faucet_id: AccountId): bigint;
    /**
     * Returns the root commitment of the asset vault tree.
     */
    root(): Word;
}

/**
 * Multisig auth configuration for `RpoFalcon512` signatures.
 */
export class AuthFalcon512RpoMultisigConfig {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Per-procedure thresholds.
     */
    getProcThresholds(): ProcedureThreshold[];
    /**
     * Build a configuration with a list of approver public key commitments and a default
     * threshold.
     *
     * `default_threshold` must be >= 1 and <= `approvers.length`.
     */
    constructor(approvers: Word[], default_threshold: number);
    /**
     * Attach per-procedure thresholds. Each threshold must be >= 1 and <= `approvers.length`.
     */
    withProcThresholds(proc_thresholds: ProcedureThreshold[]): AuthFalcon512RpoMultisigConfig;
    /**
     * Approver public key commitments as Words.
     */
    readonly approvers: Word[];
    readonly defaultThreshold: number;
}

/**
 * Authentication schemes supported by the web client.
 */
export enum AuthScheme {
    AuthEcdsaK256Keccak = 1,
    AuthRpoFalcon512 = 2,
}

export class AuthSecretKey {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static deserialize(bytes: Uint8Array): AuthSecretKey;
    static ecdsaWithRNG(seed?: Uint8Array | null): AuthSecretKey;
    /**
     * Returns the ECDSA k256 Keccak secret key bytes encoded as felts.
     */
    getEcdsaK256KeccakSecretKeyAsFelts(): Felt[];
    getPublicKeyAsWord(): Word;
    getRpoFalcon512SecretKeyAsFelts(): Felt[];
    publicKey(): PublicKey;
    static rpoFalconWithRNG(seed?: Uint8Array | null): AuthSecretKey;
    serialize(): Uint8Array;
    sign(message: Word): Signature;
    signData(signing_inputs: SigningInputs): Signature;
}

/**
 * Provides metadata for a basic fungible faucet account component.
 */
export class BasicFungibleFaucetComponent {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the number of decimal places for the token.
     */
    decimals(): number;
    /**
     * Extracts faucet metadata from an account.
     */
    static fromAccount(account: Account): BasicFungibleFaucetComponent;
    /**
     * Returns the maximum token supply.
     */
    maxSupply(): Felt;
    /**
     * Returns the faucet's token symbol.
     */
    symbol(): TokenSymbol;
}

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
export class BlockHeader {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account root commitment.
     */
    accountRoot(): Word;
    /**
     * Returns the block height.
     */
    blockNum(): number;
    /**
     * Returns the chain commitment.
     */
    chainCommitment(): Word;
    /**
     * Returns the commitment to the block contents.
     */
    commitment(): Word;
    /**
     * Returns the account ID of the fungible faucet whose assets are accepted as the native
     * asset of the blockchain (i.e. the asset used for paying transaction verification fees).
     *
     * This is stored on-chain as part of the block's fee parameters, which means consumers can
     * discover the native faucet by reading any block header rather than hardcoding it per
     * network.
     */
    nativeAssetId(): AccountId;
    /**
     * Returns the note commitment root.
     */
    noteRoot(): Word;
    /**
     * Returns the nullifier root commitment.
     */
    nullifierRoot(): Word;
    /**
     * Returns the commitment of the previous block.
     */
    prevBlockCommitment(): Word;
    /**
     * Returns the proof commitment.
     */
    proofCommitment(): Word;
    /**
     * Returns the commitment to block metadata.
     */
    subCommitment(): Word;
    /**
     * Returns the block timestamp.
     */
    timestamp(): number;
    /**
     * Returns the transaction commitment.
     */
    txCommitment(): Word;
    /**
     * Returns the transaction kernel commitment.
     */
    txKernelCommitment(): Word;
    /**
     * Returns the header version.
     */
    version(): number;
}

/**
 * Utility for linking libraries and compiling transaction/note scripts.
 */
export class CodeBuilder {
    private constructor();
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Given a Library Path, and a source code, turn it into a Library.
     * E.g. A path library can be `miden::my_contract`. When turned into a library,
     * this can be used from another script with an import statement, following the
     * previous example: `use miden::my_contract'.
     */
    buildLibrary(library_path: string, source_code: string): Library;
    /**
     * Given an `AccountComponentCode`, compiles it
     * with the available modules under this builder. Returns the compiled account component code.
     */
    compileAccountComponentCode(account_code: string): AccountComponentCode;
    /**
     * Given a Note Script's source code, compiles it with the available
     * modules under this builder. Returns the compiled script.
     */
    compileNoteScript(program: string): NoteScript;
    /**
     * Given a Transaction Script's source code, compiles it with the available
     * modules under this builder. Returns the compiled script.
     */
    compileTxScript(tx_script: string): TransactionScript;
    /**
     * This is useful to dynamically link the {@link Library} of a foreign account
     * that is invoked using foreign procedure invocation (FPI). Its code is available
     * on-chain and so it does not have to be copied into the script code.
     *
     * For all other use cases not involving FPI, link the library statically.
     * Receives as argument the library to be linked.
     */
    linkDynamicLibrary(library: Library): void;
    /**
     * Given a module path (something like `my_lib::module`) and source code, this will
     * statically link it for use with scripts to be built with this builder.
     */
    linkModule(module_path: string, module_code: string): void;
    /**
     * Statically links the given library.
     *
     * Static linking means the library code is copied into the script code.
     * Use this for most libraries that are not available on-chain.
     *
     * Receives as argument the library to link.
     */
    linkStaticLibrary(library: Library): void;
}

/**
 * Represents a note committed on chain.
 */
export class CommittedNote {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the full note metadata when the attachment payload is available.
     */
    fullMetadata(): NoteMetadata | undefined;
    /**
     * Returns the inclusion path for the note in the block's note tree.
     */
    inclusionPath(): SparseMerklePath;
    /**
     * Returns the inclusion proof for this note.
     */
    inclusionProof(): NoteInclusionProof;
    /**
     * Returns the note metadata.
     *
     * If only metadata headers are available, the returned metadata contains
     * the sender, note type, and tag without attachment payload.
     */
    metadata(): NoteMetadata;
    /**
     * Returns the note ID.
     */
    noteId(): NoteId;
    /**
     * Returns the note index in the block's note tree.
     */
    noteIndex(): number;
    /**
     * Returns the note type (public, private, etc.).
     */
    noteType(): NoteType;
    /**
     * Returns the note sender, even when only header metadata is available.
     */
    sender(): AccountId;
    /**
     * Returns the note tag.
     */
    tag(): number;
}

/**
 * Input note record annotated with consumption conditions.
 */
export class ConsumableNoteRecord {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the underlying input note record.
     */
    inputNoteRecord(): InputNoteRecord;
    /**
     * Creates a new consumable note record from an input note record and consumability metadata.
     */
    constructor(input_note_record: InputNoteRecord, note_consumability: NoteConsumability[]);
    /**
     * Returns the consumability entries.
     */
    noteConsumability(): NoteConsumability[];
}

/**
 * The `Endpoint` struct represents a network endpoint, consisting of a protocol, a host, and a
 * port.
 *
 * This struct is used to define the address of a Miden node that the client will connect to.
 */
export class Endpoint {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the endpoint for the Miden devnet.
     */
    static devnet(): Endpoint;
    /**
     * Returns the endpoint for a local Miden node.
     *
     * Uses <http://localhost:57291>
     */
    static localhost(): Endpoint;
    /**
     * Creates an endpoint from a URL string.
     *
     * @param url - The URL string (e.g., <https://localhost:57291>)
     * @throws throws an error if the URL is invalid
     */
    constructor(url: string);
    /**
     * Returns the endpoint for the Miden testnet.
     */
    static testnet(): Endpoint;
    /**
     * Returns the string representation of the endpoint.
     */
    toString(): string;
    /**
     * Returns the host of the endpoint.
     */
    readonly host: string;
    /**
     * Returns the port of the endpoint.
     */
    readonly port: number | undefined;
    /**
     * Returns the protocol of the endpoint.
     */
    readonly protocol: string;
}

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
export class ExecutedTransaction {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account delta resulting from execution.
     */
    accountDelta(): AccountDelta;
    /**
     * Returns the account the transaction was executed against.
     */
    accountId(): AccountId;
    /**
     * Returns the block header that included the transaction.
     */
    blockHeader(): BlockHeader;
    /**
     * Returns the final account header after execution.
     */
    finalAccountHeader(): AccountHeader;
    /**
     * Returns the transaction ID.
     */
    id(): TransactionId;
    /**
     * Returns the initial account header before execution.
     */
    initialAccountHeader(): AccountHeader;
    /**
     * Returns the input notes consumed by the transaction.
     */
    inputNotes(): InputNotes;
    /**
     * Returns the output notes produced by the transaction.
     */
    outputNotes(): OutputNotes;
    /**
     * Returns the arguments passed to the transaction script.
     */
    txArgs(): TransactionArgs;
}

/**
 * Field element wrapper exposed to JavaScript.
 */
export class Felt {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the integer representation of the field element.
     */
    asInt(): bigint;
    /**
     * Creates a new field element from a u64 value.
     */
    constructor(value: bigint);
    /**
     * Returns the string representation of the field element.
     */
    toString(): string;
}

export class FeltArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): Felt;
    length(): number;
    constructor(elements?: Felt[] | null);
    push(element: Felt): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: Felt): void;
}

/**
 * Account details returned by the node.
 */
export class FetchedAccount {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the full account data when the account is public.
     */
    account(): Account | undefined;
    /**
     * Returns the account ID.
     */
    accountId(): AccountId;
    /**
     * Returns the account commitment reported by the node.
     */
    commitment(): Word;
    /**
     * Returns true when the account is a network account.
     */
    isNetwork(): boolean;
    /**
     * Returns true when the account is private.
     */
    isPrivate(): boolean;
    /**
     * Returns true when the account is public.
     */
    isPublic(): boolean;
    /**
     * Returns the last block height where the account was updated.
     */
    lastBlockNum(): number;
}

/**
 * Wrapper for a note fetched over RPC.
 *
 * It contains the note header and inclusion proof. The note details are only present for
 * public notes.
 */
export class FetchedNote {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns an [`InputNote`] when the fetched note is public.
     *
     * Returns `undefined` when the note body is missing (e.g. private notes); in that case build
     * an `InputNote` manually using the inclusion proof and note data obtained elsewhere.
     */
    asInputNote(): InputNote | undefined;
    /**
     * Create a `FetchedNote` with an optional [`Note`].
     */
    constructor(note_id: NoteId, metadata: NoteMetadata, inclusion_proof: NoteInclusionProof, note?: Note | null);
    /**
     * The note's header, containing the ID and metadata.
     */
    readonly header: NoteHeader;
    /**
     * The note's inclusion proof.
     *
     * Contains the data required to prove inclusion of the note in the canonical chain.
     */
    readonly inclusionProof: NoteInclusionProof;
    /**
     * The note's metadata, including sender, tag, and other properties.
     * Available for both private and public notes.
     */
    readonly metadata: NoteMetadata;
    /**
     * The full [`Note`] data.
     *
     * For public notes, it contains the complete note data.
     * For private notes, it will be undefined.
     */
    readonly note: Note | undefined;
    /**
     * The unique identifier of the note.
     */
    readonly noteId: NoteId;
    /**
     * Returns whether the note is private, encrypted, or public.
     */
    readonly noteType: NoteType;
}

export class FlattenedU8Vec {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    data(): Uint8Array;
    lengths(): Uint32Array;
    num_inner_vecs(): number;
}

/**
 * Description of a foreign account referenced by a transaction.
 */
export class ForeignAccount {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the ID of the foreign account.
     */
    account_id(): AccountId;
    /**
     * Creates a foreign account entry for a public account with given storage requirements.
     */
    static public(account_id: AccountId, storage_requirements: AccountStorageRequirements): ForeignAccount;
    /**
     * Returns the required storage slots/keys for this foreign account.
     */
    storage_slot_requirements(): AccountStorageRequirements;
}

export class ForeignAccountArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): ForeignAccount;
    length(): number;
    constructor(elements?: ForeignAccount[] | null);
    push(element: ForeignAccount): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: ForeignAccount): void;
}

/**
 * A fungible asset.
 *
 * A fungible asset consists of a faucet ID of the faucet which issued the asset as well as the
 * asset amount. Asset amount is guaranteed to be 2^63 - 1 or smaller.
 */
export class FungibleAsset {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the amount of fungible units.
     */
    amount(): bigint;
    /**
     * Returns the faucet account that minted this asset.
     */
    faucetId(): AccountId;
    /**
     * Encodes this asset into the word layout used in the vault.
     */
    intoWord(): Word;
    /**
     * Creates a fungible asset for the given faucet and amount.
     */
    constructor(faucet_id: AccountId, amount: bigint);
}

/**
 * Aggregated fungible deltas keyed by faucet ID.
 */
export class FungibleAssetDelta {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the delta amount for a given faucet, if present.
     */
    amount(faucet_id: AccountId): bigint | undefined;
    /**
     * Returns all fungible asset deltas as a list.
     */
    assets(): FungibleAssetDeltaItem[];
    /**
     * Deserializes a fungible delta from bytes.
     */
    static deserialize(bytes: Uint8Array): FungibleAssetDelta;
    /**
     * Returns true if no fungible assets are affected.
     */
    isEmpty(): boolean;
    /**
     * Returns the number of distinct fungible assets in the delta.
     */
    numAssets(): number;
    /**
     * Serializes the fungible delta into bytes.
     */
    serialize(): Uint8Array;
}

/**
 * A single fungible asset change in the vault delta.
 */
export class FungibleAssetDeltaItem {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the signed amount change (positive adds assets, negative removes).
     */
    readonly amount: bigint;
    /**
     * Returns the faucet ID this delta refers to.
     */
    readonly faucetId: AccountId;
}

/**
 * Procedure digest paired with whether it is an auth procedure.
 */
export class GetProceduresResultItem {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the MAST root digest for the procedure.
     */
    readonly digest: Word;
    /**
     * Returns true if the procedure is used for authentication.
     */
    readonly isAuth: boolean;
}

/**
 * Note supplied as an input to a transaction, optionally with authentication data.
 */
export class InputNote {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates an authenticated input note from a note and its inclusion proof.
     *
     * An authenticated note has a proof of inclusion in the block's note tree,
     * which is required for consuming the note in a transaction.
     */
    static authenticated(note: Note, inclusion_proof: NoteInclusionProof): InputNote;
    /**
     * Returns the commitment to the note ID and metadata.
     */
    commitment(): Word;
    /**
     * Returns the identifier of the input note.
     */
    id(): NoteId;
    /**
     * Returns the note's location within the commitment tree when available.
     */
    location(): NoteLocation | undefined;
    /**
     * Returns the underlying note contents.
     */
    note(): Note;
    /**
     * Returns the inclusion proof if the note is authenticated.
     */
    proof(): NoteInclusionProof | undefined;
    /**
     * Creates an unauthenticated input note from note details.
     *
     * An unauthenticated note can be consumed in a transaction as long as the note exists in the
     * network as of the transaction batch in which the consume transaction is included.
     */
    static unauthenticated(note: Note): InputNote;
}

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
export class InputNoteRecord {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the note commitment (id + metadata), if available.
     */
    commitment(): Word | undefined;
    /**
     * Returns the transaction ID that consumed this note, if any.
     */
    consumerTransactionId(): string | undefined;
    /**
     * Returns the note details, if present.
     */
    details(): NoteDetails;
    /**
     * Returns the note ID.
     */
    id(): NoteId;
    /**
     * Returns the inclusion proof when the note is authenticated.
     */
    inclusionProof(): NoteInclusionProof | undefined;
    /**
     * Returns true if the record contains authentication data (proof).
     */
    isAuthenticated(): boolean;
    /**
     * Returns true if the note has already been consumed.
     */
    isConsumed(): boolean;
    /**
     * Returns true if the note is currently being processed.
     */
    isProcessing(): boolean;
    /**
     * Returns the note metadata if available.
     */
    metadata(): NoteMetadata | undefined;
    /**
     * Returns the nullifier for this note.
     */
    nullifier(): string;
    /**
     * Returns the current processing state for this note.
     */
    state(): InputNoteState;
    /**
     * Converts the record into an `InputNote` (including proof when available).
     */
    toInputNote(): InputNote;
    /**
     * Converts the record into a `Note` (including proof when available).
     */
    toNote(): Note;
}

export enum InputNoteState {
    Expected = 0,
    Unverified = 1,
    Committed = 2,
    Invalid = 3,
    ProcessingAuthenticated = 4,
    ProcessingUnauthenticated = 5,
    ConsumedAuthenticatedLocal = 6,
    ConsumedUnauthenticatedLocal = 7,
    ConsumedExternal = 8,
}

/**
 * Input notes for a transaction, empty if the transaction does not consume notes.
 */
export class InputNotes {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the commitment to all input notes.
     */
    commitment(): Word;
    /**
     * Returns the input note at the specified index.
     */
    getNote(index: number): InputNote;
    /**
     * Returns true if there are no input notes.
     */
    isEmpty(): boolean;
    /**
     * Returns all input notes as a vector.
     */
    notes(): InputNote[];
    /**
     * Returns the number of input notes.
     */
    numNotes(): number;
}

export class IntoUnderlyingByteSource {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(): void;
    pull(controller: ReadableByteStreamController): Promise<any>;
    start(controller: ReadableByteStreamController): void;
    readonly autoAllocateChunkSize: number;
    readonly type: ReadableStreamType;
}

export class IntoUnderlyingSink {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    abort(reason: any): Promise<any>;
    close(): Promise<any>;
    write(chunk: any): Promise<any>;
}

export class IntoUnderlyingSource {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(): void;
    pull(controller: ReadableStreamDefaultController): Promise<any>;
}

/**
 * Represents an update to a single account's state.
 */
export class JsAccountUpdate {
    private constructor();
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The cryptographic commitment representing this account's current state.
     */
    accountCommitment: string;
    /**
     * ID for this account.
     */
    accountId: string;
    /**
     * Optional seed data for the account.
     */
    get accountSeed(): Uint8Array | undefined;
    /**
     * Optional seed data for the account.
     */
    set accountSeed(value: Uint8Array | null | undefined);
    /**
     * The account's asset vault.
     */
    assets: JsVaultAsset[];
    /**
     * The merkle root of the account's executable code.
     */
    codeRoot: string;
    /**
     * Whether this account update has been committed.
     */
    committed: boolean;
    /**
     * The account's transaction nonce as a string.
     */
    nonce: string;
    /**
     * Serialized storage map entries for this account.
     */
    storageMapEntries: JsStorageMapEntry[];
    /**
     * The merkle root of the account's storage trie.
     */
    storageRoot: string;
    /**
     * Serialized storage slot data for this account.
     */
    storageSlots: JsStorageSlot[];
    /**
     * The merkle root of the account's asset vault.
     */
    vaultRoot: string;
}

/**
 * An object that contains data for a sync update,
 * which will be received by the applyStateSync JS function.
 * under sync.js
 */
export class JsStateSyncUpdate {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Account state updates included in this sync.
     */
    accountUpdates: JsAccountUpdate[];
    /**
     * For each block in this update, stores a boolean (as u8) indicating whether
     * that block contains notes relevant to this client. Index i corresponds to
     * the ith block, with 1 meaning relevant and 0 meaning not relevant.
     */
    blockHasRelevantNotes: Uint8Array;
    /**
     * The block number for this update.
     */
    blockNum: number;
    /**
     * IDs of note tags that should be removed from the client's local state.
     */
    committedNoteIds: string[];
    /**
     * The new block headers for this state update, serialized into a flattened byte array.
     */
    flattenedNewBlockHeaders: FlattenedU8Vec;
    /**
     * Flattened byte array containing partial blockchain peaks used for merkle tree
     * verification.
     */
    flattenedPartialBlockChainPeaks: FlattenedU8Vec;
    /**
     * The block numbers corresponding to each header in `flattened_new_block_headers`.
     * This vec should have the same length as the number of headers, with each index
     * representing the block number for the header at that same index.
     */
    newBlockNums: Uint32Array;
    /**
     * Input notes for this state update in serialized form.
     */
    serializedInputNotes: SerializedInputNoteData[];
    /**
     * Serialized IDs for new authentication nodes required to verify block headers.
     */
    serializedNodeIds: string[];
    /**
     * The actual authentication node data corresponding to the IDs above.
     */
    serializedNodes: string[];
    /**
     * Output notes created in this state update in serialized form.
     */
    serializedOutputNotes: SerializedOutputNoteData[];
    /**
     * Transaction data for transactions included in this update.
     */
    transactionUpdates: SerializedTransactionData[];
}

/**
 * A JavaScript representation of a storage map entry in an account.
 */
export class JsStorageMapEntry {
    private constructor();
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The key of the storage map entry.
     */
    key: string;
    /**
     * The slot name of the map this entry belongs to.
     */
    slotName: string;
    /**
     * The value of the storage map entry.
     */
    value: string;
}

/**
 * A JavaScript representation of a storage slot in an account.
 */
export class JsStorageSlot {
    private constructor();
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The name of the storage slot.
     */
    slotName: string;
    /**
     * The type of the storage slot.
     */
    slotType: number;
    /**
     * The value stored in the storage slot.
     */
    slotValue: string;
}

/**
 * An object that contains a serialized vault asset.
 */
export class JsVaultAsset {
    private constructor();
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Word representing the asset.
     */
    asset: string;
    /**
     * The vault key associated with the asset.
     */
    vaultKey: string;
}

export class Library {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
}

/**
 * Represents a Merkle path.
 */
export class MerklePath {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Computes the root given a leaf index and value.
     */
    computeRoot(index: bigint, node: Word): Word;
    /**
     * Returns the depth of the path.
     */
    depth(): number;
    /**
     * Returns the nodes that make up the path.
     */
    nodes(): Word[];
    /**
     * Verifies the path against a root.
     */
    verify(index: bigint, node: Word, root: Word): boolean;
}

/**
 * The identifier of a Miden network.
 */
export class NetworkId {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Builds a custom network ID from a provided custom prefix.
     *
     * Returns an error if the prefix is invalid.
     */
    static custom(custom_prefix: string): NetworkId;
    static devnet(): NetworkId;
    static mainnet(): NetworkId;
    static testnet(): NetworkId;
}

/**
 * The type of a Miden network.
 */
export enum NetworkType {
    /**
     * Main network prefix (`mm`).
     */
    Mainnet = 0,
    /**
     * Public test network prefix (`mtst`).
     */
    Testnet = 1,
    /**
     * Developer network prefix (`mdev`).
     */
    Devnet = 2,
    /**
     * Custom network prefix.
     */
    Custom = 3,
}

/**
 * A note bundles public metadata with private details: assets, script, inputs, and a serial number
 * grouped into a recipient. The public identifier (`NoteId`) commits to those
 * details, while the nullifier stays hidden until the note is consumed. Assets move by
 * transferring them into the note; the script and inputs define how and when consumption can
 * happen. See `NoteRecipient` for the shape of the recipient data.
 */
export class Note {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the assets locked inside the note.
     */
    assets(): NoteAssets;
    /**
     * Returns the commitment to the note ID and metadata.
     */
    commitment(): Word;
    /**
     * Builds a P2IDE note that can be reclaimed or timelocked based on block heights.
     */
    static createP2IDENote(sender: AccountId, target: AccountId, assets: NoteAssets, reclaim_height: number | null | undefined, timelock_height: number | null | undefined, note_type: NoteType, attachment: NoteAttachment): Note;
    /**
     * Builds a standard P2ID note that targets the specified account.
     */
    static createP2IDNote(sender: AccountId, target: AccountId, assets: NoteAssets, note_type: NoteType, attachment: NoteAttachment): Note;
    /**
     * Deserializes a note from its byte representation.
     */
    static deserialize(bytes: Uint8Array): Note;
    /**
     * Returns the unique identifier of the note.
     */
    id(): NoteId;
    /**
     * Returns the public metadata associated with the note.
     */
    metadata(): NoteMetadata;
    /**
     * Creates a new note from the provided assets, metadata, and recipient.
     */
    constructor(note_assets: NoteAssets, note_metadata: NoteMetadata, note_recipient: NoteRecipient);
    /**
     * Returns the note nullifier as a word.
     */
    nullifier(): Word;
    /**
     * Returns the recipient who can consume this note.
     */
    recipient(): NoteRecipient;
    /**
     * Returns the script that guards the note.
     */
    script(): NoteScript;
    /**
     * Serializes the note into bytes.
     */
    serialize(): Uint8Array;
}

export class NoteAndArgs {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a new note/args pair for transaction building.
     */
    constructor(note: Note, args?: Word | null);
}

export class NoteAndArgsArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): NoteAndArgs;
    length(): number;
    constructor(elements?: NoteAndArgs[] | null);
    push(element: NoteAndArgs): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: NoteAndArgs): void;
}

export class NoteArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): Note;
    length(): number;
    constructor(elements?: Note[] | null);
    push(element: Note): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: Note): void;
}

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
export class NoteAssets {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns all fungible assets contained in the note.
     */
    fungibleAssets(): FungibleAsset[];
    /**
     * Creates a new asset list for a note.
     */
    constructor(assets_array?: FungibleAsset[] | null);
    /**
     * Adds a fungible asset to the collection.
     */
    push(asset: FungibleAsset): void;
}

/**
 * An attachment to a note.
 *
 * Note attachments provide additional context about how notes should be processed.
 * For example, a network account target attachment indicates that the note should
 * be consumed by a specific network account.
 */
export class NoteAttachment {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the content as an array of Felts if the attachment kind is Array, otherwise None.
     */
    asArray(): FeltArray | undefined;
    /**
     * Returns the content as a Word if the attachment kind is Word, otherwise None.
     */
    asWord(): Word | undefined;
    /**
     * Returns the attachment kind.
     */
    attachmentKind(): NoteAttachmentKind;
    /**
     * Returns the attachment scheme.
     */
    attachmentScheme(): NoteAttachmentScheme;
    /**
     * Creates a default (empty) note attachment.
     */
    constructor();
    /**
     * Creates a new note attachment with Array content from the provided elements.
     */
    static newArray(scheme: NoteAttachmentScheme, elements: FeltArray): NoteAttachment;
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
     */
    static newNetworkAccountTarget(target_id: AccountId, exec_hint: NoteExecutionHint): NoteAttachment;
    /**
     * Creates a new note attachment with Word content from the provided word.
     */
    static newWord(scheme: NoteAttachmentScheme, word: Word): NoteAttachment;
}

/**
 * Defines the payload shape of a note attachment.
 */
export enum NoteAttachmentKind {
    None = 0,
    Word = 1,
    Array = 2,
}

/**
 * Describes the type of a note attachment.
 *
 * Value `0` is reserved to signal that the scheme is none or absent. Whenever the kind of
 * attachment is not standardized or interoperability is unimportant, this none value can be used.
 */
export class NoteAttachmentScheme {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the note attachment scheme as a u32.
     */
    asU32(): number;
    /**
     * Returns true if the attachment scheme is the reserved value that signals an absent scheme.
     */
    isNone(): boolean;
    /**
     * Creates a new `NoteAttachmentScheme` from a u32.
     */
    constructor(scheme: number);
    /**
     * Returns the `NoteAttachmentScheme` that signals the absence of an attachment scheme.
     */
    static none(): NoteAttachmentScheme;
}

export class NoteConsumability {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account that can consume the note.
     */
    accountId(): AccountId;
    /**
     * Returns the consumption status of the note.
     */
    consumptionStatus(): NoteConsumptionStatus;
}

/**
 * Describes if a note could be consumed under a specific conditions: target account state and
 * block height.
 */
export class NoteConsumptionStatus {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Constructs a `NoteConsumptionStatus` that is consumable.
     */
    static consumable(): NoteConsumptionStatus;
    /**
     * Constructs a `NoteConsumptionStatus` that is consumable after a specific block height.
     */
    static consumableAfter(block_height: number): NoteConsumptionStatus;
    /**
     * Returns the block number at which the note can be consumed.
     * Returns None if the note is already consumable or never possible
     */
    consumableAfterBlock(): number | undefined;
    /**
     * Constructs a `NoteConsumptionStatus` that is consumable with authorization.
     */
    static consumableWithAuthorization(): NoteConsumptionStatus;
    /**
     * Constructs a `NoteConsumptionStatus` that is never consumable.
     */
    static neverConsumable(err: string): NoteConsumptionStatus;
    /**
     * Constructs a `NoteConsumptionStatus` that is unconsumable due to conditions.
     */
    static unconsumableConditions(): NoteConsumptionStatus;
}

/**
 * Details of a note consisting of assets, script, inputs, and a serial number.
 *
 * See the {@link Note} type for more details.
 */
export class NoteDetails {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the assets locked by the note.
     */
    assets(): NoteAssets;
    /**
     * Returns the note identifier derived from these details.
     */
    id(): NoteId;
    /**
     * Creates a new set of note details from the given assets and recipient.
     */
    constructor(note_assets: NoteAssets, note_recipient: NoteRecipient);
    /**
     * Returns the note nullifier as a word.
     */
    nullifier(): Word;
    /**
     * Returns the recipient which controls when the note can be consumed.
     */
    recipient(): NoteRecipient;
}

/**
 * Pair of note details and tag used when declaring expected notes.
 */
export class NoteDetailsAndTag {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a new pair from note details and tag.
     */
    constructor(note_details: NoteDetails, tag: NoteTag);
    /**
     * Returns the note details.
     */
    readonly noteDetails: NoteDetails;
    /**
     * Returns the note tag.
     */
    readonly tag: NoteTag;
}

export class NoteDetailsAndTagArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): NoteDetailsAndTag;
    length(): number;
    constructor(elements?: NoteDetailsAndTag[] | null);
    push(element: NoteDetailsAndTag): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: NoteDetailsAndTag): void;
}

/**
 * Hint describing when a note can be consumed.
 */
export class NoteExecutionHint {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a hint that activates after the given block number.
     */
    static afterBlock(block_num: number): NoteExecutionHint;
    /**
     * Creates a hint indicating the note can always be consumed.
     */
    static always(): NoteExecutionHint;
    /**
     * Returns whether the note can be consumed at the provided block height.
     */
    canBeConsumed(block_num: number): boolean;
    /**
     * Reconstructs a hint from its encoded tag and payload.
     */
    static fromParts(tag: number, payload: number): NoteExecutionHint;
    /**
     * Creates a hint that does not specify any execution constraint.
     */
    static none(): NoteExecutionHint;
    /**
     * Creates a hint that allows execution in a specific slot of a round.
     */
    static onBlockSlot(epoch_len: number, slot_len: number, slot_offset: number): NoteExecutionHint;
}

export enum NoteExportFormat {
    Id = 0,
    Full = 1,
    Details = 2,
}

/**
 * A serialized representation of a note.
 */
export class NoteFile {
    private constructor();
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the after-block hint when present.
     */
    afterBlockNum(): number | undefined;
    /**
     * Given a valid byte representation of a `NoteFile`,
     * return it as a struct.
     */
    static deserialize(bytes: Uint8Array): NoteFile;
    /**
     * Creates a `NoteFile` from an input note, preserving proof when available.
     */
    static fromInputNote(note: InputNote): NoteFile;
    /**
     * Creates a `NoteFile` from note details.
     */
    static fromNoteDetails(note_details: NoteDetails): NoteFile;
    /**
     * Creates a `NoteFile` from a note ID.
     */
    static fromNoteId(note_details: NoteId): NoteFile;
    /**
     * Creates a `NoteFile` from an output note, choosing details when present.
     */
    static fromOutputNote(note: OutputNote): NoteFile;
    /**
     * Returns the inclusion proof if present.
     */
    inclusionProof(): NoteInclusionProof | undefined;
    /**
     * Returns the full note when the file includes it.
     */
    note(): Note | undefined;
    /**
     * Returns the note details if present.
     */
    noteDetails(): NoteDetails | undefined;
    /**
     * Returns the note ID for any `NoteFile` variant.
     */
    noteId(): NoteId;
    /**
     * Returns the note tag hint when present.
     */
    noteTag(): NoteTag | undefined;
    /**
     * Returns this `NoteFile`'s types.
     */
    noteType(): string;
    /**
     * Returns the note nullifier when present.
     */
    nullifier(): string | undefined;
    /**
     * Turn a notefile into its byte representation.
     */
    serialize(): Uint8Array;
}

/**
 * Filter options for querying notes from the store.
 */
export class NoteFilter {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a new filter for the given type and optional note IDs.
     */
    constructor(note_type: NoteFilterTypes, note_ids?: NoteId[] | null);
}

export enum NoteFilterTypes {
    All = 0,
    Consumed = 1,
    Committed = 2,
    Expected = 3,
    Processing = 4,
    List = 5,
    Unique = 6,
    Nullifiers = 7,
    Unverified = 8,
}

/**
 * Holds the strictly required, public information of a note.
 *
 * See `NoteId` and `NoteMetadata` for additional details.
 */
export class NoteHeader {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the unique identifier for the note.
     */
    id(): NoteId;
    /**
     * Returns the public metadata attached to the note.
     */
    metadata(): NoteMetadata;
    /**
     * Returns a commitment to the note ID and metadata.
     */
    toCommitment(): Word;
}

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
export class NoteId {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Parses a note ID from its hex encoding.
     */
    static fromHex(hex: string): NoteId;
    /**
     * Builds a note ID from the recipient and asset commitments.
     */
    constructor(recipient_digest: Word, asset_commitment_digest: Word);
    /**
     * Returns the canonical hex representation of the note ID.
     */
    toString(): string;
}

/**
 * Note ID paired with optional arguments for inclusion in a transaction request.
 */
export class NoteIdAndArgs {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a new NoteId/args pair.
     */
    constructor(note_id: NoteId, args?: Word | null);
}

export class NoteIdAndArgsArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): NoteIdAndArgs;
    length(): number;
    constructor(elements?: NoteIdAndArgs[] | null);
    push(element: NoteIdAndArgs): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: NoteIdAndArgs): void;
}

/**
 * Contains the data required to prove inclusion of a note in the canonical chain.
 */
export class NoteInclusionProof {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the location of the note within the tree.
     */
    location(): NoteLocation;
    /**
     * Returns the Merkle authentication path for the note.
     */
    notePath(): MerklePath;
}

/**
 * Contains information about the location of a note.
 */
export class NoteLocation {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the index of the note leaf within the block's note tree.
     */
    blockNoteTreeIndex(): number;
    /**
     * Returns the block height containing the note.
     */
    blockNum(): number;
}

/**
 * Metadata associated with a note.
 *
 * This metadata includes the sender, note type, tag, and an optional attachment.
 * Attachments provide additional context about how notes should be processed.
 */
export class NoteMetadata {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the attachment of the note.
     */
    attachment(): NoteAttachment;
    /**
     * Creates metadata for a note.
     */
    constructor(sender: AccountId, note_type: NoteType, note_tag: NoteTag);
    /**
     * Returns whether the note is private, encrypted, or public.
     */
    noteType(): NoteType;
    /**
     * Returns the account that created the note.
     */
    sender(): AccountId;
    /**
     * Returns the tag associated with the note.
     */
    tag(): NoteTag;
    /**
     * Adds an attachment to this metadata and returns the updated metadata.
     *
     * Attachments provide additional context about how notes should be processed.
     * For example, a `NetworkAccountTarget` attachment indicates that the note
     * should be consumed by a specific network account.
     */
    withAttachment(attachment: NoteAttachment): NoteMetadata;
    /**
     * Sets the tag for this metadata and returns the updated metadata.
     */
    withTag(tag: NoteTag): NoteMetadata;
}

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
export class NoteRecipient {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the digest of the recipient data (used in the note commitment).
     */
    digest(): Word;
    /**
     * Creates a note recipient from its serial number, script, and storage.
     */
    constructor(serial_num: Word, note_script: NoteScript, storage: NoteStorage);
    /**
     * Returns the script that controls consumption.
     */
    script(): NoteScript;
    /**
     * Returns the serial number that prevents double spends.
     */
    serialNum(): Word;
    /**
     * Returns the storage provided to the script.
     */
    storage(): NoteStorage;
}

export class NoteRecipientArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): NoteRecipient;
    length(): number;
    constructor(elements?: NoteRecipient[] | null);
    push(element: NoteRecipient): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: NoteRecipient): void;
}

/**
 * An executable program of a note.
 *
 * A note's script represents a program which must be executed for a note to be consumed. As such
 * it defines the rules and side effects of consuming a given note.
 */
export class NoteScript {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Deserializes a script from bytes.
     */
    static deserialize(bytes: Uint8Array): NoteScript;
    /**
     * Creates a `NoteScript` from the given `Package`.
     * The package must contain a library with exactly one procedure annotated with
     * `@note_script`.
     */
    static fromPackage(_package: Package): NoteScript;
    /**
     * Returns the well-known P2ID script.
     */
    static p2id(): NoteScript;
    /**
     * Returns the well-known P2IDE script (P2ID with execution hint).
     */
    static p2ide(): NoteScript;
    /**
     * Returns the MAST root of this script.
     */
    root(): Word;
    /**
     * Serializes the script into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns the well-known SWAP script.
     */
    static swap(): NoteScript;
    /**
     * Pretty-prints the MAST source for this script.
     */
    toString(): string;
}

/**
 * A container for note storage items.
 *
 * A note can be associated with up to 1024 storage items. Each item is represented by a single
 * field element. Thus, note storage can contain up to ~8 KB of data.
 *
 * All storage items associated with a note can be reduced to a single commitment which is
 * computed as an RPO256 hash over the storage elements.
 */
export class NoteStorage {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the raw storage items as an array of field elements.
     */
    items(): Felt[];
    /**
     * Creates note storage from a list of field elements.
     */
    constructor(felt_array: FeltArray);
}

/**
 * Represents a single block's worth of note sync data.
 */
export class NoteSyncBlock {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the block header for this block.
     */
    blockHeader(): BlockHeader;
    /**
     * Returns the MMR path for the block header.
     */
    mmrPath(): MerklePath;
    /**
     * Returns the committed notes in this block.
     */
    notes(): CommittedNote[];
}

/**
 * Represents the response data from `syncNotes`.
 */
export class NoteSyncInfo {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the first block header associated with matching notes, if any.
     */
    blockHeader(): BlockHeader | undefined;
    /**
     * Returns the last block checked by the node. Used as a cursor for pagination.
     */
    blockTo(): number;
    /**
     * Returns the blocks containing matching notes.
     */
    blocks(): NoteSyncBlock[];
    /**
     * Returns the latest block number in the chain.
     */
    chainTip(): number;
    /**
     * Returns the first block MMR path associated with matching notes, if any.
     */
    mmrPath(): MerklePath | undefined;
    /**
     * Returns the committed notes across all matching blocks.
     */
    notes(): CommittedNote[];
}

/**
 * Note tags are 32-bits of data that serve as best-effort filters for notes.
 *
 * Tags enable quick lookups for notes related to particular use cases, scripts, or account
 * prefixes.
 */
export class NoteTag {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the inner u32 value of this tag.
     */
    asU32(): number;
    /**
     * Creates a new `NoteTag` from an arbitrary u32.
     */
    constructor(tag: number);
    /**
     * Constructs a note tag that targets the given account ID.
     */
    static withAccountTarget(account_id: AccountId): NoteTag;
    /**
     * Constructs a note tag that targets the given account ID with a custom tag length.
     */
    static withCustomAccountTarget(account_id: AccountId, tag_len: number): NoteTag;
}

/**
 * Visibility level for note contents when published to the network.
 */
export enum NoteType {
    /**
     * Notes with this type have only their hash published to the network.
     */
    Private = 2,
    /**
     * Notes with this type are fully shared with the network.
     */
    Public = 1,
}

/**
 * Representation of a note produced by a transaction (full or partial).
 */
export class OutputNote {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the assets if they are present.
     */
    assets(): NoteAssets | undefined;
    /**
     * Wraps a full note output.
     */
    static full(note: Note): OutputNote;
    /**
     * Returns the note ID for this output.
     */
    id(): NoteId;
    /**
     * Converts into a full note if the data is present.
     */
    intoFull(): Note | undefined;
    /**
     * Returns the metadata that accompanies this output.
     */
    metadata(): NoteMetadata;
    /**
     * Wraps a partial note containing assets and recipient only.
     */
    static partial(partial_note: PartialNote): OutputNote;
    /**
     * Returns the recipient digest.
     */
    recipientDigest(): Word;
}

export class OutputNoteArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): OutputNote;
    length(): number;
    constructor(elements?: OutputNote[] | null);
    push(element: OutputNote): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: OutputNote): void;
}

/**
 * Represents an output note tracked by the client store.
 */
export class OutputNoteRecord {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the note assets.
     */
    assets(): NoteAssets;
    /**
     * Returns the expected block height for the note.
     */
    expectedHeight(): number;
    /**
     * Returns the note ID.
     */
    id(): NoteId;
    /**
     * Returns the inclusion proof when the note is committed.
     */
    inclusionProof(): NoteInclusionProof | undefined;
    /**
     * Returns true if the note is committed on chain.
     */
    isCommitted(): boolean;
    /**
     * Returns true if the note has been consumed on chain.
     */
    isConsumed(): boolean;
    /**
     * Returns the note metadata.
     */
    metadata(): NoteMetadata;
    /**
     * Returns the nullifier when the recipient is known.
     */
    nullifier(): string | undefined;
    /**
     * Returns the recipient details if available.
     */
    recipient(): NoteRecipient | undefined;
    /**
     * Returns the recipient digest committed for the note.
     */
    recipientDigest(): Word;
    /**
     * Returns the current processing state for this note.
     */
    state(): OutputNoteState;
}

export enum OutputNoteState {
    ExpectedPartial = 0,
    ExpectedFull = 1,
    CommittedPartial = 2,
    CommittedFull = 3,
    Consumed = 4,
}

/**
 * Contains a list of output notes of a transaction. The list can be empty if the transaction does
 * not produce any notes.
 */
export class OutputNotes {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the commitment to all output notes.
     */
    commitment(): Word;
    /**
     * Returns the output note at the specified index.
     */
    getNote(index: number): OutputNote;
    /**
     * Returns true if there are no output notes.
     */
    isEmpty(): boolean;
    /**
     * Returns all output notes as a vector.
     */
    notes(): OutputNote[];
    /**
     * Returns the number of notes emitted.
     */
    numNotes(): number;
}

/**
 * Compiled VM package containing libraries and metadata.
 */
export class Package {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the underlying library of a `Package`.
     * Fails if the package is not a library.
     */
    asLibrary(): Library;
    /**
     * Returns the underlying program of a `Package`.
     * Fails if the package is not a program.
     */
    asProgram(): Program;
    /**
     * Deserializes a package from bytes.
     */
    static deserialize(bytes: Uint8Array): Package;
    /**
     * Serializes the package into bytes.
     */
    serialize(): Uint8Array;
}

/**
 * Partial information about a note.
 *
 * Partial note consists of `NoteMetadata`, `NoteAssets`, and a recipient digest (see
 * `NoteRecipient`). However, it does not contain detailed recipient info, including
 * note script, note inputs, and note's serial number. This means that a partial note is sufficient
 * to compute note ID and note header, but not sufficient to compute note nullifier, and generally
 * does not have enough info to execute the note.
 */
export class PartialNote {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the assets locked in the note.
     */
    assets(): NoteAssets;
    /**
     * Returns the identifier of the partial note.
     */
    id(): NoteId;
    /**
     * Returns the metadata attached to the note.
     */
    metadata(): NoteMetadata;
    /**
     * Returns the digest of the recipient information.
     */
    recipientDigest(): Word;
}

/**
 * Poseidon2 hashing helpers exposed to JavaScript.
 */
export class Poseidon2 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Computes a Poseidon2 digest from the provided field elements.
     */
    static hashElements(felt_array: FeltArray): Word;
}

export class ProcedureThreshold {
    free(): void;
    [Symbol.dispose](): void;
    constructor(proc_root: Word, threshold: number);
    readonly procRoot: Word;
    readonly threshold: number;
}

export class Program {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
}

/**
 * Result of executing and proving a transaction. Contains all the data required to verify that a
 * transaction was executed correctly.
 */
export class ProvenTransaction {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account ID the transaction was executed against.
     */
    accountId(): AccountId;
    /**
     * Deserializes a proven transaction from bytes.
     */
    static deserialize(bytes: Uint8Array): ProvenTransaction;
    /**
     * Returns the block number at which the transaction expires.
     */
    expirationBlockNumber(): number;
    /**
     * Returns the transaction ID.
     */
    id(): TransactionId;
    /**
     * Returns the nullifiers of the consumed input notes.
     */
    nullifiers(): Word[];
    /**
     * Returns the commitment of the reference block.
     */
    refBlockCommitment(): Word;
    /**
     * Returns the reference block number used during execution.
     */
    refBlockNumber(): number;
    /**
     * Serializes the proven transaction into bytes.
     */
    serialize(): Uint8Array;
}

export class PublicKey {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Deserializes a public key from bytes.
     */
    static deserialize(bytes: Uint8Array): PublicKey;
    /**
     * Recovers a public key from a signature (only supported for `RpoFalcon512`).
     */
    static recoverFrom(message: Word, signature: Signature): PublicKey;
    /**
     * Serializes the public key into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns the commitment corresponding to this public key.
     */
    toCommitment(): Word;
    /**
     * Verifies a blind message word against the signature.
     */
    verify(message: Word, signature: Signature): boolean;
    /**
     * Verifies a signature over arbitrary signing inputs.
     */
    verifyData(signing_inputs: SigningInputs, signature: Signature): boolean;
}

/**
 * RPC Client for interacting with Miden nodes directly.
 */
export class RpcClient {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Fetches account details for a specific account ID.
     */
    getAccountDetails(account_id: AccountId): Promise<FetchedAccount>;
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
     */
    getAccountProof(account_id: AccountId, storage_requirements?: AccountStorageRequirements | null, block_num?: number | null, known_vault_commitment?: Word | null): Promise<AccountProof>;
    /**
     * Fetches a block header by number. When `block_num` is undefined, returns the latest header.
     */
    getBlockHeaderByNumber(block_num?: number | null): Promise<BlockHeader>;
    /**
     * Fetches a note script by its root hash from the connected Miden node.
     *
     * @param script_root - The root hash of the note script to fetch.
     * @returns Promise that resolves to the `NoteScript`.
     */
    getNoteScriptByRoot(script_root: Word): Promise<NoteScript>;
    /**
     * Fetches notes by their IDs from the connected Miden node.
     *
     * @param note_ids - Array of [`NoteId`] objects to fetch
     * @returns Promise that resolves to different data depending on the note type:
     * - Private notes: Returns the `noteHeader`, and the  `inclusionProof`. The `note` field will
     *   be `null`.
     * - Public notes: Returns the full `note` with `inclusionProof`, alongside its header.
     */
    getNotesById(note_ids: NoteId[]): Promise<FetchedNote[]>;
    /**
     * Fetches the block height at which a nullifier was committed, if any.
     */
    getNullifierCommitHeight(nullifier: Word, block_num: number): Promise<number | undefined>;
    /**
     * Creates a new RPC client instance.
     *
     * @param endpoint - Endpoint to connect to.
     */
    constructor(endpoint: Endpoint);
    /**
     * Fetches notes matching the provided tags from the node.
     */
    syncNotes(block_num: number, block_to: number | null | undefined, note_tags: NoteTag[]): Promise<NoteSyncInfo>;
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
     */
    syncStorageMaps(block_from: number, block_to: number | null | undefined, account_id: AccountId): Promise<StorageMapInfo>;
}

/**
 * RPO256 hashing helpers exposed to JavaScript.
 */
export class Rpo256 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Computes an RPO256 digest from the provided field elements.
     */
    static hashElements(felt_array: FeltArray): Word;
}

export class SerializedInputNoteData {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    get consumedBlockHeight(): number | undefined;
    set consumedBlockHeight(value: number | null | undefined);
    get consumedTxOrder(): number | undefined;
    set consumedTxOrder(value: number | null | undefined);
    get consumerAccountId(): string | undefined;
    set consumerAccountId(value: string | null | undefined);
    createdAt: string;
    inputs: Uint8Array;
    noteAssets: Uint8Array;
    noteId: string;
    noteScriptRoot: string;
    noteScript: Uint8Array;
    nullifier: string;
    serialNumber: Uint8Array;
    stateDiscriminant: number;
    state: Uint8Array;
}

export class SerializedOutputNoteData {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    expectedHeight: number;
    metadata: Uint8Array;
    noteAssets: Uint8Array;
    noteId: string;
    get nullifier(): string | undefined;
    set nullifier(value: string | null | undefined);
    recipientDigest: string;
    stateDiscriminant: number;
    state: Uint8Array;
}

export class SerializedTransactionData {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    blockNum: number;
    details: Uint8Array;
    id: string;
    get scriptRoot(): Uint8Array | undefined;
    set scriptRoot(value: Uint8Array | null | undefined);
    statusVariant: number;
    status: Uint8Array;
    get txScript(): Uint8Array | undefined;
    set txScript(value: Uint8Array | null | undefined);
}

/**
 * Cryptographic signature produced by supported auth schemes.
 */
export class Signature {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Deserializes a signature from bytes.
     */
    static deserialize(bytes: Uint8Array): Signature;
    /**
     * Serializes the signature into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Converts the signature to the prepared field elements expected by verifying code.
     */
    toPreparedSignature(message: Word): Felt[];
}

export class SigningInputs {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the arbitrary payload as an array of felts.
     */
    arbitraryPayload(): FeltArray;
    /**
     * Returns the blind payload as a word.
     */
    blindPayload(): Word;
    /**
     * Deserializes signing inputs from bytes.
     */
    static deserialize(bytes: Uint8Array): SigningInputs;
    /**
     * Creates signing inputs from arbitrary field elements.
     */
    static newArbitrary(felts: Felt[]): SigningInputs;
    /**
     * Creates blind signing inputs from a single word.
     */
    static newBlind(word: Word): SigningInputs;
    /**
     * Creates signing inputs from a transaction summary.
     */
    static newTransactionSummary(summary: TransactionSummary): SigningInputs;
    /**
     * Serializes the signing inputs into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns the commitment to these signing inputs.
     */
    toCommitment(): Word;
    /**
     * Returns the inputs as field elements.
     */
    toElements(): FeltArray;
    /**
     * Returns the transaction summary payload if this variant contains one.
     */
    transactionSummaryPayload(): TransactionSummary;
    /**
     * Returns which variant these signing inputs represent.
     */
    readonly variantType: SigningInputsType;
}

export enum SigningInputsType {
    /**
     * Signing commitment over a transaction summary.
     */
    TransactionSummary = 0,
    /**
     * Arbitrary field elements supplied by caller.
     */
    Arbitrary = 1,
    /**
     * Blind commitment derived from a single word.
     */
    Blind = 2,
}

/**
 * Storage slot index paired with map keys that must be present.
 */
export class SlotAndKeys {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a new slot-and-keys entry.
     */
    constructor(storage_slot_name: string, storage_map_keys: Word[]);
    /**
     * Returns the storage map keys required for this slot.
     */
    storage_map_keys(): Word[];
    /**
     * Returns the slot name.
     */
    storage_slot_name(): string;
}

/**
 * Represents a sparse Merkle path.
 */
export class SparseMerklePath {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the empty nodes mask used by this path.
     */
    emptyNodesMask(): bigint;
    /**
     * Returns the sibling nodes that make up the path.
     */
    nodes(): Word[];
    /**
     * Verifies the path against a root.
     */
    verify(index: bigint, node: Word, root: Word): boolean;
}

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
export class StorageMap {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Inserts a key/value pair, returning any previous value.
     */
    insert(key: Word, value: Word): Word;
    /**
     * Creates an empty storage map.
     */
    constructor();
}

/**
 * A key-value entry from a storage map.
 */
export class StorageMapEntry {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the storage map key.
     */
    key(): Word;
    /**
     * Returns the storage map value.
     */
    value(): Word;
}

/**
 * Information about storage map updates for an account, as returned by the
 * `syncStorageMaps` RPC endpoint.
 *
 * Contains the list of storage map updates within the requested block range,
 * along with the chain tip and last processed block number.
 */
export class StorageMapInfo {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the block number of the last check included in this response.
     */
    blockNumber(): number;
    /**
     * Returns the current chain tip block number.
     */
    chainTip(): number;
    /**
     * Returns the list of storage map updates.
     */
    updates(): StorageMapUpdate[];
}

/**
 * A single storage map update entry, containing the block number, slot name,
 * key, and new value.
 */
export class StorageMapUpdate {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the block number in which this update occurred.
     */
    blockNum(): number;
    /**
     * Returns the storage map key that was updated.
     */
    key(): Word;
    /**
     * Returns the name of the storage slot that was updated.
     */
    slotName(): string;
    /**
     * Returns the new value for this storage map key.
     */
    value(): Word;
}

/**
 * A single storage slot value or map for an account component.
 */
export class StorageSlot {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns an empty value slot (zeroed).
     */
    static emptyValue(name: string): StorageSlot;
    /**
     * Creates a storage slot holding a single value.
     */
    static fromValue(name: string, value: Word): StorageSlot;
    /**
     * Creates a storage slot backed by a map.
     */
    static map(name: string, storage_map: StorageMap): StorageSlot;
}

export class StorageSlotArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): StorageSlot;
    length(): number;
    constructor(elements?: StorageSlot[] | null);
    push(element: StorageSlot): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: StorageSlot): void;
}

/**
 * Contains stats about the sync operation.
 */
export class SyncSummary {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the block height the summary is based on.
     */
    blockNum(): number;
    /**
     * Returns IDs of notes committed in this sync window.
     */
    committedNotes(): NoteId[];
    /**
     * Returns transactions that were committed.
     */
    committedTransactions(): TransactionId[];
    /**
     * Returns IDs of notes that were consumed.
     */
    consumedNotes(): NoteId[];
    /**
     * Deserializes a sync summary from bytes.
     */
    static deserialize(bytes: Uint8Array): SyncSummary;
    /**
     * Serializes the sync summary into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns accounts that were updated.
     */
    updatedAccounts(): AccountId[];
}

export class TestUtils {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    static createMockAccountId(): AccountId;
    static createMockSerializedLibraryPackage(): Uint8Array;
    static createMockSerializedProgramPackage(): Uint8Array;
}

/**
 * Represents a string token symbol (e.g. "POL", "ETH") as a single {@link Felt | `Felt`} value.
 *
 * Token Symbols can consists of up to 6 capital Latin characters, e.g. "C", "ETH", "MIDENC".
 */
export class TokenSymbol {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a token symbol from a string.
     */
    constructor(symbol: string);
    /**
     * Returns the validated symbol string.
     */
    toString(): string;
}

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
export class TransactionArgs {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns advice inputs attached to the transaction.
     */
    adviceInputs(): AdviceInputs;
    /**
     * Returns note-specific arguments for the given note ID.
     */
    getNoteArgs(note_id: NoteId): Word | undefined;
    /**
     * Returns the transaction script if provided.
     */
    txScript(): TransactionScript | undefined;
}

/**
 * Filter used when querying stored transactions.
 */
export class TransactionFilter {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Matches all transactions.
     */
    static all(): TransactionFilter;
    /**
     * Matches transactions that expired before the given block number.
     */
    static expiredBefore(block_num: number): TransactionFilter;
    /**
     * Matches specific transaction IDs.
     */
    static ids(ids: TransactionId[]): TransactionFilter;
    /**
     * Matches transactions that are not yet committed.
     */
    static uncommitted(): TransactionFilter;
}

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
export class TransactionId {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the transaction ID as raw bytes.
     */
    asBytes(): Uint8Array;
    /**
     * Returns the transaction ID as field elements.
     */
    asElements(): Felt[];
    /**
     * Creates a `TransactionId` from a hex string.
     *
     * Fails if the provided string is not a valid hex representation of a `TransactionId`.
     */
    static fromHex(hex: string): TransactionId;
    /**
     * Returns the underlying word representation.
     */
    inner(): Word;
    /**
     * Returns the hexadecimal encoding of the transaction ID.
     */
    toHex(): string;
}

/**
 * Wrapper over local or remote transaction proving backends.
 */
export class TransactionProver {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Reconstructs a prover from its serialized descriptor.
     *
     * Parses the format produced by `serialize()`:
     * - `"local"` for local prover
     * - `"remote|{endpoint}"` for remote prover without timeout
     * - `"remote|{endpoint}|{timeout_ms}"` for remote prover with timeout
     */
    static deserialize(payload: string): TransactionProver;
    /**
     * Returns the endpoint if this is a remote prover.
     */
    endpoint(): string | undefined;
    /**
     * Creates a prover that uses the local proving backend.
     */
    static newLocalProver(): TransactionProver;
    /**
     * Creates a new remote transaction prover.
     *
     * Arguments:
     * - `endpoint`: The URL of the remote prover.
     * - `timeout_ms`: The timeout in milliseconds for the remote prover.
     */
    static newRemoteProver(endpoint: string, timeout_ms?: bigint | null): TransactionProver;
    /**
     * Serializes the prover configuration into a string descriptor.
     *
     * Format:
     * - `"local"` for local prover
     * - `"remote|{endpoint}"` for remote prover without timeout
     * - `"remote|{endpoint}|{timeout_ms}"` for remote prover with timeout
     *
     * Uses `|` as delimiter since it's not a valid URL character.
     */
    serialize(): string;
}

/**
 * Describes a transaction that has been executed and is being tracked on the Client.
 */
export class TransactionRecord {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account this transaction was executed against.
     */
    accountId(): AccountId;
    /**
     * Returns the block height in which the transaction was included.
     */
    blockNum(): number;
    /**
     * Returns the timestamp when the record was created.
     */
    creationTimestamp(): bigint;
    /**
     * Returns the expiration block height for the transaction.
     */
    expirationBlockNum(): number;
    /**
     * Returns the final account state commitment after execution.
     */
    finalAccountState(): Word;
    /**
     * Returns the transaction ID.
     */
    id(): TransactionId;
    /**
     * Returns the initial account state commitment before execution.
     */
    initAccountState(): Word;
    /**
     * Returns the nullifiers of the consumed input notes.
     */
    inputNoteNullifiers(): Word[];
    /**
     * Returns the output notes created by this transaction.
     */
    outputNotes(): OutputNotes;
    /**
     * Returns the block height at which the transaction was submitted.
     */
    submissionHeight(): number;
    /**
     * Returns the current status of the transaction.
     */
    transactionStatus(): TransactionStatus;
}

/**
 * Specifies a transaction request that can be executed by an account.
 *
 * A request contains information about input notes to be consumed by the transaction (if any),
 * description of the transaction script to be executed (if any), and a set of notes expected to be
 * generated by the transaction or by consuming notes generated by the transaction.
 */
export class TransactionRequest {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the authentication argument if present.
     */
    authArg(): Word | undefined;
    /**
     * Deserializes a transaction request from bytes.
     */
    static deserialize(bytes: Uint8Array): TransactionRequest;
    /**
     * Returns notes expected to be created in subsequent executions.
     */
    expectedFutureNotes(): NoteDetailsAndTag[];
    /**
     * Returns output notes created by the sender account.
     */
    expectedOutputOwnNotes(): Note[];
    /**
     * Returns the transaction script argument if present.
     */
    scriptArg(): Word | undefined;
    /**
     * Serializes the transaction request into bytes.
     */
    serialize(): Uint8Array;
}

/**
 * A builder for a `TransactionRequest`.
 *
 * Use this builder to construct a `TransactionRequest` by adding input notes, specifying
 * scripts, and setting other transaction parameters.
 */
export class TransactionRequestBuilder {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Finalizes the builder into a `TransactionRequest`.
     */
    build(): TransactionRequest;
    /**
     * Merges an advice map to be available during script execution.
     */
    extendAdviceMap(advice_map: AdviceMap): TransactionRequestBuilder;
    /**
     * Creates a new empty transaction request builder.
     */
    constructor();
    /**
     * Adds an authentication argument.
     */
    withAuthArg(auth_arg: Word): TransactionRequestBuilder;
    /**
     * Attaches a custom transaction script.
     */
    withCustomScript(script: TransactionScript): TransactionRequestBuilder;
    /**
     * Declares notes expected to be created in follow-up executions.
     */
    withExpectedFutureNotes(note_details_and_tag: NoteDetailsAndTagArray): TransactionRequestBuilder;
    /**
     * Declares expected output recipients (used for verification).
     */
    withExpectedOutputRecipients(recipients: NoteRecipientArray): TransactionRequestBuilder;
    /**
     * Sets the maximum number of blocks until the transaction request expires.
     */
    withExpirationDelta(expiration_delta: number): TransactionRequestBuilder;
    /**
     * Registers foreign accounts referenced by the transaction.
     */
    withForeignAccounts(foreign_accounts: ForeignAccountArray): TransactionRequestBuilder;
    /**
     * Adds input notes with optional arguments.
     */
    withInputNotes(notes: NoteAndArgsArray): TransactionRequestBuilder;
    /**
     * Adds output notes created by the sender that should be emitted by the transaction.
     */
    withOwnOutputNotes(notes: NoteArray): TransactionRequestBuilder;
    /**
     * Adds a transaction script argument.
     */
    withScriptArg(script_arg: Word): TransactionRequestBuilder;
}

/**
 * Represents the result of executing a transaction by the client.
 *
 * It contains an `ExecutedTransaction`, and a list of `future_notes`
 * that we expect to receive in the future (you can check at swap notes for an example of this).
 */
export class TransactionResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Deserializes a transaction result from bytes.
     */
    static deserialize(bytes: Uint8Array): TransactionResult;
    /**
     * Returns the executed transaction.
     */
    executedTransaction(): ExecutedTransaction;
    /**
     * Returns notes that are expected to be created as a result of follow-up executions.
     */
    futureNotes(): NoteDetailsAndTag[];
    /**
     * Returns the ID of the transaction.
     */
    id(): TransactionId;
    /**
     * Serializes the transaction result into bytes.
     */
    serialize(): Uint8Array;
}

/**
 * A transaction script is a program that is executed in a transaction after all input notes have
 * been executed.
 *
 * The `TransactionScript` object is composed of:
 * - An executable program defined by a MAST forest and an associated entrypoint.
 * - A set of transaction script inputs defined by a map of key-value inputs that are loaded into
 *   the advice inputs' map such that the transaction script can access them.
 */
export class TransactionScript {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a `NoteScript` from the given `Package`.
     * Throws if the package is invalid.
     */
    static fromPackage(_package: Package): TransactionScript;
    /**
     * Returns the MAST root commitment of the transaction script.
     */
    root(): Word;
}

/**
 * A script argument represented as a word plus additional felts.
 */
export class TransactionScriptInputPair {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the remaining felts for the input.
     */
    felts(): FeltArray;
    /**
     * Creates a new script input pair.
     */
    constructor(word: Word, felts: FeltArray);
    /**
     * Returns the word part of the input.
     */
    word(): Word;
}

export class TransactionScriptInputPairArray {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get element at index, will always return a clone to avoid aliasing issues.
     */
    get(index: number): TransactionScriptInputPair;
    length(): number;
    constructor(elements?: TransactionScriptInputPair[] | null);
    push(element: TransactionScriptInputPair): void;
    /**
     * Replace the element at `index`. Borrows + clones the input
     * (mirrors `push`), so the caller's JS handle remains valid
     * after the call. Without this borrow, passing `elem` by
     * value would move the underlying Rust value out of the
     * caller's JS handle and any subsequent method on it would
     * panic with `"null pointer passed to rust"`.
     */
    replaceAt(index: number, elem: TransactionScriptInputPair): void;
}

/**
 * Status of a transaction in the node or store.
 */
export class TransactionStatus {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Creates a committed status with block number and timestamp.
     */
    static committed(block_num: number, commit_timestamp: bigint): TransactionStatus;
    /**
     * Creates a discarded status from a discard cause string.
     */
    static discarded(cause: string): TransactionStatus;
    /**
     * Returns the block number if the transaction was committed.
     */
    getBlockNum(): number | undefined;
    /**
     * Returns the commit timestamp if the transaction was committed.
     */
    getCommitTimestamp(): bigint | undefined;
    /**
     * Returns true if the transaction has been committed.
     */
    isCommitted(): boolean;
    /**
     * Returns true if the transaction was discarded.
     */
    isDiscarded(): boolean;
    /**
     * Returns true if the transaction is still pending.
     */
    isPending(): boolean;
    /**
     * Creates a pending transaction status.
     */
    static pending(): TransactionStatus;
}

/**
 * Represents the changes that need to be applied to the client store as a result of a transaction
 * execution.
 */
export class TransactionStoreUpdate {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account delta applied by the transaction.
     */
    accountDelta(): AccountDelta;
    /**
     * Returns the output notes created by the transaction.
     */
    createdNotes(): OutputNotes;
    /**
     * Deserializes an update from bytes.
     */
    static deserialize(bytes: Uint8Array): TransactionStoreUpdate;
    /**
     * Returns the executed transaction associated with this update.
     */
    executedTransaction(): ExecutedTransaction;
    /**
     * Returns notes expected to be created in follow-up executions.
     */
    futureNotes(): NoteDetailsAndTag[];
    /**
     * Serializes the update into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns the block height at which the transaction was submitted.
     */
    submissionHeight(): number;
}

/**
 * Represents a transaction summary.
 */
export class TransactionSummary {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the account delta described by the summary.
     */
    accountDelta(): AccountDelta;
    /**
     * Deserializes a summary from bytes.
     */
    static deserialize(bytes: Uint8Array): TransactionSummary;
    /**
     * Returns the input notes referenced by the summary.
     */
    inputNotes(): InputNotes;
    /**
     * Returns the output notes referenced by the summary.
     */
    outputNotes(): OutputNotes;
    /**
     * Returns the random salt mixed into the summary commitment.
     */
    salt(): Word;
    /**
     * Serializes the summary into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Computes the commitment to this `TransactionSummary`.
     */
    toCommitment(): Word;
}

export class WebClient {
    free(): void;
    [Symbol.dispose](): void;
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
     */
    accountReader(account_id: AccountId): AccountReader;
    addTag(tag: string): Promise<void>;
    applyTransaction(transaction_result: TransactionResult, submission_height: number): Promise<TransactionStoreUpdate>;
    static buildSwapTag(note_type: NoteType, offered_asset_faucet_id: AccountId, offered_asset_amount: bigint, requested_asset_faucet_id: AccountId, requested_asset_amount: bigint): NoteTag;
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
     */
    createClient(node_url?: string | null, node_note_transport_url?: string | null, seed?: Uint8Array | null, store_name?: string | null, debug_mode?: boolean | null): Promise<any>;
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
     */
    createClientWithExternalKeystore(node_url?: string | null, node_note_transport_url?: string | null, seed?: Uint8Array | null, store_name?: string | null, get_key_cb?: Function | null, insert_key_cb?: Function | null, sign_cb?: Function | null, debug_mode?: boolean | null): Promise<any>;
    createCodeBuilder(): CodeBuilder;
    /**
     * Creates a new client with a mock RPC API. Useful for testing purposes and proof-of-concept
     * applications as it uses a mock chain that simulates the behavior of a real node.
     */
    createMockClient(seed?: Uint8Array | null, serialized_mock_chain?: Uint8Array | null, serialized_mock_note_transport_node?: Uint8Array | null): Promise<any>;
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
     */
    executeForSummary(account_id: AccountId, transaction_request: TransactionRequest): Promise<TransactionSummary>;
    /**
     * Executes the provided transaction script against the specified account
     * and returns the resulting stack output. This is a local-only "view call"
     * that does not submit anything to the network.
     */
    executeProgram(account_id: AccountId, tx_script: TransactionScript, advice_inputs: AdviceInputs, foreign_accounts: ForeignAccountArray): Promise<FeltArray>;
    /**
     * Executes a transaction specified by the request against the specified account but does not
     * submit it to the network nor update the local database. The returned [`TransactionResult`]
     * retains the execution artifacts needed to continue with the transaction lifecycle.
     *
     * If the transaction utilizes foreign account data, there is a chance that the client doesn't
     * have the required block header in the local database. In these scenarios, a sync to
     * the chain tip is performed, and the required block header is retrieved.
     */
    executeTransaction(account_id: AccountId, transaction_request: TransactionRequest): Promise<TransactionResult>;
    exportAccountFile(account_id: AccountId): Promise<AccountFile>;
    exportNoteFile(note_id: string, export_format: NoteExportFormat): Promise<NoteFile>;
    /**
     * Fetch all private notes from the note transport layer
     *
     * Fetches all notes stored in the transport layer, with no pagination.
     * Prefer using [`WebClient::fetch_private_notes`] for a more efficient, on-going,
     * fetching mechanism.
     */
    fetchAllPrivateNotes(): Promise<void>;
    /**
     * Fetch private notes from the note transport layer
     *
     * Uses an internal pagination mechanism to avoid fetching duplicate notes.
     */
    fetchPrivateNotes(): Promise<void>;
    /**
     * Retrieves the full account data for the given account ID, returning `null` if not found.
     *
     * This method loads the complete account state including vault, storage, and code.
     */
    getAccount(account_id: AccountId): Promise<Account | undefined>;
    /**
     * Retrieves the account code for a specific account.
     *
     * Returns `null` if the account is not found.
     */
    getAccountCode(account_id: AccountId): Promise<AccountCode | undefined>;
    /**
     * Retrieves the storage for a specific account.
     *
     * To only load a specific slot, use `accountReader` instead.
     */
    getAccountStorage(account_id: AccountId): Promise<AccountStorage>;
    /**
     * Retrieves the asset vault for a specific account.
     *
     * To check the balance for a single asset, use `accountReader` instead.
     */
    getAccountVault(account_id: AccountId): Promise<AssetVault>;
    getAccounts(): Promise<AccountHeader[]>;
    getConsumableNotes(account_id?: AccountId | null): Promise<ConsumableNoteRecord[]>;
    getInputNote(note_id: string): Promise<InputNoteRecord | undefined>;
    getInputNotes(filter: NoteFilter): Promise<InputNoteRecord[]>;
    getOutputNote(note_id: string): Promise<OutputNoteRecord>;
    getOutputNotes(filter: NoteFilter): Promise<OutputNoteRecord[]>;
    /**
     * Retrieves the setting value for `key`, or `None` if it hasn’t been set.
     */
    getSetting(key: string): Promise<any | undefined>;
    getSyncHeight(): Promise<number>;
    getTransactions(transaction_filter: TransactionFilter): Promise<TransactionRecord[]>;
    importAccountById(account_id: AccountId): Promise<any>;
    importAccountFile(account_file: AccountFile): Promise<any>;
    importNoteFile(note_file: NoteFile): Promise<NoteId>;
    importPublicAccountFromSeed(init_seed: Uint8Array, mutable: boolean, auth_scheme: AuthScheme): Promise<Account>;
    insertAccountAddress(account_id: AccountId, address: Address): Promise<void>;
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
     */
    lastAuthError(): any;
    /**
     * Returns all the existing setting keys from the store.
     */
    listSettingKeys(): Promise<string[]>;
    listTags(): Promise<any>;
    constructor();
    newAccount(account: Account, overwrite: boolean): Promise<void>;
    /**
     * Inserts an account and its secret key in one call, matching how
     * `newWallet` / `newFaucet` already work internally.  If the key
     * insertion fails the account is still persisted (same as wallet/faucet),
     * but callers only need a single await instead of two.
     */
    newAccountWithSecretKey(account: Account, secret_key: AuthSecretKey): Promise<void>;
    newConsumeTransactionRequest(list_of_notes: Note[]): TransactionRequest;
    newFaucet(storage_mode: AccountStorageMode, non_fungible: boolean, token_symbol: string, decimals: number, max_supply: bigint, auth_scheme: AuthScheme): Promise<Account>;
    newMintTransactionRequest(target_account_id: AccountId, faucet_id: AccountId, note_type: NoteType, amount: bigint): TransactionRequest;
    newSendTransactionRequest(sender_account_id: AccountId, target_account_id: AccountId, faucet_id: AccountId, note_type: NoteType, amount: bigint, recall_height?: number | null, timelock_height?: number | null): TransactionRequest;
    newSwapTransactionRequest(sender_account_id: AccountId, offered_asset_faucet_id: AccountId, offered_asset_amount: bigint, requested_asset_faucet_id: AccountId, requested_asset_amount: bigint, note_type: NoteType, payback_note_type: NoteType): TransactionRequest;
    newWallet(storage_mode: AccountStorageMode, mutable: boolean, auth_scheme: AuthScheme, init_seed?: Uint8Array | null): Promise<Account>;
    proveBlock(): void;
    /**
     * Generates a transaction proof using the client's default (local) prover.
     */
    proveTransaction(transaction_result: TransactionResult): Promise<ProvenTransaction>;
    /**
     * Generates a transaction proof using the provided prover.
     *
     * Takes the prover by reference so the JS-side handle is NOT consumed
     * by wasm-bindgen. Taking `TransactionProver` by value would transfer
     * ownership on each call, invalidating the JS object's internal WASM
     * handle; after one use, subsequent calls from JS would pass a dangling
     * handle that wasm-bindgen interprets as `None`, silently falling back
     * to the local prover.
     */
    proveTransactionWithProver(transaction_result: TransactionResult, prover: TransactionProver): Promise<ProvenTransaction>;
    /**
     * Prunes historical account states for the specified account up to the given nonce.
     *
     * Deletes all historical entries with `replaced_at_nonce <= up_to_nonce` and any
     * orphaned account code.
     *
     * Returns the total number of rows deleted, including historical entries and orphaned
     * account code.
     */
    pruneAccountHistory(account_id: AccountId, up_to_nonce: Felt): Promise<number>;
    removeAccountAddress(account_id: AccountId, address: Address): Promise<void>;
    /**
     * Deletes a setting key-value from the store.
     */
    removeSetting(key: string): Promise<void>;
    removeTag(tag: string): Promise<void>;
    /**
     * Send a private note via the note transport layer
     */
    sendPrivateNote(note: Note, address: Address): Promise<void>;
    /**
     * Returns the inner serialized mock chain if it exists.
     */
    serializeMockChain(): Uint8Array;
    /**
     * Returns the inner serialized mock note transport node if it exists.
     */
    serializeMockNoteTransportNode(): Uint8Array;
    /**
     * Sets a setting key-value in the store. It can then be retrieved using `get_setting`.
     */
    setSetting(key: string, value: any): Promise<void>;
    /**
     * Returns the identifier of the underlying store (e.g. `IndexedDB` database name, file path).
     */
    storeIdentifier(): string;
    /**
     * Executes a transaction specified by the request against the specified account,
     * proves it, submits it to the network, and updates the local database.
     *
     * Uses the prover configured for this client.
     *
     * If the transaction utilizes foreign account data, there is a chance that the client doesn't
     * have the required block header in the local database. In these scenarios, a sync to
     * the chain tip is performed, and the required block header is retrieved.
     */
    submitNewTransaction(account_id: AccountId, transaction_request: TransactionRequest): Promise<TransactionId>;
    /**
     * Executes a transaction specified by the request against the specified account, proves it
     * with the user provided prover, submits it to the network, and updates the local database.
     *
     * If the transaction utilizes foreign account data, there is a chance that the client doesn't
     * have the required block header in the local database. In these scenarios, a sync to the
     * chain tip is performed, and the required block header is retrieved.
     */
    submitNewTransactionWithProver(account_id: AccountId, transaction_request: TransactionRequest, prover: TransactionProver): Promise<TransactionId>;
    submitProvenTransaction(proven_transaction: ProvenTransaction, transaction_result: TransactionResult): Promise<number>;
    /**
     * Internal implementation of `sync_state`.
     *
     * This method performs the actual sync operation. Concurrent call coordination
     * is handled at the JavaScript layer using the Web Locks API.
     *
     * **Note:** Do not call this method directly. Use `syncState()` from JavaScript instead,
     * which provides proper coordination for concurrent calls.
     */
    syncStateImpl(): Promise<SyncSummary>;
    usesMockChain(): boolean;
    /**
     * Returns a `WebKeystoreApi` handle for managing secret keys.
     *
     * The returned object can be used from JavaScript as `client.keystore`.
     */
    readonly keystore: WebKeystoreApi;
}

/**
 * JavaScript API for the client's keystore.
 *
 * Manages the association between accounts and their authentication secret keys,
 * indexed by public key commitment.
 */
export class WebKeystoreApi {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Retrieves a secret key from the keystore given a public key commitment.
     *
     * Returns the associated `AuthSecretKey` if found, or `null` if not found.
     */
    get(pub_key_commitment: Word): Promise<AuthSecretKey | undefined>;
    /**
     * Returns the account ID associated with a given public key commitment,
     * or `null` if no account is found.
     */
    getAccountId(pub_key_commitment: Word): Promise<AccountId | undefined>;
    /**
     * Returns all public key commitments associated with the given account ID.
     */
    getCommitments(account_id: AccountId): Promise<Word[]>;
    /**
     * Inserts a secret key into the keystore, associating it with the given account ID.
     */
    insert(account_id: AccountId, secret_key: AuthSecretKey): Promise<void>;
    /**
     * Removes a key from the keystore by its public key commitment.
     */
    remove(pub_key_commitment: Word): Promise<void>;
}

export class Word {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Deserializes a word from bytes.
     */
    static deserialize(bytes: Uint8Array): Word;
    /**
     * Creates a Word from a hex string.
     * Fails if the provided string is not a valid hex representation of a Word.
     */
    static fromHex(hex: string): Word;
    /**
     * Creates a word from four u64 values.
     */
    constructor(u64_vec: BigUint64Array);
    /**
     * Creates a word from four field elements.
     */
    static newFromFelts(felt_vec: Felt[]): Word;
    /**
     * Serializes the word into bytes.
     */
    serialize(): Uint8Array;
    /**
     * Returns the word as an array of field elements.
     */
    toFelts(): Felt[];
    /**
     * Returns the hex representation of the word.
     */
    toHex(): string;
    /**
     * Returns the word as an array of u64 values.
     */
    toU64s(): BigUint64Array;
}

/**
 * Create an auth component for `Falcon512Rpo` multisig.
 */
export function createAuthFalcon512RpoMultisig(config: AuthFalcon512RpoMultisigConfig): AccountComponent;

/**
 * Exports the entire contents of an `IndexedDB` store as a JSON string.
 *
 * Use together with [`import_store`].
 */
declare function exportStore2(store_name: string): Promise<any>;
export { exportStore2 as exportStore }

/**
 * Imports store contents from a JSON string, replacing all existing data.
 *
 * Use together with [`export_store`].
 */
export function importStore(store_name: string, store_dump: string): Promise<void>;

/**
 * Single-threaded version of `parallel_sum_bench` for direct comparison.
 * Same workload, plain `iter()` — bypasses rayon entirely.
 */
export function sequentialSumBench(n: bigint): bigint;

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
 */
export function setupLogging(log_level: string): void;