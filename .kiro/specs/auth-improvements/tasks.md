# Implementation Plan: Auth Improvements

## Overview

Implementasi fitur logout, perbaikan tampilan login, dan fitur "Remember Me" untuk aplikasi HadesNotes. Implementasi akan dilakukan secara bertahap dengan fokus pada keamanan dan pengalaman pengguna.

## Tasks

- [x] 1. Update VaultStore dengan fitur Remember Me dan Logout
  - [x] 1.1 Tambahkan interface SessionToken dan RememberMeSettings di vaultStore.ts
    - Definisikan SessionToken interface dengan encryptedMnemonic, createdAt, expiresAt, vaultId, version
    - Definisikan RememberMeSettings interface dengan enabled dan duration
    - _Requirements: 3.1, 3.6, 4.1_

  - [x] 1.2 Tambahkan state dan actions baru di vaultStore
    - Tambahkan rememberMeSettings state
    - Tambahkan hasSessionToken computed state
    - Implementasi setRememberMe action
    - Implementasi saveSessionToken action
    - Implementasi clearSessionToken action
    - Implementasi autoUnlockWithToken action
    - Implementasi logout action
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.2, 3.3, 3.5, 3.7_

  - [ ]* 1.3 Write property test untuk logout clears encryption key
    - **Property 1: Logout clears encryption key**
    - **Validates: Requirements 1.1**

  - [ ]* 1.4 Write property test untuk session token encryption round-trip
    - **Property 2: Session token encryption round-trip**
    - **Validates: Requirements 3.4**

- [ ] 2. Implementasi Session Token Management
  - [ ] 2.1 Buat fungsi enkripsi dan dekripsi session token di crypto.ts
    - Implementasi encryptSessionToken function
    - Implementasi decryptSessionToken function
    - Implementasi generateTokenChecksum function
    - _Requirements: 3.4, 4.1, 4.4_

  - [ ] 2.2 Implementasi token storage dan retrieval
    - Implementasi saveTokenToStorage function
    - Implementasi loadTokenFromStorage function
    - Implementasi clearTokenFromStorage function
    - Implementasi validateTokenIntegrity function
    - _Requirements: 3.2, 3.8, 4.3, 4.4_

  - [ ]* 2.3 Write property test untuk expired token rejection
    - **Property 3: Expired token rejection**
    - **Validates: Requirements 3.5**

  - [ ]* 2.4 Write property test untuk token integrity validation
    - **Property 4: Token integrity validation**
    - **Validates: Requirements 4.4**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 4. Buat komponen LogoutConfirmationDialog
  - [x] 4.1 Buat file LogoutConfirmationDialog.tsx
    - Implementasi dialog dengan opsi Cancel dan Logout
    - Tambahkan checkbox untuk "Keep Remember Me" jika Remember Me aktif
    - Styling sesuai dark theme aplikasi
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [-] 5. Buat komponen LogoutButton
  - [x] 5.1 Buat file LogoutButton.tsx
    - Implementasi tombol logout dengan icon
    - Integrasi dengan LogoutConfirmationDialog
    - Styling yang konsisten dengan aplikasi
    - _Requirements: 1.5, 1.6_

- [-] 6. Perbaiki tampilan UnlockVault (Login)
  - [x] 6.1 Update UnlockVault.tsx dengan UI yang lebih baik
    - Tambahkan animasi dan transisi
    - Perbaiki spacing dan typography
    - Tambahkan visual feedback yang lebih baik (loading states, success/error)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 6.2 Tambahkan Remember Me checkbox dan duration selector
    - Implementasi checkbox "Remember Me"
    - Implementasi dropdown untuk durasi (7 hari, 30 hari, sampai logout)
    - Integrasi dengan vaultStore
    - _Requirements: 3.1, 3.6_

  - [x] 6.3 Pastikan responsif untuk mobile dan desktop
    - Test dan perbaiki layout untuk berbagai ukuran layar
    - _Requirements: 2.7_

- [-] 7. Perbaiki tampilan VaultAuth (Landing Page)
  - [x] 7.1 Update VaultAuth.tsx dengan desain yang lebih menarik
    - Perbaiki layout dan spacing
    - Tambahkan animasi entrance
    - Perbaiki card design
    - _Requirements: 2.1, 2.3, 2.4_

- [-] 8. Integrasi Logout Button ke aplikasi
  - [x] 8.1 Tambahkan LogoutButton ke Sidebar.tsx
    - Tempatkan di footer sidebar
    - _Requirements: 1.5_

  - [x] 8.2 Tambahkan LogoutButton ke MiniSidebar.tsx
    - Tempatkan di footer mini sidebar
    - _Requirements: 1.5_

  - [x] 8.3 Tambahkan LogoutButton ke AppSettings atau header mobile
    - Pastikan accessible dari semua view
    - _Requirements: 1.5_

- [ ] 9. Implementasi Auto-Unlock pada App Load
  - [ ] 9.1 Update App.tsx untuk check session token saat load
    - Check hasSessionToken saat aplikasi dimuat
    - Panggil autoUnlockWithToken jika token ada
    - Handle expired/invalid token dengan redirect ke login
    - _Requirements: 3.3, 3.5, 4.2, 4.3_

  - [ ]* 9.2 Write property test untuk Remember Me persistence after logout
    - **Property 5: Remember Me persistence after logout**
    - **Validates: Requirements 1.4**

  - [ ]* 9.3 Write property test untuk complete session clear on explicit logout
    - **Property 6: Complete session clear on explicit logout**
    - **Validates: Requirements 1.3**

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Focus on security: session tokens must be encrypted and validated
