// Test d'import pour debugger le problème
console.log('=== TEST D\'IMPORT ===');

try {
  console.log('\n1. Import des modèles...');
  const models = require('./src/models');
  console.log('✅ Modèles importés:', Object.keys(models));

  console.log('\n2. Import du contrôleur sanctionConfig...');
  const controller = require('./src/api/controllers/sanctionConfigController');
  console.log('✅ Contrôleur importé');
  console.log('   Exports:', Object.keys(controller));
  console.log('   getInfractionTypes type:', typeof controller.getInfractionTypes);

  console.log('\n3. Simulation du require dans routes...');
  delete require.cache[require.resolve('./src/api/controllers/sanctionConfigController')];
  const controller2 = require('./src/api/controllers/sanctionConfigController');
  console.log('✅ Contrôleur réimporté');
  console.log('   Exports:', Object.keys(controller2));
  console.log('   getInfractionTypes type:', typeof controller2.getInfractionTypes);

  console.log('\n✅ TOUT FONCTIONNE CORRECTEMENT');
} catch (error) {
  console.error('\n❌ ERREUR:', error.message);
  console.error(error.stack);
}
