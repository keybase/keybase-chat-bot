import {spawn} from 'child_process'
import readline from 'readline'
import ClientBase from '../client-base'
import {formatAPIObjectOutput, formatAPIObjectInput} from '../utils'
import * as chat1 from '../types/chat1'

/** A function to call when a message is received. */
export type OnMessage = (message: chat1.MsgSummary) => void | Promise<void>
/** A function to call when an error occurs. */
export type OnError = (error: Error) => void | Promise<void>

/** A function to call when the bot is added to a new conversation. */
export type OnConv = (channel: chat1.ConvSummary) => void | Promise<void>

/**
 * Options for the `list` method of the chat module.
 */
export interface ChatListOptions {
  failOffline?: boolean
  showErrors?: boolean
  topicType?: chat1.TopicType
  unreadOnly?: boolean
}

/**
 * Options for the `listChannels` method of the chat module.
 */
export interface ChatListChannelsOptions {
  topicType?: chat1.TopicType
  membersType?: chat1.ConversationMembersType
}

/**
 * Options for the `read` method of the chat module.
 */
export interface ChatReadOptions {
  failOffline?: boolean
  pagination?: chat1.Pagination
  peek?: boolean
  unreadOnly?: boolean
}

/**
 * Options for the `send` method of the chat module.
 */
export interface ChatSendOptions {
  nonblock?: boolean
  membersType?: chat1.ConversationMembersType
  confirmLumenSend?: boolean
  replyTo?: chat1.MessageID
  explodingLifetime?: number
}

/**
 * Options for the `attach` method of the chat module.
 */
export interface ChatAttachOptions {
  title?: string
  preview?: string
  explodingLifetime?: number
}

/**
 * Options for the `download` method of the chat module.
 */
export interface ChatDownloadOptions {
  preview?: string
  noStream?: boolean
}

/**
 * Options for the methods in the chat module that listen for new messages.
 * Local messages are ones sent by your device. Including them in the output is
 * useful for applications such as logging conversations, monitoring own flips
 * and building tools that seamlessly integrate with a running client used by
 * the user. If onNewConvo is set, it will be called when the bot is added to a new conversation.
 */
export interface ListenOptions {
  hideExploding: boolean
  showLocal: boolean
  ignoreSourceLocal?: boolean
}

export interface Advertisement {
  alias?: string
  advertisements: chat1.AdvertiseCommandAPIParam[]
}

export interface AdvertisementsLookup {
  channel: chat1.ChatChannel
  conversationID?: string
}

export interface ReadResult {
  messages: chat1.MsgSummary[]
  pagination: chat1.Pagination
}

