# ArtCatalog – Backend API

ArtCatalog is a backend service for managing artists and artworks.  
The project uses a clean, modern backend stack:

**Node.js + Express + TypeScript + Prisma ORM + PostgreSQL**

---

## 🚀 Getting Started (Development)

```bash
cd backend
npm install
npm run dev
```

Server runs at:

```
http://localhost:3000
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend` folder:

```env
PORT=3000
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/art_catalog?schema=public"
```

A template is available in `sample.env`.

---

## 🗄️ Prisma ORM

Schema location:

```
backend/prisma/schema.prisma
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev --name init
```

Open database GUI (Prisma Studio):

```bash
npx prisma studio
```

---

## 🧱 Project Structure

```
backend/
  prisma/
    schema.prisma
    migrations/
  src/
    app.ts
    prisma.ts
    routes/
    controllers/
    middlewares/
    generated/
    libs/
    utils/
  .env
  sample.env
  tsconfig.json
  package.json
  README.md
```

---

## 📡 Endpoints (MVP)

### GET /

Health check.  
**Returns:** `"ArtCatalog API running"`

### GET /api/artists

Returns all artists.

- `[]` if database is empty
- list of artists if present

---

## 🛠️ Production Build

```bash
npm run build
npm start
```

---

## 📦 Technologies

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- ts-node-dev (dev mode)

---

## 📝 TODO (Roadmap)

- [ ] POST /api/artists
- [ ] GET /api/artworks
- [ ] Controller/service structure
- [ ] Zod validation
- [ ] Authentication (JWT)
- [ ] Pagination & filtering
- [ ] Frontend integration (React/Next.js)
- [ ] Deployment workflow

---

## 📄 License

MIT License.
