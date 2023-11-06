const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const Pino = require('pino');
const { handleOrderMessage } = require('./function/orderBang.js');

const allowedGroupsFile = 'allowedGroups.json';

function getAllowedGroups() {
    try {
        const data = fs.readFileSync(allowedGroupsFile);
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveAllowedGroups(groups) {
    fs.writeFileSync(allowedGroupsFile, JSON.stringify(groups, null, 2));
}

async function connectToWhatsapp() {
    const auth = await useMultiFileAuthState('auth');
    const socket = makeWASocket({
        printQRInTerminal: true,
        browser: ['MamangSomay', 'Firefox', '1.0.0'],
        auth: auth.state,
        logger: Pino({ level: 'silent' })
    });

    socket.ev.on('creds.update', auth.saveCreds);
    socket.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') {
            console.log('Koneksi Terbuka');
        }
        if (connection === 'close') {
            connectToWhatsapp();
        }
    });


socket.ev.on('messages.upsert', async (m) => {
    if (m.messages && m.messages[0] && m.messages[0].message && !m.messages[0].key.fromMe) {
        const remoteJid = m.messages[0].key.remoteJid;
        console.log('Pesan masuk dari ID Grup:', remoteJid); // Log pesan dari ID grup

        if (m.messages[0].message.conversation.startsWith('.add')) {
            const words = m.messages[0].message.conversation.split(' ');
                if (words.length === 2) {
                    const newGroup = words[1];
                    const allowedGroups = getAllowedGroups();

                    if (!allowedGroups.includes(newGroup)) {
                        allowedGroups.push(newGroup);
                        saveAllowedGroups(allowedGroups);
                        await socket.sendMessage(remoteJid, { text: `Grup ${newGroup} telah ditambahkan ke daftar yang diizinkan.` });
                    } 
                }
        }

        if (m.messages[0].message.conversation === '!info') {
            const allowedGroups = getAllowedGroups();
            console.log('Grup yang Diizinkan:', allowedGroups); // Log ID grup yang diizinkan

            if (allowedGroups.includes(remoteJid)) {
                const quotedMessage = m.messages[0];
                const message = {
                    text: 'Halo saya sugus',
                    quoted: quotedMessage
                };
                await socket.sendMessage(remoteJid, message, { quoted: quotedMessage });
                console.log('Pesan balasan terkirim.');
            }
        }
        if (m.messages[0].message.conversation === '!bot') {
            const quotedMessage = m.messages[0];
            const message = `Sugus | 6289644795125@s.whatsapp.net | ID Grup yang sekarang : ${remoteJid}`;
            await socket.sendMessage(remoteJid, { text: message }, { quoted: quotedMessage });
            console.log('Pesan balasan terkirim ke grup yang memanggil perintah !bot.');
        }

        const message = m.messages[0].message.conversation;

        handleOrderMessage(socket, remoteJid, message);

    }
});

}

connectToWhatsapp().catch((err) => {
    console.error('Error in WhatsApp connection:', err);
});