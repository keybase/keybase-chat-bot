# keybase-chat-bot

Script Keybase Chat in Node.js!

This module is a side-project/work in progress and may change or have crashers, but feel free to play with it. As long as you have a Keybase account and a paper key, you can use this module to script basic chat commands.

For more information about the API this module uses, run `keybase chat api -h` from your terminal.

- [Installation](#installation)
- [Hello World](#hello-world)
- [API](#api)
- [Contributions](#contributions)

# Installation

Make sure to [install Keybase](https://keybase.io/download).

```bash
npm install keybase-chat-bot
```

### Hello world

```javascript
//
// Says hello to the keybase `kbot` account
//

const bot = new Bot()

try {
  await bot.init({username: process.env.KB_USERNAME, paperkey: process.env.KB_PAPERKEY, verbose: false})
  console.log(`Your bot is initialized. It is logged in as ${bot.myInfo().username}`)
  const channel = {name: 'kbot,' + bot.myInfo().username, public: false, topic_type: 'chat'}
  const sendArg = {
    channel: channel,
    message: {
      body: `Hello kbot! This is ${bot.myInfo().username} saying hello from my device ${
        bot.myInfo().devicename
      }`,
    },
  }
  await bot.chatSend(sendArg)
  console.log('Message sent!')
} catch (error) {
  console.error(error)
} finally {
  await bot.deinit()
}
```

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

- [Bot](#bot)
  - [init](#init)
    - [Parameters](#parameters)
  - [deinit](#deinit)
- [Chat](#chat)
  - [list](#list)
    - [Parameters](#parameters-1)
    - [Examples](#examples)
  - [read](#read)
    - [Parameters](#parameters-2)
  - [send](#send)
    - [Parameters](#parameters-3)
  - [delete](#delete)
    - [Parameters](#parameters-4)
  - [watchChannelForNewMessages](#watchchannelfornewmessages)
    - [Parameters](#parameters-5)
    - [Examples](#examples-1)
  - [watchAllChannelsForNewMessages](#watchallchannelsfornewmessages)
    - [Parameters](#parameters-6)
    - [Examples](#examples-2)

### Bot

A Keybase bot.

#### init

Initialize your bot by starting an instance of the Keybase service and logging in using oneshot mode.

##### Parameters

- `username` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The username of your bot's Keybase account.
- `paperkey` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The paperkey of your bot's Keybase account.
- `options` **InitOptions**

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;void>**

#### deinit

Deinitializes the bot by logging out, stopping the keybase service, and removing any leftover login files made by the bot. This should be run before your bot ends.

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;void>**

### Chat

**Extends ClientBase**

A Keybase bot.

#### list

Lists your chats, with info on which ones have unread messages.

##### Parameters

- `options` **ChatListOptions** An object of options that can be passed to the method.

##### Examples

```javascript
const chatConversations = bot.chat.list({unreadOnly: true})
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;ChatConversation>>** An array of chat conversations. If there are no conversations, the array is empty.

#### read

Reads the messages in a channel. You can read with or without marking as read.

##### Parameters

- `channel` **ChatChannel** The chat channel to read messages in.
- `options` **ChatReadOptions** An object of options that can be passed to the method.

#### send

Send a message to a certain channel.

##### Parameters

- `channel` **ChatChannel** The chat channel to send the message in.
- `message` **ChatMessage** The chat message to send.
- `options` **ChatSendOptions** An object of options that can be passed to the method.

#### delete

Deletes a message in a channel. Messages have messageId's associated with
them, which you can learn in `bot.chat.read`. Known bug: the GUI has a cache,
and deleting from the CLI may not become apparent immediately.

##### Parameters

- `channel` **ChatChannel** The chat channel to send the message in.
- `messageId` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** The chat message to send.
- `options` **ChatDeleteOptions** An object of options that can be passed to the method.

#### watchChannelForNewMessages

Listens for new chat messages on a specified channel. The `onMessage` function is called for every message your bot receives. This is pretty similar to `watchAllChannelsForNewMessages`, except it specifically checks one channel.

##### Parameters

- `channel` **ChatChannel** The chat channel to watch.
- `onMessage` **OnMessage** A callback that is triggered on every message your bot receives.
- `onError` **[OnError](https://developer.mozilla.org/docs/Web/API/GlobalEventHandlers/onerror)** A callback that is triggered on any error that occurs while the method is executing.

##### Examples

```javascript
// Reply to all messages between you and `kbot` with 'thanks!'
const channel = {name: 'kbot,' + bot.myInfo().username, public: false, topic_type: 'chat'}
const onMessage = message => {
  const channel = message.channel
  bot.chat.send({
    channel: channel,
    message: {
      body: 'thanks!!!',
    },
  })
}
bot.chat.watchChannelForNewMessages(channel, onMessage)
```

#### watchAllChannelsForNewMessages

This function will put your bot into full-read mode, where it reads
everything it can and every new message it finds it will pass to you, so
you can do what you want with it. For example, if you want to write a
Keybase bot that talks shit at anyone who dares approach it, this is the
function to use.

##### Parameters

- `onMessage` **OnMessage** A callback that is triggered on every message your bot receives.
- `onError` **[OnError](https://developer.mozilla.org/docs/Web/API/GlobalEventHandlers/onerror)** A callback that is triggered on any error that occurs while the method is executing.

##### Examples

```javascript
// Reply to incoming traffic on all channels with 'thanks!'
const onMessage = message => {
  const channel = message.channel
  bot.chat.send({
    channel: channel,
    message: {
      body: 'thanks!!!',
    },
  })
}
bot.chat.watchAllChannelsForNewMessages(onMessage)
```
