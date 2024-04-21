function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * checks the given deparment
   * @title check department
   * @category Authorization
   * @param {string} department
   */
  const myAction = async (name) => {
    //console.log(name)
    //console.log(user.auth.departments)
    let department = user.auth.departments.find((d) => d.code == name)
    console.log(department)
    temp.authorized = !!department
  }

  return myAction(args.department)

  /** Your code ends here */
}
