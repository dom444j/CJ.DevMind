import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * Database Agent - Diseña y genera esquemas de base de datos
 * 
 * Este agente es responsable de:
 * 1. Diseñar esquemas de base de datos basados en requisitos
 * 2. Generar modelos para ORM (Mongoose, Sequelize, Prisma)
 * 3. Crear migraciones y seeds para inicializar la base de datos
 * 4. Optimizar consultas y estructura para rendimiento
 * 5. Implementar relaciones y validaciones de datos
 */
export class DatabaseAgent extends BaseAgent {
  constructor() {
    super('Database Agent');
  }
  
  /**
   * Ejecuta el Database Agent para diseñar y generar esquemas de base de datos
   * @param dbSpec Especificación de la base de datos a crear
   */
  async run(dbSpec: string): Promise<void> {
    console.log(`🗄️ Database Agent diseñando base de datos para: "${dbSpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    
    // Determinar el tipo de base de datos (SQL o NoSQL)
    const dbType = this.determineDbType(dbSpec);
    
    // Crear prompt para el LLM
    const dbPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de Database Agent
    Actúa como el Database Agent de CJ.DevMind. Tu tarea es diseñar y generar esquemas de base de datos basados en la siguiente especificación:
    
    "${dbSpec}"
    
    Tipo de base de datos: ${dbType}
    
    Genera:
    1. Diseño de esquema de base de datos (tablas/colecciones, campos, tipos, relaciones)
    2. Modelos para ${dbType === 'SQL' ? 'Sequelize' : 'Mongoose'}
    3. Migraciones para inicializar la base de datos
    4. Seeds con datos de ejemplo
    5. Consultas optimizadas para operaciones comunes
    
    La base de datos debe seguir las mejores prácticas, incluir índices adecuados, y tener un diseño normalizado (para SQL) o desnormalizado (para NoSQL) según corresponda.
    `;
    
    // En modo real, consultaríamos al LLM
    let dbDesign, modelsCode, migrationsCode, seedsCode, queriesCode;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        const result = await this.queryLLM(dbPrompt);
        
        // Extraer las diferentes partes de la respuesta
        dbDesign = this.extractSection(result, 'Diseño de Base de Datos');
        modelsCode = this.extractCodeBlock(result, 'models');
        migrationsCode = this.extractCodeBlock(result, 'migrations');
        seedsCode = this.extractCodeBlock(result, 'seeds');
        queriesCode = this.extractCodeBlock(result, 'queries');
        
        // Guardar los archivos generados
        this.saveDbFiles(dbSpec, dbType, dbDesign, modelsCode, migrationsCode, seedsCode, queriesCode);
      } catch (error) {
        console.error('❌ Error generando esquema de base de datos:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Generar archivos simulados
      dbDesign = this.generateSimulatedDbDesign(dbSpec, dbType);
      modelsCode = this.generateSimulatedModels(dbType);
      migrationsCode = this.generateSimulatedMigrations(dbType);
      seedsCode = this.generateSimulatedSeeds(dbType);
      queriesCode = this.generateSimulatedQueries(dbType);
      
      // Guardar los archivos simulados
      this.saveDbFiles(dbSpec, dbType, dbDesign, modelsCode, migrationsCode, seedsCode, queriesCode);
    }
    
    // Mostrar resultado
    console.log('\n✅ Base de datos generada con éxito:');
    console.log('- db-design.md');
    console.log('- models/');
    console.log('- migrations/');
    console.log('- seeds/');
    console.log('- queries.js');
  }
  
  /**
   * Determina el tipo de base de datos basado en la especificación
   */
  private determineDbType(dbSpec: string): 'SQL' | 'NoSQL' {
    const sqlKeywords = ['relacional', 'sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'foreign key', 'join'];
    const noSqlKeywords = ['nosql', 'mongodb', 'mongo', 'documento', 'document', 'collection', 'colección', 'firebase'];
    
    const lowerSpec = dbSpec.toLowerCase();
    
    // Contar ocurrencias de palabras clave
    const sqlCount = sqlKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const noSqlCount = noSqlKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    
    // Determinar el tipo basado en la mayor cantidad de palabras clave
    return sqlCount > noSqlCount ? 'SQL' : 'NoSQL';
  }
  
  /**
   * Extrae una sección específica de la respuesta del LLM
   */
  private extractSection(text: string, sectionTitle: string): string {
    const regex = new RegExp(`## ${sectionTitle}([\\s\\S]*?)(?:## |$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
  
  /**
   * Extrae bloques de código de la respuesta del LLM
   */
  private extractCodeBlock(text: string, type: string): string {
    const regex = /```(?:js|javascript|typescript|ts)([^`]+)```/g;
    const matches = [...text.matchAll(regex)];
    
    // Buscar el bloque que corresponde al tipo
    for (const match of matches) {
      const code = match[1].trim();
      if (code.includes(type) || code.includes(type.replace('s', ''))) {
        return code;
      }
    }
    
    // Si no se encuentra un bloque específico, devolver el primero
    return matches.length > 0 ? matches[0][1].trim() : '';
  }
  
  /**
   * Guarda los archivos de la base de datos
   */
  private saveDbFiles(
    dbSpec: string,
    dbType: 'SQL' | 'NoSQL',
    dbDesign: string,
    modelsCode: string,
    migrationsCode: string,
    seedsCode: string,
    queriesCode: string
  ): void {
    // Crear directorios si no existen
    const dbDir = path.join(process.cwd(), 'database');
    const modelsDir = path.join(dbDir, 'models');
    const migrationsDir = path.join(dbDir, 'migrations');
    const seedsDir = path.join(dbDir, 'seeds');
    
    [dbDir, modelsDir, migrationsDir, seedsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Guardar archivos
    fs.writeFileSync(path.join(dbDir, 'db-design.md'), dbDesign, 'utf-8');
    
    if (dbType === 'SQL') {
      fs.writeFileSync(path.join(modelsDir, 'User.js'), modelsCode, 'utf-8');
      fs.writeFileSync(path.join(migrationsDir, '20230101000000-create-users.js'), migrationsCode, 'utf-8');
      fs.writeFileSync(path.join(seedsDir, '20230101000001-demo-users.js'), seedsCode, 'utf-8');
    } else {
      fs.writeFileSync(path.join(modelsDir, 'userModel.js'), modelsCode, 'utf-8');
      fs.writeFileSync(path.join(dbDir, 'db.js'), migrationsCode, 'utf-8');
      fs.writeFileSync(path.join(seedsDir, 'userSeeder.js'), seedsCode, 'utf-8');
    }
    
    fs.writeFileSync(path.join(dbDir, 'queries.js'), queriesCode, 'utf-8');
  }
  
  /**
   * Genera un diseño de base de datos simulado
   */
  private generateSimulatedDbDesign(dbSpec: string, dbType: 'SQL' | 'NoSQL'): string {
    if (dbType === 'SQL') {
      return `# Diseño de Base de Datos: ${dbSpec}

## Esquema Relacional

### Tabla: users
- **id** (INT, PK, AUTO_INCREMENT): Identificador único del usuario
- **name** (VARCHAR(100), NOT NULL): Nombre completo del usuario
- **email** (VARCHAR(100), UNIQUE, NOT NULL): Correo electrónico del usuario
- **password** (VARCHAR(255), NOT NULL): Contraseña hasheada del usuario
- **role** (ENUM('user', 'admin'), DEFAULT 'user'): Rol del usuario
- **created_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Fecha de creación
- **updated_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Fecha de actualización

### Tabla: products
- **id** (INT, PK, AUTO_INCREMENT): Identificador único del producto
- **name** (VARCHAR(100), NOT NULL): Nombre del producto
- **description** (TEXT): Descripción del producto
- **price** (DECIMAL(10,2), NOT NULL): Precio del producto
- **stock** (INT, DEFAULT 0): Cantidad en stock
- **category_id** (INT, FK): Referencia a la categoría
- **created_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Fecha de creación
- **updated_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Fecha de actualización

### Tabla: categories
- **id** (INT, PK, AUTO_INCREMENT): Identificador único de la categoría
- **name** (VARCHAR(50), NOT NULL): Nombre de la categoría
- **description** (TEXT): Descripción de la categoría
- **created_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Fecha de creación
- **updated_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Fecha de actualización

### Tabla: orders
- **id** (INT, PK, AUTO_INCREMENT): Identificador único del pedido
- **user_id** (INT, FK, NOT NULL): Referencia al usuario que realizó el pedido
- **total** (DECIMAL(10,2), NOT NULL): Monto total del pedido
- **status** (ENUM('pending', 'processing', 'completed', 'cancelled'), DEFAULT 'pending'): Estado del pedido
- **created_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Fecha de creación
- **updated_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Fecha de actualización

### Tabla: order_items
- **id** (INT, PK, AUTO_INCREMENT): Identificador único del ítem
- **order_id** (INT, FK, NOT NULL): Referencia al pedido
- **product_id** (INT, FK, NOT NULL): Referencia al producto
- **quantity** (INT, NOT NULL): Cantidad del producto
- **price** (DECIMAL(10,2), NOT NULL): Precio unitario al momento de la compra
- **created_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Fecha de creación

## Relaciones

- **products.category_id** -> **categories.id** (Muchos a uno)
- **orders.user_id** -> **users.id** (Muchos a uno)
- **order_items.order_id** -> **orders.id** (Muchos a uno)
- **order_items.product_id** -> **products.id** (Muchos a uno)

## Índices

- **users**: email (UNIQUE)
- **products**: category_id (INDEX)
- **orders**: user_id (INDEX), status (INDEX)
- **order_items**: order_id (INDEX), product_id (INDEX)

## Consideraciones de Diseño

- Se ha normalizado la base de datos para evitar redundancia
- Se utilizan claves foráneas para mantener la integridad referencial
- Se incluyen timestamps para auditoría
- Se utilizan tipos de datos apropiados para cada campo
- Se han definido índices para optimizar consultas frecuentes
`;
    } else {
      return `# Diseño de Base de Datos: ${dbSpec}

## Esquema NoSQL (MongoDB)

### Colección: users
\`\`\`json
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "password": String,
  "role": String,
  "createdAt": Date,
  "updatedAt": Date
}
\`\`\`

### Colección: products
\`\`\`json
{
  "_id": ObjectId,
  "name": String,
  "description": String,
  "price": Number,
  "stock": Number,
  "category": {
    "_id": ObjectId,
    "name": String
  },
  "createdAt": Date,
  "updatedAt": Date
}
\`\`\`

### Colección: categories
\`\`\`json
{
  "_id": ObjectId,
  "name": String,
  "description": String,
  "createdAt": Date,
  "updatedAt": Date
}
\`\`\`

### Colección: orders
\`\`\`json
{
  "_id": ObjectId,
  "user": {
    "_id": ObjectId,
    "name": String,
    "email": String
  },
  "items": [
    {
      "product": {
        "_id": ObjectId,
        "name": String,
        "price": Number
      },
      "quantity": Number,
      "price": Number
    }
  ],
  "total": Number,
  "status": String,
  "createdAt": Date,
  "updatedAt": Date
}
\`\`\`

## Índices

- **users**: email (UNIQUE)
- **products**: "category._id" (INDEX)
- **orders**: "user._id" (INDEX), status (INDEX)

## Consideraciones de Diseño

- Se ha desnormalizado estratégicamente para optimizar lecturas
- Se embeben documentos para datos que se consultan juntos frecuentemente
- Se mantienen referencias para relaciones complejas o datos que cambian frecuentemente
- Se incluyen timestamps para auditoría
- Se han definido índices para optimizar consultas frecuentes
`;
    }
  }
  
  /**
   * Genera modelos simulados
   */
  private generateSimulatedModels(dbType: 'SQL' | 'NoSQL'): string {
    if (dbType === 'SQL') {
      return `'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Define associations here
      User.hasMany(models.Order, {
        foreignKey: 'userId',
        as: 'orders'
      });
    }
  }
  
  User.init({
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true
  });
  
  return User;
};
`;
    } else {
      return `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese un nombre'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Por favor ingrese un email'],
    unique: true,
    lowercase: true,
    match: [/^\\S+@\\S+\\.\\S+$/, 'Por favor ingrese un email válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor ingrese una contraseña'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
`;
    }
  }
  
  /**
   * Genera migraciones simuladas
   */
  private generateSimulatedMigrations(dbType: 'SQL' | 'NoSQL'): string {
    if (dbType === 'SQL') {
      return `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    
    // Añadir índice para email
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique'
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
`;
    } else {
      return `const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;
`;
    }
  }
  
  /**
   * Genera seeds simulados
   */
  private generateSimulatedSeeds(dbType: 'SQL' | 'NoSQL'): string {
    if (dbType === 'SQL') {
      return `'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);
    
    return queryInterface.bulkInsert('users', [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: userPassword,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  }
};
`;
    } else {
      return `const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const connectDB = require('../db');

// Conectar a la base de datos
connectDB();

const importData = async () => {
  try {
    // Limpiar la base de datos
    await User.deleteMany();
    
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);
    
    // Crear usuarios
    await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin'
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: userPassword,
        role: 'user'
      }
    ]);
    
    console.log('Datos importados!');
    process.exit();
  } catch (error) {
    console.error(\`\${error}\`);
    process.exit(1);
  }
};

// Ejecutar el seeder
importData();
`;
    }
  }
  
  /**
   * Genera consultas simuladas
   */
  private generateSimulatedQueries(dbType: 'SQL' | 'NoSQL'): string {
    if (dbType === 'SQL') {
      return `// Consultas optimizadas para Sequelize

/**
 * Obtener todos los usuarios con paginación
 */
const getUsers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  return await User.findAndCountAll({
    attributes: ['id', 'name', 'email', 'role', 'created_at'],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
};

/**
 * Obtener un usuario por ID
 */
const getUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: ['id', 'name', 'email', 'role', 'created_at']
  });
};

/**
 * Obtener un usuario por email
 */
const getUserByEmail = async (email) => {
  return await User.findOne({
    where: { email },
    attributes: ['id', 'name', 'email', 'password', 'role', 'created_at']
  });
};

/**
 * Obtener pedidos de un usuario con sus items
 */
const getUserOrders = async (userId) => {
  return await Order.findAll({
    where: { user_id: userId },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

/**
 * Obtener productos por categoría con paginación
 */
const getProductsByCategory = async (categoryId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  return await Product.findAndCountAll({
    where: { category_id: categoryId },
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
};

/**
 * Buscar productos por nombre o descripción
 */
const searchProducts = async (query, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  return await Product.findAndCountAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: \`%\${query}%\` } },
        { description: { [Op.like]: \`%\${query}%\` } }
      ]
    },
    limit,
    offset,
    order: [['name', 'ASC']]
  });
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  getUserOrders,
  getProductsByCategory,
  searchProducts
};
`;
    } else {
      return `// Consultas optimizadas para Mongoose

/**
 * Obtener todos los usuarios con paginación
 */
const getUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const users = await User.find()
    .select('name email role createdAt')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments();
  
  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Obtener un usuario por ID
 */
const getUserById = async (id) => {
  return await User.findById(id).select('name email role createdAt');
};

/**
 * Obtener un usuario por email
 */
const getUserByEmail = async (email) => {
  return await User.findOne({ email }).select('+password');
};

/**
 * Obtener pedidos de un usuario
 */
const getUserOrders = async (userId) => {
  return await Order.find({ 'user._id': userId }).sort({ createdAt: -1 });
};

/**
 * Obtener productos por categoría con paginación
 */
const getProductsByCategory = async (categoryId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const products = await Product.find({ 'category._id': categoryId })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const total = await Product.countDocuments({ 'category._id': categoryId });
  
  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Buscar productos por nombre o descripción
 */
const searchProducts = async (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const products = await Product.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  })
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
  
  const total = await Product.countDocuments({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  });
  
  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  getUserOrders,
  getProductsByCategory,
  searchProducts
};
`;
    }
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function databaseAgent(dbSpec: string): Promise<string> {
  const agent = new DatabaseAgent();
  await agent.run(dbSpec);
  return "Ejecutado con éxito";
}