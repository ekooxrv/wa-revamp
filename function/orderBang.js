const axios = require('axios');
const crypto = require('crypto');

const apiKey = '041d6f82-c3f9-5100-9012-0671ce41f998'; // Ganti dengan API Key Anda
const username = 'gefuloDRXEEg'; // Ganti dengan nama pengguna Anda

function getCurrentDate() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    return formattedDate;
}

function getCurrentTime() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString();
    return formattedTime;
}

function handleOrderMessage(socket, remoteJid, message) {
    if (message.startsWith('!order')) {
        const words = message.split(' ');
        if (words.length >= 3) {
            const buyerSkuCode = words[1];
            const nomorBuyer = words.slice(2).join(' ');
            const reffId = 'RVN' + (Math.floor(1000 + Math.random() * 9000)).toString();
            const signData = username + apiKey + reffId;
            const sign = crypto.createHash('md5').update(signData).digest('hex');
            console.log(sign);

            const requestData = {
                username: username,
                buyer_sku_code: buyerSkuCode,
                customer_no: nomorBuyer,
                ref_id: reffId,
                sign: sign,
            };

            axios
                .post('https://api.digiflazz.com/v1/transaction', requestData)
                .then((response) => {
                    console.log('Response Data:', response.data);

                    // Get the current date and time
                    const currentDate = getCurrentDate();
                    const currentTime = getCurrentTime();

                    // Replace placeholders in the success message with actual values
                    let successMessage = `「Detail Order」\nTanggal: ${currentDate}\nWaktu: ${currentTime}\n====================\n\nTrxID : ${reffId}\nNo/Id : ${nomorBuyer}\nProduk: ${buyerSkuCode}\nStatus : 𝗦𝗨𝗞𝗦𝗘𝗦\n\n\n\nAH AH AH\n🍆🍑😩👉👌💦`;

                    console.log(successMessage);

                    socket.sendMessage(remoteJid, { text: successMessage });
                })
                .catch((error) => {
                    if (error.response && error.response.data && error.response.data.data && error.response.data.data.message) {
                        console.error('Error:', error.response.data.data.message);
                        socket.sendMessage(remoteJid, { text: error.response.data.data.message });
                    } else {
                        console.error('Error:', error.message);
                        socket.sendMessage(remoteJid, { text: 'Terjadi kesalahan saat melakukan pesanan.' });
                    }
                });
        } else {
            socket.sendMessage(remoteJid, { text: 'Format !order tidak valid. Gunakan: !order buyerskucode nomorbuyer' });
        }
    }
}

module.exports = { handleOrderMessage };
