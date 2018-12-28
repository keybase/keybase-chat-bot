import Bot from '../lib'
import config from './tests.config.js'

describe('Chat list', () => {
  it('Returns all chat conversations in an array', async () => {
    const alice = new Bot()
    await alice.init(config.bots.alice1.username, config.bots.alice1.paperkey)
    const list = await alice.chat.list()

    // const conversationMatcher = expect.objectContaining({
    //   id: expect.any(String),
    //   // channel: expect.any(),
    //   unread: expect.any(Boolean),
    //   activeAt: expect.any(Number),
    //   activeAtMs: expect.any(Number),
    //   memberStatus: expect.any(String),
    // })

    expect(Array.isArray(list)).toBe(true)
    expect(list).toEqual(expect.arrayContaining([expect.anything()]))
    // .or.toHaveLength(0)
    await alice.deinit()
  })

  // it('Returns an empty array if there are no chat conversations', async () => {})

  // it('Throws an error if the bot is not initialized', async () => {})

  // it('Shows only unread messages if given the option', async () => {})
})

describe('Chat read', () => {
  it('Retrieves all messages in a conversation', async () => {
    const alice = new Bot()
    await alice.init(config.bots.alice1.username, config.bots.alice1.paperkey)
    const channel = {name: `${config.bots.alice1.username},${config.bots.bob1.username}`}
    const messages = await alice.chat.read(channel)

    expect(Array.isArray(messages)).toBe(true)
  })
})

// describe('Chat send', () => {
//   it('Sends a message to a certain channel and returns an empty promise', async () => {
//     const alice = new Bot()
//     await alice.init(config.bots.alice1.username, config.bots.alice1.paperkey)

//     const channel = {name: `${config.bots.alice1.username},${config.bots.bob1.username}`}
//     const message = {body: 'Testing chat.send()!'}
//     await alice.chat.send(channel, message)

//     const messages = await alice.chat.read(channel, {peek: true}
//     expect(messages[0]).
//   })
// })
