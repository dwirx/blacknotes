# Requirements Document

## Introduction

Fitur Vault Settings menyediakan antarmuka yang komprehensif untuk mengelola vault terenkripsi pengguna. Fitur ini mencakup kemampuan untuk menyalin mnemonic phrase, membuat backup terenkripsi, dan menghapus akun secara permanen. Tujuannya adalah memberikan kontrol penuh kepada pengguna atas keamanan dan data mereka dengan UX yang intuitif dan aman.

## Glossary

- **Vault_Settings**: Komponen UI yang menampilkan pengaturan dan aksi terkait vault terenkripsi
- **Mnemonic_Phrase**: 12 kata recovery phrase yang digunakan untuk mengakses vault
- **Backup_System**: Sistem untuk mengekspor data vault dalam format terenkripsi
- **Delete_Account**: Proses penghapusan permanen vault dan semua data terkait
- **Confirmation_Dialog**: Dialog yang meminta konfirmasi pengguna sebelum aksi berbahaya
- **Clipboard_Manager**: Sistem untuk menyalin data ke clipboard dengan aman
- **Toast_Notification**: Notifikasi singkat yang muncul untuk memberikan feedback

## Requirements

### Requirement 1: Copy Mnemonic Phrase

**User Story:** As a user, I want to copy my mnemonic phrase to clipboard, so that I can safely store it in a password manager or write it down.

#### Acceptance Criteria

1. WHEN the vault is unlocked, THE Vault_Settings SHALL display a "Copy Mnemonic" button
2. WHEN a user clicks the "Copy Mnemonic" button, THE Vault_Settings SHALL show a confirmation dialog warning about security risks
3. WHEN a user confirms the copy action, THE Clipboard_Manager SHALL copy the mnemonic phrase to the system clipboard
4. WHEN the mnemonic is successfully copied, THE Toast_Notification SHALL display a success message with auto-clear warning
5. WHEN the vault is locked, THE Vault_Settings SHALL disable the "Copy Mnemonic" button
6. WHEN the mnemonic is copied, THE Clipboard_Manager SHALL automatically clear the clipboard after 60 seconds

### Requirement 2: Backup Vault Data

**User Story:** As a user, I want to create an encrypted backup of my vault, so that I can restore my notes on another device or after reinstallation.

#### Acceptance Criteria

1. WHEN the vault is unlocked, THE Vault_Settings SHALL display a "Create Backup" button
2. WHEN a user clicks "Create Backup", THE Backup_System SHALL generate an encrypted JSON file containing all vault data
3. WHEN the backup is generated, THE Backup_System SHALL trigger a file download with filename format "hadesnotes-backup-{date}.json"
4. WHEN creating backup, THE Backup_System SHALL encrypt all data using the current vault encryption algorithm
5. WHEN the backup is successfully created, THE Toast_Notification SHALL display a success message
6. IF backup creation fails, THEN THE Toast_Notification SHALL display an error message with details
7. WHEN the vault is locked, THE Vault_Settings SHALL disable the "Create Backup" button

### Requirement 3: Restore Vault from Backup

**User Story:** As a user, I want to restore my vault from a backup file, so that I can recover my notes after data loss.

#### Acceptance Criteria

1. WHEN the vault is unlocked, THE Vault_Settings SHALL display a "Restore Backup" button
2. WHEN a user clicks "Restore Backup", THE Vault_Settings SHALL open a file picker for JSON files
3. WHEN a valid backup file is selected, THE Backup_System SHALL attempt to decrypt it with the current vault key
4. IF decryption succeeds, THEN THE Confirmation_Dialog SHALL show a preview of data to be restored (note count, notebook count)
5. WHEN user confirms restore, THE Backup_System SHALL replace current data with backup data
6. IF the backup file is invalid or corrupted, THEN THE Toast_Notification SHALL display an error message
7. IF the backup was created with a different vault key, THEN THE Toast_Notification SHALL display a "wrong key" error

### Requirement 4: Delete Account

**User Story:** As a user, I want to permanently delete my vault and all data, so that I can remove all traces of my notes from the device.

#### Acceptance Criteria

1. WHEN the vault is unlocked, THE Vault_Settings SHALL display a "Delete Account" button with danger styling
2. WHEN a user clicks "Delete Account", THE Confirmation_Dialog SHALL display a multi-step confirmation process
3. WHEN in confirmation step 1, THE Confirmation_Dialog SHALL warn about permanent data loss
4. WHEN in confirmation step 2, THE Confirmation_Dialog SHALL require user to type "DELETE" to confirm
5. WHEN user completes both confirmation steps, THE Delete_Account SHALL permanently remove all vault data from IndexedDB
6. WHEN deletion is complete, THE Delete_Account SHALL clear vault state and redirect to vault creation screen
7. IF deletion fails, THEN THE Toast_Notification SHALL display an error message

### Requirement 5: Vault Settings UI

**User Story:** As a user, I want a dedicated settings section for vault management, so that I can easily access all vault-related actions.

#### Acceptance Criteria

1. THE Vault_Settings SHALL be accessible from the main settings dialog as a new "Vault" tab
2. THE Vault_Settings SHALL display current vault status (locked/unlocked, vault ID preview)
3. THE Vault_Settings SHALL display the current encryption algorithm being used
4. THE Vault_Settings SHALL group actions into "Security" and "Danger Zone" sections
5. WHEN displaying the Danger Zone, THE Vault_Settings SHALL use red/warning styling to indicate destructive actions
6. THE Vault_Settings SHALL display last backup date if available

### Requirement 6: Security Measures

**User Story:** As a security-conscious user, I want appropriate safeguards on sensitive operations, so that I don't accidentally expose my data.

#### Acceptance Criteria

1. WHEN copying mnemonic, THE Vault_Settings SHALL blur/hide the mnemonic by default with a "reveal" toggle
2. WHEN the mnemonic is revealed, THE Vault_Settings SHALL auto-hide it after 30 seconds
3. WHEN performing any destructive action, THE Confirmation_Dialog SHALL require explicit user confirmation
4. THE Vault_Settings SHALL log security-sensitive actions to console for debugging (without exposing sensitive data)
5. WHEN the vault is locked during an operation, THE Vault_Settings SHALL cancel the operation and show appropriate message

