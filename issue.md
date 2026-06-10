# Fitur: Dokumentasi API dengan Swagger

## Deskripsi Tugas
Kita perlu menambahkan fitur dokumentasi API menggunakan Swagger ke dalam project ini. Project ini menggunakan **ElysiaJS** dengan runtime **Bun**. Tujuan dari task ini adalah agar pengembang lain atau frontend developer yang ingin mengonsumsi API ini bisa dengan mudah melihat endpoint yang tersedia, parameter yang dibutuhkan, dan response yang akan dikembalikan melalui antarmuka Swagger UI.

## Target Audiens
Dokumen ini disusun agar mudah dipahami dan diimplementasikan oleh Junior Programmer atau AI Assistant. Ikuti langkah-langkah di bawah ini secara berurutan.

## Langkah-langkah Implementasi

### 1. Instalasi Plugin Swagger untuk Elysia
ElysiaJS memiliki plugin resmi untuk Swagger. Langkah pertama adalah menginstal package tersebut.

**Action:**
Jalankan perintah berikut di terminal pada root direktori project:
```bash
bun add @elysiajs/swagger
```

### 2. Integrasi Swagger di Aplikasi Utama
Setelah terinstal, kita perlu mendaftarkan plugin Swagger ke instance Elysia utama kita.

**Action:**
1. Buka file utama aplikasi, yaitu `src/index.ts` (atau file entry point utama project ini).
2. Lakukan import plugin swagger di bagian atas file:
   ```typescript
   import { swagger } from '@elysiajs/swagger';
   ```
3. Tambahkan `.use(swagger())` pada instance Elysia. Sebaiknya diletakkan di bagian atas rantai (chain) sebelum mendaftarkan route lain agar dokumentasinya mencakup semua route di bawahnya.
   
   Contoh penerapan yang diharapkan:
   ```typescript
   import { Elysia } from 'elysia';
   import { swagger } from '@elysiajs/swagger';
   // import route lain...

   const app = new Elysia()
     .use(swagger({
       path: '/swagger', // URL untuk mengakses Swagger UI
       documentation: {
         info: {
           title: 'API Documentation',
           version: '1.0.0',
           description: 'Dokumentasi API untuk project ini'
         }
       }
     }))
     // .use(userRoute)
     // ...
     .listen(3000);
   ```

### 3. Menguji Swagger UI
Setelah plugin ditambahkan, kita harus memastikan bahwa Swagger UI sudah berjalan dengan baik.

**Action:**
1. Jalankan server lokal:
   ```bash
   bun run dev
   ```
2. Buka browser dan akses `http://localhost:3000/swagger` (atau port berapapun yang digunakan oleh aplikasi).
3. Pastikan halaman Swagger UI muncul dan menampilkan endpoint API yang sudah ada.

### 4. Menambahkan Detail pada Endpoint (Opsional tapi Direkomendasikan)
Agar dokumentasi Swagger lebih rapi dan informatif, kita bisa mengelompokkan endpoint menggunakan tags dan memberikan deskripsi (summary).

**Action:**
Pada setiap definisi route, tambahkan object konfigurasi ketiga yang berisi `detail`.
Contoh:
```typescript
app.get('/users', () => {
    return 'Daftar User';
}, {
    detail: {
        summary: 'Mendapatkan daftar semua user',
        tags: ['Users']
    }
});
```

## Kriteria Penerimaan (Acceptance Criteria)
- [ ] Dependency `@elysiajs/swagger` berhasil ditambahkan ke `package.json`.
- [ ] Plugin Swagger berhasil didaftarkan di dalam instance Elysia utama.
- [ ] Halaman Swagger UI bisa diakses melalui URL `/swagger` saat aplikasi dijalankan.
- [ ] Dokumentasi Swagger menampilkan minimal informasi dasar (Title dan Version).

---
**Catatan untuk Implementator:** Silakan periksa struktur kode di `src/index.ts` saat ini. Pastikan Anda menyisipkan `.use(swagger(...))` dengan benar pada chain method Elysia yang sudah ada.
