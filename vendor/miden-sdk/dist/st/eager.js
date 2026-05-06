import { getWasmOrThrow } from './index.js';
export { AccountArray, AccountIdArray, AccountType, AuthScheme, CompilerResource, FeltArray, ForeignAccountArray, Linking, MidenArrays, MidenClient, MockWasmWebClient, NoteAndArgsArray, NoteArray, NoteIdAndArgsArray, NoteRecipientArray, NoteVisibility, OutputNoteArray, StorageMode, StorageSlotArray, TransactionScriptInputPairArray, WasmWebClient, buildSwapTag, createP2IDENote, createP2IDNote, resolveAuthScheme } from './index.js';
export { Account, AccountBuilder, AccountBuilderResult, AccountCode, AccountComponent, AccountComponentCode, AccountDelta, AccountFile, AccountHeader, AccountId, AccountInterface, AccountProof, AccountReader, AccountStatus, AccountStorage, AccountStorageDelta, AccountStorageMode, AccountStorageRequirements, AccountVaultDelta, Address, AdviceInputs, AdviceMap, AssetVault, AuthFalcon512RpoMultisigConfig, AuthSecretKey, BasicFungibleFaucetComponent, BlockHeader, CodeBuilder, CommittedNote, ConsumableNoteRecord, Endpoint, ExecutedTransaction, Felt, FetchedAccount, FetchedNote, FlattenedU8Vec, ForeignAccount, FungibleAsset, FungibleAssetDelta, FungibleAssetDeltaItem, GetProceduresResultItem, InputNote, InputNoteRecord, InputNoteState, InputNotes, IntoUnderlyingByteSource, IntoUnderlyingSink, IntoUnderlyingSource, JsAccountUpdate, JsStateSyncUpdate, JsStorageMapEntry, JsStorageSlot, JsVaultAsset, Library, MerklePath, NetworkId, NetworkType, Note, NoteAndArgs, NoteAssets, NoteAttachment, NoteAttachmentKind, NoteAttachmentScheme, NoteConsumability, NoteConsumptionStatus, NoteDetails, NoteDetailsAndTag, NoteDetailsAndTagArray, NoteExecutionHint, NoteExportFormat, NoteFile, NoteFilter, NoteFilterTypes, NoteHeader, NoteId, NoteIdAndArgs, NoteInclusionProof, NoteLocation, NoteMetadata, NoteRecipient, NoteScript, NoteStorage, NoteSyncBlock, NoteSyncInfo, NoteTag, NoteType, OutputNote, OutputNoteRecord, OutputNoteState, OutputNotes, Package, PartialNote, Poseidon2, ProcedureThreshold, Program, ProvenTransaction, PublicKey, RpcClient, Rpo256, SerializedInputNoteData, SerializedOutputNoteData, SerializedTransactionData, Signature, SigningInputs, SigningInputsType, SlotAndKeys, SparseMerklePath, StorageMap, StorageMapEntry, StorageMapInfo, StorageMapUpdate, StorageSlot, SyncSummary, TestUtils, TokenSymbol, TransactionArgs, TransactionFilter, TransactionId, TransactionProver, TransactionRecord, TransactionRequest, TransactionRequestBuilder, TransactionResult, TransactionScript, TransactionScriptInputPair, TransactionStatus, TransactionStoreUpdate, TransactionSummary, WebClient, WebKeystoreApi, Word, createAuthFalcon512RpoMultisig, exportStore, importStore, initSync, sequentialSumBench, setupLogging } from './Cargo-DPTsp1xD.js';
import './wasm.js';

// Eager entry point for @miden-sdk/miden-sdk.
//
// Awaits WASM initialization at module top level, so importing this module
// guarantees that any wasm-bindgen constructor (`new RpcClient(...)`,
// `AccountId.fromHex(...)`, `TransactionProver.newRemoteProver(...)`, etc.)
// is safe to call synchronously on the next line. No explicit
// `await MidenClient.ready()` / `isReady` gate is required.
//
// This is the default entry (`@miden-sdk/miden-sdk` → `./dist/eager.js`).
//
// When NOT to use this entry:
// - **Capacitor mobile apps** (Miden Wallet iOS/Android): Capacitor's
//   `capacitor://localhost` scheme handler interacts poorly with top-level
//   await in the main WKWebView. Verified empirically: TLA in a Capacitor
//   host WKWebView hangs module evaluation indefinitely, while the same
//   TLA in the dApp-browser WKWebView (vanilla HTTPS) resolves in <100ms.
// - **Next.js / SSR**: TLA blocks server-side module evaluation.
// - **Framework adapters (@miden-sdk/react, etc.)**: they manage readiness
//   via their own state machine (e.g. `isReady`) and should not impose
//   TLA on consumer bundles.
//
// For those contexts, import from `@miden-sdk/miden-sdk/lazy` — identical
// API surface, no top-level await, callers are responsible for awaiting
// `MidenClient.ready()` (or the equivalent) before touching wasm-bindgen
// types.

await getWasmOrThrow();

export { getWasmOrThrow };
//# sourceMappingURL=eager.js.map
