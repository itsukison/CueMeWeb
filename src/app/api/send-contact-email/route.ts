import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with fallback for build time
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build')

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available at runtime
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'メール送信サービスが設定されていません' },
        { status: 500 }
      )
    }

    const { name, email, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'すべてのフィールドを入力してください' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'CueMe Contact <noreply@cueme.ink>',
      to: ['officialcueme@gmail.com'],
      subject: `[CueMe お問い合わせ] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7ee;">
          <div style="background-color: #013220; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">CueMe お問い合わせ</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 20px;">
              <h3 style="color: #013220; margin-bottom: 5px;">お名前:</h3>
              <p style="margin: 0; padding: 10px; background-color: #f7f7ee; border-radius: 5px;">${name}</p>
            </div>
            <div style="margin-bottom: 20px;">
              <h3 style="color: #013220; margin-bottom: 5px;">メールアドレス:</h3>
              <p style="margin: 0; padding: 10px; background-color: #f7f7ee; border-radius: 5px;">${email}</p>
            </div>
            <div style="margin-bottom: 20px;">
              <h3 style="color: #013220; margin-bottom: 5px;">件名:</h3>
              <p style="margin: 0; padding: 10px; background-color: #f7f7ee; border-radius: 5px;">${subject}</p>
            </div>
            <div style="margin-bottom: 20px;">
              <h3 style="color: #013220; margin-bottom: 5px;">メッセージ:</h3>
              <div style="padding: 15px; background-color: #f7f7ee; border-radius: 5px; white-space: pre-wrap;">${message}</div>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
              <p>このメールはCueMeのお問い合わせフォームから送信されました。</p>
              <p>送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
            </div>
          </div>
        </div>
      `,
      replyTo: email,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'メールの送信に失敗しました。しばらく時間をおいて再度お試しください。' },
        { status: 500 }
      )
    }

    // Send confirmation email to the user
    await resend.emails.send({
      from: 'CueMe Support <noreply@cueme.ink>',
      to: [email],
      subject: 'お問い合わせありがとうございます - CueMe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7ee;">
          <div style="background-color: #013220; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">お問い合わせありがとうございます</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="color: #013220; font-size: 16px; margin-bottom: 20px;">こんにちは、${name}様</p>
            <p style="margin-bottom: 20px; line-height: 1.6;">この度は、CueMeにお問い合わせいただき、誠にありがとうございます。</p>
            <p style="margin-bottom: 20px; line-height: 1.6;">お送りいただいたお問い合わせ内容を確認いたしました。専門チームが内容を確認し、24時間以内にご返信させていただきます。</p>
            <div style="background-color: #f7f7ee; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #013220; margin-bottom: 10px;">お問い合わせ内容:</h3>
              <p style="margin-bottom: 5px;"><strong>件名:</strong> ${subject}</p>
              <p style="margin: 0;"><strong>送信日時:</strong> ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
            </div>
            <p style="margin-bottom: 20px; line-height: 1.6;">ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            <p style="margin-bottom: 20px; line-height: 1.6;">今後ともCueMeをよろしくお願いいたします。</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #013220; font-weight: bold; margin-bottom: 5px;">CueMeサポートチーム</p>
              <p style="color: #666; font-size: 14px; margin: 0;">ployee.officialcontact@gmail.com</p>
            </div>
          </div>
        </div>
      `,
    })

    return NextResponse.json(
      { success: true, message: 'お問い合わせを送信しました。確認メールをお送りしましたのでご確認ください。' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。' },
      { status: 500 }
    )
  }
}