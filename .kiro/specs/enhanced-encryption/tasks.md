# Implementation Plan: Enhanced Encryption System

## Overview

Implementasi sistem enkripsi yang ditingkatkan untuk HadesNotes menggunakan Argon2id KDF, XChaCha20-Poly1305 AEAD, format payload terstruktur v2.0, enkripsi metadata lengkap, dan local-first encrypted search.

## Tasks

- [x] 1. Setup dependencies dan base infrastructure
  - Install libsodium-wrappers-sumo dan fast-check
  - Setup TypeScript types untuk libsodium
  - Verify libsodium loads correctly in browser environment
  - _Requirements: 2.1_

- [x] 2. Implement KDF Module dengan Argon2id
  - [x] 2.1 Create KDF module dengan Argon2id support
    - Implement `deriveKey()` dengan Argon2id parameters (64MB memory, 3 iterations, 4 parallelism)
    - Implement `generateSalt()` untuk 16-byte random salt
    - Implement `isArgon2idAvailable()` check
    - Implement PBKDF2 fallback dengan 600,000 iterations
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [ ]* 2.2 Write property tests for KDF determinism
    - **Property 1: KDF Determinism**
    - **Validates: Requirements 1.4**
  - [ ]* 2.3 Write property tests for KDF key length
    - **Property 2: KDF Key Length**
    - **Validates: Requirements 1.3**
  - [ ]* 2.4 Write property tests for salt generation
    - **Property 3: Salt Generation**
    - **Validates: Requirements 1.2**

- [x] 3. Implement Encryption Module dengan XChaCha20-Poly1305
  - [x] 3.1 Create encryption module dengan libsodium
    - Implement `encrypt()` dengan XChaCha20-Poly1305
    - Implement `decrypt()` dengan authentication verification
    - Implement `generateNonce()` untuk 24-byte random nonce
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ]* 3.2 Write property tests for nonce uniqueness
    - **Property 4: Nonce Uniqueness**
    - **Validates: Requirements 2.3**
  - [ ]* 3.3 Write property tests for nonce length
    - **Property 5: Nonce Length**
    - **Validates: Requirements 2.2**
  - [ ]* 3.4 Write property tests for encryption round-trip
    - **Property 6: Encryption Round-Trip**
    - **Validates: Requirements 2.4, 2.5**
  - [ ]* 3.5 Write property tests for tamper detection
    - **Property 7: Tamper Detection**
    - **Validates: Requirements 2.6**

- [x] 4. Implement Padding Module
  - [x] 4.1 Create padding module dengan PKCS7 ke 1KB boundary
    - Implement `pad()` untuk padding ke kelipatan 1024 bytes
    - Implement `unpad()` untuk remove padding
    - Handle edge case: data sudah di boundary
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 4.2 Write property tests for padding round-trip
    - **Property 13: Padding Round-Trip**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 5. Checkpoint - Ensure core crypto modules work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Payload Module dengan versioning
  - [x] 6.1 Create payload module untuk structured format v2.0
    - Implement `createPayload()` dengan semua required fields
    - Implement `parsePayload()` dengan version detection
    - Implement `serialize()` dan `deserialize()` untuk JSON
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 6.2 Write property tests for payload structure
    - **Property 8: Payload Structure**
    - **Validates: Requirements 3.1, 3.2**
  - [ ]* 6.3 Write property tests for payload serialization round-trip
    - **Property 9: Payload Serialization Round-Trip**
    - **Validates: Requirements 3.5, 3.6**

- [x] 7. Implement AAD Module
  - [x] 7.1 Create AAD module untuk context binding
    - Implement `createAAD()` dengan note_id dan vault_id
    - Implement `parseAAD()` untuk extraction
    - Use safe delimiter yang tidak muncul di values
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 7.2 Write property tests for AAD binding and verification
    - **Property 10: AAD Binding and Verification**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [x] 8. Implement Note Encryption dengan metadata lengkap
  - [x] 8.1 Create enhanced note encryption functions
    - Implement `encryptNoteV2()` yang encrypt semua metadata
    - Implement `decryptNoteV2()` yang decrypt semua fields
    - Handle coarse timestamps untuk sync
    - Encrypt full-precision timestamps dalam payload
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [ ]* 8.2 Write property tests for metadata encryption
    - **Property 11: Metadata Encryption**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - [ ]* 8.3 Write property tests for timestamp handling
    - **Property 12: Timestamp Handling**
    - **Validates: Requirements 5.6, 5.7**

- [x] 9. Checkpoint - Ensure encryption pipeline complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Migration Module
  - [x] 10.1 Create migration module untuk v1 → v2
    - Implement `detectVersion()` untuk payload version detection
    - Implement `migrateNote()` untuk single note migration
    - Implement `migrateAll()` untuk bulk migration
    - Handle errors gracefully, continue on failure
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [ ]* 10.2 Write property tests for migration version handling
    - **Property 15: Migration Version Handling**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  - [ ]* 10.3 Write property tests for migration result reporting
    - **Property 16: Migration Result Reporting**
    - **Validates: Requirements 8.6**

- [x] 11. Implement Local Search Module
  - [x] 11.1 Create search module dengan in-memory index
    - Implement `buildIndex()` dari decrypted notes
    - Implement `search()` untuk full-text search
    - Implement `updateNote()` untuk incremental update
    - Implement `removeNote()` dan `clearIndex()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [ ]* 11.2 Write property tests for search index consistency
    - **Property 14: Search Index Consistency**
    - **Validates: Requirements 7.3, 7.5**

- [x] 12. Update Vault Store untuk enhanced encryption
  - [x] 12.1 Integrate new crypto module ke vault store
    - Update key derivation untuk use Argon2id
    - Store KDF params di vault metadata
    - Update session token encryption
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]* 12.2 Write property tests for session token encryption
    - **Property 17: Session Token Encryption**
    - **Validates: Requirements 9.4**

- [ ] 13. Update Notes Store untuk encrypted metadata
  - [ ] 13.1 Integrate enhanced note encryption
    - Update note save/load untuk use v2 format
    - Integrate search module
    - Handle backward compatibility dengan v1 notes
    - _Requirements: 5.1-5.7, 7.1-7.5_

- [ ] 14. Checkpoint - Ensure integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Add migration UI dan settings
  - [x] 15.1 Create migration UI component
    - Add migration button di vault settings
    - Show migration progress dan results
    - Handle partial failures gracefully
    - _Requirements: 8.4, 8.5, 8.6_

- [ ] 16. Final checkpoint - Full system verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify backward compatibility dengan existing vaults
  - Test migration flow end-to-end

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- libsodium-wrappers-sumo diperlukan untuk Argon2id support (bukan versi standard)
