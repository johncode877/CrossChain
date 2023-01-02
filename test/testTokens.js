const { expect } = require("chai");
const { ethers } = require("hardhat");
const gcf = hre.ethers.getContractFactory;


const { getRole, deploySC, printAddress, deploySCNoUp, ex, pEth, printAddressNoUp } = require("../utils");


describe("MI PRIMER TOKEN TESTING", function () {
    var nftContract, publicSale, miPrimerToken, usdcSC;
    var nameUSDC = "USD Coin";
    var symbolUSDC = "USDC";
    var decimalUSDC = 6;
    var nameMPRTKN = "Mi Primer Token";
    var symbolMPRTKN = "MPRTKN";
    var decimalMPRTKN = 18;

    async function deployMPTKN() {
        console.log("Desplegando MPTKN");
        miPrimerToken = await deploySC("MyTokenMiPrimerToken", []);
        var implementation = await printAddress("MyTokenMiPrimerToken", miPrimerToken.address);

    }

    async function deployUSDC() {
        // contrato USDC no es actualizable 
        console.log("Desplegando USDC");
        usdcSC = await deploySCNoUp("USDCoin", []);
        await printAddressNoUp("USDCoin", usdcSC.address);


    }



    describe("Publicando contratos", () => {
        // Se publica el contrato antes de cada test
        before(async () => {
            await deployUSDC();
        });

        describe("USDC Metadata", () => {
            it("Verifica nombre", async () => {
                expect(await usdcSC.name()).to.be.equal(nameUSDC);
            });

            it("Verifica símbolo", async () => {
                expect(await usdcSC.symbol()).to.be.equal(symbolUSDC);
            });

            it("Verifica Decimales ", async () => {
                expect(await usdcSC.decimals()).to.be.equal(decimalUSDC);
            });
        });


        before(async () => {
            await deployMPTKN();
        });

        describe("MPTKN Metadata", () => {
            it("Verifica nombre", async () => {
                expect(await miPrimerToken.name()).to.be.equal(nameMPRTKN);
            });

            it("Verifica símbolo", async () => {
                expect(await miPrimerToken.symbol()).to.be.equal(symbolMPRTKN);
            });

            it("Verifica Decimales ", async () => {
                expect(await miPrimerToken.decimals()).to.be.equal(decimalMPRTKN);
            });
        });


    });


});    