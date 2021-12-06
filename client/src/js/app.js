App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: "http://127.0.0.1:7545",

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("UrFabToken.json", function (data) {
      let auctionArtifact = data;
      App.contracts.auction = TruffleContract(auctionArtifact);
      App.contracts.mycontract = data;
      App.contracts.auction.setProvider(App.web3Provider);
      App.currentAccount = web3.eth.coinbase;
      console.log("App", App);
      App.contracts.auction
        .deployed()
        .then(function (instance) {
          console.log("instance", instance);
          return instance.checkregistration.call(App.currentAccount);
        })
        .then(function (result) {
          // console.log('registered',result.toNumber()!==0
          if (result.toNumber() !== 0) {
            jQuery("#register").hide();
            jQuery("#reg-status").text("User is already registered");
          }
        });
      App.contracts.auction
        .deployed()
        .then(function (instance) {
          console.log("App.currentAccount", App.currentAccount);
          return instance.balanceOf.call(App.currentAccount);
        })
        .then(function (result) {
          console.log("result", result.toNumber());
          // result = result.toNumber()
          jQuery("#balance").text(result);
        });

      App.contracts.auction
        .deployed()
        .then(function (instance) {
          return instance.getProductCounter.call({ gasLimit: 300000 });
        })
        .then(function (result) {
          console.log("productCounter", result.toNumber());
          App.loadPendingTransactions(result.toNumber());
        })
        .catch((e) => console.warn("error", e));

      jQuery("#current_account").text(App.currentAccount);

      return App.bindEvents();
    });
  },

  loadPendingTransactions: async function (count) {
    let i = 0;
    let sol = [];
    $("#pending-requests").empty();
    for (i = 1; i < count + 1; i++) {
      try {
        const instance = await App.contracts.auction.deployed();
        const result = await instance.getProduct.call(i, {
          from: App.currentAccount,
        });
        const obj = {
          productCode: result[0].toNumber(),
          productCost: result[1].toNumber(),
          currentOwner: result[2],
          status: result[3].toNumber(),
          buyer: result[4],
        };

        if (
          obj.currentOwner == App.currentAccount &&
          obj.status === 1 &&
          obj.buyer !== App.currentAccount
        ) {
          sol.push(i);
        }
      } catch (e) {
        console.log("error", e);
      }
    }
    if (sol.length == 0) {
      $("#pending-requests").text("None");
    } else {
      let temp = [];
      sol.forEach((id) => {
        let ob = `<a class='pending-request' req-id='${id}'>${id}</a> `;
        temp.push(ob);
      });
      $("#pending-requests").append(temp.join(","));
      $(".pending-request").click((event) => {
        event.preventDefault();
        App.getProductDetails({
          preventDefault: () => {},
          target: [, { value: event.target.getAttribute("req-id") }],
        });
        // console.log('event',event.target.getAttribute('req-id'))
      });
    }
    console.log("soll", sol);
  },

  getProductDetails: function (event) {
    console.log("getProductDetails");
    event.preventDefault();
    const productId = event.target[1].value;
    if (productId == null) {
      return;
    }
    App.contracts.auction
      .deployed()
      .then(function (instance) {
        return instance.getProduct.call(productId, {
          from: App.currentAccount,
        });
      })
      .then(function (result) {
        console.log({ result });
        $("#product-details").empty();

        const obj = {
          productCode: result[0].toNumber(),
          productCost: result[1].toNumber(),
          currentOwner: result[2],
          status: result[3].toNumber(),
          buyer: result[4],
        };
        if (obj.status === 1) {
          obj.status = "Requested";
        } else if (obj.status === 0) {
          obj.status = "Neutral";
        } else {
          obj.status = "Sold";
        }
        if (obj.buyer == "0x0000000000000000000000000000000000000000") {
          obj.buyer = "No bids yet";
        }
        if (obj.productCode === 0) {
          $("#product-details").text("No product exits with id " + productId);
          return;
        }

        const s = Object.keys(obj)
          .map((key) => {
            return `${key} = ${obj[key]}`;
          })
          .join("<br>");
        console.log("str", s);
        $("#product-details").append(s + "<br>");
        if (
          obj.currentOwner === App.currentAccount &&
          obj.status === "Requested" &&
          obj.buyer !== App.currentAccount
        ) {
          const accept = $(
            `<button class="btn btn-success me-2">Accept</button>`
          );
          $("#product-details").append(accept);
          accept.attr("id", "accept");
          accept.attr("product-id", productId);
          $("#accept").click((event) => {
            event.preventDefault();
            App.contracts.auction
              .deployed()
              .then(function (instance) {
                // uint256 productId,
                // uint256 productCount,
                // uint256 productCost,
                // uint256 productCode,
                // uint16 status

                // uint256 productId, productState state, uint256 productCount, uint256 productCost, uint256 productCode
                return instance.response(
                  productId,
                  obj.productCost,
                  obj.productCode,
                  2,
                  {
                    from: App.currentAccount,
                    gas: 3000000,
                    value: 0,
                    gasLimit: 300000,
                  }
                );
              })
              .then(() => {
                App.getProductDetails({
                  preventDefault: () => {},
                  target: [, { value: productId }],
                });
              })
              .catch((e) => {
                console.log("RERE", e);
              });
          });
          const reject = $(`<button class="btn btn-danger">Reject</button>`);
          $("#product-details").append(reject);
          reject.attr("id", "reject");
          reject.attr("product-id", productId);
          $("#reject").click((event) => {
            event.preventDefault();
            App.contracts.auction
              .deployed()
              .then(function (instance) {
                return instance.response(
                  productId,
                  obj.productCost,
                  obj.productCode,
                  0,
                  { from: App.currentAccount }
                );
              })
              .then(() => {
                App.getProductDetails({
                  preventDefault: () => {},
                  target: [, { value: productId }],
                });
              });
          });

          return;
        }
        if (
          obj.buyer === App.currentAccount &&
          obj.currentOwner !== App.currentAccount
        ) {
          $("#product-details")
            .append(`<div class="alert alert-success" role="alert">
        You have already requested a purchase, please wait for the owner to respond!
  </div>`);
          return;
        }
        if (obj.currentOwner !== App.currentAccount) {
          const purchase = $(
            `<button class="btn btn-primary">Request</button>`
          );
          $("#product-details").append(purchase);
          purchase.attr("id", "buy");
          purchase.attr("product-code", productId);
          $("#buy").click((event) => {
            event.preventDefault();
            App.contracts.auction
              .deployed()
              .then(function (instance) {
                return instance.request(productId, {
                  from: App.currentAccount,
                });
              })
              .then(() => {
                App.getProductDetails({
                  preventDefault: () => {},
                  target: [, { value: productId }],
                });
              });
            console.log("purchase request generated");
          });
        }
        //product created succesfully
      })
      .catch(console.error);
  },

  handleCreateProduct: function (event) {
    console.log("handleCreateProduct");
    event.preventDefault();
    const productCode = event.target[1].value;
    const productCost = event.target[2].value;
    App.contracts.auction
      .deployed()
      .then(function (instance) {
        return instance.createProduct(productCode, productCost, {
          from: App.currentAccount,
          gas: 2100000,
          gasLimit: 20000000,
        });
      })
      .then(function (result) {
        //product created succesfully
      })
      .catch(console.error);
  },

  toggleLoader: function (id, show = false) {
    if (show) {
      $("#" + id).removeClass("d-none");
    } else {
      $("#" + id).addClass("d-none");
    }
  },

  handleRegister: function () {
    console.log("hadnle1");
    App.toggleLoader("register-indicator", true);
    console.log("hadnle2");
    App.contracts.auction
      .deployed()
      .then((instance) => {
        return instance.registerParticipant({
          from: App.currentAccount,
          gas: 3000000,
          gasLimit: 3000000,
        });
      })
      .then((r) => {
        console.log("r handleRegister", r);
        App.toggleLoader("register-indicator", false);
      })
      .catch((e) => {
        console.log("e handleRegister", e);
        App.toggleLoader("register-indicator", false);
      });
  },

  bindEvents: function () {
    $("#get-product").submit(App.getProductDetails);
    // console.log('s',$('#create-product'))
    $("#create-product").submit(App.handleCreateProduct);
    $(document).on("click", "#register", App.handleRegister);
  },
};

$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      showDuration: "1000",
      positionClass: "toast-top-left",
      preventDuplicates: true,
      closeButton: true,
    };
  });
});

// code for reloading the page on account change
window.ethereum.on("accountsChanged", function () {
  location.reload();
});
