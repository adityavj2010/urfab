App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  chairPerson: null,
  currentAccount: null,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('UrFabToken.json', function (data) {
      let auctionArtifact = data;
      App.contracts.auction = TruffleContract(auctionArtifact);
      App.contracts.mycontract = data;
      App.contracts.auction.setProvider(App.web3Provider);
      App.currentAccount = web3.eth.coinbase;
      console.log('App',App);
      App.contracts.auction.deployed().then(function(instance) {
        console.log('instance',instance)
        return instance.checkregistration.call(App.currentAccount);

      }).then(function(result) {
        // console.log('registered',result.toNumber()!==0
        if(result.toNumber()!==0)
        {
          jQuery('#register').hide();
          jQuery('#reg-status').text('User is already registered')
        } 
        
      })
      App.contracts.auction.deployed().then(function(instance) {
        console.log('App.currentAccount',App.currentAccount)
        return instance.balanceOf.call(App.currentAccount)
      }).then(function(result) {
        console.log('result',result.toNumber())
        // result = result.toNumber()
        jQuery('#balance').text(result);
      })
      
      jQuery('#current_account').text(App.currentAccount);

      return App.bindEvents();
    });
  },

  
  
  getProductDetails: function(event) {
    console.log('getProductDetails');
    event.preventDefault();
    const productId = event.target[1].value
    if(productId==null)
    {
      return 
    }
    App.contracts.auction.deployed().then(function(instance) {
      return instance.getProduct.call(productId,{from:App.currentAccount});
    }).then(function(result) {
      $('#product-details').empty()
      const obj = {
        productCode:result[0].toNumber(),
        productCost:result[1].toNumber(),
        manufacturer:result[2],
        currentOwner:result[3],
        productCount:result[4].toNumber(),
        status:result[5].toNumber(),
        buyer:result[6],
      }
      if(obj.status===1) {
        obj.status='Requested';
      } else if (obj.status===0) {
        obj.status='Neutral';
      } else {
        obj.status='Sold';
      }
      if(obj.buyer=='0x0000000000000000000000000000000000000000')
      {
        obj.buyer = 'No bids yet'
      }
      if(obj.productCode===0)
      {
        $('#product-details').text('No product exits with id '+productId)
        return 
      }

      const s = Object.keys(obj).map((key)=>{
        return `${key} = ${obj[key]}`
      }).join('<br>')
      console.log('str',s)
      $('#product-details').append(s+'<br>');
      if(obj.currentOwner===App.currentAccount && obj.status==='Requested' && obj.buyer!==App.currentAccount) {
        const accept = $(`<button class="btn btn-success me-2">Accept</button>`);
        $('#product-details').append(accept);
        accept.attr('id', 'accept');
        accept.attr('product-id', productId);
        $('#accept').click((event)=>{
          event.preventDefault();
          App.contracts.auction.deployed().then(function(instance) {
            // uint256 productId, productState state, uint256 productCount, uint256 productCost, uint256 productCode
            return instance.response(productId,2,obj.productCount,obj.productCost,obj.productCode,{from:App.currentAccount,
              gas: 4712388});
          }).then(()=>{
            App.getProductDetails({
              preventDefault:()=>{},
              target:[,{value:productId}]
            })
          }).catch((e)=>{
            console.log('RERE',e)
          })
          
        })
        const reject = $(`<button class="btn btn-danger">Reject</button>`);
        $('#product-details').append(reject);
        reject.attr('id', 'reject');
        reject.attr('product-id', productId);
        $('#reject').click((event)=>{
          event.preventDefault();
          App.contracts.auction.deployed().then(function(instance) {
            // uint256 productId, productState state, uint256 productCount, uint256 productCost, uint256 productCode
            return instance.response({from:App.currentAccount});
          }).then(()=>{
            App.getProductDetails({
              preventDefault:()=>{},
              target:[,{value:productId}]
            })
          })
        })

        return 
      }
      if(obj.buyer===App.currentAccount && obj.currentOwner!==App.currentAccount)
      { 

      
        $('#product-details').append(`<div class="alert alert-success" role="alert">
        You have already requested a purchase, please wait for the owner to respond!
  </div>`);
        return 
      }
      if(obj.currentOwner!==App.currentAccount)
      {
        const purchase = $(`<button class="btn btn-primary">Request</button>`);
        $('#product-details').append(purchase);
        purchase.attr('id', 'buy');
        purchase.attr('product-code', productId);
        $('#buy').click((event)=>{
          event.preventDefault();
          App.contracts.auction.deployed().then(function(instance) {
            return instance.request(productId,{from:App.currentAccount});
          }).then(()=>{
            App.getProductDetails({
              preventDefault:()=>{},
              target:[,{value:productId}]
            })
          })
          console.log('purchase request generated')
        })
      }
      //product created succesfully
    }).catch(console.error)

  },

  handleCreateProduct: function(event) {
    console.log('handleCreateProduct')
    event.preventDefault();
    const productCode = event.target[1].value
    const productCost = event.target[2].value
    const productCount = event.target[3].value
    App.contracts.auction.deployed().then(function(instance) {
      return instance.createProduct(productCode,productCost,productCount,{from:App.currentAccount});
    }).then(function(result) {
      console.log('HANDLE CREATE',result)
      //product created succesfully
    }).catch(console.error)

  },

  getCurrentPhase: function() {
    App.contracts.auction.deployed().then(function(instance) {
      return instance.currentPhase();
    }).then(function(result) {
      console.log(result)
      App.currentPhase = result;
      var notificationText = App.auctionPhases[App.currentPhase];
      console.log(App.currentPhase);
      console.log(notificationText);
      $('# -notification-text').text(notificationText);
      console.log("Phase set");
    })
  },

  getChairperson: function() {
    App.contracts.auction.deployed().then(function(instance) {
      return instance.beneficiary();
    }).then(function(result) {
      App.chairPerson = result;
      if(App.currentAccount == App.chairPerson) {
        $(".chairperson").css("display", "inline");
        $(".img-chairperson").css("width", "100%");
        $(".img-chairperson").removeClass("col-lg-offset-2");
      } else {
        $(".other-user").css("display", "inline");
      }
    })
  },

  toggleLoader: function(id,show = false) {
    if(show)
    {
      $("#"+id).removeClass("d-none");
    } else {
      $("#"+id).addClass("d-none");
    }
  } ,


  handleRegister: function() {
    console.log('hadnle1')
    App.toggleLoader("register-indicator",true)
    console.log('hadnle2')
    App.contracts.auction.deployed().then((instance)=> {
      return instance.registerParticipant(1,1,{from: App.currentAccount})
    }).then((r)=>{
      console.log('r handleRegister',r)
      App.toggleLoader("register-indicator",false)
    }).catch((e)=>{
      console.log('e handleRegister',e)
      App.toggleLoader("register-indicator",false)
    })
  },

  handlePhase: function () {
    App.contracts.auction.deployed().then(function (instance) {
      return instance.advancePhase({from:App.currentAccount}); // added from parameter
    })
      .then(function (result) {
        console.log(result);
        if (result) {
          if (parseInt(result.receipt.status) == 1) {
            if (result.logs.length > 0) {
              App.showNotification(result.logs[0].event);
            }
            else {
              App.showNotification("AuctionEnded");
            }
            App.contracts.auction.deployed().then(function(latestInstance) {
              return latestInstance.currentPhase();
            }).then(function(result) {
              console.log("This is also working, new phase updated")
              App.currentPhase = result;
            })
            return;
          }
          else {
            toastr["error"]("Error in changing to next Event");
          }
        }
        else {
          toastr["error"]("Error in changing to next Event");
        }
      })
      .catch(function (err) {
        toastr["error"]("Error in changing to next Event");
      });
  },

  handleBid: function () {
    event.preventDefault();
    var bidValue = $("#bet-value").val();
    var msgValue = $("#message-value").val();
    // removed getting account part as we already have App.currentAccount

      App.contracts.auction.deployed().then(function (instance) {
        bidInstance = instance;

        return bidInstance.bid(bidValue, { value: web3.toWei(msgValue, "ether"), from: App.currentAccount }); // added from parameter
      }).then(function (result, err) {
        if (result) {
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            toastr.info("Your Bid is Placed!", "", { "iconClass": 'toast-info notification0' });
          else
            toastr["error"]("Error in Bidding. Bidding Reverted!");
        } else {
          toastr["error"]("Bidding Failed!");
        }
      }).catch(function (err) {
        toastr["error"]("Bidding Failed!");
      });
  },

  handleReveal: function () {
    console.log("button clicked");
    event.preventDefault();
    var bidRevealValue = $("#bet-reveal").val();
    console.log(parseInt(bidRevealValue));
    var bidRevealSecret = $("#password").val();
    // removed getting account part as we already have App.currentAccount

      App.contracts.auction.deployed().then(function (instance) {
        bidInstance = instance;

        return bidInstance.reveal(parseInt(bidRevealValue), bidRevealSecret, {from : App.currentAccount}); // added from parameter
      }).then(function (result, err) {
        if (result) {
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            toastr.info("Your Bid is Revealed!", "", { "iconClass": 'toast-info notification0' });
          else
            toastr["error"]("Error in Revealing. Bidding Reverted!");
        } else {
          toastr["error"]("Revealing Failed!");
        }
      }).catch(function (err) {
        toastr["error"]("Revealing Failed!");
      });
  },


  handleWinner: function () {
    console.log("To get winner");
    var bidInstance;
    App.contracts.auction.deployed().then(function (instance) {
      bidInstance = instance;
      return bidInstance.auctionEnd({from:App.currentAccount});  // added from parameter
    }).then(function (res) {
      console.log(res);
      var winner = res.logs[0].args.winner;
      var highestBid = res.logs[0].args.highestBid.toNumber();
      toastr.info("Highest bid is " + highestBid + "<br>" + "Winner is " + winner, "", { "iconClass": 'toast-info notification3' });
    }).catch(function (err) {
      console.log(err.message);
      toastr["error"]("Error!");
    })
  },

  handleWithdraw: function() {
    if(App.currentPhase == 3) {
      console.log("Inside handleWithdraw")
      App.contracts.auction.deployed().then(function(instance) {
        console.log("Trying to call withdraw with currentAccount: " + App.currentAccount);
        return instance.withdraw({from: App.currentAccount });
      }).then(function(result, error) {
        if(result.receipt.status) {
          toastr.info('Your bid has been withdrawn');
        }  
      }).catch(function(error) {
        console.log(err.message);
        toastr["error"]("Error in withdrawing the bid");
      })
    } else {
      toastr["error"]("Not in a valid phase to withdraw bid!");
    }
  },

  handleClose: function() {
    if(App.currentPhase == 3) {
      console.log("this worked");
      App.contracts.auction.deployed().then(function(instance) {
        return instance.closeAuction({from: App.currentAccount})  // added from parameter
      }).then(function(result) {
        if(result.receipt.status) {
          toastr["error"]("Auction is closed!");
        }
      })
    } else {
      toastr["error"]("Not in a valid phase to close the auction!");
    }
  },

  //Function to show the notification of auction phases
  showNotification: function (phase) {
    var notificationText = App.biddingPhases[phase];
    $('#phase-notification-text').text(notificationText.text);
    toastr.info(notificationText.text, "", { "iconClass": 'toast-info notification' + String(notificationText.id) });
  },

  bindEvents: function () {
    $('#get-product').submit(App.getProductDetails)
    // console.log('s',$('#create-product'))
    $('#create-product').submit(App.handleCreateProduct);
    $(document).on('click', '#register', App.handleRegister);
    $(document).on('click', '#change-phase', App.handlePhase);
    $(document).on('click', '#generate-winner', App.handleWinner);
    $(document).on('click', '#submit-reveal', App.handleReveal);
    $(document).on('click', '#close-auction', App.handleClose);
    $(document).on('click', '#withdraw-bid', App.handleWithdraw);
  },
};


$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      "showDuration": "1000",
      "positionClass": "toast-top-left",
      "preventDuplicates": true,
      "closeButton": true
    };
  });
});

// code for reloading the page on account change
window.ethereum.on('accountsChanged', function (){
  location.reload();
})