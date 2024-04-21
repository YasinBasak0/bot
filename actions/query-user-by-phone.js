  const axios = require('axios')
  /**
   * gets the user info
   * @title get user info
   * @category Authorization
   * @param {string} phone
   */
  const myAction = async phone => {
    try {
      if (phone.startsWith('whatsapp')) {
        phone = phone.split(':')[1]
      }

      const { data } = await axios.get(`${session.auth.authUrl}/user/sub/phone/${phone}`, {
        headers: {
          Authorization: 'Bearer ' + session.auth.token
        }
      })
      event.state.user.smsValid == undefined ? (data.smsValid = 'false') : (data.smsValid = event.state.user.smsValid)
      Object.assign(event.state.user, data)
    } catch (e) {
      bp.logger.error(e)
    }
  }

  return myAction(args.phone)
