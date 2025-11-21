const fs = require('fs').promises;
const path = require('path');

/**
 * Valide le code d'un module pour des raisons de sécurité
 */
const validateModuleCode = async (moduleId) => {
  const modulePath = path.join(__dirname, '../modules/custom', moduleId, 'index.js');
  
  try {
    const content = await fs.readFile(modulePath, 'utf-8');
    
    // Vérifications de sécurité basiques
    const dangerousPatterns = [
      { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/, name: 'child_process' },
      { pattern: /require\s*\(\s*['"]fs['"]\s*\)/, name: 'fs (accès fichiers)' },
      { pattern: /eval\s*\(/, name: 'eval()' },
      { pattern: /Function\s*\(/, name: 'Function()' },
      { pattern: /process\.exit/, name: 'process.exit' },
      { pattern: /process\.kill/, name: 'process.kill' },
      { pattern: /require\s*\(\s*['"]net['"]\s*\)/, name: 'net (connexions réseau)' },
      { pattern: /require\s*\(\s*['"]http['"]\s*\)/, name: 'http' },
      { pattern: /require\s*\(\s*['"]https['"]\s*\)/, name: 'https' },
    ];
    
    const violations = [];
    
    for (const { pattern, name } of dangerousPatterns) {
      if (pattern.test(content)) {
        violations.push(name);
      }
    }
    
    if (violations.length > 0) {
      throw new Error(`Code dangereux détecté : ${violations.join(', ')}`);
    }
    
    // Vérifier la syntaxe JavaScript
    try {
      new Function(content);
    } catch (syntaxError) {
      throw new Error(`Erreur de syntaxe JavaScript : ${syntaxError.message}`);
    }
    
    console.log(`[ModuleValidator] Module ${moduleId} validé avec succès`);
    return true;
  } catch (error) {
    console.error(`[ModuleValidator] Erreur validation module ${moduleId}:`, error);
    throw error;
  }
};

/**
 * Valide la structure d'un module chargé
 */
const validateModuleStructure = (moduleCode) => {
  const errors = [];
  
  // Vérifications obligatoires
  if (!moduleCode.name || typeof moduleCode.name !== 'string') {
    errors.push('Propriété "name" manquante ou invalide');
  }
  
  if (!moduleCode.version || typeof moduleCode.version !== 'string') {
    errors.push('Propriété "version" manquante ou invalide');
  }
  
  // Vérifications optionnelles mais recommandées
  if (moduleCode.commands && !Array.isArray(moduleCode.commands)) {
    errors.push('Propriété "commands" doit être un tableau');
  }
  
  if (moduleCode.events && typeof moduleCode.events !== 'object') {
    errors.push('Propriété "events" doit être un objet');
  }
  
  // Valider chaque commande
  if (moduleCode.commands) {
    moduleCode.commands.forEach((cmd, index) => {
      if (!cmd.data || !cmd.data.name) {
        errors.push(`Commande ${index} : propriété "data.name" manquante`);
      }
      if (!cmd.execute || typeof cmd.execute !== 'function') {
        errors.push(`Commande ${index} : méthode "execute" manquante ou invalide`);
      }
    });
  }
  
  if (errors.length > 0) {
    throw new Error(`Structure du module invalide :\n- ${errors.join('\n- ')}`);
  }
  
  return true;
};

module.exports = {
  validateModuleCode,
  validateModuleStructure,
};
