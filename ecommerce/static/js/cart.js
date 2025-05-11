var updateBtns = document.getElementsByClassName('update-cart');

for (var i = 0; i < updateBtns.length; i++) {
    updateBtns[i].addEventListener('click', function() {
        var productId = this.dataset.product;
        var action = this.dataset.action;

        console.log('productId:', productId, 'Action:', action);

        fetch('/update_item/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                'productId': productId,
                'action': action
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Data:', data);
            updateCartDisplay(productId, action, data); // Call function to update display
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating the cart.');
        });
    });
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var parts = document.cookie.split(';');
        for (var i = 0; i < parts.length; i++) {
            var cookie = parts[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


function updateCartDisplay(productId, action, data) {
    var quantityElement = document.querySelector(`.quantity[data-product="${productId}"]`);
    var totalElement = document.querySelector(`.total[data-product="${productId}"]`);
    var cartItemsElement = document.querySelector(`.cart-items`); //select the element displaying the total cart items
    var cartTotalElement = document.querySelector(`.cart-total`);  //element displaying the cart total


    if (quantityElement) {
        if (action === 'add') {
            quantityElement.textContent = 'x' + data.quantity;
        } else if (action === 'remove') {
             if(data.quantity > 0){
                 quantityElement.textContent = 'x' + data.quantity;
             }
             else{
                quantityElement.parentElement.parentElement.remove();
             }
        }
    }

    if (totalElement) {
        totalElement.textContent = 'Ksh ' + data.total_price;
    }
    if(cartItemsElement){
        cartItemsElement.textContent = data.cart_items;
    }

    if(cartTotalElement){
        cartTotalElement.textContent = 'Ksh' + data.cart_total;
    }
}
