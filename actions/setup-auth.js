  const qbitra = require('./qbitra-config')
  const axios = require('axios')

  /**
   * Sets the credentials of authentication
   * @title Setup Authentication
   * @category Authorization
   */
  const setupAuthAction = async () => {
    let authUrl = qbitra.config.auth.authUrl
    let ClientId = qbitra.config.auth.authClientId
    let ClientSecret = qbitra.config.auth.authClientSecret

    session.auth = { authUrl }

    const response = await axios.post(authUrl + '/login', {
      ClientId,
      ClientSecret
    })

    session.auth.token = response.data.token
  }

  return setupAuthAction()
