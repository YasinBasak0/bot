function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * @title User Session Reset
   * @category User Session
   * @author i.tunga
   */
  const myAction = async () => {
    event.state.user = { timezone: -3, language: 'en' }
  }

  return myAction()

  /** Your code ends here */
}
