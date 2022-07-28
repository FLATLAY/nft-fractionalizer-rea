const editProfileImageButton = document.querySelector('#editProfileImageButton')
const editProfileImageInput = document.querySelector('#editProfileImageInput')
const saveEditsButton = document.querySelector('#saveEditsButton')
const discardEditsButton = document.querySelector('#discardEditsButton')

editProfileImageButton.addEventListener('click', (event) => {
  editProfileImageInput.click()
})

editProfileImageInput.addEventListener('change', (event) => {
  const files = event.target.files;

  if (FileReader && files && files.length) {

    try {
      const fr = new FileReader();
      fr.onload = () => {
        const profileImage = document.querySelector('#profileImage')
        profileImage.setAttribute('src', fr.result)
      }
      fr.readAsDataURL(files[0]);

    } catch (error) {
      console.log(error)
    }

  }
})

saveEditsButton.addEventListener('click', async (event) => {
  try {

    const fullname = document.querySelector('#fullnameInput').value
    const address = document.querySelector('#addressInput').value
    const currentPassword = document.querySelector('#currentPasswordInput').value
    const newPassword = document.querySelector('#newPasswordInput').value
    const image = editProfileImageInput.files[0] || null

    const formData = new FormData()
    formData.append('fullname', fullname)
    formData.append('address', address)
    formData.append('currentPassword', currentPassword)
    formData.append('newPassword', newPassword)
    formData.append('image', image)

    const response = await makePatchRequestFormData('users/profile/edit', formData)

    if (response.status === 200) {
      location.replace(`${BASEURL}/users/profile`)
    }
    else {
      throw new Error('Failed to update user info .')
    }

  } catch (error) {
    console.log(error)
  }
})

discardEditsButton.addEventListener('click', (event) => {
  location.replace(`${BASEURL}/users/profile`)
})