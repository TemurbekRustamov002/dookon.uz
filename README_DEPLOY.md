# Deploy (Ubuntu) — one domain with Traefik

1. DNS

- Point your domain A record to the server public IP.

2. Update values

- Edit `docker-compose.yml` and replace `yourdomain.com` and `you@domain.com` with real values.

3. Build & run

```bash
sudo mkdir -p /home/ubuntu/dookon/letsencrypt
cd /home/ubuntu/dookon  # place repository here or adjust paths
sudo docker compose up -d --build
```

4. Check

- Visit `https://yourdomain.com` and `https://yourdomain.com/api/`

Notes:

- Backend runs on port 3000 inside container — ensure app listens on `process.env.PORT || 3000`.
- Frontend uses Vite build output (`dist`) served by nginx inside container.
- Certs stored in `./letsencrypt` volume; keep it persistent.
