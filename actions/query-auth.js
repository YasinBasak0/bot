  const axios = require('axios')
  const _ = require('lodash')
  /**
   * @title Get Authorization Info
   * @category Authorization
   */
  const myAction = async () => {
    const departmentsRequest = axios.get(`${session.auth.authUrl}/user/sub/${user.Id}/auth/departments`, {
      headers: {
        Authorization: 'Bearer ' + session.auth.token
      }
    })

    const skillsRequest = axios.get(`${session.auth.authUrl}/user/sub/${user.Id}/auth/`, {
      headers: {
        Authorization: 'Bearer ' + session.auth.token
      }
    })

    const [departmentsResponse, skillsResponse] = await Promise.all([departmentsRequest, skillsRequest])

    user.auth = { departments: departmentsResponse.data, skills: skillsResponse.data }

    /** 
    temp.names = {
      departments: _.uniq(user.auth.Departments.map(d => d.Name.trim())).join(' , ')
   }
   */
  }

  return myAction()