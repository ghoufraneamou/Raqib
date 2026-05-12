"""
Authentification : MySQL, OTP 6 chiffres par e-mail, JWT.
Connexion : e-mail + mot de passe + code.

Variables d'environnement MySQL :
  AMMPS_MYSQL_HOST
  AMMPS_MYSQL_PORT
  AMMPS_MYSQL_USER
  AMMPS_MYSQL_PASSWORD
  AMMPS_MYSQL_DATABASE

Autres :
  AMMPS_JWT_SECRET
  AMMPS_AUTH_DEV=1
  AMMPS_SMTP_*
"""

from __future__ import annotations

import hashlib
import os
import secrets
import smtplib
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import make_msgid
from pathlib import Path
from typing import Any, Dict, Generator, Optional, Tuple

import pymysql
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymysql.cursors import DictCursor

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
_lock = threading.Lock()

JWT_SECRET = os.getenv("AMMPS_JWT_SECRET", "dev-insecure-change-me")
JWT_ALG = "HS256"
JWT_EXPIRE_HOURS = 72
OTP_TTL_MINUTES = 10
AUTH_DEV = os.getenv("AMMPS_AUTH_DEV", "0") == "1"

MYSQL_HOST = os.getenv("AMMPS_MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("AMMPS_MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("AMMPS_MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("AMMPS_MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("AMMPS_MYSQL_DATABASE", "ammps_auth")


def _mysql_params() -> Dict[str, Any]:
    return {
        "host": MYSQL_HOST,
        "port": MYSQL_PORT,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "database": MYSQL_DATABASE,
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
        "autocommit": False,
    }


@contextmanager
def get_connection() -> Generator[pymysql.connections.Connection, None, None]:
    conn = pymysql.connect(**_mysql_params())
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    ddl_users = """
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL DEFAULT '',
      verified TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME(6) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """

    ddl_otp = """
    CREATE TABLE IF NOT EXISTS otp_codes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      purpose VARCHAR(32) NOT NULL,
      code_hash CHAR(64) NOT NULL,
      expires_at DATETIME(6) NOT NULL,
      consumed TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      KEY idx_otp_email_purpose (email, purpose, consumed)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """

    with _lock:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(ddl_users)
                cur.execute(ddl_otp)


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _gen_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000:06d}"


def _smtp_config() -> Tuple[str, int, str, str, str]:
    host = os.getenv("AMMPS_SMTP_HOST", "").strip()
    port = int(os.getenv("AMMPS_SMTP_PORT", "587"))
    user = os.getenv("AMMPS_SMTP_USER", "").strip()
    password = os.getenv("AMMPS_SMTP_PASSWORD", "").strip()
    mail_from = os.getenv("AMMPS_MAIL_FROM", user).strip()
    return host, port, user, password, mail_from


def _logo_paths() -> Tuple[str, str]:
    raqib_logo_path = os.getenv(
        "RAQIB_LOGO_PATH",
        str(BASE_DIR / "assets" / "raqib_logo.png"),
    )

    ammps_logo_path = os.getenv(
        "AMMPS_LOGO_PATH",
        str(BASE_DIR / "assets" / "logo_ammps.png"),
    )

    return raqib_logo_path, ammps_logo_path


def _attach_logos(msg: EmailMessage, raqib_cid: str, ammps_cid: str) -> None:
    raqib_logo_path, ammps_logo_path = _logo_paths()

    if os.path.exists(raqib_logo_path):
        with open(raqib_logo_path, "rb") as img:
            msg.get_payload()[1].add_related(
                img.read(),
                maintype="image",
                subtype="png",
                cid=raqib_cid,
            )

    if os.path.exists(ammps_logo_path):
        with open(ammps_logo_path, "rb") as img:
            msg.get_payload()[1].add_related(
                img.read(),
                maintype="image",
                subtype="png",
                cid=ammps_cid,
            )


def send_email_otp(to_email: str, code: str, purpose_fr: str) -> None:
    subject = f"RAQIB — Code de vérification ({purpose_fr})"

    host, port, user, password, mail_from = _smtp_config()

    print("🔵 SMTP START")
    print("host:", host)
    print("user:", user)

    if not host:
        print("❌ SMTP NOT CONFIGURED")
        print("OTP:", code)
        return

    raqib_cid = make_msgid(domain="raqib.local")
    ammps_cid = make_msgid(domain="ammps.local")

    raqib_cid_clean = raqib_cid[1:-1]
    ammps_cid_clean = ammps_cid[1:-1]

    plain_text = (
        f"Bonjour,\n\n"
        f"Votre code à 6 chiffres ({purpose_fr}) est : {code}\n\n"
        f"Ce code expire dans {OTP_TTL_MINUTES} minutes.\n\n"
        f"Cordialement,\n"
        f"L'équipe RAQIB\n"
        f"AMMPS\n"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <body style="margin:0; padding:0; background-color:#f4f7f5; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f5; padding:30px 0;">
            <tr>
                <td align="center">
                    <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e1e8e3;">

                        <tr>
                            <td style="background:linear-gradient(135deg,#0b5d2a,#2f9e44); padding:28px 30px; text-align:center;">
                                <h1 style="margin:0; color:#ffffff; font-size:24px;">
                                    Code de vérification
                                </h1>
                                <p style="margin:8px 0 0; color:#e9f7ee; font-size:14px;">
                                    Plateforme intelligente de conformité réglementaire
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:34px 38px; color:#1f2933;">
                                <p style="font-size:16px; margin:0 0 18px;">Bonjour,</p>

                                <p style="font-size:15px; line-height:1.7; margin:0 0 22px;">
                                    Voici votre code de vérification pour votre demande de
                                    <strong style="color:#0b5d2a;">{purpose_fr}</strong>.
                                </p>

                                <div style="text-align:center; margin:28px 0;">
                                    <div style="display:inline-block; background-color:#f0f8f3; border:1px solid #cdebd5; border-radius:12px; padding:18px 34px;">
                                        <span style="font-size:34px; font-weight:bold; letter-spacing:8px; color:#0b5d2a;">
                                            {code}
                                        </span>
                                    </div>
                                </div>

                                <p style="font-size:14px; line-height:1.7; color:#44524a;">
                                    Ce code est valable pendant <strong>{OTP_TTL_MINUTES} minutes</strong>.
                                    Pour des raisons de sécurité, ne partagez jamais ce code avec une autre personne.
                                </p>

                                <div style="background-color:#f0f8f3; border-left:4px solid #2f9e44; padding:14px 18px; border-radius:8px; margin:24px 0;">
                                    <p style="margin:0; font-size:14px; line-height:1.6; color:#234b2f;">
                                        Ce message a été généré automatiquement par <strong>RAQIB</strong>,
                                        plateforme intelligente d'aide à la vérification des dossiers réglementaires.
                                    </p>
                                </div>

                                <p style="font-size:15px; margin:26px 0 0;">
                                    Cordialement,<br>
                                    <strong style="color:#0b5d2a;">L'équipe RAQIB</strong>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color:#f8faf8; padding:24px 30px; border-top:1px solid #e1e8e3; text-align:center;">
                                <img src="cid:{raqib_cid_clean}" alt="RAQIB" style="max-height:78px; max-width:210px; margin-right:24px; vertical-align:middle;">
                                <img src="cid:{ammps_cid_clean}" alt="AMMPS" style="max-height:78px; max-width:210px; vertical-align:middle;">
                                <p style="margin:14px 0 0; font-size:12px; color:#607063; line-height:1.5;">
                                    RAQIB — Plateforme intelligente de conformité réglementaire<br>
                                    Agence Marocaine du Médicament et des Produits de Santé
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = to_email

    msg.set_content(plain_text)
    msg.add_alternative(html_content, subtype="html")
    _attach_logos(msg, raqib_cid, ammps_cid)

    try:
        with smtplib.SMTP(host, port, timeout=8) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            if user and password:
                smtp.login(user, password)
            smtp.send_message(msg)

        print("✅ EMAIL SENT")

    except Exception as e:
        print("❌ SMTP ERROR:", str(e))
        print("⚠️ FALLBACK: showing OTP in terminal:", code)


def send_appointment_email(
    to_email: str,
    service: str,
    date: str,
    time: str,
    location: str,
) -> None:
    subject = f"RAQIB — Confirmation de rendez-vous du {date} à {time}"

    host, port, user, password, mail_from = _smtp_config()

    if not host:
        print(f"[RAQIB] SMTP non configuré — e-mail de rendez-vous non envoyé vers {to_email}")
        return

    raqib_cid = make_msgid(domain="raqib.local")
    ammps_cid = make_msgid(domain="ammps.local")

    raqib_cid_clean = raqib_cid[1:-1]
    ammps_cid_clean = ammps_cid[1:-1]

    plain_text = (
        f"Bonjour,\n\n"
        f"Nous vous confirmons la prise de votre rendez-vous auprès de l’AMMPS.\n\n"
        f"Détails du rendez-vous :\n"
        f"- Service : {service}\n"
        f"- Date : {date}\n"
        f"- Heure : {time}\n"
        f"- Lieu : {location}\n\n"
        f"Nous vous prions de vous présenter 10 minutes avant l’heure prévue.\n\n"
        f"Cordialement,\n"
        f"L'équipe RAQIB\n"
        f"AMMPS\n"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <body style="margin:0; padding:0; background-color:#f4f7f5; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f5; padding:30px 0;">
            <tr>
                <td align="center">
                    <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e1e8e3;">

                        <tr>
                            <td style="background:linear-gradient(135deg,#0b5d2a,#2f9e44); padding:28px 30px; text-align:center;">
                                <h1 style="margin:0; color:#ffffff; font-size:24px;">
                                    Rendez-vous confirmé
                                </h1>
                                <p style="margin:8px 0 0; color:#e9f7ee; font-size:14px;">
                                    Confirmation officielle de votre rendez-vous AMMPS
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:34px 38px; color:#1f2933;">
                                <p style="font-size:16px; margin:0 0 18px;">Bonjour,</p>

                                <p style="font-size:15px; line-height:1.7; margin:0 0 22px;">
                                    Nous vous confirmons la prise de votre rendez-vous auprès de
                                    <strong style="color:#0b5d2a;">l’Agence Marocaine du Médicament et des Produits de Santé</strong>.
                                </p>

                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:24px 0; border:1px solid #dce9df; border-radius:10px; overflow:hidden;">
                                    <tr>
                                        <td style="background-color:#f0f8f3; padding:14px 18px; font-weight:bold; color:#0b5d2a; width:34%;">Service</td>
                                        <td style="padding:14px 18px; color:#1f2933;">{service}</td>
                                    </tr>
                                    <tr>
                                        <td style="background-color:#f0f8f3; padding:14px 18px; font-weight:bold; color:#0b5d2a;">Date</td>
                                        <td style="padding:14px 18px; color:#1f2933;">{date}</td>
                                    </tr>
                                    <tr>
                                        <td style="background-color:#f0f8f3; padding:14px 18px; font-weight:bold; color:#0b5d2a;">Heure</td>
                                        <td style="padding:14px 18px; color:#1f2933;">{time}</td>
                                    </tr>
                                    <tr>
                                        <td style="background-color:#f0f8f3; padding:14px 18px; font-weight:bold; color:#0b5d2a;">Lieu</td>
                                        <td style="padding:14px 18px; color:#1f2933;">{location}</td>
                                    </tr>
                                </table>

                                <div style="background-color:#fff8e6; border-left:4px solid #d89b00; padding:14px 18px; border-radius:8px; margin:24px 0;">
                                    <p style="margin:0; font-size:14px; line-height:1.6; color:#5c4700;">
                                        Nous vous prions de vous présenter <strong>10 minutes avant l’heure prévue</strong>,
                                        muni(e) des documents nécessaires à votre demande.
                                    </p>
                                </div>

                                <div style="background-color:#f0f8f3; border-left:4px solid #2f9e44; padding:14px 18px; border-radius:8px; margin:24px 0;">
                                    <p style="margin:0; font-size:14px; line-height:1.6; color:#234b2f;">
                                        Cette confirmation a été générée automatiquement par <strong>RAQIB</strong>,
                                        plateforme intelligente d'accompagnement des démarches réglementaires.
                                    </p>
                                </div>

                                <p style="font-size:15px; margin:26px 0 0;">
                                    Cordialement,<br>
                                    <strong style="color:#0b5d2a;">L'équipe RAQIB</strong>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color:#f8faf8; padding:24px 30px; border-top:1px solid #e1e8e3; text-align:center;">
                                <img src="cid:{raqib_cid_clean}" alt="RAQIB" style="max-height:78px; max-width:210px; margin-right:24px; vertical-align:middle;">
                                <img src="cid:{ammps_cid_clean}" alt="AMMPS" style="max-height:78px; max-width:210px; vertical-align:middle;">
                                <p style="margin:14px 0 0; font-size:12px; color:#607063; line-height:1.5;">
                                    RAQIB — Plateforme intelligente de conformité réglementaire<br>
                                    Agence Marocaine du Médicament et des Produits de Santé
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = to_email

    msg.set_content(plain_text)
    msg.add_alternative(html_content, subtype="html")
    _attach_logos(msg, raqib_cid, ammps_cid)

    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        if user and password:
            smtp.login(user, password)
        smtp.send_message(msg)

    print("✅ APPOINTMENT EMAIL SENT")


def _store_otp(email: str, purpose: str, code: str) -> None:
    expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    h = _hash_code(code)

    with _lock:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM otp_codes WHERE email = %s AND purpose = %s AND consumed = 0",
                    (email.lower(), purpose),
                )
                cur.execute(
                    """
                    INSERT INTO otp_codes (email, purpose, code_hash, expires_at, consumed)
                    VALUES (%s, %s, %s, %s, 0)
                    """,
                    (email.lower(), purpose, h, expires),
                )


def _verify_otp(email: str, purpose: str, code: str) -> bool:
    if not code or len(code.strip()) != 6 or not code.strip().isdigit():
        return False

    code = code.strip()
    h = _hash_code(code)
    now = datetime.now(timezone.utc)

    with _lock:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id FROM otp_codes
                    WHERE email = %s AND purpose = %s AND code_hash = %s
                      AND consumed = 0 AND expires_at > %s
                    ORDER BY id DESC LIMIT 1
                    """,
                    (email.lower(), purpose, h, now),
                )
                row = cur.fetchone()

                if not row:
                    return False

                cur.execute(
                    "UPDATE otp_codes SET consumed = 1 WHERE id = %s",
                    (row["id"],),
                )

            return True


def register_start(email: str, password: str, full_name: str) -> Tuple[bool, str, Optional[str]]:
    email = email.strip().lower()

    if not email or "@" not in email:
        return False, "E-mail invalide", None

    if len(password) < 8:
        return False, "Mot de passe : au moins 8 caractères", None

    ph = _pwd.hash(password)
    code = _gen_otp()

    with _lock:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, verified FROM users WHERE email = %s", (email,))
                row = cur.fetchone()

                if row and row["verified"]:
                    return False, "Ce compte existe déjà. Connectez-vous.", None

                if row:
                    cur.execute(
                        "UPDATE users SET password_hash = %s, full_name = %s, verified = 0 WHERE id = %s",
                        (ph, full_name or "", row["id"]),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO users (email, password_hash, full_name, verified, created_at)
                        VALUES (%s, %s, %s, 0, %s)
                        """,
                        (email, ph, full_name or "", datetime.now(timezone.utc)),
                    )

    _store_otp(email, "register", code)

    try:
        send_email_otp(email, code, "inscription")
    except Exception as e:
        return False, f"Envoi e-mail impossible : {e!s}", None

    return True, "Code envoyé par e-mail.", code if AUTH_DEV else None


def register_verify(email: str, code: str) -> Tuple[bool, str]:
    email = email.strip().lower()

    if not _verify_otp(email, "register", code):
        return False, "Code incorrect ou expiré."

    with _lock:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET verified = 1 WHERE email = %s", (email,))

    return True, "Compte activé."


def login_send_code(email: str, password: str) -> Tuple[bool, str, Optional[str]]:
    email = email.strip().lower()

    if not password:
        return False, "Mot de passe requis.", None

    with _lock:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, password_hash, verified FROM users WHERE email = %s",
                    (email,),
                )
                row = cur.fetchone()

    if not row:
        return False, "E-mail ou mot de passe incorrect.", None

    if not row["verified"]:
        return False, "Compte non vérifié. Terminez l'inscription avec le code reçu.", None

    if not _pwd.verify(password, row["password_hash"]):
        return False, "E-mail ou mot de passe incorrect.", None

    code = _gen_otp()
    _store_otp(email, "login", code)

    try:
        send_email_otp(email, code, "connexion")
    except Exception as e:
        return False, f"Envoi e-mail impossible : {e!s}", None

    return True, "Code envoyé par e-mail.", code if AUTH_DEV else None


def login_verify(email: str, password: str, code: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    email = email.strip().lower()

    if not password:
        return False, "Mot de passe requis.", None

    with _lock:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, email, full_name, verified, password_hash FROM users WHERE email = %s",
                    (email,),
                )
                row = cur.fetchone()

    if not row or not row["verified"]:
        return False, "Compte introuvable ou non vérifié.", None

    if not _pwd.verify(password, row["password_hash"]):
        return False, "E-mail ou mot de passe incorrect.", None

    if not _verify_otp(email, "login", code):
        return False, "Code incorrect ou expiré.", None

    token = create_access_token({"sub": row["email"], "uid": row["id"]})

    return True, "OK", {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": row["email"],
            "full_name": row["full_name"] or "",
        },
    }


def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    to_encode["exp"] = exp
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except JWTError:
        return None