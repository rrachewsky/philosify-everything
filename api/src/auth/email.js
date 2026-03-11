// ============================================================
// SUPABASE AUTH EMAIL HOOK HANDLER
// Sends localized authentication emails via Resend API
// ============================================================

import { getSecret } from "../utils/secrets.js";
import { jsonResponse } from "../utils/index.js";

// New logo URL on R2
const LOGO_URL =
  "https://pub-2485a0b8727445bbb7148e85a0db3edf.r2.dev/newlogocircuitsrounded.png";

// Email translations for all 18 supported languages
const EMAIL_TRANSLATIONS = {
  en: {
    confirmSignup: {
      subject: "Confirm your Philosify account",
      title: "Welcome to Philosify! 🎵",
      body: "Thank you for signing up! Please confirm your email address to start discovering the philosophy in your favorite music.",
      button: "Confirm Email",
      footer:
        "If you didn't create an account, you can safely ignore this email.",
    },
    magicLink: {
      subject: "Your Philosify login link",
      title: "Sign In to Philosify 🔑",
      body: "Click the button below to sign in to your account. This link will expire in 1 hour.",
      button: "Sign In Now",
      footer:
        "If you didn't request this link, you can safely ignore this email.",
    },
    resetPassword: {
      subject: "Reset your Philosify password",
      title: "Reset Your Password 🔒",
      body: "We received a request to reset your password. Click the button below to create a new password.",
      button: "Reset Password",
      footer:
        "If you didn't request a password reset, you can safely ignore this email.",
    },
    emailChange: {
      subject: "Confirm your new email address",
      title: "Confirm Email Change 📧",
      body: "You requested to change your email address. Click the button below to confirm this new email.",
      button: "Confirm New Email",
      footer:
        "If you didn't request this change, please contact support immediately.",
    },
    invite: {
      subject: "You've been invited to Philosify",
      title: "You're Invited! 🎶",
      body: "You've been invited to join Philosify - discover the philosophy hidden in your favorite music.",
      button: "Accept Invitation",
      footer:
        "If you weren't expecting this invitation, you can safely ignore this email.",
    },
  },
  pt: {
    confirmSignup: {
      subject: "Confirme sua conta Philosify",
      title: "Bem-vindo ao Philosify! 🎵",
      body: "Obrigado por se cadastrar! Por favor, confirme seu endereço de e-mail para começar a descobrir a filosofia nas suas músicas favoritas.",
      button: "Confirmar E-mail",
      footer:
        "Se você não criou uma conta, pode ignorar este e-mail com segurança.",
    },
    magicLink: {
      subject: "Seu link de login do Philosify",
      title: "Entrar no Philosify 🔑",
      body: "Clique no botão abaixo para entrar na sua conta. Este link expira em 1 hora.",
      button: "Entrar Agora",
      footer:
        "Se você não solicitou este link, pode ignorar este e-mail com segurança.",
    },
    resetPassword: {
      subject: "Redefinir sua senha do Philosify",
      title: "Redefinir Sua Senha 🔒",
      body: "Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.",
      button: "Redefinir Senha",
      footer:
        "Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança.",
    },
    emailChange: {
      subject: "Confirme seu novo endereço de e-mail",
      title: "Confirmar Alteração de E-mail 📧",
      body: "Você solicitou a alteração do seu endereço de e-mail. Clique no botão abaixo para confirmar o novo e-mail.",
      button: "Confirmar Novo E-mail",
      footer:
        "Se você não solicitou esta alteração, entre em contato com o suporte imediatamente.",
    },
    invite: {
      subject: "Você foi convidado para o Philosify",
      title: "Você Foi Convidado! 🎶",
      body: "Você foi convidado para se juntar ao Philosify - descubra a filosofia escondida nas suas músicas favoritas.",
      button: "Aceitar Convite",
      footer:
        "Se você não esperava este convite, pode ignorar este e-mail com segurança.",
    },
  },
  es: {
    confirmSignup: {
      subject: "Confirma tu cuenta de Philosify",
      title: "¡Bienvenido a Philosify! 🎵",
      body: "¡Gracias por registrarte! Por favor, confirma tu dirección de correo electrónico para comenzar a descubrir la filosofía en tus canciones favoritas.",
      button: "Confirmar Correo",
      footer:
        "Si no creaste una cuenta, puedes ignorar este correo con seguridad.",
    },
    magicLink: {
      subject: "Tu enlace de inicio de sesión de Philosify",
      title: "Iniciar Sesión en Philosify 🔑",
      body: "Haz clic en el botón de abajo para iniciar sesión en tu cuenta. Este enlace expira en 1 hora.",
      button: "Iniciar Sesión",
      footer:
        "Si no solicitaste este enlace, puedes ignorar este correo con seguridad.",
    },
    resetPassword: {
      subject: "Restablecer tu contraseña de Philosify",
      title: "Restablecer Tu Contraseña 🔒",
      body: "Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva.",
      button: "Restablecer Contraseña",
      footer:
        "Si no solicitaste restablecer tu contraseña, puedes ignorar este correo con seguridad.",
    },
    emailChange: {
      subject: "Confirma tu nueva dirección de correo",
      title: "Confirmar Cambio de Correo 📧",
      body: "Solicitaste cambiar tu dirección de correo electrónico. Haz clic en el botón de abajo para confirmar.",
      button: "Confirmar Nuevo Correo",
      footer:
        "Si no solicitaste este cambio, contacta al soporte inmediatamente.",
    },
    invite: {
      subject: "Has sido invitado a Philosify",
      title: "¡Estás Invitado! 🎶",
      body: "Has sido invitado a unirte a Philosify - descubre la filosofía oculta en tus canciones favoritas.",
      button: "Aceptar Invitación",
      footer:
        "Si no esperabas esta invitación, puedes ignorar este correo con seguridad.",
    },
  },
  de: {
    confirmSignup: {
      subject: "Bestätige dein Philosify-Konto",
      title: "Willkommen bei Philosify! 🎵",
      body: "Danke für deine Anmeldung! Bitte bestätige deine E-Mail-Adresse, um die Philosophie in deiner Lieblingsmusik zu entdecken.",
      button: "E-Mail bestätigen",
      footer:
        "Wenn du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.",
    },
    magicLink: {
      subject: "Dein Philosify-Anmeldelink",
      title: "Bei Philosify anmelden 🔑",
      body: "Klicke auf den Button unten, um dich anzumelden. Dieser Link läuft in 1 Stunde ab.",
      button: "Jetzt anmelden",
      footer:
        "Wenn du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren.",
    },
    resetPassword: {
      subject: "Setze dein Philosify-Passwort zurück",
      title: "Passwort zurücksetzen 🔒",
      body: "Wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Klicke unten, um ein neues zu erstellen.",
      button: "Passwort zurücksetzen",
      footer:
        "Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.",
    },
    emailChange: {
      subject: "Bestätige deine neue E-Mail-Adresse",
      title: "E-Mail-Änderung bestätigen 📧",
      body: "Du hast eine Änderung deiner E-Mail-Adresse angefordert. Klicke unten, um die neue E-Mail zu bestätigen.",
      button: "Neue E-Mail bestätigen",
      footer:
        "Wenn du dies nicht angefordert hast, kontaktiere bitte sofort den Support.",
    },
    invite: {
      subject: "Du wurdest zu Philosify eingeladen",
      title: "Du bist eingeladen! 🎶",
      body: "Du wurdest eingeladen, Philosify beizutreten - entdecke die Philosophie in deiner Lieblingsmusik.",
      button: "Einladung annehmen",
      footer:
        "Wenn du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.",
    },
  },
  fr: {
    confirmSignup: {
      subject: "Confirmez votre compte Philosify",
      title: "Bienvenue sur Philosify ! 🎵",
      body: "Merci de vous être inscrit ! Veuillez confirmer votre adresse e-mail pour découvrir la philosophie dans vos musiques préférées.",
      button: "Confirmer l'e-mail",
      footer:
        "Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.",
    },
    magicLink: {
      subject: "Votre lien de connexion Philosify",
      title: "Se connecter à Philosify 🔑",
      body: "Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans 1 heure.",
      button: "Se connecter",
      footer:
        "Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet e-mail.",
    },
    resetPassword: {
      subject: "Réinitialisez votre mot de passe Philosify",
      title: "Réinitialiser votre mot de passe 🔒",
      body: "Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez ci-dessous pour en créer un nouveau.",
      button: "Réinitialiser",
      footer:
        "Si vous n'avez pas fait cette demande, vous pouvez ignorer cet e-mail.",
    },
    emailChange: {
      subject: "Confirmez votre nouvelle adresse e-mail",
      title: "Confirmer le changement d'e-mail 📧",
      body: "Vous avez demandé à changer votre adresse e-mail. Cliquez ci-dessous pour confirmer.",
      button: "Confirmer le nouvel e-mail",
      footer:
        "Si vous n'avez pas demandé ce changement, contactez immédiatement le support.",
    },
    invite: {
      subject: "Vous êtes invité sur Philosify",
      title: "Vous êtes invité ! 🎶",
      body: "Vous avez été invité à rejoindre Philosify - découvrez la philosophie cachée dans vos musiques préférées.",
      button: "Accepter l'invitation",
      footer:
        "Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail.",
    },
  },
  it: {
    confirmSignup: {
      subject: "Conferma il tuo account Philosify",
      title: "Benvenuto su Philosify! 🎵",
      body: "Grazie per esserti registrato! Conferma il tuo indirizzo email per scoprire la filosofia nella tua musica preferita.",
      button: "Conferma Email",
      footer: "Se non hai creato un account, puoi ignorare questa email.",
    },
    magicLink: {
      subject: "Il tuo link di accesso Philosify",
      title: "Accedi a Philosify 🔑",
      body: "Clicca sul pulsante qui sotto per accedere. Questo link scade tra 1 ora.",
      button: "Accedi Ora",
      footer: "Se non hai richiesto questo link, puoi ignorare questa email.",
    },
    resetPassword: {
      subject: "Reimposta la tua password Philosify",
      title: "Reimposta la Password 🔒",
      body: "Abbiamo ricevuto una richiesta per reimpostare la tua password. Clicca qui sotto per crearne una nuova.",
      button: "Reimposta Password",
      footer: "Se non hai richiesto questo, puoi ignorare questa email.",
    },
    emailChange: {
      subject: "Conferma il tuo nuovo indirizzo email",
      title: "Conferma Cambio Email 📧",
      body: "Hai richiesto di cambiare il tuo indirizzo email. Clicca qui sotto per confermare.",
      button: "Conferma Nuova Email",
      footer:
        "Se non hai richiesto questo cambio, contatta immediatamente il supporto.",
    },
    invite: {
      subject: "Sei stato invitato su Philosify",
      title: "Sei Invitato! 🎶",
      body: "Sei stato invitato a unirti a Philosify - scopri la filosofia nascosta nella tua musica preferita.",
      button: "Accetta Invito",
      footer: "Se non ti aspettavi questo invito, puoi ignorare questa email.",
    },
  },
  ja: {
    confirmSignup: {
      subject: "Philosifyアカウントを確認してください",
      title: "Philosifyへようこそ！🎵",
      body: "ご登録ありがとうございます！メールアドレスを確認して、お気に入りの音楽の哲学を発見しましょう。",
      button: "メールを確認",
      footer:
        "アカウントを作成していない場合は、このメールを無視してください。",
    },
    magicLink: {
      subject: "Philosifyログインリンク",
      title: "Philosifyにサインイン 🔑",
      body: "下のボタンをクリックしてサインインしてください。このリンクは1時間で期限切れになります。",
      button: "サインイン",
      footer:
        "このリンクをリクエストしていない場合は、このメールを無視してください。",
    },
    resetPassword: {
      subject: "Philosifyパスワードをリセット",
      title: "パスワードをリセット 🔒",
      body: "パスワードリセットのリクエストを受け取りました。下のボタンをクリックして新しいパスワードを作成してください。",
      button: "パスワードをリセット",
      footer: "リクエストしていない場合は、このメールを無視してください。",
    },
    emailChange: {
      subject: "新しいメールアドレスを確認してください",
      title: "メール変更を確認 📧",
      body: "メールアドレスの変更をリクエストしました。下のボタンをクリックして確認してください。",
      button: "新しいメールを確認",
      footer:
        "この変更をリクエストしていない場合は、すぐにサポートに連絡してください。",
    },
    invite: {
      subject: "Philosifyに招待されました",
      title: "招待されました！🎶",
      body: "Philosifyに招待されました - お気に入りの音楽に隠された哲学を発見しましょう。",
      button: "招待を受け入れる",
      footer:
        "この招待を予期していなかった場合は、このメールを無視してください。",
    },
  },
  ko: {
    confirmSignup: {
      subject: "Philosify 계정을 확인하세요",
      title: "Philosify에 오신 것을 환영합니다! 🎵",
      body: "가입해 주셔서 감사합니다! 이메일 주소를 확인하고 좋아하는 음악의 철학을 발견하세요.",
      button: "이메일 확인",
      footer: "계정을 만들지 않았다면 이 이메일을 무시해도 됩니다.",
    },
    magicLink: {
      subject: "Philosify 로그인 링크",
      title: "Philosify에 로그인 🔑",
      body: "아래 버튼을 클릭하여 로그인하세요. 이 링크는 1시간 후에 만료됩니다.",
      button: "지금 로그인",
      footer: "이 링크를 요청하지 않았다면 이 이메일을 무시해도 됩니다.",
    },
    resetPassword: {
      subject: "Philosify 비밀번호 재설정",
      title: "비밀번호 재설정 🔒",
      body: "비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새 비밀번호를 만드세요.",
      button: "비밀번호 재설정",
      footer: "요청하지 않았다면 이 이메일을 무시해도 됩니다.",
    },
    emailChange: {
      subject: "새 이메일 주소를 확인하세요",
      title: "이메일 변경 확인 📧",
      body: "이메일 주소 변경을 요청했습니다. 아래 버튼을 클릭하여 확인하세요.",
      button: "새 이메일 확인",
      footer: "이 변경을 요청하지 않았다면 즉시 지원팀에 연락하세요.",
    },
    invite: {
      subject: "Philosify에 초대되었습니다",
      title: "초대되었습니다! 🎶",
      body: "Philosify에 초대되었습니다 - 좋아하는 음악에 숨겨진 철학을 발견하세요.",
      button: "초대 수락",
      footer: "이 초대를 예상하지 않았다면 이 이메일을 무시해도 됩니다.",
    },
  },
  zh: {
    confirmSignup: {
      subject: "确认您的 Philosify 账户",
      title: "欢迎来到 Philosify！🎵",
      body: "感谢您的注册！请确认您的电子邮件地址，开始发现您喜爱音乐中的哲学。",
      button: "确认邮箱",
      footer: "如果您没有创建账户，可以忽略此邮件。",
    },
    magicLink: {
      subject: "您的 Philosify 登录链接",
      title: "登录 Philosify 🔑",
      body: "点击下方按钮登录您的账户。此链接将在1小时后过期。",
      button: "立即登录",
      footer: "如果您没有请求此链接，可以忽略此邮件。",
    },
    resetPassword: {
      subject: "重置您的 Philosify 密码",
      title: "重置密码 🔒",
      body: "我们收到了重置密码的请求。点击下方按钮创建新密码。",
      button: "重置密码",
      footer: "如果您没有请求重置密码，可以忽略此邮件。",
    },
    emailChange: {
      subject: "确认您的新邮箱地址",
      title: "确认邮箱更改 📧",
      body: "您请求更改邮箱地址。点击下方按钮确认新邮箱。",
      button: "确认新邮箱",
      footer: "如果您没有请求此更改，请立即联系客服。",
    },
    invite: {
      subject: "您已被邀请加入 Philosify",
      title: "您被邀请了！🎶",
      body: "您已被邀请加入 Philosify - 发现您喜爱音乐中隐藏的哲学。",
      button: "接受邀请",
      footer: "如果您没有预期收到此邀请，可以忽略此邮件。",
    },
  },
  ru: {
    confirmSignup: {
      subject: "Подтвердите свой аккаунт Philosify",
      title: "Добро пожаловать в Philosify! 🎵",
      body: "Спасибо за регистрацию! Пожалуйста, подтвердите свой email, чтобы начать открывать философию в любимой музыке.",
      button: "Подтвердить email",
      footer:
        "Если вы не создавали аккаунт, можете проигнорировать это письмо.",
    },
    magicLink: {
      subject: "Ваша ссылка для входа в Philosify",
      title: "Войти в Philosify 🔑",
      body: "Нажмите кнопку ниже, чтобы войти. Ссылка действительна 1 час.",
      button: "Войти сейчас",
      footer:
        "Если вы не запрашивали эту ссылку, можете проигнорировать это письмо.",
    },
    resetPassword: {
      subject: "Сброс пароля Philosify",
      title: "Сбросить пароль 🔒",
      body: "Мы получили запрос на сброс вашего пароля. Нажмите кнопку ниже, чтобы создать новый.",
      button: "Сбросить пароль",
      footer:
        "Если вы не запрашивали сброс, можете проигнорировать это письмо.",
    },
    emailChange: {
      subject: "Подтвердите новый email адрес",
      title: "Подтвердить смену email 📧",
      body: "Вы запросили изменение email адреса. Нажмите кнопку ниже для подтверждения.",
      button: "Подтвердить новый email",
      footer:
        "Если вы не запрашивали это изменение, немедленно свяжитесь с поддержкой.",
    },
    invite: {
      subject: "Вас пригласили в Philosify",
      title: "Вы приглашены! 🎶",
      body: "Вас пригласили присоединиться к Philosify - откройте философию, скрытую в любимой музыке.",
      button: "Принять приглашение",
      footer:
        "Если вы не ожидали это приглашение, можете проигнорировать это письмо.",
    },
  },
  ar: {
    confirmSignup: {
      subject: "تأكيد حساب Philosify الخاص بك",
      title: "مرحباً بك في Philosify! 🎵",
      body: "شكراً لتسجيلك! يرجى تأكيد عنوان بريدك الإلكتروني لبدء اكتشاف الفلسفة في موسيقاك المفضلة.",
      button: "تأكيد البريد الإلكتروني",
      footer: "إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد الإلكتروني.",
    },
    magicLink: {
      subject: "رابط تسجيل الدخول إلى Philosify",
      title: "تسجيل الدخول إلى Philosify 🔑",
      body: "انقر على الزر أدناه لتسجيل الدخول. ستنتهي صلاحية هذا الرابط خلال ساعة واحدة.",
      button: "سجل الدخول الآن",
      footer: "إذا لم تطلب هذا الرابط، يمكنك تجاهل هذا البريد الإلكتروني.",
    },
    resetPassword: {
      subject: "إعادة تعيين كلمة مرور Philosify",
      title: "إعادة تعيين كلمة المرور 🔒",
      body: "تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر أدناه لإنشاء كلمة مرور جديدة.",
      button: "إعادة تعيين كلمة المرور",
      footer: "إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد الإلكتروني.",
    },
    emailChange: {
      subject: "تأكيد عنوان بريدك الإلكتروني الجديد",
      title: "تأكيد تغيير البريد الإلكتروني 📧",
      body: "لقد طلبت تغيير عنوان بريدك الإلكتروني. انقر أدناه للتأكيد.",
      button: "تأكيد البريد الجديد",
      footer: "إذا لم تطلب هذا التغيير، يرجى الاتصال بالدعم فوراً.",
    },
    invite: {
      subject: "لقد تمت دعوتك إلى Philosify",
      title: "أنت مدعو! 🎶",
      body: "لقد تمت دعوتك للانضمام إلى Philosify - اكتشف الفلسفة المخفية في موسيقاك المفضلة.",
      button: "قبول الدعوة",
      footer: "إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني.",
    },
  },
  he: {
    confirmSignup: {
      subject: "אשר את חשבון ה-Philosify שלך",
      title: "ברוכים הבאים ל-Philosify! 🎵",
      body: "תודה שנרשמת! אנא אשר את כתובת האימייל שלך כדי להתחיל לגלות את הפילוסופיה במוזיקה האהובה עליך.",
      button: "אשר אימייל",
      footer: "אם לא יצרת חשבון, אתה יכול להתעלם מאימייל זה.",
    },
    magicLink: {
      subject: "קישור הכניסה שלך ל-Philosify",
      title: "התחבר ל-Philosify 🔑",
      body: "לחץ על הכפתור למטה כדי להתחבר. קישור זה יפוג בעוד שעה.",
      button: "התחבר עכשיו",
      footer: "אם לא ביקשת קישור זה, אתה יכול להתעלם מאימייל זה.",
    },
    resetPassword: {
      subject: "איפוס סיסמת Philosify שלך",
      title: "איפוס סיסמה 🔒",
      body: "קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ למטה כדי ליצור סיסמה חדשה.",
      button: "איפוס סיסמה",
      footer: "אם לא ביקשת זאת, אתה יכול להתעלם מאימייל זה.",
    },
    emailChange: {
      subject: "אשר את כתובת האימייל החדשה שלך",
      title: "אישור שינוי אימייל 📧",
      body: "ביקשת לשנות את כתובת האימייל שלך. לחץ למטה כדי לאשר.",
      button: "אשר אימייל חדש",
      footer: "אם לא ביקשת שינוי זה, אנא פנה לתמיכה מיד.",
    },
    invite: {
      subject: "הוזמנת ל-Philosify",
      title: "אתה מוזמן! 🎶",
      body: "הוזמנת להצטרף ל-Philosify - גלה את הפילוסופיה המוסתרת במוזיקה האהובה עליך.",
      button: "קבל הזמנה",
      footer: "אם לא ציפית להזמנה זו, אתה יכול להתעלם מאימייל זה.",
    },
  },
  hi: {
    confirmSignup: {
      subject: "अपने Philosify खाते की पुष्टि करें",
      title: "Philosify में आपका स्वागत है! 🎵",
      body: "साइन अप करने के लिए धन्यवाद! कृपया अपनी पसंदीदा संगीत में दर्शन खोजना शुरू करने के लिए अपना ईमेल पता पुष्टि करें।",
      button: "ईमेल की पुष्टि करें",
      footer:
        "अगर आपने खाता नहीं बनाया है, तो आप इस ईमेल को अनदेखा कर सकते हैं।",
    },
    magicLink: {
      subject: "आपका Philosify लॉगिन लिंक",
      title: "Philosify में साइन इन करें 🔑",
      body: "साइन इन करने के लिए नीचे दिए गए बटन पर क्लिक करें। यह लिंक 1 घंटे में समाप्त हो जाएगा।",
      button: "अभी साइन इन करें",
      footer:
        "अगर आपने यह लिंक नहीं मांगा है, तो आप इस ईमेल को अनदेखा कर सकते हैं।",
    },
    resetPassword: {
      subject: "अपना Philosify पासवर्ड रीसेट करें",
      title: "पासवर्ड रीसेट करें 🔒",
      body: "हमें आपका पासवर्ड रीसेट करने का अनुरोध मिला। नया पासवर्ड बनाने के लिए नीचे क्लिक करें।",
      button: "पासवर्ड रीसेट करें",
      footer:
        "अगर आपने यह अनुरोध नहीं किया है, तो आप इस ईमेल को अनदेखा कर सकते हैं।",
    },
    emailChange: {
      subject: "अपने नए ईमेल पते की पुष्टि करें",
      title: "ईमेल परिवर्तन की पुष्टि करें 📧",
      body: "आपने अपना ईमेल पता बदलने का अनुरोध किया। पुष्टि करने के लिए नीचे क्लिक करें।",
      button: "नए ईमेल की पुष्टि करें",
      footer:
        "अगर आपने यह परिवर्तन नहीं मांगा है, तो कृपया तुरंत सहायता से संपर्क करें।",
    },
    invite: {
      subject: "आपको Philosify में आमंत्रित किया गया है",
      title: "आप आमंत्रित हैं! 🎶",
      body: "आपको Philosify में शामिल होने के लिए आमंत्रित किया गया है - अपनी पसंदीदा संगीत में छिपे दर्शन की खोज करें।",
      button: "निमंत्रण स्वीकार करें",
      footer:
        "अगर आप इस निमंत्रण की उम्मीद नहीं कर रहे थे, तो आप इस ईमेल को अनदेखा कर सकते हैं।",
    },
  },
  fa: {
    confirmSignup: {
      subject: "حساب Philosify خود را تأیید کنید",
      title: "به Philosify خوش آمدید! 🎵",
      body: "از ثبت نام شما متشکریم! لطفاً آدرس ایمیل خود را تأیید کنید تا فلسفه موسیقی مورد علاقه خود را کشف کنید.",
      button: "تأیید ایمیل",
      footer:
        "اگر حسابی ایجاد نکرده‌اید، می‌توانید این ایمیل را نادیده بگیرید.",
    },
    magicLink: {
      subject: "لینک ورود Philosify شما",
      title: "ورود به Philosify 🔑",
      body: "برای ورود روی دکمه زیر کلیک کنید. این لینک تا یک ساعت دیگر منقضی می‌شود.",
      button: "اکنون وارد شوید",
      footer:
        "اگر این لینک را درخواست نکرده‌اید، می‌توانید این ایمیل را نادیده بگیرید.",
    },
    resetPassword: {
      subject: "بازنشانی رمز عبور Philosify",
      title: "بازنشانی رمز عبور 🔒",
      body: "درخواست بازنشانی رمز عبور شما را دریافت کردیم. برای ایجاد رمز جدید روی دکمه زیر کلیک کنید.",
      button: "بازنشانی رمز عبور",
      footer:
        "اگر این درخواست را نداده‌اید، می‌توانید این ایمیل را نادیده بگیرید.",
    },
    emailChange: {
      subject: "آدرس ایمیل جدید خود را تأیید کنید",
      title: "تأیید تغییر ایمیل 📧",
      body: "شما درخواست تغییر آدرس ایمیل خود را داده‌اید. برای تأیید روی دکمه زیر کلیک کنید.",
      button: "تأیید ایمیل جدید",
      footer:
        "اگر این تغییر را درخواست نکرده‌اید، لطفاً فوراً با پشتیبانی تماس بگیرید.",
    },
    invite: {
      subject: "شما به Philosify دعوت شده‌اید",
      title: "شما دعوت شده‌اید! 🎶",
      body: "شما به پیوستن به Philosify دعوت شده‌اید - فلسفه پنهان در موسیقی مورد علاقه خود را کشف کنید.",
      button: "پذیرش دعوت",
      footer:
        "اگر انتظار این دعوت را نداشتید، می‌توانید این ایمیل را نادیده بگیرید.",
    },
  },
  hu: {
    confirmSignup: {
      subject: "Erősítsd meg Philosify fiókodat",
      title: "Üdvözlünk a Philosify-ban! 🎵",
      body: "Köszönjük a regisztrációt! Kérjük, erősítsd meg e-mail címedet, hogy felfedezhesd a filozófiát kedvenc zenéidben.",
      button: "E-mail megerősítése",
      footer:
        "Ha nem hoztál létre fiókot, figyelmen kívül hagyhatod ezt az e-mailt.",
    },
    magicLink: {
      subject: "Philosify bejelentkezési linked",
      title: "Bejelentkezés a Philosify-ba 🔑",
      body: "Kattints az alábbi gombra a bejelentkezéshez. Ez a link 1 óra múlva lejár.",
      button: "Bejelentkezés most",
      footer:
        "Ha nem kérted ezt a linket, figyelmen kívül hagyhatod ezt az e-mailt.",
    },
    resetPassword: {
      subject: "Philosify jelszó visszaállítása",
      title: "Jelszó visszaállítása 🔒",
      body: "Jelszó-visszaállítási kérelmet kaptunk. Kattints az alábbi gombra új jelszó létrehozásához.",
      button: "Jelszó visszaállítása",
      footer: "Ha nem kérted ezt, figyelmen kívül hagyhatod ezt az e-mailt.",
    },
    emailChange: {
      subject: "Erősítsd meg új e-mail címedet",
      title: "E-mail változtatás megerősítése 📧",
      body: "E-mail cím változtatását kérted. Kattints az alábbi gombra a megerősítéshez.",
      button: "Új e-mail megerősítése",
      footer:
        "Ha nem kérted ezt a változtatást, kérjük, azonnal lépj kapcsolatba a támogatással.",
    },
    invite: {
      subject: "Meghívtak a Philosify-ba",
      title: "Meghívást kaptál! 🎶",
      body: "Meghívtak a Philosify-hoz való csatlakozásra - fedezd fel a kedvenc zenéidben rejlő filozófiát.",
      button: "Meghívás elfogadása",
      footer:
        "Ha nem vártad ezt a meghívást, figyelmen kívül hagyhatod ezt az e-mailt.",
    },
  },
  nl: {
    confirmSignup: {
      subject: "Bevestig je Philosify-account",
      title: "Welkom bij Philosify! 🎵",
      body: "Bedankt voor je aanmelding! Bevestig je e-mailadres om de filosofie in je favoriete muziek te ontdekken.",
      button: "E-mail bevestigen",
      footer:
        "Als je geen account hebt aangemaakt, kun je deze e-mail negeren.",
    },
    magicLink: {
      subject: "Je Philosify inloglink",
      title: "Inloggen bij Philosify 🔑",
      body: "Klik op de knop hieronder om in te loggen. Deze link verloopt over 1 uur.",
      button: "Nu inloggen",
      footer:
        "Als je deze link niet hebt aangevraagd, kun je deze e-mail negeren.",
    },
    resetPassword: {
      subject: "Reset je Philosify wachtwoord",
      title: "Wachtwoord resetten 🔒",
      body: "We hebben een verzoek ontvangen om je wachtwoord te resetten. Klik hieronder om een nieuw wachtwoord aan te maken.",
      button: "Wachtwoord resetten",
      footer: "Als je dit niet hebt aangevraagd, kun je deze e-mail negeren.",
    },
    emailChange: {
      subject: "Bevestig je nieuwe e-mailadres",
      title: "E-mailwijziging bevestigen 📧",
      body: "Je hebt gevraagd om je e-mailadres te wijzigen. Klik hieronder om te bevestigen.",
      button: "Nieuwe e-mail bevestigen",
      footer:
        "Als je deze wijziging niet hebt aangevraagd, neem dan direct contact op met support.",
    },
    invite: {
      subject: "Je bent uitgenodigd voor Philosify",
      title: "Je bent uitgenodigd! 🎶",
      body: "Je bent uitgenodigd om lid te worden van Philosify - ontdek de filosofie verborgen in je favoriete muziek.",
      button: "Uitnodiging accepteren",
      footer:
        "Als je deze uitnodiging niet verwachtte, kun je deze e-mail negeren.",
    },
  },
  pl: {
    confirmSignup: {
      subject: "Potwierdź swoje konto Philosify",
      title: "Witamy w Philosify! 🎵",
      body: "Dziękujemy za rejestrację! Proszę potwierdź swój adres e-mail, aby zacząć odkrywać filozofię w ulubionej muzyce.",
      button: "Potwierdź e-mail",
      footer: "Jeśli nie zakładałeś konta, możesz zignorować ten e-mail.",
    },
    magicLink: {
      subject: "Twój link logowania Philosify",
      title: "Zaloguj się do Philosify 🔑",
      body: "Kliknij przycisk poniżej, aby się zalogować. Ten link wygaśnie za 1 godzinę.",
      button: "Zaloguj się teraz",
      footer: "Jeśli nie prosiłeś o ten link, możesz zignorować ten e-mail.",
    },
    resetPassword: {
      subject: "Zresetuj hasło Philosify",
      title: "Resetuj hasło 🔒",
      body: "Otrzymaliśmy prośbę o zresetowanie hasła. Kliknij poniżej, aby utworzyć nowe.",
      button: "Resetuj hasło",
      footer: "Jeśli o to nie prosiłeś, możesz zignorować ten e-mail.",
    },
    emailChange: {
      subject: "Potwierdź swój nowy adres e-mail",
      title: "Potwierdź zmianę e-maila 📧",
      body: "Poprosiłeś o zmianę adresu e-mail. Kliknij poniżej, aby potwierdzić.",
      button: "Potwierdź nowy e-mail",
      footer:
        "Jeśli nie prosiłeś o tę zmianę, natychmiast skontaktuj się ze wsparciem.",
    },
    invite: {
      subject: "Zostałeś zaproszony do Philosify",
      title: "Jesteś zaproszony! 🎶",
      body: "Zostałeś zaproszony do Philosify - odkryj filozofię ukrytą w ulubionej muzyce.",
      button: "Przyjmij zaproszenie",
      footer:
        "Jeśli nie spodziewałeś się tego zaproszenia, możesz zignorować ten e-mail.",
    },
  },
  tr: {
    confirmSignup: {
      subject: "Philosify hesabınızı onaylayın",
      title: "Philosify'a hoş geldiniz! 🎵",
      body: "Kayıt olduğunuz için teşekkürler! Favori müziklerinizdeki felsefeyi keşfetmeye başlamak için e-posta adresinizi onaylayın.",
      button: "E-postayı Onayla",
      footer: "Hesap oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.",
    },
    magicLink: {
      subject: "Philosify giriş bağlantınız",
      title: "Philosify'a Giriş Yap 🔑",
      body: "Giriş yapmak için aşağıdaki düğmeye tıklayın. Bu bağlantı 1 saat içinde sona erecek.",
      button: "Şimdi Giriş Yap",
      footer:
        "Bu bağlantıyı talep etmediyseniz, bu e-postayı görmezden gelebilirsiniz.",
    },
    resetPassword: {
      subject: "Philosify şifrenizi sıfırlayın",
      title: "Şifreyi Sıfırla 🔒",
      body: "Şifrenizi sıfırlama isteği aldık. Yeni şifre oluşturmak için aşağıya tıklayın.",
      button: "Şifreyi Sıfırla",
      footer: "Bunu talep etmediyseniz, bu e-postayı görmezden gelebilirsiniz.",
    },
    emailChange: {
      subject: "Yeni e-posta adresinizi onaylayın",
      title: "E-posta Değişikliğini Onayla 📧",
      body: "E-posta adresinizi değiştirme isteğinde bulundunuz. Onaylamak için aşağıya tıklayın.",
      button: "Yeni E-postayı Onayla",
      footer:
        "Bu değişikliği talep etmediyseniz, lütfen hemen destekle iletişime geçin.",
    },
    invite: {
      subject: "Philosify'a davet edildiniz",
      title: "Davet Edildiniz! 🎶",
      body: "Philosify'a katılmaya davet edildiniz - favori müziklerinizdeki gizli felsefeyi keşfedin.",
      button: "Daveti Kabul Et",
      footer:
        "Bu daveti beklemiyordunuzsa, bu e-postayı görmezden gelebilirsiniz.",
    },
  },
};

