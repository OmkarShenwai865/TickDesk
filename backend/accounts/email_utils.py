"""Shared branded HTML email builder — same visual shell (logo header, white
card, footer) used for every real email TickDesk sends (new company signup,
user invites, password resets, announcements), so they all look like one
product instead of ad hoc plain-text messages.
"""
import html as _html
import os

from django.conf import settings

LOGO_PATH = settings.BASE_DIR / 'accounts' / 'email_assets' / 'logo.png'


def esc(value):
    return _html.escape(str(value))


def rows_table(rows):
    """rows: list of (label, value) tuples — rendered as a bordered key/value table."""
    trs = []
    for i, (label, value) in enumerate(rows):
        border = "border-bottom:1px solid #f3f4f6;" if i < len(rows) - 1 else ""
        trs.append(f"""
        <tr>
          <td style="padding:10px 0;color:#6b7280;{border}">{esc(label)}</td>
          <td style="padding:10px 0;color:#111827;font-weight:600;text-align:right;{border}">{esc(value)}</td>
        </tr>""")
    return f'<table style="width:100%;border-collapse:collapse;font-size:13px;">{"".join(trs)}</table>'


def paragraph(text, color="#374151"):
    escaped = esc(text).replace("\n", "<br>")
    return f'<p style="font-size:14px;color:{color};line-height:1.6;margin:0 0 14px;">{escaped}</p>'


def cta_button(text, url):
    return (
        f'<a href="{url}" style="display:block;text-align:center;background:#2563eb;'
        f'color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:12px;'
        f'border-radius:8px;margin-top:20px;">{esc(text)}</a>'
    )


def code_box(value):
    """A monospace highlight box — used for one-off temporary passwords."""
    return (
        f'<div style="background:#f3f4f6;border:1px dashed #d1d5db;border-radius:8px;'
        f'padding:14px;text-align:center;font-family:monospace;font-size:16px;'
        f'font-weight:700;color:#111827;letter-spacing:0.03em;margin:0 0 16px;">{esc(value)}</div>'
    )


def render_shell(preheader, title, body_html):
    return f"""\
<div style="background:#f3f4f6;padding:32px 16px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111827;padding:24px 28px;display:flex;align-items:center;">
      <img src="cid:logo" width="36" height="36" style="border-radius:9px;vertical-align:middle;" alt="TickDesk" />
      <span style="color:#ffffff;font-size:17px;font-weight:700;margin-left:10px;vertical-align:middle;">TickDesk</span>
    </div>
    <div style="padding:28px;">
      <p style="font-size:12px;font-weight:700;letter-spacing:0.06em;color:#2563eb;margin:0 0 6px;">{esc(preheader)}</p>
      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 18px;">{esc(title)}</h1>
      {body_html}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">TickDesk — IT Helpdesk &amp; Asset Management</p>
    </div>
  </div>
</div>
"""


def send_branded_email(to, subject, preheader, title, body_html, text_fallback):
    """to: list of recipient email addresses."""
    html_body = render_shell(preheader, title, body_html)

    # Use Resend if API key is configured, otherwise fall back to Django email backend
    resend_api_key = os.environ.get('RESEND_API_KEY', '')

    if resend_api_key:
        # Use Resend API
        try:
            import resend
            resend.api_key = resend_api_key

            params = {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": to,
                "subject": subject,
                "html": html_body,
                "text": text_fallback,
            }

            response = resend.Emails.send(params)
            print(f"✅ Email sent successfully via Resend to {to} (ID: {response['id']})")
        except Exception as e:
            print(f"❌ Resend email failed to {to}: {e}")
    else:
        # Fall back to Django SMTP (for local development)
        try:
            from django.core.mail import EmailMultiAlternatives
            from email.mime.image import MIMEImage

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_fallback,
                from_email=None,
                to=to,
            )
            msg.attach_alternative(html_body, "text/html")

            if LOGO_PATH.exists():
                with open(LOGO_PATH, 'rb') as f:
                    logo = MIMEImage(f.read())
                logo.add_header('Content-ID', '<logo>')
                logo.add_header('Content-Disposition', 'inline', filename='logo.png')
                msg.attach(logo)

            msg.send(fail_silently=False)
            print(f"✅ Email sent successfully via SMTP to {to}")
        except Exception as e:
            print(f"❌ SMTP email failed to {to}: {e}")
