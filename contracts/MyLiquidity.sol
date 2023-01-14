import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IUniswapV2Router02 {

    function addLiquidity(
        address token0,
        address token1,
        uint amount0Desired,
        uint amount1Desired,
        uint amount0Min,
        uint amount1Min,
        address to,
        uint deadline
    ) external returns (uint amount0, uint amount1, uint liquidity);

    function getAmountsIn(
        uint amountOut, 
        address[] memory path
      )  external view returns (uint[] memory amounts);

}

interface IUniswapV2Factory {
    function getPair(
        address token0,
        address token1
    ) external view returns (address pair);
}


contract MyLiquidity {
    // Router Goerli
    address routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);
    
    // MyTokenMiPrimerToken 
    IERC20Upgradeable token0 = IERC20Upgradeable(0x17DE84281C4bfF53beb423ff8256B1dbE3bDb3E6);

    // USDCoin 
    IERC20 token1 = IERC20(0x46bdCBd7f7eb221F06b5FEc60Be928B7744f95E5);

    event AddLiquidityAdded(uint amount0, uint amount1, uint liquidity);
    

    function addLiquidity(
        address _token0,
        address _token1,
        uint _amount0Desired,
        uint _amount1Desired,
        uint _amount0Min,
        uint _amount1Min,
        address _to,
        uint _deadline
    ) external {

        // Approve the router to spend the token
        token0.approve(routerAddress, _amount0Desired);
        token1.approve(routerAddress, _amount1Desired);


        // amount0,amount1 cuantos tokens 0 y 1 se han depositado
        // cuantos tokens liquidity se han generado , con esto
        // despues se pueden socilicitar la devolución de la liquidez
        (uint amount0, uint amount1, uint liquidity) = router.addLiquidity(
            _token0,
            _token1,
            _amount0Desired,
            _amount1Desired,
            _amount0Min,
            _amount1Min,
            _to,
            _deadline
        );
        emit AddLiquidityAdded(amount0, amount1, liquidity);
    }

    function getAmountsIn(
       uint amountOut, 
       address[] memory path
    ) external view returns (uint[] memory) {

        uint[] memory amounts = router.getAmountsIn(
            amountOut,
            path
        );

        return amounts;
    }    

}