/**
 * Map Supabase email action types to our translation keys
 */
function mapEmailType(emailActionType) {
  const typeMap = {
    signup: "confirmSignup",
    magiclink: "magicLink",
    recovery: "resetPassword",
    email_change: "emailChange",
    invite: "invite",
  };
  return typeMap[emailActionType?.toLowerCase()] || "confirmSignup";
}

/**
 * Get translations for a specific language and email type
 */
function getTranslations(language, emailType) {
  const lang = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS["en"];
  const type = mapEmailType(emailType);
  return lang[type] || EMAIL_TRANSLATIONS["en"][type];
}

/**
 * Generate HTML email template with localized content
 */
function generateEmailHtml(translations, confirmationUrl) {
  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0020; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0020; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Outer glow wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <tr>
            <td style="padding: 2px; background: linear-gradient(135deg, rgba(0,240,255,0.3) 0%, rgba(124,58,237,0.25) 50%, rgba(0,200,220,0.3) 100%); border-radius: 14px;">
              <!-- Main card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0c051e; border-radius: 12px; overflow: hidden;">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: #0a0020; padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid rgba(120,100,180,0.2);">
                    <img src="${LOGO_URL}" alt="Philosify" style="max-width: 80px; height: auto;" />
                  </td>
                </tr>
                
                <!-- Accent line (cyan-purple gradient simulation) -->
                <tr>
                  <td style="height: 2px; background: linear-gradient(90deg, transparent, #00f0ff, #7c3aed, #00f0ff, transparent);"></td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 36px 40px 32px; background-color: #0c051e;">
                    <!-- Title -->
                    <h2 style="margin: 0 0 20px 0; color: #00f0ff; font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; font-size: 22px; font-weight: bold; letter-spacing: 1px; text-align: center;">${translations.title}</h2>
                    
                    <!-- Body text -->
                    <p style="margin: 0 0 28px 0; color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.8; text-align: center;">
                      ${translations.body}
                    </p>
                    
                    <!-- CTA Button (Bulletproof: works in Outlook, Gmail, Apple Mail, etc.) -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0 32px 0;">
                          <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                              <td align="center" bgcolor="#00f0ff" style="border-radius: 8px; background-color: #00f0ff;">
                                <!--[if mso]>
                                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="16%" strokecolor="#00f0ff" fillcolor="#00f0ff">
                                  <w:anchorlock/>
                                  <center style="color:#0a0020;font-family:'Trebuchet MS','Segoe UI',sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">${translations.button}</center>
                                </v:roundrect>
                                <![endif]-->
                                <!--[if !mso]><!-->
                                <a href="${confirmationUrl}" style="background-color: #00f0ff; border-radius: 8px; color: #0a0020; display: inline-block; font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; padding: 14px 48px; text-decoration: none; mso-hide: all;">
                                  ${translations.button}
                                </a>
                                <!--<![endif]-->
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
                      <tr>
                        <td style="height: 1px; background: linear-gradient(90deg, transparent, rgba(120,100,180,0.25), transparent);"></td>
                      </tr>
                    </table>
                    
                    <!-- Footer text -->
                    <p style="margin: 0; color: rgba(255,255,255,0.35); font-size: 12px; text-align: center; line-height: 1.6;">
                      ${translations.footer}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer bar -->
                <tr>
                  <td style="background-color: #080318; padding: 20px 40px; border-top: 1px solid rgba(120,100,180,0.15);">
                    <p style="margin: 0; color: rgba(255,255,255,0.25); font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; font-size: 11px; text-align: center; letter-spacing: 0.5px;">
                      &copy; Philosify &bull; <a href="https://everything.philosify.org" style="color: #00f0ff; text-decoration: none;">everything.philosify.org</a>
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
</html>`;
}

/**
 * Verify Supabase Auth Hook signature (Standard Webhooks format)
 * Supabase uses the standardwebhooks spec with headers:
 *   webhook-id, webhook-timestamp, webhook-signature
 * Secret format: "v1,whsec_<base64_encoded_secret>"
 */
async function verifyHookSignature(request, env, body) {
  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");

  console.log("[AuthEmail] Signature check - headers present:", {
    id: !!webhookId,
    timestamp: !!webhookTimestamp,
    signature: !!webhookSignature,
  });

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error("[AuthEmail] Missing webhook headers");
    return false;
  }

  const hookSecret = await getSecret(env.SUPABASE_AUTH_HOOK_SECRET);
  if (!hookSecret) {
    console.error("[AuthEmail] SUPABASE_AUTH_HOOK_SECRET not configured");
    return false;
  }

  console.log("[AuthEmail] Secret configured:", !!hookSecret);

  try {
    // Extract the base64 secret (remove "v1,whsec_" prefix)
    const secretStr = hookSecret.replace(/^v1,whsec_/, "");
    const secretBytes = Uint8Array.from(atob(secretStr), (c) =>
      c.charCodeAt(0),
    );

    // Build the signed content: "webhook-id.webhook-timestamp.body"
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedContent),
    );

    // Convert to base64
    const computedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer)),
    );

    // webhook-signature header can have multiple signatures separated by spaces
    // Each signature is prefixed with version (e.g., "v1,<base64>")
    const expectedSignatures = webhookSignature.split(" ");
    console.log("[AuthEmail] Signature count:", expectedSignatures.length);

    for (const sig of expectedSignatures) {
      const sigValue = sig.replace(/^v1,/, "");
      if (sigValue === computedSignature) {
        console.log("[AuthEmail] Signature verified OK");
        return true;
      }
    }

    console.error("[AuthEmail] Signature mismatch");
    return false;
  } catch (err) {
    console.error(
      "[AuthEmail] Signature verification error:",
      err.message || err,
    );
    return false;
  }
}

/**
 * Main handler for Supabase Auth Email Hook
 * POST /auth/send-email
 */
export async function handleAuthEmail(request, env, origin) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin, env);
  }

  try {
    // Parse request body
    const bodyText = await request.text();
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, origin, env);
    }

    // Verify signature - REQUIRED for security
    const isValid = await verifyHookSignature(request, env, bodyText);
    if (!isValid) {
      console.error(
        "[AuthEmail] Invalid or missing signature - rejecting request",
      );
      return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
    }

    // Extract user info and email data from Supabase payload
    const user = payload.user || {};
    const emailData = payload.email_data || {};

    const userEmail = user.email;
    const emailActionType = emailData.email_action_type || "signup";

    // Build confirmation URL from token_hash and site_url/redirect_to
    // Supabase sends site_url as the full auth base (e.g. https://xxx.supabase.co/auth/v1)
    // so we only append /verify (not /auth/v1/verify) to avoid path duplication
    const siteUrl = emailData.site_url || "https://everything.philosify.org";
    const redirectTo = emailData.redirect_to || siteUrl;
    const tokenHash = emailData.token_hash || "";
    const confirmationUrl = tokenHash
      ? `${siteUrl.replace(/\/+$/, "")}/verify?token=${tokenHash}&type=${emailActionType}&redirect_to=${encodeURIComponent(redirectTo)}`
      : redirectTo;

    // Get user's preferred language from metadata, fallback to 'en'
    const userLanguage =
      user.user_metadata?.language || user.app_metadata?.language || "en";

    // Validate required fields
    if (!userEmail) {
      console.error("[AuthEmail] Missing user email");
      return jsonResponse({ error: "Missing user email" }, 400, origin, env);
    }

    console.log(
      `[AuthEmail] Sending ${emailActionType} email to ${userEmail} in ${userLanguage}`,
    );

    // Get localized translations
    const translations = getTranslations(userLanguage, emailActionType);

    // Generate HTML email
    const html = generateEmailHtml(translations, confirmationUrl);

    // Send via Resend
    const resendApiKey = await getSecret(env.RESEND_API_KEY);
    if (!resendApiKey) {
      console.error("[AuthEmail] RESEND_API_KEY not configured");
      return jsonResponse(
        { error: "Email service not configured" },
        500,
        origin,
        env,
      );
    }

    const emailPayload = {
      from: "Philosify <bob@philosify.org>",
      to: [userEmail],
      subject: translations.subject,
      html: html,
      text: `${translations.title}\n\n${translations.body}\n\n${translations.button}: ${confirmationUrl}\n\n${translations.footer}`,
      reply_to: "bob@philosify.org",
    };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error("[AuthEmail] Resend error:", resendResponse.status, error);
      return jsonResponse({ error: "Failed to send email" }, 500, origin, env);
    }

    const result = await resendResponse.json();
    console.log(`[AuthEmail] ✅ Email sent successfully: ${result.id}`);

    // Return success to Supabase
    return jsonResponse(
      {
        success: true,
        message_id: result.id,
      },
      200,
      origin,
      env,
    );
  } catch (err) {
    console.error("[AuthEmail] Exception:", err);
    return jsonResponse({ error: "Email processing failed" }, 500, origin, env);
  }
}
