$(document).ready(function() {
    $.getJSON("dataBase.json", function(productList) {
      for (let i = 0; i < productList.length; i++) {
        // Loopa ut alla etiketter med respektive produkt, hämtade från json-filen (productList)
        const etiquetteHolder = $("#etiquette-wrapper");
  
        etiquetteHolder.append(
          `<li class="card">
                      <img class="image" src="${productList[i].img}">
                      <div class="card-body">
                          <h3 class="card-title">${productList[i].product}</h3>
                          <p class="card-text">${productList[i].price} kr</p>
                          <input class="inputQuant" type="number" min="1" value="1">
                          <button class="addBtn btn btn-primary">Lägg till</button>
                      </div>
                  </li>`
        );
      }
      if (localStorage.getItem("cartArr") === null) {
        localStorage.setItem("cartArr", "[]"); // ersätter cartArr som redan finns i localStorage med en tom array
      } else {
        createCart(); 
      }
  
      // lägger click-event på alla "Lägg-till"-knappar
      $(".addBtn").click(function() {
        addToCart(this); 
      });
  
      $("#toggle-cart-btn").click(function() {
        $(".cart").slideToggle(800); 
      });
  
      $("#emptyCartBtn").click(function() {
        localStorage.setItem("cartArr", "[]"); 
        createCart(); 
      });
  
      // lägger input-event på alla input-fält
      $(".inputQuant").on("input", function() {
        const $inputField = $(this); 
        const $price = $inputField.siblings("p");
        const product = $inputField.siblings("h3").text();
        const unitPrice = getProductInfo(product).price;
  
        if ($inputField.val() === "" || $inputField.val() < 1) {
          $inputField.val("1"); 
        }
        $price.text(`${$inputField.val() * unitPrice} kr`); 
      });
  
      // Lägger till en produktbeställning i localStorage
      function addToCart(addBtn) {
        const $inputField = $(addBtn).siblings("input");
        const $priceElement = $(addBtn).siblings("p");
        const qty = parseInt($inputField.val());
        const product = $(addBtn)
          .siblings("h3")
          .text();
        const price = getProductInfo(product).price * qty;
         // hämta nuvarande localStorage
        const cartArr = JSON.parse(localStorage.getItem("cartArr"));
  
        if (duplicateExists(cartArr, product)) {
          if (confirm("Produkten finns redan i varukorgen. Vill du lägga till antal? \n OK = lägg till antal \n Cancel = Ersätt antal" )){
            // om man väljer att ersätta beställningen
            mergeProduct(cartArr, product, qty, price); 
            createCart(); 
            showMessage("Produkten har lagts till i varukorgen.", "success"); 
          } else {
            // annars om man väljer att lägga ihop beställningarna
            replaceProduct(cartArr, product, qty, price); 
            createCart(); 
            showMessage("Produkten har lagts till i varukorgen.", "success");
          }
        } else {
          // om det inte finns en produktdublett
          cartArr.unshift({ quantity: qty, product: product, price: price }); 
          localStorage.setItem("cartArr", JSON.stringify(cartArr)); // skicka arrayen till localStorage
          createCart(); 
          showMessage("Produkten har lagts till i varukorgen.", "success"); 
        }
        $inputField.val(1); 
        $priceElement.text(`${getProductInfo(product).price} kr`); 
      }
  
      function showMessage(message, className) {
        $("table").before(`<div class="alert alert-${className}">${message}</div>`); 
        const $alertElement = $(".alert");
  
        setTimeout(() => $alertElement.remove(), 2000); 
      }
  
      // Skapar varukorgen i HTML utifrån localStorage
      function createCart() {
        // hämta cartArr från localStorage
        const cartArr = JSON.parse(localStorage.getItem("cartArr")); 
        const $cart = $("#cart-items-holder");
        let content = "";
        let totalCost = 0;
  
        for (let i = 0; i < cartArr.length; i++) {
          // lägger ihop alla produktbeställningar
          content += `<tr><td class="product">${cartArr[i].product}</td><td>`;
          if (cartArr[i].quantity !== 1) {
            content += '<button class="decrease">-</button>'; // lägg också till decrease-knappen
          }
          content += `<span>${cartArr[i].quantity}</span>
                              <button class="increase">+</button>
                          </td>
                          <td>${cartArr[i].price} kr</td>
                          <td>
                              <button class="dltBtn btn btn-danger btn-sx delete">Ta bort</button>
                          </td>
                      </tr>`;
          totalCost += cartArr[i].price; 
        }
        $("#total").text("Totalt:" + " " + totalCost + " kr"); // lägg till total-summan i HTML
        $cart.html(content);
  
        $(".decrease").click(function() {
          const $btn = $(this); 
          const product = $btn
            .parent()
            .prev()
            .text();
          const newQty = parseInt($btn.next().text()) - 1;
          const newPrice = newQty * getProductInfo(product).price;
  
          replaceProduct(cartArr, product, newQty, newPrice); 
          createCart(); 
        });
  
        $(".increase").click(function() {
          const $btn = $(this); 
          const product = $btn
            .parent()
            .prev()
            .text();
          const newQty = parseInt($btn.prev().text()) + 1;
          const newPrice = newQty * getProductInfo(product).price;
  
          replaceProduct(cartArr, product, newQty, newPrice); 
          createCart(); 
        });
  
        $(".dltBtn").click(function() {
          const targetProduct = $(this)
            .parent()
            .siblings(".product")
            .text();
  
          // tar bort produktbeställningen från localStorage
          deleteItem(cartArr, targetProduct); 
          createCart(); 
        });
      }
  
      // Kollar om en produkt redan finns i localStorage
      function duplicateExists(cartArr, targetProduct) {
        return cartArr.find(element => element.product === targetProduct); // Returnerar truthy eller falsy
      }
  
      function replaceProduct(cartArr, targetProduct, newQty, newPrice) {
        cartArr.forEach((element, index) => {
          if (element.product === targetProduct) {
            cartArr.splice(index, 1, {
              quantity: newQty,
              product: targetProduct,
              price: newPrice
            }); 
          }
        });
        // Skicka nya listan till localStorage
        localStorage.setItem("cartArr", JSON.stringify(cartArr)); 
      }
  
      function mergeProduct(cartArr, targetProduct, newQty, newPrice) {
        cartArr.forEach((element, index) => {
          if (element.product === targetProduct) {
            const qtySum = newQty + element.quantity; 
            const priceSum = newPrice + element.price; 
            cartArr.splice(index, 1, {
              quantity: qtySum,
              product: targetProduct,
              price: priceSum
            }); 
          }
        });
        localStorage.setItem("cartArr", JSON.stringify(cartArr)); 
      }
  
      function deleteItem(cartArr, targetProduct) {
        cartArr.forEach((element, index) => {
          if (element.product === targetProduct) {
            cartArr.splice(index, 1); 
          }
        });
        localStorage.setItem("cartArr", JSON.stringify(cartArr)); 
      }
  
      // Hämtar produktinfo från JSON-filen
      function getProductInfo(targetProduct) {
          return productList.find(element => element.product === targetProduct);
      }
    });
  });
  