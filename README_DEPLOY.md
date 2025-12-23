# Dookon.uz - Deployment Instructions

Dookon lohiyasini Ubuntu serverga Docker orqali joylashtirish bo'yicha qo'llanma.

## 1. Tayyorgarlik (Ubuntu Serverda)

Serverga Docker va Docker Compose o'rnatilgan bo'lishi kerak:
```bash
# Docker o'rnatish
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
```

## 2. Loyihani yuklab olish

Dookon loyihasini GitHub'dan serverga klon qiling:
```bash
git clone <Sizning_GitHub_Repo_URL> dookon
cd dookon
```

## 3. Environment Variables (.env)

Loyiha ildizida (root) `.env` faylini yarating:
```bash
nano .env
```
Fayl ichiga quyidagilarni yozing:
```env
POSTGRES_USER=dookon_user
POSTGRES_PASSWORD=qattiq_parol_bu_erda
POSTGRES_DB=dookon_prod
JWT_SECRET=maxfiy_kalit_juda_uzun_bo'lsin
```

## 4. Docker orqali ishga tushirish

Loyiha ildizida turib quyidagi komandani bering:
```bash
docker-compose up -d --build
```
Bu komanda:
- Postgres bazasini yaratadi.
- Backendni build qiladi va `2001` portida ochadi.
- Frontendni build qiladi va `2000` portida ochadi.

## 5. Nginx (Reverse Proxy) sozlamalari

Serveringizda asosiy Nginx o'rnatilgan bo'lishi kerak. `/etc/nginx/sites-available/dookon` faylini yarating:

### Frontend (dookon.uz)
```nginx
server {
    listen 80;
    server_name dookon.uz www.dookon.uz;

    location / {
        proxy_pass http://localhost:2000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backend (api.dookon.uz)
```nginx
server {
    listen 80;
    server_name api.dookon.uz;

    location / {
        proxy_pass http://localhost:2001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sertifikatlar (SSL) uchun `certbot` dan foydalaning:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d dookon.uz -d www.dookon.uz -d api.dookon.uz
```

## 6. Bazani Migratsiya qilish

Konteynerlar yonganidan so'ng bazani sozlash uchun:
```bash
docker exec -it dookon-backend npx prisma migrate deploy
docker exec -it dookon-backend npx tsx prisma/reset.ts
```

Tayyor! Endi saytingiz https://dookon.uz orqali ishlashi kerak.
