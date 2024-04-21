  /**
   * checks the given deparment
   * @title check department
   * @category Authorization
   * @param {string} department
   */
  const myAction = async name => {
    //console.log(name)
    //console.log(user.auth.departments)
    let department = user.auth.departments.find(d => d.Code == name)
    console.log(department)
    temp.authorized = !!department
  }

  return myAction(args.department)
