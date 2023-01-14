// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IUniSwapV2Router02 {
    // comienzas por los tokens finales
    // quiero n tokens finales
    // pero no se cuanto me van a cobrar
    // de los tokens iniciales
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    // comienzas por los primeros tokens
    // yo se cuanto voy a dar y no se cuanto me daran
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract PublicSale is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // para llevar la cuenta de ids vendidos
    bool[30] nftIdsSaled;
    uint256 nftTotalSaled;

    // Mi Primer Token
    // Crear su setter
    IERC20Upgradeable miPrimerToken;
    IERC20 usdcoin;

    // 21 de diciembre del 2022 GMT
    uint256 constant startDate = 1671580800;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 50000 * 10 ** 18;
    uint256 constant MAX_PRICE_NFT_MPTKN = 50000;

    // Gnosis Safe
    // Crear su setter
    address gnosisSafeWallet;
    address routerUniSwap;

    uint256 tpriceNft;
    event Received(uint256 etherAmount);
    event DeliverNft(address winnerAccount, uint256 nftId);
    event Convertion(uint256 qusdc, uint256 qmiPrimerToken);

    // interactuar con uniswap
    IUniSwapV2Router02 router;
    address usdcAdd;
    address miPrimerTokenAdd;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        routerUniSwap = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        nftTotalSaled = 0;
        tpriceNft = 0;
    }

    function setMiPrimerToken(address _miPrimerToken) external {
        miPrimerToken = IERC20Upgradeable(_miPrimerToken);
        miPrimerTokenAdd = _miPrimerToken;
    }

    function setUSDCCoin(address _usdc) external {
        usdcoin = IERC20(_usdc);
        usdcAdd = _usdc;
    }

    function setGnosisWalletAdd(address _gnosisSafeWallet) external {
        gnosisSafeWallet = _gnosisSafeWallet;
    }

    function getGnosisWalletAdd() external view returns (address) {
        return gnosisSafeWallet;
    }

    function getMiPrimerTokenAdd() external view returns (address) {
        return miPrimerTokenAdd;
    }

    function getUSDCoinAdd() external view returns (address) {
        return usdcAdd;
    }

    function getPriceByIdUSDC(uint256 _id) external view returns (uint256,uint256) {
         
        uint256 amountOut = _getPriceById(_id);
        
        uint256 balance = usdcoin.balanceOf(msg.sender);
        uint256 priceNftInUSDC = amountOut / 8;

        return (balance,priceNftInUSDC);
    }

    function purchaseNftByIdUsingUSDCoin(uint256 _id,uint256 priceInUsdCoin) external {
        // 4 - el _id se encuentre entre 1 y 30
        //         * Mensaje de error: "NFT: Token id out of range"
        require((_id > 0) && (_id <= 30), "NFT: Token id out of range");

        // 1 - el id no se haya vendido. Sugerencia: llevar la cuenta de ids vendidos
        //         * Mensaje de error: "Public Sale: id not available"
        require(!nftIdsSaled[_id-1], "Public Sale: id not available");

        // 2 - el msg.sender haya dado allowance a este contrato en suficiente de MPRTKN
        //         * Mensaje de error: "Public Sale: Not enough allowance"

        uint256 allowance = usdcoin.allowance(msg.sender, address(this));
        require(allowance >= priceInUsdCoin, "Public Sale: Not enough allowance");

        // Obtener el precio segun el id
        uint256 amountOut = _getPriceById(_id);
        tpriceNft = amountOut;

        // obtiene USDC del comprador
        usdcoin.transferFrom(msg.sender, address(this), priceInUsdCoin);

        router = IUniSwapV2Router02(routerUniSwap);

        usdcoin.approve(routerUniSwap, priceInUsdCoin);

        address[] memory path;
        path[0] = usdcAdd;
        path[1] = miPrimerTokenAdd;

        uint deadline = block.timestamp;
        uint[] memory amounts = router.swapTokensForExactTokens(
            amountOut,
            priceInUsdCoin,
            path,
            address(this),
            deadline
        );

        uint256 _fee = (amounts[1] * 10) / 100;

        // enviar comision a Gnosis Safe desde los fondos de PublicSale
        miPrimerToken.transferFrom(address(this), gnosisSafeWallet, _fee);

        nftIdsSaled[_id - 1] = true;
        nftTotalSaled++;

        // EMITIR EVENTO para que lo escuche OPEN ZEPPELIN DEFENDER
        emit DeliverNft(msg.sender, _id);
    }

    function getRouterUniSwapAdd() external view returns (address) {
        return routerUniSwap;
    }

    function purchaseNftById(uint256 _id) external {
        // Realizar 3 validaciones:

        // 4 - el _id se encuentre entre 1 y 30
        //         * Mensaje de error: "NFT: Token id out of range"
        require((_id > 0) && (_id <= 30), "NFT: Token id out of range");

        // 1 - el id no se haya vendido. Sugerencia: llevar la cuenta de ids vendidos
        //         * Mensaje de error: "Public Sale: id not available"
        require(!nftIdsSaled[_id-1], "Public Sale: id not available");

        // 2 - el msg.sender haya dado allowance a este contrato en suficiente de MPRTKN
        //         * Mensaje de error: "Public Sale: Not enough allowance"

        uint256 allowance = miPrimerToken.allowance(msg.sender, address(this));
        require(allowance > 0, "Public Sale: Not enough allowance");

        // 3 - el msg.sender tenga el balance suficiente de MPRTKN
        //         * Mensaje de error: "Public Sale: Not enough token balance"

        // Obtener el precio segun el id
        uint256 priceNft = _getPriceById(_id);
        tpriceNft = priceNft;

        uint256 balance = miPrimerToken.balanceOf(msg.sender);
        require(balance >= priceNft, "Public Sale: Not enough token balance");

        // Purchase fees
        // 10% para Gnosis Safe (fee)
        // 90% se quedan en este contrato (net)
        // from: msg.sender - to: gnosisSafeWallet - amount: fee
        // from: msg.sender - to: address(this) - amount: net

        uint256 _fee = (priceNft * 10) / 100;
        uint256 _net = priceNft - _fee;

        // enviar comision a Gnosis Safe
        miPrimerToken.transferFrom(msg.sender, gnosisSafeWallet, _fee);

        // cobrar MiPrimerToken al comprador
        miPrimerToken.transferFrom(msg.sender, address(this), _net);

        nftIdsSaled[_id-1] = true;
        nftTotalSaled++;
        // EMITIR EVENTO para que lo escuche OPEN ZEPPELIN DEFENDER
        emit DeliverNft(msg.sender, _id);
    }

    function getPriceNftSaled() external view returns (uint256) {
        return tpriceNft;
    }

    function depositEthForARandomNft() public payable {
        // Realizar 2 validaciones

        // 1 - que el msg.value sea mayor o igual a 0.01 ether
        require(msg.value >= 0.01 ether, "Insuficiente cantidad de Ether");

        // 2 - que haya NFTs disponibles para hacer el random
        // obtener id nft random para vender
        require(nftTotalSaled < 30, "No hay nfts disponibles");

        // Escoger una id random de la lista de ids disponibles
        uint256 nftId = _getRandomNftId();

        // si el nft random esta vendido
        if (nftIdsSaled[nftId - 1]) {
            nftId = 0;
            // recorro la lista y escojo el primer nft disponible
            for (uint256 k = 1; k <= 30; k++) {
                if (!nftIdsSaled[k - 1]) {
                    nftId = k;
                    break;
                }
            }
            require(nftId > 0, "No hay nfts disponibles");
        }

        // Enviar ether a Gnosis Safe
        // SUGERENCIA: Usar gnosisSafeWallet.call para enviar el ether
        // Validar los valores de retorno de 'call' para saber si se envio el ether correctamente
        (bool success, ) = payable(gnosisSafeWallet).call{
            value: 0.01 ether,
            gas: 500000
        }("");
        require(success, "Transfer Ether Gnosis failed");

        // Dar el cambio al usuario
        // El vuelto seria equivalente a: msg.value - 0.01 ether
        if (msg.value > 0.01 ether) {
            // logica para dar cambio
            // usar '.transfer' para enviar ether de vuelta al usuario
            uint256 _amountEther = msg.value - 0.01 ether;

            payable(msg.sender).transfer(_amountEther);

            //(success, ) = payable(gnosisSafeWallet).call{
            //    value: _amountEther,
            //    gas: 2300
            //}("");

            //require(success, "Transfer Ether To Client failed");
        }

        nftIdsSaled[nftId - 1] = true;
        nftTotalSaled++;
        // EMITIR EVENTO para que lo escuche OPEN ZEPPELIN DEFENDER
        emit DeliverNft(msg.sender, nftId);
    }

    // PENDING
    // Crear el metodo receive
    receive() external payable {
        emit Received(msg.value);

        depositEthForARandomNft();
    }

    // Método que permite recuperar lo tokens de MiPrimerToken almacenados en este contrato
    // Esta protegido y solo el admin/owner del contrato lo puede llamar
    // Todos los MiPrimerToken del contrato Compra y Venta son transferidos
    // al llamante del método
    function transferTokensFromSmartContract()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        miPrimerToken.transfer(
            msg.sender,
            miPrimerToken.balanceOf(address(this))
        );
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    // Devuelve un id random de NFT de una lista de ids disponibles
    function _getRandomNftId() internal view returns (uint256) {
        uint256 random = (uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        ) % 30) + 1;

        return random;
    }

    function getPriceNFTById(uint256 _id) external view returns (uint256) {   
        uint256 priceGroupOne = 500;
        uint256 priceGroupTwo = _id * 1000;
        uint256 priceGroupThree = 10000; // temporalmente
        if (_id > 0 && _id < 11) {
            return priceGroupOne;
        } else if (_id > 10 && _id < 21) {
            return priceGroupTwo;
        } else {
            uint256 basePriceNft = 10000;
            uint256 hourElapsed = (block.timestamp - startDate) / 3600;
            priceGroupThree = basePriceNft + hourElapsed * 1000;
            priceGroupThree = (priceGroupThree < MAX_PRICE_NFT_MPTKN)
                ? priceGroupThree
                : MAX_PRICE_NFT_MPTKN;

            return priceGroupThree;
        }
    }    

    // Según el id del NFT, devuelve el precio. Existen 3 grupos de precios
    function _getPriceById(uint256 _id) internal view returns (uint256) {
        uint256 priceGroupOne = 500;
        uint256 priceGroupTwo = _id * 1000;
        uint256 priceGroupThree = 10000; // temporalmente
        if (_id > 0 && _id < 11) {
            return priceGroupOne;
        } else if (_id > 10 && _id < 21) {
            return priceGroupTwo;
        } else {
            uint256 basePriceNft = 10000;
            uint256 hourElapsed = (block.timestamp - startDate) / 3600;
            priceGroupThree = basePriceNft + hourElapsed * 1000;
            priceGroupThree = (priceGroupThree < MAX_PRICE_NFT_MPTKN)
                ? priceGroupThree
                : MAX_PRICE_NFT_MPTKN;

            return priceGroupThree;
        }
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}
}
