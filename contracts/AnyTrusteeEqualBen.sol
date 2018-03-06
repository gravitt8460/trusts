pragma solidity ^0.4.17;

contract AnyTrusteeEqualBen is Trust {

    function AnyTrusteeEqualBen(string _trustName) Trust (_trustName) public {

    }

    function withdraw (uint percentage) public {
        // only a trustee can trigger a withdrawal
        require (trustees[msg.sender]);

        // percentage must be greater than zero and less than or equal to 100
        require (percentage > 0 && percentage <= 100);

        uint256 beforeBalance = this.balance;
        uint i = 0;
        for (i; i < beneficiaries.length; i++) {
            beneficiaries[i].transfer(beforeBalance / beneficiaries.length * percentage / 100);
        }
    }

}
