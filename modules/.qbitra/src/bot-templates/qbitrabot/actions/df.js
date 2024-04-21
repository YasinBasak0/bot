function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  const uuid = require('uuid')
  const dialogflow = require('/home/qbitra/bot/node_modules/@google-cloud/dialogflow/build/src/index.js')

  /**
   * Small description of your action
   * @title DialogFlow Detect Intent
   * @category NLU
   * @author i.tunga
   * @param {string} query - Dialogflow query
   */

  const myAction = async (query) => {
    const project = 'mainmenu-amxu'

    async function runSample(projectId, queryy) {
      const keyFilename = '/home/qbitra/google-credential/mainmenu-amxu-56fa4f39e06a.json'
      const sessionId = uuid.v4()
      const sessionClient = new dialogflow.SessionsClient({ keyFilename: keyFilename })
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
      Object.assign(event.state.temp, gonder)
      //console.log(result.fulfillmentText)

      /*
      console.log(`  Query: ${result.queryText}`)
      console.log(`  Response: ${result.fulfillmentText}`)
      if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`)
      } else {
        console.log('  No intent matched.')
      }
      */
    }
    await runSample(project, query)
  }
  return myAction(args.query)

  /** Your code ends here */
}
