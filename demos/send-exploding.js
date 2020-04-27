#!/usr/bin/env node
const Bot = require('../index.js')

async function main() {
  const bot = new Bot()
  const target = process.env.KB_TARGET || 'kbot'

  try {
    // You must execute this with a running service in order to have available ephemeral keys
    await bot.initFromRunningService()
    console.log(`Your bot is initialized. It is logged in as ${bot.myInfo().username}`)
    const channel = {name: target + ',' + bot.myInfo().username, public: false, topicType: 'chat'}
    const message = {
      body: `Hello ${target}! This is ${bot.myInfo().username} saying an _exploding_ hello from my device ${
        bot.myInfo().devicename
      }`,
    }
    await bot.chat.send(channel, message, {
      explodingLifetime: '24h',
    })
    console.log('Message sent!')
  } catch (err) {
    console.error(err)
  } finally {
    bot.deinit()
  }
}

main()
