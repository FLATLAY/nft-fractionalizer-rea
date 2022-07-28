const { openContractCall } = require("@stacks/connect")
const { StacksTestnet } = require('@stacks/network')
const {
  uintCV,
  standardPrincipalCV,
  makeStandardSTXPostCondition,
  createAssetInfo,
  FungibleConditionCode,
  AnchorMode,
  makeContractFungiblePostCondition
} = require("@stacks/transactions")

const makeRequest = async (stockId, fractionsCountToPurchase, transactionId) => {

  try {

    const response = await makePostRequest('stocks/purchase', {
      stockID: stockId,
      fractionsCountToPurchase,
      transactionId
    })

    return response

  } catch (error) {
    console.log(error)
  }

}

const makeContractCall = async (stockId, fractions) => {

  try {

    const response = await makeGetRequest(`stocks/${stockId}`)

    if (response.status === 200) {

      const result = await response.json()

      const functionArgs = [
        uintCV(result.tokenid),
        uintCV(fractions),
        standardPrincipalCV(result.seller)
      ]

      const stxPostCondition = makeStandardSTXPostCondition(
        result.buyer,
        FungibleConditionCode.LessEqual,
        BigInt(Math.floor(result.fractionPrice * fractions * 1e6))
      );

      const asset = createAssetInfo(
        'STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M', // contract address
        'fractionalizer-rea', // contract name
        'fractions' // fungible token name
      )

      const stxPostConditionFungible = makeContractFungiblePostCondition(
        'STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M', // contract address
        'fractionalizer-rea',
        FungibleConditionCode.Equal,
        BigInt(fractions),
        asset
      );

      const postConditions = [stxPostCondition, stxPostConditionFungible]

      const options = {
        contractAddress: "STJY93CBSR6AC096D3ZQ8A63PYQSM0CG2HZP481M",
        stxAddress: result.buyer.principal,
        contractName: "fractionalizer-rea",
        functionName: "purchase-fractions",
        network: new StacksTestnet(),
        AnchorMode: AnchorMode.Any,
        postConditions,
        functionArgs,
        appDetails: {
          name: "My App",
          icon: ".",
        },
        onFinish: (TXData) => {
          makeRequest(stockId, fractions, TXData.txId).then((response) => {
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

let purchaseFractionsForms = document.querySelectorAll('[id^="purchaseFractionsForm"]')

purchaseFractionsForms.forEach((form) => {

  const stockID = form.id.slice(21)
  form.addEventListener('submit', async (event) => {

    event.preventDefault()

    try {

      const fractionsCountToPurchase = event.target.elements.fractionsCountToPurchase.value
      await makeContractCall(stockID, fractionsCountToPurchase)

    } catch (error) {
      console.log(error)
    }

  })

})