pragma solidity ^0.4.17;

contract MajorityTrusteeEqualBen is Trust {

    struct WithdrawRequest {
        uint percentageWithdrawal;
        bool complete;
        uint approvalCount;
        mapping (address => bool) approvals;
    }

    uint public trusteeCount;
    WithdrawRequest[] public withdrawRequests;

    function MajorityTrusteeEqualBen (string _trustName) Trust (_trustName) public {

    }

    function getApprovalCount () private view returns (uint) {
      return trusteeCount / 2;
    }

    function registerTrustee (address _trustee) public onlyOwner {
        // Only the owner can register beneficiaries
        super.registerTrustee (_trustee);
        trusteeCount++;
    }

    function unregisterTrustee (address _trustee) public {
        super.unregisterTrustee (_trustee);
        trusteeCount--;
    }

    function requestWithdrawal (uint _percentageWithdrawal) public {
        // only a trustee OR a beneficiary can request a withdrawal
        require (trustees[msg.sender] || isBeneficiary(msg.sender));

         // percentage must be between 0 and 100
        require (_percentageWithdrawal > 0 && _percentageWithdrawal <= 100);

        WithdrawRequest memory newRequest = WithdrawRequest({
            percentageWithdrawal: _percentageWithdrawal,
            complete: false,
            approvalCount: 0
        });

        withdrawRequests.push (newRequest);
    }

    function getWithdrawalRequestCount () view public returns (uint) {
        return withdrawRequests.length;
    }

    function approveWithdrawal(uint index) public {
        WithdrawRequest storage request = withdrawRequests[index];

        // require that this approver is a trustee
        require(trustees[msg.sender]);

        // require that this trustee has not already approved this request
        require(!request.approvals[msg.sender]);

        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    function finalizeWithdrawal (uint index) public {

        WithdrawRequest storage withdrawRequest = withdrawRequests[index];

        // Approval count for this withdrawal request is a majority
        require(withdrawRequest.approvalCount > getApprovalCount());

        // Withdraw request must not be complete (to avoid double withdrawals)
        require(!withdrawRequest.complete);

        uint256 beforeBalance = this.balance;
        uint i = 0;
        for (i; i < beneficiaries.length; i++) {
            beneficiaries[i].transfer(beforeBalance / beneficiaries.length * withdrawRequest.percentageWithdrawal / 100);
        }

        withdrawRequest.complete = true;
    }

}
