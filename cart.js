// Function to create star rating
function createStar(ratings) {
    const starContainer = document.createElement('h3');
    ratings = Math.min(ratings, 5);
    for (let i = 0; i < ratings; i++) {
        const starSpan = document.createElement('span');
        starSpan.textContent = "⭐";
        starContainer.appendChild(starSpan);
    }
    return starContainer;
}

async function myCart() {
    const email = localStorage.getItem('loggedInUserEmail');
    console.log(email);
    try {
        const response = await fetch(`http://localhost:5000/search-book/?email=${email}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch cart items");
        }

        const data = await response.json();
        if (data.success) {
            const userCart = document.getElementById('my-cart');
            userCart.innerHTML = "";
            data.data.forEach(card => {
                if (card) {
                    const div = document.createElement('div');
                    div.classList.add('card');

                    div.innerHTML = `
                        <img src=${card.imageUrl}>
                        <h4>${card.title}</h4>
                        <p>${card.writer}</p>
                        <p>${card.details}</p>
                        <h3></h3>
                        <h3>₹ ${card.price}</h3>
                        <button data-card-id=${card.id}>Remove</button>

                    `;
                    const starContainer = div.querySelector('h3');
                    starContainer.appendChild(createStar(card.ratings));

                    userCart.appendChild(div);

                }
            });
        } else {
            alert("Failed to fetch cart items");
        }
        addEventListeners();
    } catch (error) {
        console.error('Internal server error:', error.message);
        alert("Internal server error");
    }
}

// Function to add event listeners to buttons
function addEventListeners() {
    document.querySelectorAll('.card button').forEach(button => {
        button.addEventListener('click', function () {
            const cardId = this.dataset.cardId;
            const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
            deleteCart(cardId, loggedInUserEmail);
        });
    });
}

async function deleteCart(cardId, email) {
    try {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            iconColor: "red",
            confirmButtonColor: "#05fb4b",
            cancelButtonColor: "red",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            const response = await fetch("http://localhost:5000/delete-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ card_Id: cardId, email: email }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete from cart");
            }

            const data = await response.json();

            await Swal.fire({
                title: "Deleted!",
                text: "Your file has been deleted.",
                icon: "success",
                iconColor: "#05fb4b",
                confirmButtonColor: "#05fb4b",
            });

            // Redirect after successful deletion
            window.location.href = 'http://127.0.0.1:3000/Frontend/Components/cart.html';
        }
    } catch (error) {
        console.error('Error deleting:', error);
        await Swal.fire({
            title: "Error",
            text: "Failed to delete the file.",
            icon: "error",
            iconColor: "red",
        });
    }
}


myCart();
