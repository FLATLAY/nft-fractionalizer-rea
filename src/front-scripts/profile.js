const { openContractCall } = require("@stacks/connect")
const { StacksTestnet } = require('@stacks/network')
const {
  uintCV,
  makeStandardFungiblePostCondition,
  createAssetInfo,
  FungibleConditionCode,
  AnchorMode,
  makeContractFungiblePostCondition
} = require("@stacks/transactions")

const makeRequestList = async (stockId, fractionsCountToList, transactionId) => {

  try {

    const response = await makePostRequest('stocks/list', {
      stockID: stockId,
      fractionsCountToList,
      transactionId
    })

    return response

  } catch (error) {
    console.log(error)
  }

}

const makeRequestUnlist = async (stockId, transactionId) => {

  try {

    const response = await makeDeleteRequest('stocks/list', {
      stockID: stockId,
      transactionId
    })

    return response

  } catch (error) {
    console.log(error)
  }
}

const makeContractCallList = async (stockId, fractions) => {

  try {

    const response = await makeGetRequest(`stocks/${stockId}`)

    if (response.status === 200) {

      const result = await response.json()

      const functionArgs = [
        uintCV(result.tokenid),
        uintCV(fractions)
      ]

      const asset = createAssetInfo(
        'STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M', // contract address
        'fractionalizer-rea', // contract name
        'fractions' // fungible token name
      )

      const stxPostConditionFungible = makeStandardFungiblePostCondition(
        result.buyer, // the owner of fractions ( stock )
        FungibleConditionCode.Equal,
        BigInt(fractions),
        asset
      );

      const postConditions = [stxPostConditionFungible]

      const options = {
        contractAddress: "STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M",
        stxAddress: result.buyer.principal,
        contractName: "fractionalizer-rea",
        functionName: "list-fractions",
        network: new StacksTestnet(),
        AnchorMode: AnchorMode.Any,
        postConditions,
        functionArgs,
        appDetails: {
          name: "My App",
          icon: ".",
        },
        onFinish: (TXData) => {
          makeRequestList(stockId, fractions, TXData.txId).then((response) => {
            if (response.status === 201) {
              location.reload()
            } else {
              throw new Error('Failed to submit the request .')
            }
          })
        }
      };

      await openContractCall(options);

    } else {
      throw new Error('Failed to get user principal address .')
    }

  } catch (error) {
    console.log(error)
  }

}

const makeContractCallUnlist = async (stockId) => {

  try {

    const response = await makeGetRequest(`stocks/${stockId}`)

    if (response.status === 200) {

      const result = await response.json()

      const functionArgs = [
        uintCV(result.tokenid)
      ]

      const asset = createAssetInfo(
        'STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M', // contract address
        'fractionalizer-rea', // contract name
        'fractions' // fungible token name
      )

      const stxPostConditionFungible = makeContractFungiblePostCondition(
        'STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M',
        'fractionalizer-rea',
        FungibleConditionCode.Equal,
        BigInt(result.fractions),
        asset
      );

      const postConditions = [stxPostConditionFungible]

      const options = {
        contractAddress: "STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M",
        stxAddress: result.buyer.principal,
        contractName: "fractionalizer-rea",
        functionName: "unlist-fractions",
        network: new StacksTestnet(),
        AnchorMode: AnchorMode.Any,
        postConditions,
        functionArgs,
        appDetails: {
          name: "My App",
          icon: ".",
        },
        onFinish: (TXData) => {
          makeRequestUnlist(stockId, TXData.txId).then((response) => {
            if (response.status === 200) {
              location.reload()
            } else {
              throw new Error('Failed to submit the request .')
            }
          })
        }
      };

      await openContractCall(options);

    } else {
      throw new Error('Failed to get user principal address .')
    }

  } catch (error) {
    console.log(error)
  }

}

const logoutButton = document.querySelector('#logoutButton')

logoutButton.addEventListener('click', async (event) => {
  try {
    const response = await makePostRequest('authentication/logout')
    if (response.status === 200) {
      location.replace(`${BASEURL}/authentication/login`)
    } else {
      throw new Error('Failed to logout .')
    }
  } catch (error) {
    console.log(error)
  }
})

const listForSaleButtons = document.querySelectorAll('[id^="listFractionsButton"]')

listForSaleButtons.forEach((button) => {

  const stockID = button.id.slice(19)
  const form = document.querySelector('#listFractionsForm' + stockID)
  form.addEventListener('submit', async (event) => {

    event.preventDefault()

    try {

      const fractionsCountToList = event.target.elements.fractionsCountToList.value
      await makeContractCallList(stockID, fractionsCountToList)

    } catch (error) {
      console.log(error)
    }

  })

  button.addEventListener('click', async (event) => {

    if (button.classList.contains('hidden-form')) {

      button.classList.remove('hidden-form')
      button.textContent = '- List for sale'
      form.classList.remove('d-none')

    } else {

      button.classList.add('hidden-form')
      button.textContent = '+ List for sale'
      form.classList.add('d-none')

    }
  })
})


const unlistFractionsButtons = document.querySelectorAll('[id^="unlistFractions"]')

unlistFractionsButtons.forEach((button) => {

  const stockID = button.id.slice(15)

  button.addEventListener('click', async (event) => {

    try {

      await makeContractCallUnlist(stockID)

    } catch (error) {
      console.log(error)
    }

  })
})