/** The chat module of your Keybase bot. For more info about the API this module uses, you may want to check out `keybase chat api`. */
class Chat extends ClientBase {
  /**
   * Lists your chats, with info on which ones have unread messages.
   * @memberof Chat
   * @param options - An object of options that can be passed to the method.
   * @returns - An array of chat conversations. If there are no conversations, the array is empty.
   * @example
   * const chatConversations = await bot.chat.list({unreadOnly: true})
   * console.log(chatConversations)
   */
  public async list(options?: ChatListOptions): Promise<chat1.ConvSummary[]> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'list', options})
    if (!res) {
      throw new Error('Keybase chat list returned nothing.')
    }
    return res.conversations || []
  }

  /**
   * Lists conversation channels in a team
   * @memberof Chat
   * @param name - Name of the team
   * @param options - An object of options that can be passed to the method.
   * @returns - An array of chat conversations. If there are no conversations, the array is empty.
   * @example
   * bot.chat.listChannels('team_name').then(chatConversations => console.log(chatConversations))
   */
  public async listChannels(name: string, options?: ChatListChannelsOptions): Promise<chat1.ConvSummary[]> {
    await this._guardInitialized()
    const optionsWithDefaults = {
      ...options,
      name,
      membersType: options && options.membersType ? options.membersType : 'team',
    }
    const res = await this._runApiCommand({
      apiName: 'chat',
      method: 'listconvsonname',
      options: optionsWithDefaults,
    })
    if (!res) {
      throw new Error('Keybase chat list convs on name returned nothing.')
    }
    return res.conversations || []
  }

  private getChannelOrConversationId(
    channelOrConversationId: chat1.ChatChannel | chat1.ConvIDStr
  ): {
    channel?: chat1.ChatChannel
    conversationId?: chat1.ConvIDStr
  } {
    return {
      ...(typeof channelOrConversationId === 'string' ? {conversationId: channelOrConversationId} : {}),
      ...(typeof channelOrConversationId === 'string' ? {} : {channel: channelOrConversationId}),
    }
  }

  /**
   * Reads the messages in a channel. You can read with or without marking as read.
   * @memberof Chat
   * @param channel - The chat channel to read messages in.
   * @param options - An object of options that can be passed to the method.
   * @returns - A summary of data about a message, including who send it, when, the content of the message, etc. If there are no messages in your channel, then an error is thrown.
   * @example
   * alice.chat.read(channel).then(messages => console.log(messages))
   */
  public async read(channelOrConversationId: chat1.ChatChannel | chat1.ConvIDStr, options?: ChatReadOptions): Promise<ReadResult> {
    await this._guardInitialized()
    const conv = this.getChannelOrConversationId(channelOrConversationId)
    const optionsWithDefaults = {
      ...options,
      ...conv,
      peek: options && options.peek ? options.peek : false,
      unreadOnly: options && options.unreadOnly !== undefined ? options.unreadOnly : false,
    }
    const res = await this._runApiCommand({apiName: 'chat', method: 'read', options: optionsWithDefaults})
    if (!res) {
      throw new Error('Keybase chat read returned nothing.')
    }
    // Pagination gets passed as-is, while the messages get cleaned up
    return {
      pagination: res.pagination,
      messages: res.messages.map((message: chat1.MsgNotification): chat1.MsgSummary => message.msg!),
    }
  }

  /**
   * Joins a team conversation.
   * @param channel - The team chat channel to join.
   * @example
   * bot.chat.listConvsOnName('team_name').then(async teamConversations => {
   *  for (const conversation of teamConversations) {
   *    if (conversation.memberStatus !== 'active') {
   *      await bot.chat.join(conversation.channel)
   *      console.log('Joined team channel', conversation.channel)
   *    }
   *  }
   * })
   */
  public async joinChannel(channel: chat1.ChatChannel): Promise<void> {
    await this._guardInitialized()
    const res = await this._runApiCommand({
      apiName: 'chat',
      method: 'join',
      options: {
        channel,
      },
    })
    if (!res) {
      throw new Error('Keybase chat join returned nothing')
    }
  }

  /**
   * Leaves a team conversation.
   * @param channel - The team chat channel to leave.
   * @example
   * bot.chat.listConvsOnName('team_name').then(async teamConversations => {
   *  for (const conversation of teamConversations) {
   *    if (conversation.memberStatus === 'active') {
   *      await bot.chat.leave(conversation.channel)
   *      console.log('Left team channel', conversation.channel)
   *    }
   *  }
   * })
   */
  public async leaveChannel(channel: chat1.ChatChannel): Promise<void> {
    await this._guardInitialized()
    const res = await this._runApiCommand({
      apiName: 'chat',
      method: 'leave',
      options: {
        channel,
      },
    })
    if (!res) {
      throw new Error('Keybase chat leave returned nothing')
    }
  }

  /**
   * Send a message to a certain channel.
   * @memberof Chat
   * @param channel - The chat channel to send the message in.
   * @param message - The chat message to send.
   * @example
   * const channel = {name: 'kbot,' + bot.myInfo().username, public: false, topicType: 'chat'}
   * const message = {body: 'Hello kbot!'}
   * bot.chat.send(channel, message).then(() => console.log('message sent!'))
   */
  public async send(
    channelOrConversationId: chat1.ChatChannel | chat1.ConvIDStr,
    message: chat1.ChatMessage,
    options?: ChatSendOptions
  ): Promise<chat1.SendRes> {
    await this._guardInitialized()
    const conv = this.getChannelOrConversationId(channelOrConversationId)
    const args = {
      ...options,
      explodingLifetime: options?.explodingLifetime ? `${options?.explodingLifetime}ms` : undefined,
      ...conv,
      message,
    }
    this._adminDebugLogger.info(`sending message "${message.body}" in conversation ${JSON.stringify(conv)}`)
    const res = await this._runApiCommand({
      apiName: 'chat',
      method: 'send',
      options: args,
    })
    if (!res) {
      throw new Error('Keybase chat send returned nothing')
    }
    this._adminDebugLogger.info(`message sent with id ${res.id}`)
    return res
  }

  /**
   * Creates a new blank conversation.
   * @memberof Chat
   * @param channel - The chat channel to create.
   * @example
   * bot.chat.createChannel(channel).then(() => console.log('conversation created'))
   */
  public async createChannel(channel: chat1.ChatChannel): Promise<void> {
    await this._guardInitialized()
    const args = {
      channel,
    }
    const res = await this._runApiCommand({
      apiName: 'chat',
      method: 'newconv',
      options: args,
    })
    if (!res) {
      throw new Error('Keybase chat newconv returned nothing')
    }
  }

  /**
   * Send a file to a channel.
   * @memberof Chat
   * @param channel - The chat channel to send the message in.
   * @param filename - The absolute path of the file to send.
   * @param options - An object of options that can be passed to the method.
   * @example
   * bot.chat.attach(channel, '/Users/nathan/my_picture.png').then(() => console.log('Sent a picture!'))
   */
  public async attach(
    channelOrConversationId: chat1.ChatChannel | chat1.ConvIDStr,
    filename: string,
    options?: ChatAttachOptions
  ): Promise<chat1.SendRes> {
    await this._guardInitialized()
    const conv = this.getChannelOrConversationId(channelOrConversationId)
    const args = {
      ...options,
      explodingLifetime: options?.explodingLifetime ? `${options?.explodingLifetime}ms` : undefined,
      ...conv,
      filename,
    }
    const res = await this._runApiCommand({apiName: 'chat', method: 'attach', options: args})
    if (!res) {
      throw new Error('Keybase chat attach returned nothing')
    }
    return res
  }

  /**
   * Download a file send via Keybase chat.
   * @memberof Chat
   * @param channel - The chat channel that the desired attacment to download is in.
   * @param messageId - The message id of the attached file.
   * @param output - The absolute path of where the file should be downloaded to.
   * @param options - An object of options that can be passed to the method
   * @example
   * bot.chat.download(channel, 325, '/Users/nathan/Downloads/file.png')
   */
  public async download(
    channelOrConversationId: chat1.ChatChannel | chat1.ConvIDStr,
    messageId: number,
    output: string,
    options?: ChatDownloadOptions
  ): Promise<void> {
    await this._guardInitialized()
    const conv = this.getChannelOrConversationId(channelOrConversationId)
    const args = {...options, ...conv, messageId, output}
    const res = await this._runApiCommand({apiName: 'chat', method: 'download', options: args})
    if (!res) {
      throw new Error('Keybase chat download returned nothing')
    }
  }

  /**
   * Reacts to a given message in a channel. Messages have messageId's associated with
   * them, which you can learn in `bot.chat.read`.
   * @memberof Chat
   * @param channel - The chat channel to send the message in.
   * @param messageId - The id of the message to react to.
   * @param reaction - The reaction emoji, in colon form.
   * @param options - An object of options that can be passed to the method.
   * @example
   * bot.chat.react(channel, 314, ':+1:').then(() => console.log('Thumbs up!'))
   */
  public async react(
    channelOrConversationId: chat1.ChatChannel | chat1.ConvIDStr,
    messageId: number,
    reaction: string
  ): Promise<chat1.SendRes> {
    await this._guardInitialized()
    const conv = this.getChannelOrConversationId(channelOrConversationId)
    const args = {
      ...conv,
      messageId,
      message: {body: reaction},
    }
    const res = await this._runApiCommand({apiName: 'chat', method: 'reaction', options: args})
    if (!res) {
      throw new Error('Keybase chat react returned nothing.')
    }

    return res
  }

  /**
   * Deletes a message in a channel. Messages have messageId's associated with
   * them, which you can learn in `bot.chat.read`. Known bug: the GUI has a cache,
   * and deleting from the CLI may not become apparent immediately.
   * @memberof Chat
   * @param channel - The chat channel to send the message in.
   * @param messageId - The id of the message to delete.
   * @param options - An object of options that can be passed to the method.
   * @example
   * bot.chat.delete(channel, 314).then(() => console.log('message deleted!'))
   */
  public async delete(channelOrConversationId: chat1.ChatChannel | chat1.ConvIDStr, messageId: number): Promise<void> {
    await this._guardInitialized()
    const conv = this.getChannelOrConversationId(channelOrConversationId)
    const args = {
      ...conv,
      messageId,
    }
    const res = await this._runApiCommand({apiName: 'chat', method: 'delete', options: args})
    if (!res) {
      throw new Error('Keybase chat delete returned nothing.')
    }
  }

  /**
   * Gets current unfurling settings
   * @example
   * bot.chat.getUnfurlSettings().then((mode) => console.log(mode))
   */
  public async getUnfurlSettings(): Promise<chat1.UnfurlSettings> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'getunfurlsettings', options: {}})
    if (!res) {
      throw new Error('Keybase chat get unfurl mode returned nothing.')
    }
    return res
  }

  /**
   * Sets the unfurling mode
   * In Keybase, unfurling means generating previews for links that you're sending
   * in chat messages. If the mode is set to always or the domain in the URL is
   * present on the whitelist, the Keybase service will automatically send a preview
   * to the message recipient in a background chat channel.
   * @param mode - the new unfurl mode
   * @example
   * bot.chat.setUnfurlMode({
   *   "mode": "always",
   * }).then((mode) => console.log('mode updated!'))
   */
  public async setUnfurlSettings(mode: chat1.UnfurlSettings): Promise<void> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'setunfurlsettings', options: mode})
    if (!res) {
      throw new Error('Keybase chat set unfurl mode returned nothing.')
    }
  }

  /**
   * Gets device information for a given username.
   * This method allows you to see device name, description, type (desktop
   * or mobile), and creation time for all active devices of a given username.
   * @param username - the Keybase username to get devices for
   * @example
   * bot.chat.getDeviceInfo(username).then((devices) => console.log(devices))
   */
  public async getDeviceInfo(username: string): Promise<chat1.GetDeviceInfoRes> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'getdeviceinfo', options: {username}})
    if (!res) {
      throw new Error('Keybase chat get device info returned nothing.')
    }
    return res
  }

  /**
   * Loads a flip's details
   * @param conversationID - conversation ID received in API listen.
   * @param flipConversationID - flipConvID from the message summary.
   * @param messageID - ID of the message in the conversation.
   * @param gameID - gameID from the flip message contents.
   * @example
   * // check demos/es7/poker-hands.js
   */
  public async loadFlip(
    conversationID: string,
    flipConversationID: string,
    messageID: number,
    gameID: string
  ): Promise<chat1.UICoinFlipStatus> {
    await this._guardInitialized()
    const res = await this._runApiCommand({
      apiName: 'chat',
      method: 'loadflip',
      // The flip method uses `msg_id` as a parameter instead of `message_id`, like other chat methods
      // eslint-disable-next-line @typescript-eslint/camelcase
      options: formatAPIObjectInput({conversationID, flipConversationID, msg_id: messageID, gameID}, 'chat'),
      timeout: 2000,
    })
    if (!res) {
      throw new Error('Keybase chat load flip returned nothing.')
    }
    return res.status
  }

  /**
   * Publishes a commands advertisement which is shown in the "!" chat autocomplete.
   * @param advertisement - details of the advertisement
   * @example
   * await bot.chat.advertiseCommands({
   *   advertisements: [
   *     {
   *       type: 'public',
   *       commands: [
   *         {
   *           name: '!echo',
   *           description: 'Sends out your message to the current channel.',
   *           usage: '[your text]',
   *         },
   *       ]
   *     }
   *   ],
   * })
   */
  public async advertiseCommands(advertisement: Advertisement): Promise<void> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'advertisecommands', options: advertisement})
    if (!res) {
      throw new Error('Keybase chat advertise commands returned nothing.')
    }
  }

  /**
   * Clears all published commands advertisements.
   * @param advertisement - advertisement parameters
   * @example
   * await bot.chat.clearCommands()
   */
  public async clearCommands(): Promise<void> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'clearcommands'})
    if (!res) {
      throw new Error('Keybase chat clear commands returned nothing.')
    }
  }

  /**
   * Let's a conversation partner back in after they've reset their account. You can
   * get a list of such candidates with getResetConvMembers()
   * @param username - the username of the user who has reset
   * @param conversationId
   * @example
   * await bot.chat.addResetConvMember({username: "chris", conversationId: "abc1234567"})
   */
  public async addResetConvMember(param: chat1.ResetConvMemberAPI): Promise<chat1.GetResetConvMembersRes> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'addresetconvmember', options: param})
    if (!res) {
      throw new Error('addResetConvMember returned nothing.')
    }
    return res
  }

  /**
   * Lists all the direct (non-team) conversations your bot has, in
   * which their partner has "reset" their account and needs to be let back in
   * @example
   * await bot.chat.getResetConvMembers()
   */
  public async getResetConvMembers(): Promise<chat1.GetResetConvMembersRes> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'getresetconvmembers'})
    if (!res) {
      throw new Error('getResetConvMembers returned nothing.')
    }
    return res
  }

  /**
   * Lists all commands advertised in a channel.
   * @param lookup - either conversation id or channel
   * @example
   * const commandsList = await bot.chat.listCommands({
   *   channel: channel,
   * })
   * console.log(commandsList)
   * // prints out something like:
   * // {
   * //   commands: [
   * //     {
   * //       name: '!helloworld',
   * //       description: 'sample description',
   * //       usage: '[command arguments]',
   * //       username: 'userwhopublished',
   * //     }
   * //   ]
   * // }
   */
  public async listCommands(lookup: AdvertisementsLookup): Promise<{commands: chat1.UserBotCommandOutput[]}> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'chat', method: 'listcommands', options: lookup})
    if (!res) {
      throw new Error('Keybase chat list commands returned nothing.')
    }
    return {commands: res.commands || []}
  }

  /**
   * Listens for new chat messages on a specified channel. The `onMessage` function is called for every message your bot receives. This is pretty similar to `watchAllChannelsForNewMessages`, except it specifically checks one channel. Note that it receives messages your own bot posts, but from other devices. You can filter out your own messages by looking at a message's sender object.
   * Hides exploding messages by default.
   * @memberof Chat
   * @param channel - The chat channel to watch.
   * @param onMessage - A callback that is triggered on every message your bot receives.
   * @param onError - A callback that is triggered on any error that occurs while the method is executing.
   * @param options - Options for the listen method.
   * @example
   * // Reply to all messages between you and `kbot` with 'thanks!'
   * const channel = {name: 'kbot,' + bot.myInfo().username, public: false, topicType: 'chat'}
   * const onMessage = message => {
   *   const channel = message.channel
   *   bot.chat.send(channel, {body: 'thanks!!!'})
   * }
   * bot.chat.watchChannelForNewMessages(channel, onMessage)
   */
  public async watchChannelForNewMessages(
    channel: chat1.ChatChannel,
    onMessage: OnMessage,
    onError?: OnError,
    options?: ListenOptions
  ): Promise<void> {
    await this._guardInitialized()
    return this._chatListenMessage(onMessage, onError, channel, options)
  }

  /**
   * This function will put your bot into full-read mode, where it reads
   * everything it can and every new message it finds it will pass to you, so
   * you can do what you want with it. For example, if you want to write a
   * Keybase bot that talks shit at anyone who dares approach it, this is the
   * function to use. Note that it receives messages your own bot posts, but from other devices.
   * You can filter out your own messages by looking at a message's sender object.
   * Hides exploding messages by default.
   * @memberof Chat
   * @param onMessage - A callback that is triggered on every message your bot receives.
   * @param onError - A callback that is triggered on any error that occurs while the method is executing.
   * @param options - Options for the listen method.
   * @example
   * // Reply to incoming traffic on all channels with 'thanks!'
   * const onMessage = message => {
   *   const channel = message.channel
   *   bot.chat.send(channel, {body: 'thanks!!!'})
   * }
   * bot.chat.watchAllChannelsForNewMessages(onMessage)
   *
   */
  public async watchAllChannelsForNewMessages(onMessage: OnMessage, onError?: OnError, options?: ListenOptions): Promise<void> {
    await this._guardInitialized()
    return this._chatListenMessage(onMessage, onError, undefined, options)
  }

  /**
   * This function watches for new conversations your bot is added into. This gives your bot a chance to say hi when it's added/installed into a conversation.
   * @param onConv - A callback that is triggered when the bot is added into a conversation.
   * @param onError - A callback that is triggered on any error that occurs while the method is executing.
   * @example
   * // Say hi
   * const onConv = conv => {
   *   const channel = conv.channel
   *   bot.chat.send(channel, {body: 'Hi!'})
   * }
   * bot.chat.watchForNewConversation(onConv)
   *
   */
  public async watchForNewConversation(onConv: OnConv, onError?: OnError): Promise<void> {
    await this._guardInitialized()
    return this._chatListenConvs(onConv, onError)
  }

  private _spawnChatListenChild(args: Array<string>, onLine: (line: string) => void): Promise<void> {
    return new Promise((resolve, reject): void => {
      const child = spawn(this._pathToKeybaseBinary(), args)
      this._spawnedProcesses.push(child)
      const cmdSample = this._pathToKeybaseBinary() + ' ' + args.join(' ')
      this._adminDebugLogger.info(`beginning listen using ${cmdSample}`)
      const lineReaderStderr = readline.createInterface({input: child.stderr})
      const stdErrBuffer: string[] = []
      child.on('error', (err: Error): void => {
        this._adminDebugLogger.error(`got listen error ${err.message}`)
      })
      child.on('exit', (): void => {
        this._adminDebugLogger.info(`got listen exit`)
      })
      child.on('close', (code: number): void => {
        this._adminDebugLogger.info(`got listen close, code ${code}`)
        if (code) {
          return this._deinitializing ? resolve() : reject(new Error(stdErrBuffer.join('\n')))
        }
        resolve()
      })
      child.on('disconnect', (): void => {
        this._adminDebugLogger.info(`got listen disconnect`)
      })
      lineReaderStderr.on('line', (line: string): void => {
        stdErrBuffer.push(line)
        this._adminDebugLogger.error(`stderr from listener: ${line}`)
      })

      const lineReaderStdout = readline.createInterface({input: child.stdout})
      lineReaderStdout.on('line', onLine)
    })
  }

  private _getChatListenArgs(channel?: chat1.ChatChannel, options?: ListenOptions): Array<string> {
    const args = ['chat', 'api-listen']
    if (this.homeDir) {
      args.unshift('--home', this.homeDir)
    }
    if (!options || (options && options.hideExploding !== false)) {
      args.push('--hide-exploding')
    }
    if (options && options.showLocal === true) {
      args.push('--local')
    }
    if (channel) {
      args.push('--filter-channel', JSON.stringify(formatAPIObjectInput(channel, 'chat')))
    }
    return args
  }

  /**
   * Spawns the chat listen process and handles the calling of onMessage, onError, and filtering for a specific channel.
   * @memberof Chat
   * @ignore
   * @param onMessage - A callback that is triggered on every message your bot receives.
   * @param onError - A callback that is triggered on any error that occurs while the method is executing.
   * @param channel - The chat channel to watch.
   * @param options - Options for the listen method.
   * @example
   * this._chatListenMessage(onMessage, onError)
   */
  private _chatListenMessage(onMessage: OnMessage, onError?: OnError, channel?: chat1.ChatChannel, options?: ListenOptions): Promise<void> {
    const args = this._getChatListenArgs(channel, options)
    const onLine = (line: string): void => {
      this._adminDebugLogger.info(`stdout from listener: ${line}`)
      try {
        const messageObject = formatAPIObjectOutput(JSON.parse(line), null)
        if (messageObject.hasOwnProperty('error')) {
          throw new Error(messageObject.error)
        }
        if (messageObject.type !== 'chat' || !messageObject.msg) {
          return
        }
        const msgNotification: chat1.MsgNotification = messageObject
        const showLocal: boolean = (options && options.showLocal) || false
        const ignoreSourceLocal: boolean = (options && options.ignoreSourceLocal) || false
        const isSourceLocal: boolean = msgNotification.source === 'local'
        if (msgNotification.msg) {
          if (
            // fire onMessage if it was from a different sender or at least a different device
            // from this sender. Bots can filter out their own messages from other devices.
            // With option ignoreSourceLocal, local source messages are ignored.
            showLocal ||
            (this.username &&
              this.devicename &&
              (msgNotification.msg.sender.username !== this.username.toLowerCase() ||
                msgNotification.msg.sender.deviceName !== this.devicename))
          ) {
            if (!ignoreSourceLocal || (ignoreSourceLocal && !isSourceLocal)) onMessage(msgNotification.msg)
          }
        }
      } catch (error) {
        if (onError) {
          onError(error)
        }
      }
    }
    this._adminDebugLogger.info(`spawningChatListenChild on channel=${JSON.stringify(channel || 'ALL')}`)
    return this._spawnChatListenChild(args, onLine)
  }

  /**
   * Spawns the chat listen process for new channels and handles the calling of onConv, and onError.
   * @memberof Chat
   * @ignore
   * @param onConv - A callback that is triggered on every new channel your bot is added to.
   * @param onError - A callback that is triggered on any error that occurs while the method is executing.
   * @example
   * this._chatListenConvs(onConv, onError)
   */
  private _chatListenConvs(onConv: OnConv, onError?: OnError): Promise<void> {
    const args = this._getChatListenArgs()
    args.push('--convs')
    this._adminDebugLogger.info(`spawningChatListenChild for convs`)
    return this._spawnChatListenChild(args, (line: string) => {
      this._adminDebugLogger.info(`stdout from listener: ${line}`)
      try {
        const messageObject = formatAPIObjectOutput(JSON.parse(line), null)
        if (messageObject.hasOwnProperty('error')) {
          throw new Error(messageObject.error)
        }
        if (messageObject.type !== 'chat_conv' || !messageObject.conv) {
          return
        }
        const convNotification: chat1.ConvNotification = messageObject
        convNotification.conv && onConv(convNotification.conv)
      } catch (error) {
        if (onError) {
          onError(error)
        }
      }
    })
  }
}

export default Chat
