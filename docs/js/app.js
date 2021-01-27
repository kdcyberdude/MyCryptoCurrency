
App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: async function() {


    console.log('Initializing web3...');


    const provider = await detectEthereumProvider();
    const ethereum = provider;

    if (provider) {
      startApp(provider); // Initialize your app
    } else {
      console.log('Please install MetaMask!');
    }

    if(ethereum.isConnected()){

    }

    function startApp(provider) {
      // If the provider returned by detectEthereumProvider is not the same as
      // window.ethereum, something is overwriting it, perhaps another wallet.
      if (provider !== window.ethereum) {
        console.error('Do you have multiple wallets installed?');
      }
      // Access the decentralized web!
    }



          /**********************************************************/
    /* Handle chain (network) and chainChanged (per EIP-1193) */
    /**********************************************************/

    const chainId = await ethereum.request({ method: 'eth_chainId' });
    handleChainChanged(chainId);
    console.log('ChainId is:',chainId);
    ethereum.on('chainChanged', handleChainChanged);

    function handleChainChanged(_chainId) {
      // We recommend reloading the page, unless you must do otherwise
      console.log('chain changed...');
      //window.location.reload();
    }

    /***********************************************************/
    /* Handle user accounts and accountsChanged (per EIP-1193) */
    /***********************************************************/

    let currentAccount = null;
    ethereum
      .request({ method: 'eth_accounts' })
      .then(handleAccountsChanged)
      .catch((err) => {
        // Some unexpected error.
        // For backwards compatibility reasons, if no accounts are available,
        // eth_accounts will return an empty array.
        console.error(err);
      });

    // Note that this event is emitted on page load.
    // If the array of accounts is non-empty, you're already
    // connected.
    ethereum.on('accountsChanged', handleAccountsChanged);

    // For now, 'eth_accounts' will continue to always return an array
    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        console.log('Please connect to MetaMask.');
      } else if (accounts[0] !== currentAccount) {
        currentAccount = accounts[0];
        console.log('currentAccount Address:',currentAccount);
        App.web3Provider = ethereum;
        web3 = new Web3(ethereum);
        return App.initContracts();
        // App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        // web3 = new Web3(App.web3Provider);
        // return App.initContracts();

      }
    }

    /*********************************************/
    /* Access the user's accounts (per EIP-1102) */
    /*********************************************/

    // You should only attempt to request the user's accounts in response to user
    // interaction, such as a button click.
    // Otherwise, you popup-spam the user like it's 1999.
    // If you fail to retrieve the user's account(s), you should encourage the user
    // to initiate the attempt.

    // While you are awaiting the call to eth_requestAccounts, you should disable
    // any buttons the user can click to initiate the request.
    // MetaMask will reject any additional requests while the first is still
    // pending.
    function connect() {
      console.log('connecting to metamask...');
      ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleAccountsChanged)
        .catch((err) => {
          if (err.code === 4001) {
            // EIP-1193 userRejectedRequest error
            // If this happens, the user rejected the connection request.
            console.log('Please connect to MetaMask.');
          } else {
            console.error(err);
          }
        });
    }

    connect();




    // if (typeof web3 !== 'undefined' && false) {
    //   // If a web3 instance is already provided by Meta Mask.
    //   App.web3Provider = web3.currentProvider;
    //   web3 = new Web3(web3.currentProvider);
    //   console.log('web3 intialized with ethereum')
    // } else {
    //   // Specify default instance if no web3 instance provided
    //   App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    //   web3 = new Web3(App.web3Provider);
    // }

  },

  initContracts: function() {
    $.getJSON("KDSTokenSale.json", function(kdsTokenSale) {
      App.contracts.KDSTokenSale = TruffleContract(kdsTokenSale);
      App.contracts.KDSTokenSale.setProvider(App.web3Provider);
      App.contracts.KDSTokenSale.deployed().then(function(kdsTokenSale) {
        console.log("KDS Token Sale Address:", kdsTokenSale.address);
      });
    }).done(function() {
      $.getJSON("KDSToken.json", function(kdsToken) {
        App.contracts.KDSToken = TruffleContract(kdsToken);
        App.contracts.KDSToken.setProvider(App.web3Provider);
        App.contracts.KDSToken.deployed().then(function(kdsToken) {
          console.log("KDS Token Address:", kdsToken.address);

        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.KDSTokenSale.deployed().then(function(instance) {
      console.log('sell event on watch');
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      });

    });

    App.contracts.KDSToken.deployed().then(function(instance){
      instance.Transfer({}, {
        fromBlock:0,
        toBlock: 'latest',
      }).watch(function(error,event){
        console.log('Transfer Event:\n',event);
      })
    })

  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#accountAddress').html("Your Account: " + App.account);
      }
    })

    // Load token sale contract
    App.contracts.KDSTokenSale.deployed().then(function(instance) {
      kdsTokenSaleInstance = instance;
      return kdsTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      /*
        Here i am getting an array i.e tokenPrice is instance of map of lenght 1 and value of zero
        I did not understand why it is happening, therfore I am hard coding the codition to overcome this
        TODO: Resolve this error in future

        Now I do understand this ... but I'll solve this later :/
      */

      if (tokenPrice instanceof Object){

      }else{
          App.tokenPrice = tokenPrice;
      }

        price = web3.fromWei(App.tokenPrice,"ether");
        $('.token-price').html(price);

      return kdsTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
    
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.KDSToken.deployed().then(function(instance) {
        kdsTokenInstance = instance;
        return kdsTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        if (balance.e == 6){  // means million
          //start the sale 
         kdsTokenSaleInstance.totalTokensForSale().then(function(totalTokens){
            console.log('total_tokens:',totalTokens);
            kdsTokenInstance.transfer(
              kdsTokenSaleInstance.address,
               App.tokensAvailable, {from:App.account, gas:500000
               }).then(function(res){
              console.log('750000 tokens sent to KDSTokenSale contract:',res);
            }).catch(function(e){
              console.log('startSale error:',e);
            });

          });
        }
        $('.kds-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.KDSTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 // Gas limit
      });

    }).then(function(result) {
      $('form').trigger('reset');
      // reset number of tokens in form
      // Wait for Sell event
      console.log('Tokens sucessfully bought!!');
      App.render();
    }).catch(function(e){
      console.log('error', e);  
      App.render();
      if((String(e)).includes('from')){
        alert('Try Again, because you changed the MetaMask account');
      }else{
        alert('You denied transaction');
      }
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
