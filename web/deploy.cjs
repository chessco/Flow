const SftpClient = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.deploy') });

async function deploy() {
    const sftp = new SftpClient();
    
    const config = {
        host: '185.212.71.206',
        port: 65002, // SSH port for Hostinger
        username: 'u471794305',
        password: 'Frida.3136'
    };

    const remotePath = 'domains/flow.pitayacode.io/public_html';
    const localPath = path.join(__dirname, 'dist');

    try {
        console.log(`🚀 Conectando a ${config.host}...`);
        await sftp.connect(config);
        console.log('✅ Conexión establecida.');

        console.log(`📂 Subiendo archivos de ${localPath} a ${remotePath}...`);
        await sftp.uploadDir(localPath, remotePath);
        
        console.log('✨ ¡Despliegue completado con éxito!');
    } catch (err) {
        console.error('❌ Error durante el despliegue:', err.message);
        process.exit(1);
    } finally {
        await sftp.end();
    }
}

deploy();
