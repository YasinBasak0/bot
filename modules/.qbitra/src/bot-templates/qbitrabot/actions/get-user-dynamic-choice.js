function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * user dynanic choice
   * @title Get User Dynamic Choice
   * @category Message Types
   */
  const myAction = async () => {
    try {
      let selectedOption =
        temp.options[Number(event.payload.text) - 1] || temp.options.find((o) => o.title == event.payload.text)
      temp['user-selected'] = selectedOption.value
      temp['user_selected'] = selectedOption.value
    } catch {
      temp['user_selected'] = null
    }
    delete temp.options
  }

  return myAction()

  /** Your code ends here */
}
