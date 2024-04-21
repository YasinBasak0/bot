function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Checks skill and writes the result to temp.authorized
   * @title Check Skill
   * @category Authorization
   * @author Ahmet
   * @param {string} name - Skill name
   */
  const myAction = async (name) => {
    let skill = user.auth.skills.find((s) => s.code == name)
    console.log(skill)
    temp.authorized = !!skill
  }

  return myAction(args.name)

  /** Your code ends here */
}
