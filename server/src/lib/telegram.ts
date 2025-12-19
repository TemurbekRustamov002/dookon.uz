const API_URL = 'https://api.telegram.org/bot';

export async function setWebhook(token: string, webhookUrl: string) {
    const url = `${API_URL}${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    const res = await fetch(url);
    return res.json();
}

export async function sendMessage(token: string, chatId: number, text: string, replyMarkup?: any) {
    const url = `${API_URL}${token}/sendMessage`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            reply_markup: replyMarkup
        })
    });
    return res.json();
}
