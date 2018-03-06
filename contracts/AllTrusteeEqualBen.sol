pragma solidity ^0.4.17;

contract AllTrusteeEqualBen is MajorityTrusteeEqualBen {
  function AllTrusteeEqualBen(string _trustName)
    MajorityTrusteeEqualBen (_trustName) {

  }

  function getApprovalCount () private view returns (uint) {
    return trusteeCount;
  }
}
