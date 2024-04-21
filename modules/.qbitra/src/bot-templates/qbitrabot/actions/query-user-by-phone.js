function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  const axios = require('axios')
  /**
   * gets the user info
   * @title get user info
   * @category Authorization
   * @param {string} phone
   */
  const myAction = async (phone) => {
    try {
      if (phone.startsWith('whatsapp')) {
        phone = phone.split(':')[1]
      }

      console.log(phone)

      const { data } = await axios.get(`${session.auth.url}/user/phone/${phone}`, {
        headers: {
          Authorization: 'Bearer ' + session.auth.token
        }
      })
      console.log(data)
      Object.assign(event.state.user, data)
    } catch (e) {
      // console.log(e)
    }
  }

  return myAction(args.phone)

  /** Your code ends here */
}
