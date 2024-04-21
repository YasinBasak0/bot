  const axios = require('axios')
  /**
   * gets the user info
   * @title get user info
   * @category Authorization
   * @param {string} email
   */
  const myAction = async email => {
    try {
      const { data } = await axios.get(`${session.auth.authUrl}/user/sub/email/${email}`, {
        headers: {
          Authorization: 'Bearer ' + session.auth.token
        }
      })
      Object.assign(event.state.user, data)
    } catch (e) {
      bp.logger.error(e)
    }
  }

  return myAction(args.email)