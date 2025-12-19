async function testOrder() {
    const slug = "Sadiyaxonim";
    const orderData = {
        customer: {
            name: "Dostonbek (Test)",
            phone: "+998901234567",
            address: "Toshkent, Chilonzor"
        },
        items: [
            { product_id: "66ef838d-77d4-4a03-9e1c-6c7398a478ec", quantity: 2 }, // Buxonka
            { product_id: "a472abfb-6779-4265-b260-2744b4ebb2c9", quantity: 1 }  // Coca Cola
        ],
        notes: "Lokal test buyurtmasi"
    };

    console.log('--- Buyurtma yuborilmoqda ---');
    const response = await fetch(`http://localhost:4000/api/shop/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });

    const result = await response.json();
    console.log('Natija:', JSON.stringify(result, null, 2));
}

testOrder().catch(console.error);
