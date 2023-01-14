require("dotenv").config();
const { ethers } = require("hardhat");
const hre = require("hardhat");

var pEth = hre.ethers.utils.parseEther;

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
  printAddressNoUp,
} = require("../utils");

const publicSaleAbi = require("../artifacts/contracts/PublicSale.sol/PublicSale.json");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");
var usdcContract, miPrimerTokenContract, publicSaleContract;


// USDCoin - Imp: 0x46bdCBd7f7eb221F06b5FEc60Be928B7744f95E5
// address verified: 0x4c08Da541D93C529d4F71035bcd2a7CB612da868
async function deployUSDC() {
  //var name = "USD Coin";
  //var symbol = "USDC";
  usdcContract = await deploySCNoUp("USDCoin", []);
  await printAddressNoUp("USDCoin", usdcContract.address);

  await verify(usdcContract.address, "USDCoin", []);
}

// goerli address verified: 0x14ee6684d6fC6f50d9EF3991869fb60877C79c35
async function publishLiquiditySC() {
  var MyAddLiquidityPool = await hre.ethers.getContractFactory("MyAddLiquidity");
  var myAddLiquidityPool = await MyAddLiquidityPool.deploy();
  var tx = await myAddLiquidityPool.deployed();
  await tx.deployTransaction.wait(5);
  console.log("Address:", myAddLiquidityPool.address);

  await hre.run("verify:verify", {
    contract: "contracts/MyAddLiquidity.sol:MyAddLiquidity",
    address: myAddLiquidityPool.address,
    constructorArguments: [],
  });
}


/* Libreria para obtener los valores de tokens
de entrada que se requieren para hacer un intercambio 
en el pool de liquidez 
se utilizara como libreria para poder obtener este 
valor y poder hacer la compra del nft con usdcoin 

Compiled 1 Solidity file successfully
Address: 0xF056396526318D8490133638ebC9ec9e2BA7b1df
Nothing to compile
Successfully submitted source code for contract
contracts/MyLiquidity.sol:MyLiquidity at 0xF056396526318D8490133638ebC9ec9e2BA7b1df
for verification on the block explorer. Waiting for verification result...

Successfully verified contract MyLiquidity on Etherscan.
https://goerli.etherscan.io/address/0xF056396526318D8490133638ebC9ec9e2BA7b1df#code
*/
async function publishLibraryLiquiditySC() {
  var MyLiquidity = await hre.ethers.getContractFactory("MyLiquidity");
  var myLiquidity = await MyLiquidity.deploy();
  var tx = await myLiquidity.deployed();
  await tx.deployTransaction.wait(5);
  console.log("Address:", myLiquidity.address);

  await hre.run("verify:verify", {
    contract: "contracts/MyLiquidity.sol:MyLiquidity",
    address: myLiquidity.address,
    constructorArguments: [],
  });
}



async function swapTokensForExact() {
  var usdcAdd = "0x46bdCBd7f7eb221F06b5FEc60Be928B7744f95E5";
  var USDCoin = await hre.ethers.getContractFactory("USDCoin");
  var usdcoin = USDCoin.attach(usdcAdd);

  var miPrimerTokenAdd = "0x17DE84281C4bfF53beb423ff8256B1dbE3bDb3E6";
  var MiPrimerTokenAdd = await hre.ethers.getContractFactory("MyTokenMiPrimerToken");
  var miPrimerToken = MiPrimerTokenAdd.attach(miPrimerTokenAdd);

  var myswapperAdd = "0xF5B2BeC5799C4E7ce5615145ce1eB893f9Ad8650";
  var MySwapper = await hre.ethers.getContractFactory("MySwapper");
  var myswapper = MySwapper.attach(myswapperAdd);

  // Enviaremos al contrato Swapper 10 usdcoin
  // El contrato MySwapper no tiene miPrimerToken
  // El ratio de usdcoin a miPrimerToken  es 10:80
  // Vamos a solicitar la cantidad exacta de 80 miPrimerToken
  // No sabemos cuantos usdcoin necesitamos para obtener 80 miPrimerToken
  // Atraves del liquidity pool, se intercambirá los usdcoin por miPrimerToken
  // Enviar usdcoin al contrato Swapper
  var tx = await usdcoin.mint(myswapperAdd, pEth("10"));
  await tx.wait();

  var amountOut = pEth("80"); // 80 miPrimerToken
  var amountInMax = pEth("15"); // Aprox, estoy dispuesto a entregar 15 usdc
  var path = [usdcAdd, miPrimerTokenAdd];
  var to = myswapperAdd;
  var deadline = new Date().getTime();

  var tx = await myswapper.swapTokensForExactTokens(
    amountOut,
    amountInMax,
    path,
    to,
    deadline
  );

  var res = await tx.wait();
  console.log("Transaction Hash", res.transactionHash);

  console.log("Token usdcoin Bal: ", (await usdcoin.balanceOf(myswapperAdd)).toString());
  console.log("Token miPrimerToken Bal: ", (await miPrimerToken.balanceOf(myswapperAdd)).toString());
}

