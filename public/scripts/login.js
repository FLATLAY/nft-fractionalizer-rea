const loginForm = document.querySelector('#loginForm')

loginForm.addEventListener('submit', async (event) => {

  event.preventDefault()

  try {
    const username = event.target.elements.usernameInput.value
    const password = event.target.elements.passwordInput.value

    const response = await makePostRequest('authentication/login', {
      username,
      password
    })

    if (response.status === 200) {
      console.log('logged in succesfully .')
      location.replace(`${BASEURL}/users/profile`)
    } else {
      throw new Error()
    }

  } catch (error) {
    console.log(error)
  }
})