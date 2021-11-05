let links = ["img/banner-1.jpg", "img/banner-2.jpg", "img/banner-3.jpg"];
let index = 0;
let element = document.getElementById('img');

function slide(v) {

    index = index + 1 * v;
    if (index > links.length - 1) {
        index = 0;
    } else if (index < 0) {
        index = links.length - 1;
    }
    element.src = links[index];
}




const API = 'https://raw.githubusercontent.com/MarinaMnishek/testJSON/master';

class List {
    constructor(url, container, list = list2) {
        this.container = container;
        this.list = list;
        this.url = url;
        this.goods = [];
        this.allProducts = [];
        this._init();
    }
    getJson(url) {
        return fetch(url ? url : `${API + this.url}`)

            .then(result => result.json())
            .catch(error => {
                console.log(error);
            })
    }
    handleData(data) {
        this.goods = [...data];
        this.render();
    }
    calcSum() {
        return this.allProducts.reduce((accum, item) => accum += item.price, 0);
    }
    render() {
        const block = document.querySelector(this.container);
        for (let product of this.goods) {
            const productObj = new this.list[this.constructor.name](product);//делаем объект товара либо CartItem, либо ProductItem
            this.allProducts.push(productObj);
            block.insertAdjacentHTML('beforeend', productObj.render());
        }
    }
    filter(value) {
        const regexp = new RegExp(value, 'i');
        this.filtered = this.allProducts.filter(product => regexp.test(product.product_name));
        this.allProducts.forEach(el => {
            const block = document.querySelector(`.product-item[data-id="${el.id_product}"]`);
            if (!this.filtered.includes(el)) {
                block.classList.add('invisible');
            } else {
                block.classList.remove('invisible');
            }
        })
    }
    _init() {
        return false
    }
}

class Item {
    constructor(el) {
        this.product_name = el.product_name;
        this.price = el.price;
        this.id_product = el.id_product;
        this.img = el.img;
        this.category = el.category
    }
    render() {

        return `<div class="product-item" data-id="${this.id_product}">
        <img src="${this.img}" alt="product" class="product-item-img">
        <div class="product-item-info">
            <h3 class="product-item-name"><a href="#">${this.product_name}<a></h3>
            <h4 class="product-item-category"><a href="#">${this.category}<a></h4>
            <p class="product-item-price">${this.price}&#8381;</p>
            <button class="buy-btn"
            data-src="${this.img}"
            data-id="${this.id_product}"
            data-name="${this.product_name}"
            data-price="${this.price}">Добавить в корзину</button>
        </div>
    </div>`
    }
}

class ProductsList extends List {
    constructor(cart, container = '.products', url = "/catalogData.json") {

        super(url, container);
        this.cart = cart;
        this.getJson()
            .then(data => this.handleData(data));
    }
    _init() {
        document.querySelector(this.container).addEventListener('click', e => {
            if (e.target.classList.contains('buy-btn')) {
                this.cart.addProduct(e.target);
            }
        });
        document.querySelector('.search').addEventListener('change', e => {
            e.preventDefault();
            this.filter(document.querySelector('.search').value)
        })

    }
}


class ProductItem extends Item { }



class Cart extends List {
    constructor(container = ".cart-block", url = "/getBasketEmpty.json") {
        super(url, container);
        this.getJson()
            .then(data => {
                this.handleData(data.contents);
            });
    }
    addProduct(element) {
        this.getJson(`${API}/addToBasket.json`)

            .then(data => {
                if (data.result === 1) {
                    let productId = +element.dataset['id'];
                    let find = this.allProducts.find(product => product.id_product === productId);
                    if (find) {
                        find.quantity++;
                        this._updateCart(find);
                    } else {
                        let product = {
                            id_product: productId,
                            price: element.dataset['price'],
                            product_name: element.dataset['name'],
                            quantity: 1,
                            product_src: element.dataset['src']
                        };
                        this.goods = [product];
                        this.render();
                    }
                } else {
                    alert('Error');
                }
            })
    }
    removeProduct(element) {
        this.getJson(`${API}/deleteFromBasket.json`)
            .then(data => {
                if (data.result === 1) {
                    let productId = +element.dataset['id'];
                    let find = this.allProducts.find(product => product.id_product === productId);
                    if (find.quantity > 1) {
                        find.quantity--;
                        this._updateCart(find);
                    } else {
                        this.allProducts.splice(this.allProducts.indexOf(find), 1);
                        document.querySelector(`.cart-item[data-id="${productId}"]`).remove();
                    }
                } else {
                    alert('Error');
                }
            })
    }
    _updateCart(product) {
        let block = document.querySelector(`.cart-item[data-id="${product.id_product}"]`);
        block.querySelector('.cart-item-quantity').textContent = `Количество: ${product.quantity}`;
        block.querySelector('.cart-item-price').textContent = `${product.quantity * product.price}`;
    }
    _init() {
        document.querySelector('.btn-cart').addEventListener('click', () => {
            document.querySelector(this.container).classList.toggle('invisible');
        });
        document.querySelector(this.container).addEventListener('click', e => {
            if (e.target.classList.contains('del-btn')) {
                this.removeProduct(e.target);
            }
        })
    }

}

class CartItem extends Item {

    constructor(el) {
        super(el);
        this.quantity = el.quantity;
        this.img = el.product_src;
        this.price = el.price.replace(/\s/g, '');
    }
    render() {
        return `<div class="cart-item" data-id="${this.id_product}">
            <div class="cart-item-product">
            <img src="${this.img}" alt="IMAGE"">
            <div class="cart-item-info">
            <p class="cart-item-title"><a href="#">${this.product_name}<a></p>
            <p class="cart-item-quantity">Количество: ${this.quantity}</p>
        <p class="cart-item-single-price">${this.price}&#8381; </p>
        </div>
        </div>
        <div class="cart-item-right">
            <p class="cart-item-price">${this.quantity * this.price}&#8381;</p>
            <button class="del-btn" data-id="${this.id_product}">&times;</button>
        </div>
        </div>`

    }
}



const list2 = {
    ProductsList: ProductItem,
    Cart: CartItem
};


let cart = new Cart();
let products = new ProductsList(cart);