// MySwapper address: 0xF5B2BeC5799C4E7ce5615145ce1eB893f9Ad8650
async function publishSwapper() {

  var MySwapper = await hre.ethers.getContractFactory("MySwapper");
  var myswapper = await MySwapper.deploy();
  var tx = await myswapper.deployed();

  // 5 bloques de confirmacion
  await tx.deployTransaction.wait(5);
  console.log("myswapper esta publicado en el address", myswapper.address);

  console.log("Empezo la verificaion");
  // script para verificacion del contrato
  await hre.run("verify:verify", {
    address: myswapper.address,
    constructorArguments: [],
  });
}


async function compraPublicSale() {

  console.log("Conectandonos al MiPrimerToken");
  var miPrimerTokenAdd = "0x17DE84281C4bfF53beb423ff8256B1dbE3bDb3E6";
  var MiPrimerTokenAdd = await hre.ethers.getContractFactory("MyTokenMiPrimerToken");
  var miPrimerToken = MiPrimerTokenAdd.attach(miPrimerTokenAdd);

  console.log("Conectandonos al PublicSale");
  var publicSaleAdd = "0xa9E34791B749DaFDA4ea48a10C4e06222e44D39d";
  var PublicSaleContract = await hre.ethers.getContractFactory("PublicSale");
  var publicSale = PublicSaleContract.attach(publicSaleAdd);

  //hre.ethers.Wallet.caller

}

async function addLiquidityToPool() {

  var usdcAdd = "0x46bdCBd7f7eb221F06b5FEc60Be928B7744f95E5";
  var USDCoin = await hre.ethers.getContractFactory("USDCoin");

  console.log("Conectandonos al USDCoin");
  var usdcoin = USDCoin.attach(usdcAdd);

  var miPrimerTokenAdd = "0x17DE84281C4bfF53beb423ff8256B1dbE3bDb3E6";
  var MiPrimerTokenAdd = await hre.ethers.getContractFactory("MyTokenMiPrimerToken");

  console.log("Conectandonos al MiPrimerToken");
  var miPrimerToken = MiPrimerTokenAdd.attach(miPrimerTokenAdd);

  // reemplazar por el valor que retorna luego de publicar el MyAddLiquidity
  var myAddliquidityPoolAdd = "0x14ee6684d6fC6f50d9EF3991869fb60877C79c35";
  var MyAddLiquidityPool = await hre.ethers.getContractFactory("MyAddLiquidity");

  console.log("Conectandonos al MyAddLiquidity");
  var myAddLiquidityPool = MyAddLiquidityPool.attach(myAddliquidityPoolAdd);

  console.log("Depositar usdcoin en el contrato que creará el pool de liquidez");
  var tx = await usdcoin.mint(myAddliquidityPoolAdd, pEth("100000"));
  await tx.wait();

  console.log("Depositar miPrimerToken en el contrato que creará el pool de liquidez");
  var tx = await miPrimerToken.mint(myAddliquidityPoolAdd, pEth("800000"));
  await tx.wait();


  // Definir el ratio => definir el X * Y = K
  // Token usdcoin: 100,000
  // Token miPrimerToken: 800,000
  // ratio 10:80
  var _token0 = usdcAdd;
  var _token1 = miPrimerTokenAdd;
  var _amount0Desired = ethers.utils.parseEther("100000");
  var _amount1Desired = ethers.utils.parseEther("800000");
  var _amount0Min = ethers.utils.parseEther("100000");
  var _amount1Min = ethers.utils.parseEther("800000");
  var _to = myAddLiquidityPool.address;
  var _deadline = new Date().getTime();

  console.log("Añadiendo liquidez al pool de liquidez");
  var tx = await myAddLiquidityPool.addLiquidity(
    _token0,
    _token1,
    _amount0Desired,
    _amount1Desired,
    _amount0Min,
    _amount1Min,
    _to,
    _deadline
  );

  var res = await tx.wait();
  console.log("transaccion hash ", res.transactionHash);
  console.log("balance usdcoin", (await usdcoin.balanceOf(myAddLiquidityPool)).toString());
  console.log("balance miPrimerToken", (await miPrimerToken.balanceOf(myAddLiquidityPool)).toString());
}



