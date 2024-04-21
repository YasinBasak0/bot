function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Small description of your action
   * @title User Session isAuth
   * @category User Session
   * @author i.tunga
   */
  const myAction = async () => {
    event.state.user.isauth = 'true'
  }

  return myAction()

  /** Your code ends here */
}
