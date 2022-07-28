const registerForm = document.querySelector('#registerForm')

registerForm.addEventListener('submit', async (event) => {

  event.preventDefault()

  try {
    const fullname = event.target.elements.fullnameInput.value
    const username = event.target.elements.usernameInput.value
    const address = event.target.elements.STXAddressInput.value
    const password = event.target.elements.passwordInput.value

    const response = await makePostRequest('authentication/register', {
      fullname,
      username,
      address,
      password
    })

    if (response.status === 201) {
      console.log('Registered successfully .')
      location.replace(`${BASEURL}/users/profile`)
    } else {
      const result = await response.json()
      throw new Error(result.error)
    }

  } catch (error) {
    console.log(error)
  }
})