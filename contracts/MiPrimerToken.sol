// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

//Goerly Verified
// Proxy Address: 0x17DE84281C4bfF53beb423ff8256B1dbE3bDb3E6
// Impl Address: 0x9DBA23611B6DA81E3D3a8a5ECa041e051913c4E1
contract MyTokenMiPrimerToken is 
        Initializable, 
        ERC20Upgradeable, 
        AccessControlUpgradeable,
        UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __ERC20_init("Mi Primer Token", "MPRTKN");
        __AccessControl_init();
        __UUPSUpgradeable_init();
         //__Ownable_init();
        
        _mint(msg.sender, 1000000 * 10 ** decimals());

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
    }

    // para contratos actualizables tipo uups
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(MINTER_ROLE) {}

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
