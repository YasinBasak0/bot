function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  const axios = require('axios')

  /**
   * Sets the credentials of authentication
   * @title Setup Authentication
   * @category Authorization
   * @author Your_Name
   * @param {string} url
   * @param {string} clientId
   * @param {string} clientSecret
   */
  const myAction = async (url, clientId, clientSecret) => {
    session.auth = { url }

    const response = await axios.post(url + '/login', {
      clientId,
      clientSecret
    })

    session.auth.token = response.data.token
  }

  return myAction(args.url, args.clientId, args.clientSecret)

  /** Your code ends here */
}
