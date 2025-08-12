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
  async setMyCommands(commands){
    await fetch(`${this.base}/setMyCommands`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ commands }) });
  }
  async setMyDescription(description){
    await fetch(`${this.base}/setMyDescription`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ description }) });
  }
  async setMyShortDescription(short_description){
    await fetch(`${this.base}/setMyShortDescription`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ short_description }) });
  }
  async setMyName(name){
    await fetch(`${this.base}/setMyName`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
  }
}

module.exports = { TelegramBot };