function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  const axios = require('axios')
  const _ = require('lodash')
  /**
   * @title Get Authorization Info
   * @category Authorization
   */
  const myAction = async () => {
    const departmentsRequest = axios.get(`${session.auth.url}/user/${user.id}/auth/departments`, {
      headers: {
        Authorization: 'Bearer ' + session.auth.token
      }
    })

    const skillsRequest = axios.get(`${session.auth.url}/user/${user.id}/auth/`, {
      headers: {
        Authorization: 'Bearer ' + session.auth.token
      }
    })

    const [departmentsResponse, skillsResponse] = await Promise.all([departmentsRequest, skillsRequest])

    user.auth = { departments: departmentsResponse.data, skills: skillsResponse.data }

    temp.names = {
      departments: _.uniq(user.auth.departments.map((d) => d.name.trim())).join(' , ')
    }
  }

  return myAction()

  /** Your code ends here */
}