// PublicSale Proxy Address: 0xa9E34791B749DaFDA4ea48a10C4e06222e44D39d
// PublicSale Impl Address: 0xb469a67703Cec68e5f6D3431Fba7E61595246A61
async function deployPublicSaleSC() {

  publicSaleContract = await deploySC("PublicSale", []);
  var implementation = await printAddress("PublicSale", publicSaleContract.address);

  await verify(implementation, "PublicSale", []);


}



// implementacion: 0x45d038f4b0e24acb22a02dFd39AFe5620c5627e8
// implementacion: 0x6E93F82823c6dc40A1223Fbd63Bc947BeEc69273
// implementacion: 0xfA9106f112f6EDa76e45BA6608ed5D6d3F5b8591 
// implementacion: 0x87Edd6A6342BE960837f3EeBc2E8e64b8F975B21
// implementacion: 0x8bbe8c0f09976Ab50217C8285d3B36e0d26f9c12
// implementacion: 0xc574ABa6B27314207101afbC542842a82638341E
// implementacion: 0x4b877A71F47bc9C4ba984E1F16397691e60d0588

async function upgradePublicSaleSC() {
  
  console.log("Actualizando PublicSale ......");

  var PublicSaleProxyAdd = "0xa9E34791B749DaFDA4ea48a10C4e06222e44D39d";
  const PublicSaleUpgrade = await hre.ethers.getContractFactory("PublicSale");

  var publicSaleUpgrade = await upgrades.upgradeProxy(PublicSaleProxyAdd, PublicSaleUpgrade);
  try {
    await publicSaleUpgrade.deployTransaction.wait(5);
  } catch (error) {
    console.log(error);
  }
  
  var implmntAddress = await upgrades.erc1967.getImplementationAddress(publicSaleUpgrade.address);

  console.log("Proxy address publicSaleUpgrade:", publicSaleUpgrade.address);
  console.log("Implementation address publicSaleUpgrade:", implmntAddress);

  await hre.run("verify:verify", {
    address: implmntAddress,
    constructorArguments: [],
  });


}


async function setupPublicSale() {

  console.log("Conectandonos a PublicSale");
  var publicSaleProxyAdd = "0xa9E34791B749DaFDA4ea48a10C4e06222e44D39d";
  var gnosisSafeWalletAdd = "0x9bF02fD6C167e59dd1D2b2caCB24a92F99535BDb";
  var usdCoinAdd = "0x46bdCBd7f7eb221F06b5FEc60Be928B7744f95E5";  
  var miPrimerTokenAdd = "0x17DE84281C4bfF53beb423ff8256B1dbE3bDb3E6";

  var [owner] = await hre.ethers.getSigners();
  var urlProvider = process.env.GOERLI_TESNET_URL;
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  var publicSaleContract = new hre.ethers.Contract(publicSaleProxyAdd, publicSaleAbi.abi, provider);

  console.log("Configura el address de MiPrimerToken en Public Sale");
  var tx = await publicSaleContract.connect(owner).setMiPrimerToken(miPrimerTokenAdd);
  await tx.wait();

  console.log("Configura el address de UsdCoin en Public Sale");
  var tx = await publicSaleContract.connect(owner).setUSDCCoin(usdCoinAdd);
  await tx.wait();

  console.log("Configura el address de Gnosis en Public Sale");
  var tx = await publicSaleContract.connect(owner).setGnosisWalletAdd(gnosisSafeWalletAdd);
  await tx.wait();


}

