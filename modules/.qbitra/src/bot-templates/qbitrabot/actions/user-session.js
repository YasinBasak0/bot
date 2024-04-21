function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Small description of your action
   * @title User Session Create
   * @category User Session
   * @author i.tunga
   * @param {string} id
   * @param {string} name
   * @param {string} email
   * @param {string} phone
   */
  const myAction = async (id, name, email, phone) => {
    event.state.user = { id: id, name: name, email: email, phone: phone, auth: 'true' }
  }

  return myAction(args.id, args.name, args.email, args.phone)

  /** Your code ends here */
}
