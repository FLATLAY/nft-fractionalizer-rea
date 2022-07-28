const sha256 = require('sha256')
const { openContractCall } = require("@stacks/connect")
const { StacksTestnet } = require('@stacks/network')
const {
  uintCV,
  stringAsciiCV,
  AnchorMode
} = require("@stacks/transactions")

const imagesElement = document.querySelector('#formPropertyImagesInput')
const submitPropertyForm = document.querySelector('#submitPropertyForm')
const carousel = document.querySelector('#propertyImages')

const makeRequest = async (name, description, price, fractions, propertyInfo, images, transactionId) => {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('description', description)
  formData.append('price', price)
  formData.append('fractions', fractions)
  formData.append('transactionId', transactionId)
  formData.append('files', propertyInfo)
  for (const image of images) {
    formData.append('files', image)
  }

  try {

    const response = await makePostRequestFormData('properties/submit', formData)
    return response

  } catch (error) {
    console.log(error)
  }

}

const makeContractCall = async (name, description, price, fractions, propertyInfo, images, data, uri) => {

  try {

    const response = await makeGetRequest('users/profile/get-principal')

    if (response.status === 200) {

      const result = await response.json()

      const functionArgs = [
        uintCV(price),
        uintCV(fractions),
        stringAsciiCV(data),
        stringAsciiCV(uri)
      ]

      const options = {
        contractAddress: "STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M",
        stxAddress: result.principal,
        contractName: "fractionalizer-rea",
        functionName: "submit-property",
        network: new StacksTestnet(),
        AnchorMode: AnchorMode.Any,
        functionArgs,
        appDetails: {
          name: "My App",
          icon: ".",
        },
        onFinish: (TXData) => {
          makeRequest(name, description, price, fractions, propertyInfo, images, TXData.txId).then((response) => {
            if (response.status === 201) {
              location.replace(`${BASEURL}/users/profile`)
            } else {
              throw new Error('Failed to submite request .')
            }
          })
        }
      };

      await openContractCall(options);

    } else {
      throw new Error('Failed to get user principal .')
    }

  } catch (error) {
    console.log(error)
  }

}

submitPropertyForm.addEventListener('submit', async (event) => {

  event.preventDefault()

  try {

    const name = event.target.elements.propertyNameInput.value
    const description = event.target.elements.propertyDescriptionInput.value
    const price = event.target.elements.propertyPriceInput.value
    const fractions = event.target.elements.propertyFractionsInput.value
    const propertyInfo = event.target.elements.propertyInfoInput.files[0]
    const images = imagesElement.files

    if (propertyInfo.name.endsWith('.json')) {
      const reader = new FileReader()
      reader.readAsText(propertyInfo, 'UTF-8')
      reader.onload = async (event) => {
        const data = sha256(JSON.stringify(event.target.result))
        await makeContractCall(name, description, price, fractions, propertyInfo, images, data, '')
      }
    } else {
      throw new Error('You have to choose a json file .')
    }

  } catch (error) {
    console.log(error)
  }
})

imagesElement.addEventListener('change', (event) => {
  const files = event.target.files;

  if (FileReader && files && files.length) {

    try {
      document.querySelector('#carousel-prev-button').removeAttribute('disabled')
      document.querySelector('#carousel-next-button').removeAttribute('disabled')

      const carouselCurrentItems = document.querySelectorAll('#propertyImages .carousel-item')
      carouselCurrentItems.forEach((item) => {
        item.remove()
      })

      for (let i = 0; i < files.length; i++) {
        const fr = new FileReader();
        fr.onload = function () {

          const carouselItem = document.createElement('div')
          carouselItem.classList.add('carousel-item')
          if (i === 0) {
            carouselItem.classList.add('active')
          }

          const image = document.createElement('img')
          image.classList.add('d-block')
          image.classList.add('w-100')
          image.classList.add('img-fluid')
          image.setAttribute('alt', 'Property image .')
          image.setAttribute('src', fr.result)

          carouselItem.appendChild(image)
          carousel.appendChild(carouselItem)
        }
        fr.readAsDataURL(files[i]);
      }
    } catch (error) {
      console.log(error)
    }

  }
})