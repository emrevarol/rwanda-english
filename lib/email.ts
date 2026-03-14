import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendFriendRequestEmail(to: string, recipientName: string, senderName: string, locale: string = 'en') {
  try {
    await getResend().emails.send({
      from: 'english.cash <noreply@english.cash>',
      to,
      subject: `${senderName} wants to connect with you on english.cash`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #2563eb; margin: 0; font-size: 24px;">english.cash</h2>
          </div>

          <div style="background: #f0f4ff; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
              <span style="color: white; font-size: 28px; font-weight: bold;">${senderName.charAt(0).toUpperCase()}</span>
            </div>
            <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 18px;">${senderName}</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px;">wants to be your friend</p>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Hi ${recipientName}, accept this request to compare your progress, compete on the leaderboard, and motivate each other!
          </p>

          <div style="text-align: center; margin-bottom: 16px;">
            <a href="https://english.cash/${locale}/friends" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px;">
              Accept or Decline
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 32px;">
            You're receiving this because you have an account on english.cash
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Friend request email error:', err)
  }
}

export async function sendOtpEmail(to: string, code: string, name: string) {
  const { error } = await getResend().emails.send({
    from: 'english.cash <noreply@english.cash>',
    to,
    subject: `Your verification code: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; margin-bottom: 8px;">english.cash</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <div style="background: #f0f4ff; border: 2px solid #2563eb; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  })

  if (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send verification email')
  }
}