async function testSetupPublicSale() {
  console.log("Conectandonos a PublicSale");
  var publicSaleProxyAdd = "0xa9E34791B749DaFDA4ea48a10C4e06222e44D39d";

  var [owner] = await hre.ethers.getSigners();
  var urlProvider = process.env.GOERLI_TESNET_URL;
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  var publicSaleContract = new hre.ethers.Contract(publicSaleProxyAdd, publicSaleAbi.abi, provider);
  
  console.log("Obtiene el address de la billetera Gnosis configurado en PublicSale");
  var res = await publicSaleContract.connect(owner).getGnosisWalletAdd();
  console.log("Wallet Gnosis Address", res);

  console.log("Obtiene el address de UsdCoin configurado en PublicSale");
  var res = await publicSaleContract.connect(owner).getUSDCoinAdd();
  console.log("UsdCoin Address", res);

  console.log("Obtiene el address de MiPrimerToken configurado en PublicSale");
  var res = await publicSaleContract.connect(owner).getMiPrimerTokenAdd();
  console.log("MiPrimerToken Address", res);


}



// MyTokenMiPrimerToken Proxy Address: 0x17DE84281C4bfF53beb423ff8256B1dbE3bDb3E6
// MyTokenMiPrimerToken Impl Address: 0x9DBA23611B6DA81E3D3a8a5ECa041e051913c4E1

async function deployMyTokenMiPrimerToken() {
  //var name = "Mi Primer Token";
  //var symbol = "MPRTKN";
  miPrimerTokenContract = await deploySC("MyTokenMiPrimerToken", []);
  var implementation = await printAddress("MyTokenMiPrimerToken", miPrimerTokenContract.address);

  await verify(implementation, "MyTokenMiPrimerToken", []);
}



// MiPrimerNft Proxy Address: 0x4dDc538656A404dB5632852D0EE60DBB0C0A8FdC
// MiPrimerNft Impl Address: 0x7f28E1fEBC3Dac93e50A2453F45b4756bF2374f4
async function deployMumbai() {
  var relayerAddress = "0x78c580fd629a1b2724441ffe3af102825762e82b";
  //var name = "Mi Primer NFT";
  //var symbol = "MPRNFT";
  //var nftContract = await deploySC("MiPrimerNft", [name, symbol]);
  var nftContract = await deploySC("MiPrimerNft", []);
  var implementation = await printAddress("MiPrimerNft", nftContract.address);

  // set up
  await ex(nftContract, "grantRole", [MINTER_ROLE, relayerAddress], "GR");

  await verify(implementation, "MiPrimerNft", []);
}

async function deployTokensGoerli() {

  await deployUSDC();
  await deployMyTokenMiPrimerToken();

}

async function deployGoerli() {

  // gnosis safe
  // Crear un gnosis safe en https://gnosis-safe.io/app/
  // Extraer el address del gnosis safe y pasarlo al contrato con un setter
  //var gnosis = { address: "" };
}

//deployGoerli()
//testSetupPublicSale()
//setupPublicSale()
//publishLibraryLiquiditySC()
upgradePublicSaleSC()
  //deployPublicSaleSC()
  //swapTokensForExact()
  //publishSwapper()
  //addLiquidityToPool()
  //publishLiquiditySC()
  //deployTokensGoerli()
  //deployMumbai()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
