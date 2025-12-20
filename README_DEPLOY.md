## Deploy (Ubuntu) — run alongside other services (no Traefik)

1. DNS

- Point your domain A record to the server public IP (if you will use host Nginx for TLS).

2. Ports used by this project

- Frontend is served from container nginx (container port `2000`) and mapped to host port `2000`.
- Backend listens inside container on `2001` (set via `PORT=2001`) and is mapped to host port `2001`.

3. Build & run

```bash
cd /var/www/t/dookon.uz
sudo docker compose up -d --build
```

4. Host Nginx (example) — proxy to containers

- Create `/etc/nginx/sites-available/dookon.conf` with:

```nginx
server {
	listen 80;
	server_name yourdomain.com www.yourdomain.com;

	location /api/ {
		proxy_pass http://127.0.0.1:2001/;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}

	location / {
		proxy_pass http://127.0.0.1:2000/;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}
}
```

- Enable and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/dookon.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

5. SSL (Let's Encrypt)

- Use Certbot on the host Nginx (since ports 80/443 are owned by host Nginx):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

6. Check

- Visit `https://yourdomain.com` and `https://yourdomain.com/api/`

Notes:

- The backend container now runs on internal port `2001`; host mapping `2001:2001` lets host Nginx reach it.
- If you need different host ports within `2000-2999`, adjust `docker-compose.yml` accordingly.
