function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  const axios = require('axios')
  /**
   * Stores user and channel data to the remote session server
   * @title Store user and channel data
   * @category Remote Session
   * @author Your_Name
   */
  const myAction = async () => {
    const url = session.remoteSession.url

    const response = await axios.patch(
      url + '/session/' + session.remoteSession.id,
      {
        user,
        channel: {
          botId: event.botId,
          target: event.target
        }
      },
      {
        headers: {
          Authorization: session.remoteSession.token
        }
      }
    )
  }

  return myAction()

  /** Your code ends here */
}
