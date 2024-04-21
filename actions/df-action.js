  const uuid = require('uuid')
  const dialogflow = require('/@google-cloud/dialogflow')
  var qbitra = require('./qbitra-config')

  /**
   * Small description of your action
   * @title DialogFlow Detect Intent
   * @category NLU
   * @author i.tunga
   * @param {string} query - Dialogflow query
   */
  async function runSample(projectId, queryy) {
    const sessionId = uuid.v4()
    const sessionClient = new dialogflow.SessionsClient({
      credentials: {
        client_email: qbitra.config.dfkey.client_email,
        private_key: qbitra.config.dfkey.private_key
      }
    })
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId)

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: queryy,
          languageCode: 'tr-TR'
        }
      }
    }
    const responses = await sessionClient.detectIntent(request)
    const result = responses[0].queryResult
    const gonder = { response: result }
    return gonder
  }

  const myAction = async query => {
    const project = qbitra.config.dfkey.project_id
    const gonder = await runSample(project, query)
    Object.assign(event.state.temp, gonder)
  }

  //action olarak çağırıldıysa çalışsın
  if (typeof args !== 'undefined') {
    return myAction(args.query)
  }

  module.exports.myAction = async function(query) {
    return await runSample(qbitra.config.dfkey.project_id, query)
  }
