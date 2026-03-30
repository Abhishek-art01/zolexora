import asyncio, logging, resend
from core.config import settings

logger = logging.getLogger("zolexora.email")

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

async def send_otp_email(email: str, name: str, otp: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.warning("No RESEND_API_KEY – OTP for %s: %s", email, otp)
        return
    html = f"""
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;background:#FAFAF8;padding:32px;">
      <div style="background:#1C1C1C;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="color:#FFB800;font-size:24px;font-weight:900;letter-spacing:-0.5px;">ZOLEXORA</span>
        <p style="color:#888;font-size:12px;margin:4px 0 0;">Watch. Earn. Shop.</p>
      </div>
      <div style="background:#fff;border:1.5px solid #E8E5DF;border-radius:16px;padding:32px;">
        <h2 style="font-weight:800;color:#1C1C1C;margin:0 0 8px;">Hi {name} 👋</h2>
        <p style="color:#666;margin:0 0 24px;">Your verification code is below. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#1C1C1C;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
          <span style="color:#FFB800;font-size:48px;font-weight:900;letter-spacing:12px;">{otp}</span>
        </div>
        <p style="color:#999;font-size:12px;margin:0;">Didn't request this? Ignore this email safely.</p>
      </div>
    </div>"""
    params = {
        "from": f"Zolexora <{settings.SENDER_EMAIL}>",
        "to": [email],
        "subject": f"{otp} – Your Zolexora verification code",
        "html": html,
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info("OTP sent to %s", email)
    except Exception as e:
        logger.error("Email failed: %s", e)
