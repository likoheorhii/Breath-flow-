const fetch = global.fetch;

class TelegramBot {
  constructor(token, options={}){
    this.token = token; this.base = `https://api.telegram.org/bot${token}`;
    this.offset = 0; this.polling = options.polling;
  }
  async sendMessage(chatId, text, parseMode='HTML', replyMarkup){
    const body = { chat_id: chatId, text };
    if(parseMode) body.parse_mode = parseMode;
    if(replyMarkup) body.reply_markup = replyMarkup;
    await fetch(`${this.base}/sendMessage`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  }
  async getUpdates(){
    const res = await fetch(`${this.base}/getUpdates?timeout=30&offset=${this.offset+1}`);
    if(!res.ok) return [];
    const data = await res.json();
    return data.result||[];
  }
}

module.exports = { TelegramBot };