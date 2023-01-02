
import { BigNumber, Contract, providers, ethers, utils } from "ethers";

//const pEth = hre.ethers.utils.parseEther;

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import miPrimerTknAbi from "../artifacts/contracts/MiPrimerToken.sol/MyTokenMiPrimerToken.json";
import publicSaleAbi from "../artifacts/contracts/PublicSale.sol/PublicSale.json";
import nftTknAbi from "../artifacts/contracts/NFT.sol/MiPrimerNft.json";

import {
  init,
  approve,
  participateInAirdrop,
  quemarMisTokensParaParticipar,
  addToWhiteList,
  removeFromWhitelist,
  connectToMumbai,
} from "utec-smart-contracts";


window.ethers = ethers;

var provider, signer, account, gnosisWallet, usdcAdd, miPrTknAdd, pubSContractAdd;
var usdcTkContract, miPrTokenContract, nftTknContract, pubSContract;

// REQUIRED
// Conectar con metamask
async function initSCsGoerli() {
  console.log("Conectandose a los contratos de Goerli");
  usdcAdd = "0x46bdCBd7f7eb221F06b5FEc60Be928B7744f95E5";
  miPrTknAdd = "0x17DE84281C4bfF53beb423ff8256B1dbE3bDb3E6";
  pubSContractAdd = "0xa9E34791B749DaFDA4ea48a10C4e06222e44D39d";
  gnosisWallet = "0x9bF02fD6C167e59dd1D2b2caCB24a92F99535BDb";

  provider = new providers.Web3Provider(window.ethereum);

  usdcTkContract = new Contract(usdcAdd, usdcTknAbi.abi, provider);
  miPrTokenContract = new Contract(miPrTknAdd, miPrimerTknAbi.abi, provider);
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi.abi, provider);



}

// OPTIONAL
// No require conexion con Metamask
// Usar JSON-RPC
// Se pueden escuchar eventos de los contratos usando el provider con RPC
async function initSCsMumbai() {
  console.log("Conectandose al NFT de Mumbai");
  var nftAddress = "0x4dDc538656A404dB5632852D0EE60DBB0C0A8FdC";
  //var [owner] = await hre.ethers.getSigners(); 
  //var urlProvider = process.env.MUMBAI_TESNET_URL;
  var urlProvider = "https://polygon-mumbai.g.alchemy.com/v2/QV4QkoS_BabdEHEFy6saHtOjU50rSFLw";
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  nftTknContract = new Contract(nftAddress, nftTknAbi.abi, provider);

  // console.log(nftTknContract);
  // var res = await nftTknContract.connect(owner).balanceOf(address);
  // console.log("balance", res);

}

async function setUpListeners() {
  // Connect to Metamask
  var bttn = document.getElementById("connect");

  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);

      provider = new providers.Web3Provider(window.ethereum);
      signer = provider.getSigner(account);
      window.signer = signer;

      // obtenemos los saldos 
      var response2 = await usdcTkContract.connect(signer).balanceOf(account);

      console.log(response2.toString());

      var usdcbalance = document.getElementById("usdcBalance");
      usdcbalance.textContent = response2.toString();

      // obtenemos los saldos 
      var response1 = await miPrTokenContract.connect(signer).balanceOf(account);

      console.log(response1.toString());

      var miPrimerTknBalance = document.getElementById("miPrimerTknBalance");
      miPrimerTknBalance.textContent = response1.toString();


    }
  });





  var bttn = document.getElementById("usdcUpdate");
  bttn.addEventListener("click", async function () {

    // obtenemos los saldos 
    var response2 = await usdcTkContract.connect(signer).balanceOf(account);

    console.log(response2.toString());

    var usdcbalance = document.getElementById("usdcBalance");
    usdcbalance.textContent = response2.toString();
  });

  var bttn = document.getElementById("miPrimerTknUpdate");
  bttn.addEventListener("click", async function () {

    // obtenemos los saldos 
    var response1 = await miPrTokenContract.connect(signer).balanceOf(account);

    console.log(response1.toString());

    var miPrimerTknBalance = document.getElementById("miPrimerTknBalance");
    miPrimerTknBalance.textContent = response1.toString();

  });


  var bttn = document.getElementById("switch");
  bttn.addEventListener("click", async function () {
    await connectToMumbai();
  });


  // APROVAR TOKENS
  var bttn = document.getElementById("approveButton");
  bttn.addEventListener("click", async function () {
    var valorCajaTexto = document.getElementById("approveInput").value;
    var value = BigNumber.from(`${valorCajaTexto}000000000000000000`);
    //var value = BigNumber.from(`${valorCajaTexto}`);
    console.log(value);
    var tx = await miPrTokenContract
      .connect(signer)
      .approve(pubSContract.address, value);
    //var tx = await approve(value, signer);
    var response = await tx.wait();
    console.log(response);
    return response;
  });

  // HACER COMPRA CON ID
  var bttn = document.getElementById("purchaseButton");
  bttn.addEventListener("click", async function () {

    var valorCajaTexto = document.getElementById("purchaseInput").value;
    var value = BigNumber.from(`${valorCajaTexto}`);
    console.log(value);
    var tx = await pubSContract
      .connect(signer)
      .purchaseNftById(value)
    var response = await tx.wait();
    console.log(response);
    return response;
  });

  // HACER COMPRA CON USDC Y ID 
  var bttn = document.getElementById("approveButton2");
  bttn.addEventListener("click", async function () {
    var valorCajaTexto = document.getElementById("approveInput2").value;
    var value = BigNumber.from(`${valorCajaTexto}000000`);
    console.log(value);
    var tx = await usdcTkContract
      .connect(signer)
      .approve(pubSContract.address, value);
    //var tx = await approve(value, signer);
    var response = await tx.wait();
    console.log(response);
    return response;

  });


  var bttn = document.getElementById("purchaseButtonUSDC");
  bttn.addEventListener("click", async function () {

    var valorCajaTexto = document.getElementById("purchaseInput2").value;
    var value = BigNumber.from(`${valorCajaTexto}`);
    console.log(value);
    var tx = await pubSContract
      .connect(signer)
      .purchaseNftByIdUsingUSDCoin(value)
    var response = await tx.wait();
    console.log(response);
    return response;
  });




  var bttn = document.getElementById("purchaseEthButton");
  bttn.addEventListener("click", async function () {

    const ethAmount = "0.01";
    const weiAmount = ethers.utils.parseEther(ethAmount);
    const transaction = {
      value: weiAmount,
    };

    var tx = await pubSContract
      .connect(signer)
      .depositEthForARandomNft(transaction);

    var response = await tx.wait();
    console.log(response);
    return response;

  });

  var bttn = document.getElementById("sendEtherButton");
  bttn.addEventListener("click", async function () {

    var tx = await signer.sendTransaction({
      to: pubSContractAdd,
      value: ethers.utils.parseEther("0.01"),
    });

    var response = await tx.wait();
    console.log(response);
    return response;


  });


}

async function setUpEventsContracts() {

  nftTknContract.on("Transfer", (from, to, tokenId) => {
    console.log("from", from);
    console.log("to", to);
    console.log("tokenId", tokenId);

    var ul = document.getElementById("nftList");
    var li = document.createElement("li");
    var children = ul.children.length + 1
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("Transfer from " + from + " to " + to + " tokenId " + tokenId));
    ul.appendChild(li)

  });
}

async function setUp() {
  //init(window.ethereum);
  await initSCsGoerli();
  await initSCsMumbai();
  await setUpListeners();
  await setUpEventsContracts();
}

setUp()
  .then()
  .catch((e) => console.log(e));
