
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'pitaya_default_encryption_key_32';
const algorithm = 'aes-256-ctr';
const secretKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

function decrypt(text) {
    if (!text) return '';
    try {
        const [iv, content] = text.split(':');
        if (!content) return text;
        const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        return text;
    }
}

async function testDownload() {
    const acc = await prisma.whatsAppAccount.findFirst();
    if (!acc) return console.log('No account');

    const token = decrypt(acc.accessToken);
    const mediaId = '1622460345585063'; // From diagnostic

    console.log(`Testing Media ID: ${mediaId}`);

    try {
        const infoUrl = `https://graph.facebook.com/v20.0/${mediaId}`;
        console.log(`1. Fetching URL: ${infoUrl}`);
        const infoRes = await axios.get(infoUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const downloadUrl = infoRes.data.url;
        console.log(`2. Got Download URL: ${downloadUrl}`);

        console.log('3. Fetching Binary with Header...');
        try {
            const binRes = await axios.get(downloadUrl, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer'
            });
            console.log(`Success! Buffer length: ${binRes.data.byteLength}, Type: ${binRes.headers['content-type']}`);
        } catch (e) {
            console.log(`Binary Download FAILED with header: ${e.message}`);
            if (e.response) console.log(`Status: ${e.response.status}, Data: ${e.response.data.toString()}`);

            console.log('4. Retrying BINARY WITHOUT Header...');
            try {
                const binRes2 = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer'
                });
                console.log(`Success without header! Buffer length: ${binRes2.data.byteLength}, Type: ${binRes2.headers['content-type']}`);
            } catch (e2) {
                console.log(`Binary Download FAILED without header too: ${e2.message}`);
            }
        }

    } catch (e) {
        console.log(`General Failure: ${e.message}`);
        if (e.response) console.log(`Status: ${e.response.status}, Data: ${JSON.stringify(e.response.data)}`);
    }
}

testDownload().finally(() => prisma.$disconnect());
