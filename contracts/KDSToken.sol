pragma solidity >=0.4.21 <0.6.0;

contract KDSToken {

  string public name = "KDSToken";
  string public symbol = "KD";
  string public standard = "KDSToken v1.0";
  uint public totalSupply;
  mapping (address => uint) public balanceOf;
  mapping (address => mapping (address => uint)) public allowance;
  event Transfer(
    address indexed _from,
    address indexed _to,
    uint _value
  );

  event Approval(
    address _owner,
    address _spender,
    uint _value
  );

  constructor (uint _initialSupply) public {
    balanceOf[msg.sender] = _initialSupply;
    totalSupply = _initialSupply;
  }
  // transfer function
  function transfer(address _to, uint _value) public returns (bool success) {
    require(balanceOf[msg.sender] >= _value);
    balanceOf[msg.sender] -= _value;
    balanceOf[_to] += _value;
    emit Transfer(msg.sender, _to, _value);
    return  true;
  }

  // Delegated transfer
  function approve(address _spender, uint _value) public returns (bool success) {
    // _spender is get approval by msg.sender to spend _value tokens i.e KDSToken

    // allow _spender to withdraw from your accoutn multiple times, up to the _value amount.
    // if this function is called again it overwrites the current allowance with _value.
    allowance[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
    require(_value <= balanceOf[_from]);
    require(_value <= allowance[_from][msg.sender]);

    //change the balance
    balanceOf[_from] -= _value;
    balanceOf[_to] += _value;

    allowance[_from][msg.sender] -= _value;

    emit Transfer(_from, _to, _value);
    return true;
  }
}
