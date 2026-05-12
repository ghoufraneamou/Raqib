import os
import smtplib
from email.message import EmailMessage
from email.utils import make_msgid


def send_report_email_with_attachment(to_email: str, pdf_path: str, dossier_name: str) -> None:
    smtp_host = os.getenv("AMMPS_SMTP_HOST")
    smtp_port = int(os.getenv("AMMPS_SMTP_PORT", "587"))
    smtp_user = os.getenv("AMMPS_SMTP_USER")
    smtp_password = os.getenv("AMMPS_SMTP_PASSWORD")
    mail_from = os.getenv("AMMPS_MAIL_FROM", smtp_user or "")

    # Put your logos inside your backend folder, for example:
    # backend/assets/raqib_logo.png
    # backend/assets/logo_ammps.png
    base_dir = os.path.dirname(os.path.abspath(__file__))
    raqib_logo_path = os.getenv(
        "RAQIB_LOGO_PATH",
        os.path.join(base_dir, "assets", "raqib_logo.png")
    )
    ammps_logo_path = os.getenv(
        "AMMPS_LOGO_PATH",
        os.path.join(base_dir, "assets", "logo_ammps.png")
    )

    if not smtp_host or not mail_from:
        raise RuntimeError("SMTP configuration is missing")

    msg = EmailMessage()
    msg["Subject"] = f"Rapport d'analyse du dossier - {dossier_name}"
    msg["From"] = mail_from
    msg["To"] = to_email

    raqib_cid = make_msgid(domain="raqib.local")
    ammps_cid = make_msgid(domain="ammps.local")

    raqib_cid_clean = raqib_cid[1:-1]
    ammps_cid_clean = ammps_cid[1:-1]

    plain_text = f"""
Bonjour,

Votre rapport d'analyse du dossier {dossier_name} a été généré avec succès.

Veuillez trouver le rapport PDF en pièce jointe.

Ce rapport a été produit automatiquement par la plateforme RAQIB, solution intelligente d'aide à la vérification et à la conformité réglementaire des dossiers.

Cordialement,
Plateforme RAQIB
AMMPS
"""

    html_content = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <body style="margin:0; padding:0; background-color:#f4f7f5; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f5; padding:30px 0;">
            <tr>
                <td align="center">
                    <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e1e8e3;">
                        
                        <tr>
                            <td style="background:linear-gradient(135deg,#0b5d2a,#2f9e44); padding:26px 30px; text-align:center;">
                                <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:0.5px;">
                                    Rapport d'analyse généré avec succès
                                </h1>
                                <p style="margin:8px 0 0; color:#e9f7ee; font-size:14px;">
                                    Plateforme intelligente de conformité réglementaire
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:34px 38px; color:#1f2933;">
                                <p style="font-size:16px; margin:0 0 18px;">
                                    Bonjour,
                                </p>

                                <p style="font-size:15px; line-height:1.7; margin:0 0 18px;">
                                    Votre rapport d'analyse relatif au dossier 
                                    <strong style="color:#0b5d2a;">{dossier_name}</strong> 
                                    a été généré avec succès.
                                </p>

                                <p style="font-size:15px; line-height:1.7; margin:0 0 22px;">
                                    Vous trouverez le document PDF en pièce jointe. Ce rapport présente les résultats de l'analyse automatique, les éléments vérifiés ainsi que les observations liées à la conformité du dossier.
                                </p>

                                <div style="background-color:#f0f8f3; border-left:4px solid #2f9e44; padding:14px 18px; border-radius:8px; margin:24px 0;">
                                    <p style="margin:0; font-size:14px; line-height:1.6; color:#234b2f;">
                                        Ce message a été généré automatiquement par <strong>RAQIB</strong>, une plateforme d'aide à l'analyse et à la validation des dossiers réglementaires.
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
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding-bottom:14px;">
                                            <img src="cid:{raqib_cid_clean}" alt="RAQIB" style="max-height:82px; max-width:210px; margin-right:24px; vertical-align:middle;">
                                            <img src="cid:{ammps_cid_clean}" alt="AMMPS" style="max-height:82px; max-width:210px; vertical-align:middle;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <p style="margin:0; font-size:12px; color:#607063; line-height:1.5;">
                                                RAQIB — Plateforme intelligente de conformité réglementaire<br>
                                                Agence Marocaine du Médicament et des Produits de Santé
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    msg.set_content(plain_text)
    msg.add_alternative(html_content, subtype="html")

    # Add RAQIB logo inline
    if os.path.exists(raqib_logo_path):
        with open(raqib_logo_path, "rb") as img:
            msg.get_payload()[1].add_related(
                img.read(),
                maintype="image",
                subtype="png",
                cid=raqib_cid
            )

    # Add AMMPS logo inline
    if os.path.exists(ammps_logo_path):
        with open(ammps_logo_path, "rb") as img:
            msg.get_payload()[1].add_related(
                img.read(),
                maintype="image",
                subtype="png",
                cid=ammps_cid
            )

    # Attach PDF report
    with open(pdf_path, "rb") as f:
        msg.add_attachment(
            f.read(),
            maintype="application",
            subtype="pdf",
            filename=os.path.basename(pdf_path),
        )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.send_message(msg)