// @flow
import ClientBase from '../client-base'
import type {Account, Transaction} from './types'

/** The wallet module of your Keybase bot. For more info about the API this module uses, you may want to check out `keybase wallet api`. */
class Wallet extends ClientBase {
  /**
   * Provides a list of all accounts owned by the current Keybase user.
   * @memberof Wallet
   * @returns - An array of accounts. If there are no accounts, the array is empty.
   * @example
   * bot.wallet.balances().then(accounts => console.log(accounts))
   */
  async balances(): Promise<Account[]> {
    await this._guardInitialized()
    const res = await this._runApiCommand({apiName: 'wallet', method: 'balances'})
    if (!res) {
      throw new Error('Keybase wallet balanaces returned nothing.')
    }
    return res || []
  }

  /**
   * Provides a list of all transactions in a single account.
   * @memberof Wallet
   * @param accountId - The id of an account owned by a Keybase user.
   * @returns - An array of transactions related to the account.
   * @example
   * bot.wallet.history('GDUKZH6Q3U5WQD4PDGZXYLJE3P76BDRDWPSALN4OUFEESI2QL5UZHCK').then(transactions => console.log(transactions))
   */
  async history(accountId: string): Promise<Transaction[]> {
    await this._guardInitialized()
    const options = {
      accountId,
    }
    const res = await this._runApiCommand({apiName: 'wallet', method: 'history', options: options})
    if (!res) {
      throw new Error('Keybase wallet history returned nothing.')
    }
    // Removes a single object with property `payment`
    const cleanedRes = res.map(payment => payment.payment)
    return cleanedRes
  }

  /**
   * Get details about a particular transaction
   * @memberof Wallet
   * @param transactionId - The id of the transaction you would like details about.
   * @returns - An object of details about the transaction specified.
   * @example
   * bot.wallet.details('e5334601b9dc2a24e031ffeec2fce37bb6a8b4b51fc711d16dec04d3e64976c4').then(details => console.log(details))
   */
  async details(transactionId: string): Promise<Transaction> {
    await this._guardInitialized()
    const options = {txid: transactionId}
    const res = await this._runApiCommand({apiName: 'wallet', method: 'details', options: options})
    if (!res) {
      throw new Error('Keybase wallet details returned nothing.')
    }
    return res
  }

  /**
   * Lookup the primary Stellar account ID of a Keybase user.
   * @memberof Wallet
   * @param name - The name of the user you want to lookup.
   * @returns - An object containing the account ID and Keybase username of the found user.
   * @example
   * const {accountID} = bot.wallet.lookup('patrick')
   */
  async lookup(name: string): Promise<{|accountID: string, username: string|}> {
    await this._guardInitialized()
    const options = {name}
    const res = await this._runApiCommand({apiName: 'wallet', method: 'lookup', options})
    if (!res) {
      throw new Error('Keybase wallet lookup returned nothing.')
    }
    return res
  }

  /**
   * Send money with your bot!
   * @memberof Wallet
   * @param recipient - Who you're sending your money to!
   * @param amount - How much money to send.
   * @param [currency] - The currency of the value you're sending. If not included, defaults to XLM.
   * @param [message] - The message for your payment
   * @returns - The trasaction object of the transaction.
   * @example
   * bot.wallet.send('nathunsmitty', '3.50', 'USD', 'Shut up and take my money!').then(() => console.log('Money sent!'))
   */
  async send(recipient: string, amount: string, currency?: string, message?: string): Promise<Transaction> {
    await this._guardInitialized()
    const options = {recipient, amount, currency, message}
    const res = await this._runApiCommand({apiName: 'wallet', method: 'send', options})
    if (!res) {
      throw new Error('Keybase wallet send returned nothing.')
    }
    return res
  }

  /**
   * If you send XLM to a Keybase user who has not established a wallet, you can cancel the payment before the recipient claims it and the XLM will be returned to your account.
   * @memberof Wallet
   * @param transactionId - The id of the transaction to cancel.
   * @example
   * bot.wallet.cancel('e5334601b9dc2a24e031ffeec2fce37bb6a8b4b51fc711d16dec04d3e64976c4').then(() => console.log('Transaction successfully canceled!'))
   */
  async cancel(transactionId: string): Promise<void> {
    await this._guardInitialized()
    const options = {txid: transactionId}
    const res = await this._runApiCommand({apiName: 'wallet', method: 'cancel', options})
    if (!res) {
      throw new Error('Keybase wallet cancel returned nothing.')
    }
  }
}

export default Wallet