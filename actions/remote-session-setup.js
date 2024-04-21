 const axios = require('axios')
  const qbitra = require('./qbitra-config')

  /**
   * Sets the credentials of remote session and create a session
   * @title Setup Remote Session
   * @category Remote Session
   */
  const sessionSetupAction = async () => {
    let sessionUrl = qbitra.config.session.sessionUrl
    let clientId = qbitra.config.session.sessionClientId
    let clientSecret = qbitra.config.session.sessionClientSecret

    session.remoteSession = { sessionUrl }

    const response = await axios.post(sessionUrl + '/login', {
      clientId,
      clientSecret
    })

    session.remoteSession.token = response.data.token

    const sessionIdResponse = await axios.post(
      sessionUrl + '/session/',
      {},
      {
        headers: {
          Authorization: session.remoteSession.token
        }
      }
    )

    session.remoteSession.id = sessionIdResponse.data.id
  }

  return sessionSetupAction()