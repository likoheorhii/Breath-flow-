const fetch = global.fetch;

class TelegramBot {
  constructor(token, options={}){
    this.token = token; this.base = `https://api.telegram.org/bot${token}`;
    this.offset = 0; this.polling = options.polling;
  }
  async sendMessage(chatId, text){
    await fetch(`${this.base}/sendMessage`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ chat_id: chatId, text }) });
  }
  async getUpdates(){
    const res = await fetch(`${this.base}/getUpdates?timeout=30&offset=${this.offset+1}`);
    if(!res.ok) return [];
    const data = await res.json();
    return data.result||[];
  }
}

module.exports = { TelegramBot };