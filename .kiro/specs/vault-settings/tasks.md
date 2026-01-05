# Implementation Plan: Vault Settings

## Overview

Implementasi fitur Vault Settings dengan pendekatan incremental. Dimulai dari service layer, kemudian komponen UI, dan terakhir integrasi dengan AppSettings yang sudah ada.

## Tasks

- [x] 1. Create ClipboardManager service
  - Create `src/lib/clipboard.ts`
  - Implement `copyToClipboard(text: string): Promise<boolean>`
  - Implement `clearClipboard(): Promise<void>`
  - Implement `scheduleClipboardClear(delayMs: number): void` with timer management
  - _Requirements: 1.3, 1.6_

- [x] 2. Extend BackupManager functionality
  - [x] 2.1 Add backup download function to `src/lib/crypto.ts`
    - Implement `downloadBackup(backup: VaultBackup): void` to trigger file download
    - Generate filename with format `hadesnotes-backup-{YYYY-MM-DD}.json`
    - _Requirements: 2.2, 2.3_
  
  - [x] 2.2 Add backup file parsing function
    - Implement `parseBackupFile(file: File): Promise<VaultBackup>`
    - Validate backup structure and version
    - _Requirements: 3.2, 3.6_
  
  - [x] 2.3 Add backup preview function
    - Implement `getBackupPreview(backup: VaultBackup, key: Uint8Array): Promise<BackupPreview | null>`
    - Return note count, notebook count, tag count, backup date
    - _Requirements: 3.4_
  
  - [ ]* 2.4 Write property test for backup round-trip
    - **Property 2: Backup Round-Trip Consistency**
    - **Validates: Requirements 2.4, 3.3, 3.5**

- [x] 3. Create ConfirmationDialog component
  - Create `src/components/ConfirmationDialog.tsx`
  - Support `variant: 'default' | 'danger'` for styling
  - Support `requireInput` prop for typed confirmation
  - Implement input validation for delete confirmation
  - _Requirements: 1.2, 4.2, 4.3, 4.4, 6.3_

  - [ ]* 3.1 Write property test for delete confirmation input
    - **Property 3: Delete Confirmation Input Validation**
    - **Validates: Requirements 4.4**

- [x] 4. Create VaultSettings component
  - [x] 4.1 Create base VaultSettings component
    - Create `src/components/VaultSettings.tsx`
    - Display vault status (locked/unlocked indicator)
    - Display vault ID preview (first 8 chars)
    - Display current encryption algorithm
    - _Requirements: 5.2, 5.3_
  
  - [x] 4.2 Implement Security section
    - Add "Copy Mnemonic" button with blur/reveal toggle
    - Implement 30-second auto-hide timer for revealed mnemonic
    - Add confirmation dialog before copy
    - Integrate with ClipboardManager
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2_
  
  - [x] 4.3 Implement Backup section
    - Add "Create Backup" button
    - Add "Restore Backup" button with file picker
    - Show last backup date if available
    - Implement backup preview dialog before restore
    - _Requirements: 2.1, 2.5, 3.1, 3.4, 5.6_
  
  - [x] 4.4 Implement Danger Zone section
    - Add red/warning styling for section
    - Add "Delete Account" button with danger variant
    - Implement 2-step confirmation flow
    - Integrate with vaultStore.destroyVault() and db.clearAll()
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 5.5_

  - [ ]* 4.5 Write property test for vault action buttons state
    - **Property 1: Vault Action Buttons State**
    - **Validates: Requirements 1.1, 1.5, 2.1, 2.7, 3.1, 4.1**

  - [ ]* 4.6 Write property test for vault info display
    - **Property 5: Vault Info Display Accuracy**
    - **Validates: Requirements 5.2, 5.3, 5.6**

- [x] 5. Integrate VaultSettings into AppSettings
  - Add "Vault" tab to AppSettings TabsList
  - Import and render VaultSettings component in new TabsContent
  - Add Shield/Lock icon for Vault tab
  - _Requirements: 5.1, 5.4_

- [x] 6. Implement error handling and edge cases
  - [x] 6.1 Add error handling for all async operations
    - Wrap operations in try-catch
    - Display appropriate toast notifications for errors
    - Log errors to console (without sensitive data)
    - _Requirements: 2.6, 3.6, 3.7, 4.7, 6.4_
  
  - [x] 6.2 Handle vault lock during operations
    - Check vault lock state before and during operations
    - Cancel operations and show message if vault becomes locked
    - _Requirements: 6.5_

  - [ ]* 6.3 Write property test for operations abort on vault lock
    - **Property 7: Operations Abort on Vault Lock**
    - **Validates: Requirements 6.5**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Final integration and polish
  - [x] 8.1 Add toast notifications for all user actions
    - Success toast for copy mnemonic
    - Success toast for backup created
    - Success toast for restore completed
    - Success toast for account deleted
    - _Requirements: 1.4, 2.5, 4.6_
  
  - [x] 8.2 Store and display last backup date
    - Save backup date to localStorage after successful backup
    - Display formatted date in Backup section
    - _Requirements: 5.6_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests
- Each task references specific requirements for traceability
- Property tests use fast-check library with minimum 100 iterations
- Unit tests complement property tests for edge cases and error conditions
- Checkpoints ensure incremental validation

