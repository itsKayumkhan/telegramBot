const express = require('express');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const port = process.env.PORT || 5000;

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const bot = new TelegramBot('7454719460:AAHaqbR2QL0W-9LTtmT3BJpR4mIONmOXLgc', { polling: true }); // TODO: Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token

mongoose.connect('mongodb+srv://kayumkhan:kayumkhan2004@cluster0.ctdsalv.mongodb.net/telegram-bot', { useNewUrlParser: true, useUnifiedTopology: true }) // TODO: Replace '<username>' and '<password>' with your MongoDB credentials
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

const userSchema = new mongoose.Schema({
  chatId: { type: String, unique: true },
  firstName: String,
  lastName: String,
  username: String,
  amount: { type: Number, default: 100 }
});

const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
  text: String,
  links: [String]
});

const Message = mongoose.model('Message', messageSchema);

app.use(express.json());

app.post('/api/message', async (req, res) => {
  try {
    const { text, links } = req.body;
    const message = new Message({ text, links: JSON.parse(links) });
    await message.save();
    res.send({ text: message.text, links: message.links });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/message', async (req, res) => {
  try {
    const messages = await Message.find();
    res.send(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const sendMessageWithButtons = (chatId, text, includeStartButton = false) => {
  const buttons = [
    [
      { text: 'Withdraw', callback_data: 'withdraw' },
      { text: 'Refer and Earn', callback_data: 'refer' }
    ]
  ];

  if (includeStartButton) {
    buttons.unshift([{ text: 'Start', callback_data: 'start' }]);
  }

  const options = {
    reply_markup: {
      inline_keyboard: buttons
    }
  };
  bot.sendMessage(chatId, text, options);
};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name;
  const username = msg.from.username;

  try {
    let user = await User.findOne({ chatId: chatId });

    if (!user) {
      user = new User({ chatId, firstName, lastName, username });
      await user.save();

      const welcomeMessage = '👋 Hey There User Welcome To Paytm Ads Bot ! \n\n❤️ Join The Above Channels After Click Claim You Will Receive Upto ₹100 Upi Cash Withdraw It Instantly In Your Upi 🤑 \n\n😱 Also Per Refer Upto ₹100 Unlimited. 💰 \n\nTo access the wallet you must join channels 👇👇';
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Join Gift Code Channel', url: 'https://t.me/akib7627' }], // TODO: Replace with your actual channel link
            [{ text: 'Register Now', url: 'https://tpplay.in/#/register?invitationCode=52151101341' }], // TODO: Replace with your actual registration link
            [{ text: 'Claim', callback_data: 'claim' }]
          ]
        },
        parse_mode: 'Markdown'
      };
      bot.sendMessage(chatId, welcomeMessage, options);
    } else {
      const mainMenuMessage = '🏡 Welcome To Main Menu\n🎁 You Won Rs.100 Bonus Cash';
      sendMessageWithButtons(chatId, mainMenuMessage);
    }
  } catch (error) {
    console.error('Error handling /start command:', error);
    bot.sendMessage(chatId, 'An error occurred. Please try again later.');
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  try {
    const user = await User.findOne({ chatId: chatId });

    switch (data) {
      case 'withdraw':
        if (user.amount < 500) {
          bot.sendMessage(chatId, 'You Need Minimum ₹500 In Balance To Withdraw !');
        } else {
          bot.sendMessage(chatId, 'Withdrawal successful!');
          user.amount -= 500;
          await user.save();
        }
        break;
      case 'refer':
        const referMessage = `🥳 Per Refer Upto ₹100 UPI Cash !\n\n🔍 Refer Link : https://t.me/PaytmAdsCashBackBot?start=${chatId}\n\n👇🏻 Use Below Button To Share It With Your Friends And Earn Rewards.`;
        sendMessageWithButtons(chatId, referMessage);
        break;
      case 'start':
      case 'claim':
        bot.sendMessage(chatId, '/start');
        break;
      default:
        bot.sendMessage(chatId, 'Invalid action. Please try again.');
        break;
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.sendMessage(chatId, 'An error occurred. Please try again later.');
  }
});
