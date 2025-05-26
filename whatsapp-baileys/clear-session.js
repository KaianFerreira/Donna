#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Script de Limpeza de Sessão WhatsApp');
console.log('=====================================');

const authPath = path.join(__dirname, 'auth_info_baileys');

try {
    if (fs.existsSync(authPath)) {
        console.log('📁 Encontrada pasta de autenticação:', authPath);
        
        // Listar arquivos antes de deletar
        const files = fs.readdirSync(authPath);
        console.log('📄 Arquivos encontrados:', files.length);
        files.forEach(file => console.log(`   - ${file}`));
        
        // Deletar pasta
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('✅ Sessão de autenticação removida com sucesso!');
        console.log('');
        console.log('📱 Próximos passos:');
        console.log('   1. Reinicie o servidor: npm start ou node server.js');
        console.log('   2. Escaneie o QR Code novamente');
        console.log('   3. O WhatsApp será reconectado com sessão limpa');
        
    } else {
        console.log('ℹ️  Pasta de autenticação não encontrada');
        console.log('   Isso significa que não há sessão para limpar');
    }
    
} catch (error) {
    console.error('❌ Erro ao limpar sessão:', error.message);
    console.log('');
    console.log('💡 Solução manual:');
    console.log(`   rm -rf ${authPath}`);
    process.exit(1);
}

console.log('');
console.log('🔧 Outros comandos úteis:');
console.log('   • Diagnóstico: curl http://localhost:3000/debug/connection');
console.log('   • Limpar via API: curl -X POST http://localhost:3000/debug/clear-session');
console.log('   • Reconectar: curl -X POST http://localhost:3000/debug/reconnect'); 