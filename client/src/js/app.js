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

  bindEvents: function () {
    $(document).on('click', '#register', App.handleRegister);
    $(document).on('click', '#change-phase', App.handlePhase);
    $(document).on('click', '#generate-winner', App.handleWinner);
    $(document).on('click', '#submit-reveal', App.handleReveal);
    $(document).on('click', '#close-auction', App.handleClose);
    $(document).on('click', '#withdraw-bid', App.handleWithdraw);
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
  }
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