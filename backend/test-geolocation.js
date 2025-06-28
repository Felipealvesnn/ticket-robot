#!/usr/bin/env node

/**
 * Script de teste para verificar o sistema de geolocalização
 *
 * Execute: node test-geolocation.js
 */

// Usando fetch nativo do Node.js 18+
const API_BASE_URL = 'http://localhost:3000';

// Coordenadas de teste de diferentes cidades
const testLocations = {
  sao_paulo: {
    name: 'São Paulo, SP',
    latitude: -23.5505,
    longitude: -46.6333,
    accuracy: 10.5,
  },
  rio_de_janeiro: {
    name: 'Rio de Janeiro, RJ',
    latitude: -22.9068,
    longitude: -43.1729,
    accuracy: 15.2,
  },
  belo_horizonte: {
    name: 'Belo Horizonte, MG',
    latitude: -19.9191,
    longitude: -43.9386,
    accuracy: 8.7,
  },
  brasilia: {
    name: 'Brasília, DF',
    latitude: -15.7942,
    longitude: -47.8821,
    accuracy: 12.1,
  },
};

async function testLogin(location, withCoordinates = true) {
  const loginData = {
    email: 'admin@ticketrobot.com',
    password: '123456',
    ...(withCoordinates && {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    }),
  };

  try {
    console.log(
      `\n🧪 Testando login ${withCoordinates ? 'COM' : 'SEM'} coordenadas...`,
    );
    if (withCoordinates) {
      console.log(`📍 Localização: ${location.name}`);
      console.log(`   Latitude: ${location.latitude}`);
      console.log(`   Longitude: ${location.longitude}`);
      console.log(`   Precisão: ${location.accuracy}m`);
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }));
      throw new Error(
        `HTTP ${response.status}: ${errorData.message || response.statusText}`,
      );
    }

    const result = await response.json();

    console.log('✅ Login realizado com sucesso!');
    console.log('📱 Informações do dispositivo:');
    console.log(`   Nome: ${result.deviceInfo?.deviceName || 'N/A'}`);
    console.log(`   Tipo: ${result.deviceInfo?.deviceType || 'N/A'}`);
    console.log(`   SO: ${result.deviceInfo?.operatingSystem || 'N/A'}`);
    console.log(`   Navegador: ${result.deviceInfo?.browser || 'N/A'}`);

    if (result.deviceInfo?.country) {
      console.log(
        `🌍 Localização: ${result.deviceInfo.city || 'N/A'}, ${result.deviceInfo.country || 'N/A'}`,
      );
    }

    if (result.deviceInfo?.latitude && result.deviceInfo?.longitude) {
      console.log('🎯 Coordenadas GPS:');
      console.log(`   Latitude: ${result.deviceInfo.latitude}`);
      console.log(`   Longitude: ${result.deviceInfo.longitude}`);
      console.log(`   Precisão: ${result.deviceInfo.accuracy || 'N/A'}m`);
    } else {
      console.log('📍 Coordenadas GPS: Não fornecidas');
    }

    return result;
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    return null;
  }
}

async function testAllLocations() {
  console.log('🚀 Iniciando testes do sistema de geolocalização...\n');
  console.log('📊 Testando em diferentes cidades brasileiras');
  console.log('=' * 60);

  // Teste sem coordenadas
  await testLogin(testLocations.sao_paulo, false);

  // Teste com coordenadas de diferentes cidades
  for (const [key, location] of Object.entries(testLocations)) {
    await testLogin(location, true);

    // Pausa entre requisições
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n✨ Testes concluídos!');
  console.log('\n💡 Para verificar os dados salvos no banco:');
  console.log(
    '   SELECT deviceName, country, city, latitude, longitude, accuracy, createdAt FROM sessions ORDER BY createdAt DESC;',
  );
}

// Verificar se o servidor está rodando
async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    try {
      // Tentar endpoint alternativo
      const response = await fetch(`${API_BASE_URL}`);
      return response.ok;
    } catch (error2) {
      return false;
    }
  }
}

async function main() {
  console.log('🔍 Verificando se o servidor está rodando...');

  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.error('❌ Servidor não está rodando em ' + API_BASE_URL);
    console.log('💡 Execute: npm run start:dev');
    process.exit(1);
  }

  console.log('✅ Servidor está rodando!');

  await testAllLocations();
}

// Executar testes
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testLogin, testLocations };
