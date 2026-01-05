# Requirements Document

## Introduction

Peningkatan sistem enkripsi HadesNotes untuk mencapai standar keamanan zero-knowledge yang lebih tinggi. Sistem saat ini menggunakan PBKDF2 untuk key derivation dan AES-256-GCM/XSalsa20-Poly1305 untuk enkripsi. Peningkatan ini akan mengimplementasikan Argon2id sebagai KDF, XChaCha20-Poly1305 dengan libsodium, format payload terstruktur dengan versioning, enkripsi metadata lengkap, dan local-first encrypted search.

## Glossary

- **KDF (Key Derivation Function)**: Fungsi untuk menurunkan encryption key dari password/mnemonic
- **Argon2id**: KDF modern yang tahan terhadap GPU/ASIC attacks, kombinasi Argon2i dan Argon2d
- **XChaCha20-Poly1305**: AEAD cipher dengan 24-byte nonce, lebih aman dari nonce reuse
- **AEAD (Authenticated Encryption with Associated Data)**: Enkripsi yang menyediakan confidentiality dan integrity
- **AAD (Additional Authenticated Data)**: Data tambahan yang di-authenticate tapi tidak dienkripsi
- **Nonce**: Number used once, nilai unik untuk setiap operasi enkripsi
- **Zero-Knowledge**: Arsitektur dimana server tidak memiliki akses ke plaintext data
- **Ciphertext_Padding**: Teknik menambahkan padding ke ciphertext untuk menyembunyikan ukuran asli
- **Encrypted_Payload**: Struktur data terenkripsi dengan metadata dan versioning
- **Local_Search_Index**: Index pencarian yang dibangun dan disimpan secara lokal setelah dekripsi

## Requirements

### Requirement 1: Argon2id Key Derivation

**User Story:** As a user, I want my encryption key derived using Argon2id, so that my vault is protected against brute-force and hardware-accelerated attacks.

#### Acceptance Criteria

1. WHEN deriving an encryption key from mnemonic, THE KDF_Module SHALL use Argon2id algorithm with minimum parameters: memory 64MB, iterations 3, parallelism 4
2. WHEN a new vault is created, THE KDF_Module SHALL generate a cryptographically random 16-byte salt
3. WHEN deriving a key, THE KDF_Module SHALL produce a 256-bit (32-byte) encryption key
4. WHEN the same mnemonic and salt are provided, THE KDF_Module SHALL produce identical keys (deterministic)
5. IF Argon2id is unavailable in the environment, THEN THE KDF_Module SHALL fall back to PBKDF2 with 600,000 iterations and log a warning

### Requirement 2: XChaCha20-Poly1305 Encryption

**User Story:** As a user, I want my data encrypted using XChaCha20-Poly1305, so that I have strong authenticated encryption with reduced nonce collision risk.

#### Acceptance Criteria

1. THE Encryption_Module SHALL use XChaCha20-Poly1305 as the default encryption algorithm
2. WHEN encrypting data, THE Encryption_Module SHALL generate a cryptographically random 24-byte nonce
3. WHEN encrypting data, THE Encryption_Module SHALL never reuse a nonce with the same key
4. WHEN encrypting data, THE Encryption_Module SHALL store the nonce alongside the ciphertext
5. WHEN decrypting data, THE Encryption_Module SHALL extract the nonce from the stored payload
6. IF authentication tag verification fails, THEN THE Encryption_Module SHALL reject the decryption and return an error

### Requirement 3: Structured Encrypted Payload Format

**User Story:** As a developer, I want a versioned and structured payload format, so that encrypted data can be upgraded and validated properly.

#### Acceptance Criteria

1. THE Payload_Module SHALL structure encrypted data with fields: version, kdf (algorithm, salt, params), nonce, ciphertext, and optional aad
2. WHEN creating a payload, THE Payload_Module SHALL include format version number starting at "2.0"
3. WHEN reading a payload, THE Payload_Module SHALL validate the version and structure before decryption
4. WHEN the payload version is unsupported, THE Payload_Module SHALL return a descriptive error
5. THE Payload_Module SHALL serialize payloads to JSON for storage
6. THE Payload_Module SHALL parse JSON payloads back to structured objects for decryption

