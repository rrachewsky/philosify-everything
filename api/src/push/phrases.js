// ============================================================
// PUSH NOTIFICATION PHRASES — All 18 Languages
// ============================================================
// Used by handlers when sending push notifications.
// The recipient's language is fetched from their profile/preferences.

const PUSH_PHRASES = {
  en: {
    sentMessage: 'Sent you a message',
    repliedComment: 'Replied to your comment in the debate',
    joinedDebate: (name) => `${name} has joined the debate`,
    verdictIn: 'The verdict is in',
    newMessage: 'You have a new notification',
    inGroup: (name, group) => `${name} in ${group}`,
  },
  pt: {
    sentMessage: 'Enviou uma mensagem para voce',
    repliedComment: 'Respondeu ao seu comentario no debate',
    joinedDebate: (name) => `${name} entrou no debate`,
    verdictIn: 'O veredito chegou',
    newMessage: 'Voce tem uma nova notificacao',
    inGroup: (name, group) => `${name} em ${group}`,
  },
  es: {
    sentMessage: 'Te envio un mensaje',
    repliedComment: 'Respondio a tu comentario en el debate',
    joinedDebate: (name) => `${name} se unio al debate`,
    verdictIn: 'El veredicto esta listo',
    newMessage: 'Tienes una nueva notificacion',
    inGroup: (name, group) => `${name} en ${group}`,
  },
  fr: {
    sentMessage: 'Vous a envoye un message',
    repliedComment: 'A repondu a votre commentaire dans le debat',
    joinedDebate: (name) => `${name} a rejoint le debat`,
    verdictIn: 'Le verdict est arrive',
    newMessage: 'Vous avez une nouvelle notification',
    inGroup: (name, group) => `${name} dans ${group}`,
  },
  de: {
    sentMessage: 'Hat Ihnen eine Nachricht gesendet',
    repliedComment: 'Hat auf Ihren Kommentar in der Debatte geantwortet',
    joinedDebate: (name) => `${name} ist der Debatte beigetreten`,
    verdictIn: 'Das Urteil ist da',
    newMessage: 'Sie haben eine neue Benachrichtigung',
    inGroup: (name, group) => `${name} in ${group}`,
  },
  it: {
    sentMessage: 'Ti ha inviato un messaggio',
    repliedComment: 'Ha risposto al tuo commento nel dibattito',
    joinedDebate: (name) => `${name} si e unito al dibattito`,
    verdictIn: 'Il verdetto e arrivato',
    newMessage: 'Hai una nuova notifica',
    inGroup: (name, group) => `${name} in ${group}`,
  },
  ru: {
    sentMessage: 'Отправил вам сообщение',
    repliedComment: 'Ответил на ваш комментарий в дебатах',
    joinedDebate: (name) => `${name} присоединился к дебатам`,
    verdictIn: 'Вердикт вынесен',
    newMessage: 'У вас новое уведомление',
    inGroup: (name, group) => `${name} в ${group}`,
  },
  hu: {
    sentMessage: 'Uzenetet kuldott neked',
    repliedComment: 'Valaszolt a hozzaszolasodra a vitaban',
    joinedDebate: (name) => `${name} csatlakozott a vitahoz`,
    verdictIn: 'Az itelet megerkezett',
    newMessage: 'Uj ertesitesed van',
    inGroup: (name, group) => `${name} a(z) ${group} csoportban`,
  },
  he: {
    sentMessage: 'שלח לך הודעה',
    repliedComment: 'הגיב לתגובה שלך בדיון',
    joinedDebate: (name) => `${name} הצטרף לדיון`,
    verdictIn: 'פסק הדין ניתן',
    newMessage: 'יש לך התראה חדשה',
    inGroup: (name, group) => `${name} ב-${group}`,
  },
  zh: {
    sentMessage: '给你发了一条消息',
    repliedComment: '回复了你在辩论中的评论',
    joinedDebate: (name) => `${name} 加入了辩论`,
    verdictIn: '裁决已出',
    newMessage: '你有一条新通知',
    inGroup: (name, group) => `${name} 在 ${group}`,
  },
  ja: {
    sentMessage: 'メッセージを送信しました',
    repliedComment: 'ディベートであなたのコメントに返信しました',
    joinedDebate: (name) => `${name}がディベートに参加しました`,
    verdictIn: '評決が出ました',
    newMessage: '新しい通知があります',
    inGroup: (name, group) => `${name}（${group}）`,
  },
  ko: {
    sentMessage: '메시지를 보냈습니다',
    repliedComment: '토론에서 당신의 댓글에 답변했습니다',
    joinedDebate: (name) => `${name}님이 토론에 참여했습니다`,
    verdictIn: '평결이 나왔습니다',
    newMessage: '새 알림이 있습니다',
    inGroup: (name, group) => `${name} - ${group}`,
  },
  ar: {
    sentMessage: 'أرسل لك رسالة',
    repliedComment: 'رد على تعليقك في النقاش',
    joinedDebate: (name) => `${name} انضم إلى النقاش`,
    verdictIn: 'صدر الحكم',
    newMessage: 'لديك إشعار جديد',
    inGroup: (name, group) => `${name} في ${group}`,
  },
  hi: {
    sentMessage: 'आपको एक संदेश भेजा',
    repliedComment: 'बहस में आपकी टिप्पणी का जवाब दिया',
    joinedDebate: (name) => `${name} बहस में शामिल हुए`,
    verdictIn: 'फैसला आ गया है',
    newMessage: 'आपकी एक नई सूचना है',
    inGroup: (name, group) => `${name} ${group} में`,
  },
  fa: {
    sentMessage: 'برایت پیام فرستاد',
    repliedComment: 'به نظر شما در بحث پاسخ داد',
    joinedDebate: (name) => `${name} به بحث پیوست`,
    verdictIn: 'حکم صادر شد',
    newMessage: 'یک اعلان جدید دارید',
    inGroup: (name, group) => `${name} در ${group}`,
  },
  nl: {
    sentMessage: 'Heeft je een bericht gestuurd',
    repliedComment: 'Heeft gereageerd op je opmerking in het debat',
    joinedDebate: (name) => `${name} heeft zich bij het debat aangesloten`,
    verdictIn: 'Het oordeel is gevallen',
    newMessage: 'Je hebt een nieuwe melding',
    inGroup: (name, group) => `${name} in ${group}`,
  },
  pl: {
    sentMessage: 'Wyslal ci wiadomosc',
    repliedComment: 'Odpowiedzial na twoj komentarz w debacie',
    joinedDebate: (name) => `${name} dolaczyl do debaty`,
    verdictIn: 'Werdykt zostal wydany',
    newMessage: 'Masz nowe powiadomienie',
    inGroup: (name, group) => `${name} w ${group}`,
  },
  tr: {
    sentMessage: 'Sana bir mesaj gonderdi',
    repliedComment: 'Tartismadaki yorumuna cevap verdi',
    joinedDebate: (name) => `${name} tartismaya katildi`,
    verdictIn: 'Karar verildi',
    newMessage: 'Yeni bir bildiriminiz var',
    inGroup: (name, group) => `${name} - ${group}`,
  },
};

/**
 * Get push notification phrase in the recipient's language.
 * @param {string} lang - Recipient's language code
 * @param {string} key - Phrase key
 * @param {...any} args - Arguments for dynamic phrases
 * @returns {string}
 */
export function getPushPhrase(lang, key, ...args) {
  const phrases = PUSH_PHRASES[lang] || PUSH_PHRASES.en;
  const phrase = phrases[key] || PUSH_PHRASES.en[key];
  if (typeof phrase === 'function') return phrase(...args);
  return phrase || PUSH_PHRASES.en[key] || '';
}
