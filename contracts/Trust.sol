pragma solidity ^0.4.17;

contract Trust {

  struct BenStruct {
      uint benData;
      uint listPointer;
  }

  string public trustName;
  address public owner;

  mapping (address => bool) public trustees;
  mapping(address => BenStruct) public benStructs;
  address[] public beneficiaries;

  function Trust (string _trustName) public {
      trustName = _trustName;
      owner = msg.sender;
      registerTrustee (msg.sender);
  }

  function isBeneficiary (address _benAddress) public view returns (bool) {
      if (beneficiaries.length == 0)
          return false;
      return (beneficiaries[benStructs[_benAddress].listPointer] == _benAddress);
  }

  function getBenCount() public constant returns(uint entityCount) {
      return beneficiaries.length;
  }


  function newBeneficiary(address _benAddress, uint _benData) public returns(bool) {
      require (! isBeneficiary (_benAddress));
      benStructs[_benAddress].benData = _benData;
      benStructs[_benAddress].listPointer = beneficiaries.push(_benAddress) - 1;
      return true;
  }

  function updateBeneficiary(address _benAddress, uint _benData) public {
      require (isBeneficiary (_benAddress));
      benStructs[_benAddress].benData = _benData;
  }

  function deleteBeneficiary(address _benAddress) public  {
      require (isBeneficiary (_benAddress));
      uint rowToDelete = benStructs[_benAddress].listPointer;
      address keyToMove = beneficiaries[beneficiaries.length-1];
      beneficiaries[rowToDelete] = keyToMove;
      benStructs[keyToMove].listPointer = rowToDelete;
      beneficiaries.length--;
  }

  function registerBeneficiary (address _ben) public {
      // Only the owner can register beneficiaries
      require (msg.sender == owner);
      newBeneficiary (_ben, 0);
  }

  function unregisterBeneficiary (address _ben) public {
      // Only the owner can register beneficiaries
      require (msg.sender == owner);
      deleteBeneficiary (_ben);
  }

  function getBeneficiaries () public view returns (address[]) {
      return beneficiaries;
  }

  function registerTrustee (address _trustee) public onlyOwner {
      trustees[_trustee] = true;
  }

  function unregisterTrustee (address _trustee) public onlyOwner {
      trustees[_trustee] = false;
  }

  modifier onlyOwner () {
    require (msg.sender == owner);
    _;
  }

  function deposit() payable public {
  
  }

  function () public {}
}
