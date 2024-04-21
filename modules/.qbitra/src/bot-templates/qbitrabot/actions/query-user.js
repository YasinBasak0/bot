function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  const axios = require('axios')
  /**
   * gets the user info
   * @title get user info
   * @category Authorization
   * @param {string} email
   */
  const myAction = async (email) => {
    try {
      const { data } = await axios.get(`${session.auth.url}/user/email/${email}`, {
        headers: {
          Authorization: 'Bearer ' + session.auth.token
        }
      })
      console.log(data)
      Object.assign(event.state.user, data)
    } catch (e) {
      console.log(e)
    }
  }

  return myAction(args.email)

  /** Your code ends here */
}
