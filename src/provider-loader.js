// src/provider-loader.js
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Validate that a provider object implements the RuleProvider interface
 * @param {any} provider - Provider object to validate
 * @param {string} source - Source description for error messages
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateProvider(provider, source = 'provider') {
  if (!provider || typeof provider !== 'object') {
    throw new Error(`${source}: Provider must be an object`);
  }

  if (typeof provider.id !== 'string' || !provider.id.trim()) {
    throw new Error(`${source}: Provider must have a non-empty string 'id' property`);
  }

  if (typeof provider.init !== 'function') {
    throw new Error(`${source}: Provider must have an 'init' method`);
  }

  if (typeof provider.handle !== 'function') {
    throw new Error(`${source}: Provider must have a 'handle' method`);
  }

  if (typeof provider.finish !== 'function') {
    throw new Error(`${source}: Provider must have a 'finish' method`);
  }

  return true;
}

/**
 * Load a custom provider from a file path
 * @param {string} providerPath - Path to the provider file
 * @returns {Promise<import("./types.js").RuleProvider>} Loaded provider instance
 */
export async function loadCustomProvider(providerPath) {
  try {
    // Resolve the absolute path
    const absolutePath = path.resolve(providerPath);
    
    // Check if file exists
    await fs.access(absolutePath, fs.constants.F_OK);

    // Convert to file URL for dynamic import
    const fileUrl = pathToFileURL(absolutePath).href;
    
    // Dynamically import the module
    const module = await import(fileUrl);
    
    let ProviderClass;
    
    // Try to find the provider class in different export patterns
    if (module.default && typeof module.default === 'function') {
      // Default export is a class
      ProviderClass = module.default;
    } else if (module.default && typeof module.default === 'object') {
      // Default export is an instance
      validateProvider(module.default, providerPath);
      return module.default;
    } else {
      // Look for named exports that look like provider classes
      const exports = Object.keys(module).filter(key => key !== 'default');
      const providerExports = exports.filter(key => {
        const value = module[key];
        return typeof value === 'function' && 
               (key.includes('Provider') || key.includes('provider'));
      });
      
      if (providerExports.length === 0) {
        throw new Error(`No provider class found in ${providerPath}. Expected a class named *Provider or default export.`);
      }
      
      if (providerExports.length > 1) {
        throw new Error(`Multiple provider classes found in ${providerPath}: ${providerExports.join(', ')}. Please export only one provider class or use default export.`);
      }
      
      ProviderClass = module[providerExports[0]];
    }

    // Create instance of the provider class
    const provider = new ProviderClass();
    
    // Validate the provider instance
    validateProvider(provider, providerPath);
    
    return provider;
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Provider file not found: ${providerPath}`);
    } else if (error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(`Failed to load provider from ${providerPath}: Module not found or invalid ES module`);
    } else {
      throw new Error(`Failed to load provider from ${providerPath}: ${error.message}`);
    }
  }
}

/**
 * Get all built-in providers
 * @returns {Promise<import("./types.js").RuleProvider[]>} Array of built-in provider instances
 */
export async function getBuiltinProviders() {
  const { CursorProvider } = await import("./providers/cursor.js");
  const { ClineProvider } = await import("./providers/cline.js");
  const { ClaudeProvider } = await import("./providers/claude.js");

  return [
    new CursorProvider(),
    new ClineProvider(),
    new ClaudeProvider(),
  ];
}

/**
 * Filter built-in providers by ID
 * @param {import("./types.js").RuleProvider[]} providers - Array of providers
 * @param {string[]} ids - Array of provider IDs to include
 * @returns {import("./types.js").RuleProvider[]} Filtered providers
 */
export function filterProvidersByIds(providers, ids) {
  const filtered = [];
  const availableIds = providers.map(p => p.id);
  
  for (const id of ids) {
    const provider = providers.find(p => p.id === id);
    if (provider) {
      filtered.push(provider);
    } else {
      throw new Error(`Unknown provider ID: ${id}. Available providers: ${availableIds.join(', ')}`);
    }
  }
  
  return filtered;
}

/**
 * Load and prepare all providers based on CLI options
 * @param {import("./cli.js").CLIOptions} options - CLI options
 * @returns {Promise<import("./types.js").RuleProvider[]>} Array of provider instances to use
 */
export async function loadProviders(options) {
  const providers = [];
  
  // Load built-in providers (unless --no-builtin which sets builtin to false)
  if (options.builtin !== false) {
    const builtinProviders = await getBuiltinProviders();
    
    // Filter by specific provider IDs if specified
    if (options.providers && options.providers.length > 0) {
      const filtered = filterProvidersByIds(builtinProviders, options.providers);
      providers.push(...filtered);
    } else {
      providers.push(...builtinProviders);
    }
  }
  
  // Load custom providers
  if (options.provider && options.provider.length > 0) {
    for (const providerPath of options.provider) {
      try {
        const customProvider = await loadCustomProvider(providerPath);
        
        // Check for ID conflicts
        const existingIds = providers.map(p => p.id);
        if (existingIds.includes(customProvider.id)) {
          throw new Error(`Provider ID conflict: '${customProvider.id}' is already used by another provider`);
        }
        
        providers.push(customProvider);
      } catch (error) {
        throw new Error(`Failed to load custom provider '${providerPath}': ${error.message}`);
      }
    }
  }
  
  if (providers.length === 0) {
    throw new Error('No providers specified. Use built-in providers or provide custom providers with --provider.');
  }
  
  return providers;
}

/**
 * Validate a provider file without loading it into the main execution
 * @param {string} providerPath - Path to the provider file to validate
 * @returns {Promise<void>}
 */
export async function validateProviderFile(providerPath) {
  try {
    const provider = await loadCustomProvider(providerPath);
    console.log(`✅ Provider validation successful:`);
    console.log(`   File: ${providerPath}`);
    console.log(`   ID: ${provider.id}`);
    console.log(`   Class: ${provider.constructor.name}`);
    
    // Test that required methods are callable (but don't actually call them)
    const methods = ['init', 'handle', 'finish'];
    for (const method of methods) {
      if (typeof provider[method] !== 'function') {
        throw new Error(`Method '${method}' is not a function`);
      }
    }
    
    console.log(`   Methods: ${methods.join(', ')} ✓`);
    
  } catch (error) {
    console.error(`❌ Provider validation failed:`);
    console.error(`   File: ${providerPath}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}