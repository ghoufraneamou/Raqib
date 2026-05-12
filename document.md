# AMMPS — notes projet

## Ce qu’elle doit faire après un `git clone` depuis GitHub

Remplace `URL_DU_REPO` par l’URL que tu lui donnes (HTTPS ou SSH).

### 1. Cloner le dépôt

```bash
git clone URL_DU_REPO
cd Ghoufrane
```

(Le nom du dossier peut être différent si le dépôt s’appelle autrement — elle doit `cd` dans le dossier racine du projet.)

### 2. MySQL — créer la base (une fois)

Connecte-toi à MySQL (`mysql -u root -p` ou ton client habituel), puis :

```sql
CREATE DATABASE ammps_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Les tables d’authentification sont créées **automatiquement** au premier démarrage du backend si la base existe et que les variables ci-dessous sont correctes. Tu peux aussi importer le fichier :

```bash
mysql -u root -p ammps_auth < backend/schema_mysql.sql
```

### 3. Backend (Python)

```bash
cd Ghoufrane
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

Configurer les variables (copier le modèle puis éditer) :

```bash
cp backend/.env.example backend/.env
```

Ouvre `backend/.env` et remplis au minimum :

- `AMMPS_MYSQL_HOST`, `AMMPS_MYSQL_PORT`, `AMMPS_MYSQL_USER`, `AMMPS_MYSQL_PASSWORD`, `AMMPS_MYSQL_DATABASE`
- `AMMPS_JWT_SECRET` (chaîne longue et aléatoire en production)
- optionnel : `AMMPS_SMTP_*` pour l’envoi d’e-mails réels
- pour les tests sans lire les mails : `AMMPS_AUTH_DEV=1` (le code OTP apparaît aussi dans les réponses JSON)

Lancer le backend en chargeant automatiquement `backend/.env` :

```bash
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --env-file backend/.env
```

(Si `--env-file` pose problème avec ta version d’uvicorn, exporte les variables à la main dans le terminal avant `uvicorn`.)

L’API est sur **http://127.0.0.1:8000** — doc interactive : **http://127.0.0.1:8000/docs**

### 4. Frontend (Node)

**Nouveau terminal** (garder le backend lancé dans l’autre) :

```bash
cd Ghoufrane/frontend
npm install
npm run dev
```

Ouvre l’URL affichée (souvent **http://localhost:5173**).

Optionnel : copier `frontend/.env.example` vers `frontend/.env` et définir `VITE_API_URL` si le backend n’est pas sur `http://127.0.0.1:8000`.

### 5. Entraînement YOLO (optionnel)

```bash
cd Ghoufrane/backend
source .venv/bin/activate
python train_yolo.py --epochs 35 --batch 8 --device cpu
```

Le meilleur modèle est copié vers `backend/weights/best.pt`.

---

## Rappel auth (MySQL)

- **Inscription** : code à 6 chiffres par e-mail, puis validation.
- **Connexion** : e-mail + mot de passe → envoi du code → e-mail + mot de passe + code → session (JWT).

Détails des endpoints : `POST /auth/register/start`, `/auth/register/verify`, `/auth/login/send-code`, `/auth/login/verify` (voir `/docs`).

---

## Fichiers utiles

| Fichier | Rôle |
|---------|------|
| `backend/.env.example` | Modèle des variables backend (MySQL, JWT, SMTP, `AMMPS_AUTH_DEV`) |
| `backend/schema_mysql.sql` | Schéma SQL optionnel pour MySQL |
| `frontend/.env.example` | URL du backend pour le front |
