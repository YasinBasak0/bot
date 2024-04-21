  /**
   * Checks skill and writes the result to temp.authorized
   * @title Check Skill
   * @category Authorization
   * @author Ahmet
   * @param {string} name - Skill name
   */
  const myAction = async name => {
    let skill = user.auth.skills.find(s => s.Code == name)
    temp.authorized = !!skill
  }

  return myAction(args.name)