# Belajar Vibe Coding - Part 1: REST API with Elysia, Drizzle, and Bun

Aplikasi ini adalah REST API sederhana yang mengelola autentikasi pengguna (registrasi, login, manajemen sesi) dan operasi CRUD dasar untuk data pengguna. Aplikasi ini dibuat sebagai bagian dari pembelajaran Vibe Coding.

## Arsitektur dan Struktur File

Proyek ini dirancang dengan arsitektur modular yang memisahkan routing, *business logic*, dan konfigurasi database.

```text
belajar-part1/
├── src/                  # Direktori utama source code
│   ├── db/               # Konfigurasi database dan skema
│   │   ├── index.ts      # Inisialisasi koneksi Drizzle ORM
│   │   └── schema.ts     # Definisi tabel database (users, sessions)
│   ├── routes/           # Definisi routing endpoint API
│   │   └── users-route.ts# Routing khusus autentikasi pengguna
│   ├── services/         # Business logic aplikasi
│   │   └── users-service.ts # Logika inti untuk registrasi, login, dll
│   └── index.ts          # Entry point aplikasi, setup server Elysia & global routes
├── tests/                # Direktori pengujian unit (Unit Tests)
│   └── users.test.ts     # Kumpulan test case komprehensif menggunakan `bun test`
├── .env                  # Variabel lingkungan (contoh: DATABASE_URL, PORT)
├── bun.lock              # Lock file dependensi Bun
├── drizzle.config.ts     # Konfigurasi Drizzle Kit untuk migrasi database
├── package.json          # Definisi metadata proyek, dependensi, dan script
└── tsconfig.json         # Konfigurasi TypeScript
```

## Technology Stack & Library

*   **Runtime:** [Bun](https://bun.sh) - JavaScript/TypeScript runtime terintegrasi yang sangat cepat.
*   **Bahasa Pemrograman:** TypeScript.
*   **Web Framework:** [ElysiaJS](https://elysiajs.com/) - Framework web yang sangat cepat dan dioptimalkan untuk Bun.
*   **Database:** MySQL / MariaDB.
*   **ORM:** [Drizzle ORM](https://orm.drizzle.team/) (`drizzle-orm`) - TypeScript ORM yang *type-safe*.
*   **Database Driver:** `mysql2`.
*   **Keamanan:** `bcrypt` - Untuk hashing dan komparasi kata sandi.
*   **Tools:** `drizzle-kit` (untuk generate dan migrasi skema database).

## Schema Database

Aplikasi ini menggunakan skema database relasional sederhana dengan dua tabel utama:

1.  **`users`** (Tabel Pengguna)
    *   `id`: Serial / Primary Key
    *   `name`: Varchar(255), Not Null
    *   `email`: Varchar(255), Not Null, Unique
    *   `password`: Varchar(255), Not Null (Disimpan dalam bentuk *hash*)
    *   `created_at`: Timestamp, Default Now()

2.  **`sessions`** (Tabel Sesi Login)
    *   `id`: Serial / Primary Key
    *   `token`: Varchar(255), Not Null (UUID token autentikasi)
    *   `user_id`: BigInt (Unsigned), Not Null, Foreign Key mereferensi ke `users.id`
    *   `created_at`: Timestamp, Default Now()

## API Endpoint yang Tersedia

Berikut adalah daftar endpoint API yang tersedia di aplikasi ini:

*   **Health Check**
    *   `GET /` : Memeriksa status kesehatan server aplikasi.
*   **User Authentication**
    *   `POST /api/users` : Mendaftarkan pengguna baru. (Payload Body: `name`, `email`, `password`)
    *   `POST /api/users/login` : Login pengguna dan mendapatkan token otorisasi. (Payload Body: `email`, `password`)
    *   `GET /api/users/current` : Mendapatkan detail pengguna yang sedang login. (Header: `Authorization: Bearer <token>`)
    *   `DELETE /api/users/logout` : Logout pengguna dan menghapus token sesi yang aktif. (Header: `Authorization: Bearer <token>`)
*   **User Management (CRUD)**
    *   `GET /users` : Mendapatkan daftar seluruh pengguna.
    *   `GET /users/:id` : Mendapatkan detail spesifik pengguna berdasarkan parameter ID.
    *   `DELETE /users/:id` : Menghapus pengguna berdasarkan parameter ID.

## Cara Setup Project

1.  **Install Bun:** Pastikan Bun sudah terpasang di sistem Anda. Jika belum, instal menggunakan perintah:
    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```
2.  **Clone Repositori:** Clone repositori ini ke komputer lokal Anda.
3.  **Install Dependencies:** Buka terminal di direktori proyek dan jalankan:
    ```bash
    bun install
    ```
4.  **Konfigurasi Environment:** Pastikan ada file `.env` di root direktori dengan struktur sebagai berikut:
    ```env
    DATABASE_URL=mysql://root:root@127.0.0.1:3306/belajar_vibe_coding
    PORT=3000
    ```
    *(Sesuaikan username, password, dan port database dengan sistem lokal Anda)*
5.  **Siapkan Database:**
    *   Pastikan servis MySQL/MariaDB sudah menyala. Anda dapat menggunakan Docker container atau servis MySQL lokal.
    *   Buat database (jika belum ada): `CREATE DATABASE belajar_vibe_coding;`
    *   Jalankan migrasi Drizzle untuk membuat tabel:
        ```bash
        bun run db:generate
        bun run db:migrate
        ```

## Cara Run Aplikasi

Untuk menjalankan aplikasi dalam mode *development* (otomatis me-restart server ketika ada perubahan kode), jalankan perintah:

```bash
bun run dev
```

Server akan mulai berjalan secara default di `http://localhost:3000`.

## Cara Test Aplikasi

Proyek ini telah dikonfigurasi dengan serangkaian pengujian unit test end-to-end yang komprehensif menggunakan *test runner* bawaan Bun (`bun test`).

**Peringatan Penting Sebelum Testing:** Test suite ini menggunakan *hook* `beforeEach` yang akan **menghapus secara permanen semua data di tabel `users` dan `sessions`** untuk memastikan konsistensi state. Sangat disarankan untuk menjalankan testing pada environment/database lokal yang ditujukan *khusus* untuk testing.

Untuk menjalankan seluruh *test suite*, jalankan perintah:

```bash
bun run test
```

Perintah di atas akan menjalankan skenario pengujian positif maupun negatif terhadap seluruh endpoint aplikasi untuk memastikan validasi dan logika berjalan sesuai yang diharapkan.
