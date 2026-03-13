import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendFriendRequestEmail(to: string, recipientName: string, senderName: string) {
  try {
    await getResend().emails.send({
      from: 'english.cash <noreply@english.cash>',
      to,
      subject: `${senderName} wants to connect with you on english.cash`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; margin-bottom: 8px;">english.cash</h2>
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> sent you a friend request!</p>
          <p style="color: #6b7280; font-size: 14px;">Connect with friends to compare your progress, compete on the leaderboard, and motivate each other.</p>
          <div style="margin: 24px 0;">
            <a href="https://english.cash/en/friends" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              View Request
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">You're receiving this because you have an account on english.cash</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Friend request email error:', err)
    // Don't throw — friend request should succeed even if email fails
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
