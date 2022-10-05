const ContractKit = require("@celo/contractkit");
const Web3 = require("web3");
const OdisUtils = require("@celo/identity").OdisUtils;
const privateKeyToAddress =
    require("@celo/utils/lib/address").privateKeyToAddress;
const normalizeAddressWith0x =
    require("@celo/utils/lib/address").normalizeAddressWith0x;
const fs = require("fs");
const { IncomingMessage } = require("http");
const delay = ms => new Promise(res => setTimeout(res, ms));

require("dotenv").config();

async function initialize_network() {
    web3 = new Web3("https://alfajores-forno.celo-testnet.org");
    contractkit = ContractKit.newKitFromWeb3(web3);
    let random_account = await web3.eth.accounts.create();

    console.log('****************************************initialize_network************************************************')
    fs.appendFileSync('./.env',
        `
PRIVATE_KEY = ${random_account.privateKey}
ADDRESS_CREATED = ${random_account.address} `)
    let created_account = await random_account.address
    let created_account_private_key = await random_account.privateKey

    console.log('Created Account: ', created_account)
    // return Promise.resolve(created_account).then(() => undefined)
    return { created_account, created_account_private_key };
}


async function fundCreatedAccount(anAddress) {

    let account = normalizeAddressWith0x(
        privateKeyToAddress(process.env.PRIVATE_KEY_SEND)
    );
    contractkit.connection.addAccount(normalizeAddressWith0x(process.env.PRIVATE_KEY_SEND))
    console.log('contractkit account', contractkit.defaultAccount);
    const balance = await contractkit.celoTokens.balancesOf(account);
    // console.log('Celo balance', balance.CELO.toFixed());
    // console.log('cUSD balance', balance.cUSD.toFixed());
    console.log("FROM: ", account)
    console.log("TO: ", anAddress)

    let amount = contractkit.web3.utils.toWei("0.05", "ether")

    let goldtoken = await contractkit.contracts.getGoldToken()
    let stabletoken = await contractkit.contracts.getStableToken()


    // Transfer CELO and cUSD from your account to anAddress
    // Specify cUSD as the feeCurrency when sending cUSD
    let celotx = await goldtoken.transfer(anAddress, amount).send({ from: account })
    let cUSDtx = await stabletoken.transfer(anAddress, amount).send({ from: account, feeCurrency: stabletoken.address })

    let celoReceipt = await celotx.waitReceipt()
    let cUSDReceipt = await cUSDtx.waitReceipt()

    console.log(`CELO Transaction: https://alfajores-blockscout.celo-testnet.org/tx/${celoReceipt.transactionHash}/`)
    // console.log(`cUSD Transaction: https://alfajores-blockscout.celo-testnet.org/tx/${cUSDReceipt.transactionHash}/`)

    let celoBalance = await goldtoken.balanceOf(account)
    let cUSDBalance = await stabletoken.balanceOf(account)

    // console.log(`Your new account CELO balance: ${contractkit.web3.utils.fromWei(celoBalance.toString(), "ether")}`)
    // console.log(`Your new account cUSD balance: ${contractkit.web3.utils.fromWei(cUSDBalance.toString(), "ether")}`)
}

module.exports.main = main;

async function main() {
    let wallet = await initialize_network();
    await fundCreatedAccount(wallet.created_account)

    return { wallet }
    // await delay(10000);

}
