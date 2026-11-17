# Security Specification — Portofolio Ketenagalistrikan Firestore

## 1. Data Invariants
1. **Default-Deny Catch-All**: Semua path yang tidak didefinisikan eksplisit ditolak (`allow read, write: if false`).
2. **Email Verified Gate**: Semua operasi tulis terautentikasi mewajibkan `request.auth.token.email_verified == true`.
3. **PII Isolation (`inquiries`)**: Dokumen pesan berisi `senderEmail` hanya dapat dibaca (`get`, `list`) oleh pemilik (`senderUid == request.auth.uid`) atau `isAdmin()`.
4. **Admin Bootstrapping**: Admin adalah pengguna dengan `email == "ramdhani2rabbit@gmail.com"` dan `email_verified == true`, atau memiliki dokumen di `/admins/$(request.auth.uid)`.
5. **Path Variable Hardening**: Semua ID dokumen (`projectId`, `inquiryId`, `calcId`, `userId`) divalidasi dengan `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, maks 128 karakter) pada operasi single-document (`get`, `create`, `update`, `delete`).
6. **Temporal Integrity & Immutability**: `createdAt` wajib sama dengan `request.time` saat pembuatan dan tidak dapat diubah pada pembaruan; `senderUid`, `ownerUid`, dan `authorUid` bersifat imutabel.
7. **Terminal State Locking (`inquiries`)**: Pengirim non-admin tidak dapat mengubah status `arsip` kembali menjadi `baru` atau memodifikasi status tindak lanjut admin.

## 2. "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Inquiry Create**: `POST /inquiries/inq-1` tanpa token auth.
2. **Unverified Email Create**: `POST /inquiries/inq-1` dengan `email_verified: false`.
3. **Identity Spoofing on Inquiry**: `POST /inquiries/inq-2` dengan `senderUid != request.auth.uid`.
4. **Shadow Field Injection**: `POST /inquiries/inq-3` menyertakan field liar `isApproved: true`.
5. **Status Bypass on Create**: `POST /inquiries/inq-4` dengan `status: "dibalas"` (wajib `"baru"` saat dibuat).
6. **PII Cross-User Read**: User B mencoba `GET /inquiries/inq-user-a`.
7. **Blanket List Scraping**: User B mencoba `LIST /inquiries` tanpa filter `where('senderUid', '==', uidB)`.
8. **ID Poisoning**: `POST /calculations/bad..id..with..1500..chars` melanggar regex/batas 128 karakter.
9. **Client Timestamp Forgery**: `POST /calculations/calc-1` dengan `createdAt` palsu bukan `request.time`.
10. **Non-Admin Project Tampering**: User biasa mencoba `POST /projects/proj-1` atau `UPDATE /projects/proj-1`.
11. **Unbounded Array / Payload DoW**: Admin mencoba menulis `components` berjumlah > 12 item atau string > 2000 karakter.
12. **Terminal State Re-open by Sender**: Pengirim mencoba mengubah `inquiries` berstatus `arsip` atau mengedit field `status`.
