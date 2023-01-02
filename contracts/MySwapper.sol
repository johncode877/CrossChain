
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

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


contract MySwapper {
  // address del router de uniswap
  address routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
  IUniSwapV2Router02 router = IUniSwapV2Router02(routerAddress);

  event SwapAmounts(uint[] amounts);
  
   function swapTokensForExactTokens(
      uint amountOut,
      uint amountInMax,
      address[] calldata path, //[usdcoin , miprimertoken]
      address to,
      uint deadline
   ) external {
      
      address tokenAdd = path[0];
      IERC20(tokenAdd).approve(routerAddress,amountInMax);
 
      uint[] memory amounts = router.swapTokensForExactTokens(
          amountOut,
          amountInMax,
          path,
          to,
          deadline
      );
      emit SwapAmounts(amounts);
   }

    
   function swapExactTokensForTokens(
      uint amountIn,
      uint amountOutMin,
      address[] calldata path,
      address to,
      uint deadline
   ) external {

      address tokenAdd = path[0];
      IERC20(tokenAdd).approve(routerAddress,amountIn);


      uint[] memory amounts = router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,  //[tokenA , tokenB]
          to,
          deadline
      );
      emit SwapAmounts(amounts);
   }


}
