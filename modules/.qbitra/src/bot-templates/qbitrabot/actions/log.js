function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Small description of your action
   * @title The title displayed in the flow editor
   * @category Custom
   * @author Your_Name
   */
  const myAction = async () => {
    bp.logger.info(event)
  }

  return myAction()

  /** Your code ends here */
}