### Requirement 4: AAD (Additional Authenticated Data) Binding

**User Story:** As a user, I want my encrypted notes bound to their identifiers, so that ciphertext cannot be moved between notes without detection.

#### Acceptance Criteria

1. WHEN encrypting a note, THE Encryption_Module SHALL include note_id as AAD
2. WHEN encrypting a note, THE Encryption_Module SHALL include vault_id as AAD
3. WHEN decrypting a note, THE Encryption_Module SHALL verify AAD matches the expected values
4. IF AAD verification fails during decryption, THEN THE Encryption_Module SHALL reject the decryption and return an error
5. THE AAD_Module SHALL concatenate AAD fields with a delimiter that cannot appear in the values

### Requirement 5: Complete Metadata Encryption

**User Story:** As a user, I want all my note metadata encrypted, so that no information leaks about my notes' content or organization.

#### Acceptance Criteria

1. WHEN storing a note, THE Encryption_Module SHALL encrypt the title field
2. WHEN storing a note, THE Encryption_Module SHALL encrypt the content field
3. WHEN storing a note, THE Encryption_Module SHALL encrypt the preview field
4. WHEN storing a note, THE Encryption_Module SHALL encrypt all tags as a single encrypted blob
5. WHEN storing a note, THE Encryption_Module SHALL encrypt the notebookId field if present
6. WHILE timestamps are stored, THE Encryption_Module SHALL only store coarse timestamps (day precision) in plaintext for sync purposes
7. THE Encryption_Module SHALL encrypt the full-precision timestamps within the encrypted payload

### Requirement 6: Ciphertext Padding

**User Story:** As a user, I want my encrypted data padded, so that the size of my notes is not revealed through ciphertext length.

#### Acceptance Criteria

1. WHEN encrypting data, THE Padding_Module SHALL pad plaintext to the nearest 1KB boundary before encryption
2. WHEN decrypting data, THE Padding_Module SHALL remove padding after decryption
3. THE Padding_Module SHALL use PKCS7-style padding with the padding length encoded in the final bytes
4. WHEN the plaintext is already at a 1KB boundary, THE Padding_Module SHALL add a full 1KB of padding

### Requirement 7: Local-First Encrypted Search

**User Story:** As a user, I want to search my notes locally after decryption, so that search functionality works without exposing data to any server.

#### Acceptance Criteria

1. WHEN the vault is unlocked, THE Search_Module SHALL build a local search index from decrypted notes
2. WHEN a user searches, THE Search_Module SHALL query the local index without network requests
3. WHEN a note is added or updated, THE Search_Module SHALL update the local index incrementally
4. WHEN the vault is locked, THE Search_Module SHALL clear the local search index from memory
5. THE Search_Module SHALL support full-text search across title, content, and tags
6. THE Search_Module SHALL return results ranked by relevance

### Requirement 8: Backward Compatibility and Migration

**User Story:** As an existing user, I want my old encrypted data to remain accessible, so that upgrading encryption does not lose my notes.

#### Acceptance Criteria

1. WHEN reading encrypted data, THE Migration_Module SHALL detect the payload version
2. WHEN a v1 payload is detected, THE Migration_Module SHALL decrypt using the legacy algorithm
3. WHEN a note is saved after being read from v1 format, THE Migration_Module SHALL re-encrypt using v2 format
4. THE Migration_Module SHALL provide a bulk migration function to upgrade all notes
5. IF migration fails for a note, THEN THE Migration_Module SHALL log the error and continue with remaining notes
6. WHEN migration completes, THE Migration_Module SHALL report the count of successful and failed migrations

### Requirement 9: Secure Key Management

**User Story:** As a user, I want my encryption keys handled securely in memory, so that keys are not exposed unnecessarily.

#### Acceptance Criteria

1. THE Key_Module SHALL store encryption keys only in memory, never in persistent storage
2. WHEN the vault is locked, THE Key_Module SHALL zero-out the encryption key from memory
3. THE Key_Module SHALL derive keys on-demand rather than storing derived keys long-term
4. WHEN session tokens are used, THE Key_Module SHALL encrypt the mnemonic with a separate session key
5. THE Key_Module SHALL use cryptographically secure random number generation for all random values
