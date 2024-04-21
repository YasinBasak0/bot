function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  const axios = require('axios')

  /**
   * Sets the credentials of remote session and create a session
   * @title Setup Remote Session
   * @category Remote Session
   * @author Your_Name
   * @param {string} url
   * @param {string} clientId
   * @param {string} clientSecret
   */
  const myAction = async (url, clientId, clientSecret) => {
    session.remoteSession = { url }

    const response = await axios.post(url + '/login', {
      clientId,
      clientSecret
    })

    session.remoteSession.token = response.data.token

    const sessionIdResponse = await axios.post(
      url + '/session/',
      {},
      {
        headers: {
          Authorization: session.remoteSession.token
        }
      }
    )

    session.remoteSession.id = sessionIdResponse.data.id
  }

  return myAction(args.url, args.clientId, args.clientSecret)

  /** Your code ends here */
}
