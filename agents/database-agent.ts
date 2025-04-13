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
  
  // Cargar variables de entorno
  dotenv.config();
  
  // Configuración de conexión a MongoDB
  const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/myapp', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
      });
      
      console.log(\`MongoDB conectado: \${conn.connection.host}\`);
    } catch (error) {
      console.error(\`Error al conectar a MongoDB: \${error.message}\`);
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
      // Hashear contraseñas
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash('admin123', salt);
      const userPassword = await bcrypt.hash('user123', salt);
      
      // Insertar usuarios de ejemplo
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
  const bcrypt = require('bcryptjs');
  const User = require('../models/userModel');
  const connectDB = require('../db');
  
  // Conectar a la base de datos
  connectDB();
  
  // Datos de ejemplo
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    },
    {
      name: 'Regular User',
      email: 'user@example.com',
      password: 'user123',
      role: 'user'
    }
  ];
  
  // Función para importar datos
  const importData = async () => {
    try {
      // Limpiar la base de datos
      await User.deleteMany();
      
      // Hashear contraseñas y crear usuarios
      const createdUsers = await Promise.all(
        users.map(async (user) => {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          return User.create(user);
        })
      );
      
      console.log('Datos importados correctamente');
      process.exit();
    } catch (error) {
      console.error(\`Error al importar datos: \${error.message}\`);
      process.exit(1);
    }
  };
  
  // Ejecutar importación
  importData();
  `;
      }
    }
    
    /**
     * Genera consultas simuladas
     */
    private generateSimulatedQueries(dbType: 'SQL' | 'NoSQL'): string {
      if (dbType === 'SQL') {
        return `/**
   * Consultas optimizadas para la base de datos SQL
   */
  
  const { User, Product, Category, Order, OrderItem } = require('./models');
  const { Op } = require('sequelize');
  
  /**
   * Busca usuarios por criterios con paginación
   * @param {Object} criteria - Criterios de búsqueda
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @returns {Promise<Object>} - Resultados paginados
   */
  exports.findUsers = async (criteria = {}, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const where = {};
    
    if (criteria.name) {
      where.name = { [Op.like]: \`%\${criteria.name}%\` };
    }
    
    if (criteria.email) {
      where.email = { [Op.like]: \`%\${criteria.email}%\` };
    }
    
    if (criteria.role) {
      where.role = criteria.role;
    }
    
    // Ejecutar consulta optimizada
    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'name', 'email', 'role', 'created_at'] // Excluir password
    });
    
    return {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      results: rows
    };
  };
  
  /**
   * Obtiene productos con su categoría
   * @param {Object} criteria - Criterios de búsqueda
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @returns {Promise<Object>} - Resultados paginados
   */
  exports.findProducts = async (criteria = {}, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const where = {};
    
    if (criteria.name) {
      where.name = { [Op.like]: \`%\${criteria.name}%\` };
    }
    
    if (criteria.minPrice) {
      where.price = { ...where.price, [Op.gte]: criteria.minPrice };
    }
    
    if (criteria.maxPrice) {
      where.price = { ...where.price, [Op.lte]: criteria.maxPrice };
    }
    
    if (criteria.categoryId) {
      where.category_id = criteria.categoryId;
    }
    
    // Ejecutar consulta optimizada con JOIN
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      results: rows
    };
  };
  
  /**
   * Obtiene pedidos de un usuario con sus productos
   * @param {number} userId - ID del usuario
   * @param {Object} criteria - Criterios de búsqueda
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @returns {Promise<Object>} - Resultados paginados
   */
  exports.findUserOrders = async (userId, criteria = {}, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const where = { user_id: userId };
    
    if (criteria.status) {
      where.status = criteria.status;
    }
    
    if (criteria.startDate && criteria.endDate) {
      where.created_at = {
        [Op.between]: [new Date(criteria.startDate), new Date(criteria.endDate)]
      };
    }
    
    // Ejecutar consulta optimizada con JOIN anidados
    const { count, rows } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price'],
              include: [
                {
                  model: Category,
                  as: 'category',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ]
    });
    
    return {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      results: rows
    };
  };
  
  /**
   * Obtiene estadísticas de ventas por período
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {string} groupBy - Agrupar por (day, week, month)
   * @returns {Promise<Array>} - Estadísticas de ventas
   */
  exports.getSalesStats = async (startDate, endDate, groupBy = 'day') => {
    let dateFormat;
    
    // Definir formato de fecha según agrupación
    switch (groupBy) {
      case 'week':
        dateFormat = 'YYYY-WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }
    
    // Consulta con funciones de agregación y GROUP BY
    const stats = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), dateFormat), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSales']
      ],
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        },
        status: 'completed'
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), dateFormat), 'ASC']]
    });
    
    return stats;
  };
  `;
      } else {
        return `/**
   * Consultas optimizadas para la base de datos MongoDB
   */
  
  const User = require('./models/userModel');
  const Product = require('./models/productModel');
  const Category = require('./models/categoryModel');
  const Order = require('./models/orderModel');
  
  /**
   * Busca usuarios por criterios con paginación
   * @param {Object} criteria - Criterios de búsqueda
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @returns {Promise<Object>} - Resultados paginados
   */
  exports.findUsers = async (criteria = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const query = {};
    
    if (criteria.name) {
      query.name = { $regex: criteria.name, $options: 'i' };
    }
    
    if (criteria.email) {
      query.email = { $regex: criteria.email, $options: 'i' };
    }
    
    if (criteria.role) {
      query.role = criteria.role;
    }
    
    // Ejecutar consulta optimizada
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password') // Excluir password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      results: users
    };
  };
  
  /**
   * Obtiene productos con su categoría
   * @param {Object} criteria - Criterios de búsqueda
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @returns {Promise<Object>} - Resultados paginados
   */
  exports.findProducts = async (criteria = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const query = {};
    
    if (criteria.name) {
      query.name = { $regex: criteria.name, $options: 'i' };
    }
    
    if (criteria.minPrice || criteria.maxPrice) {
      query.price = {};
      
      if (criteria.minPrice) {
        query.price.$gte = criteria.minPrice;
      }
      
      if (criteria.maxPrice) {
        query.price.$lte = criteria.maxPrice;
      }
    }
    
    if (criteria.categoryId) {
      query['category._id'] = criteria.categoryId;
    }
    
    // Ejecutar consulta optimizada
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      results: products
    };
  };
  
  /**
   * Obtiene pedidos de un usuario con sus productos
   * @param {string} userId - ID del usuario
   * @param {Object} criteria - Criterios de búsqueda
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @returns {Promise<Object>} - Resultados paginados
   */
  exports.findUserOrders = async (userId, criteria = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const query = { 'user._id': userId };
    
    if (criteria.status) {
      query.status = criteria.status;
    }
    
    if (criteria.startDate && criteria.endDate) {
      query.createdAt = {
        $gte: new Date(criteria.startDate),
        $lte: new Date(criteria.endDate)
      };
    }
    
    // Ejecutar consulta optimizada
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      results: orders
    };
  };
  
  /**
   * Obtiene estadísticas de ventas por período
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {string} groupBy - Agrupar por (day, week, month)
   * @returns {Promise<Array>} - Estadísticas de ventas
   */
  exports.getSalesStats = async (startDate, endDate, groupBy = 'day') => {
    let dateFormat;
    
    // Definir formato de fecha según agrupación
    switch (groupBy) {
      case 'week':
        dateFormat = { $week: '$createdAt' };
        break;
      case 'month':
        dateFormat = { 
          $dateToString: { 
            format: '%Y-%m', 
            date: '$createdAt' 
          } 
        };
        break;
      default:
        dateFormat = { 
          $dateToString: { 
            format: '%Y-%m-%d', 
            date: '$createdAt' 
          } 
        };
    }
    
    // Consulta con agregación
    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: dateFormat,
          orderCount: { $sum: 1 },
          totalSales: { $sum: '$total' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          orderCount: 1,
          totalSales: 1
        }
      }
    ]);
    
    return stats;
  };
  `;
      }
    }
    
    /**
     * Lee un archivo de contexto
     * @param fileName Nombre del archivo de contexto
     * @returns Contenido del archivo
     */
    private readContext(fileName: string): string {
      try {
        const contextPath = path.join(process.cwd(), 'context', fileName);
        return fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf-8') : '';
      } catch (error) {
        console.warn(`⚠️ No se pudo leer el archivo de contexto ${fileName}`);
        return '';
      }
    }
    
    /**
     * Consulta al LLM para obtener una respuesta
     * @param prompt Prompt para el LLM
     * @returns Respuesta del LLM
     */
    private async queryLLM(prompt: string): Promise<string> {
      // Aquí se implementaría la lógica para consultar al LLM
      // Por ahora, simulamos una respuesta
      
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulación de respuesta del LLM
          resolve(`Respuesta simulada para el prompt: "${prompt.substring(0, 50)}..."`);
        }, 1000);
      });
    }
    
    /**
     * Genera un esquema de base de datos completo
     * @param dbSpec Especificación de la base de datos
     * @returns Esquema generado
     */
    async generateDatabaseSchema(dbSpec: string): Promise<any> {
      console.log(`🔍 Analizando especificación de base de datos: "${dbSpec}"`);
      
      // Determinar el tipo de base de datos
      const dbType = this.determineDbType(dbSpec);
      
      // Crear prompt para el LLM
      const schemaPrompt = `
      # Tarea de Database Agent
      
      Genera un esquema de base de datos completo para la siguiente especificación:
      
      "${dbSpec}"
      
      Tipo de base de datos: ${dbType}
      
      Proporciona:
      1. Entidades/tablas/colecciones con sus campos y tipos
      2. Relaciones entre entidades
      3. Índices recomendados
      4. Restricciones y validaciones
      5. Consideraciones de rendimiento
      
      El esquema debe seguir las mejores prácticas para ${dbType === 'SQL' ? 'bases de datos relacionales' : 'bases de datos NoSQL'}.
      `;
      
      try {
        // Consultar al LLM
        const response = await this.queryLLM(schemaPrompt);
        
        // Extraer el esquema de la respuesta
        const schema = this.parseSchemaFromResponse(response, dbType);
        
        return schema;
      } catch (error) {
        console.error('❌ Error al generar esquema de base de datos:', error);
        throw error;
      }
    }
    
    /**
     * Analiza la respuesta del LLM para extraer el esquema
     * @param response Respuesta del LLM
     * @param dbType Tipo de base de datos
     * @returns Esquema estructurado
     */
    private parseSchemaFromResponse(response: string, dbType: 'SQL' | 'NoSQL'): any {
      // Aquí se implementaría la lógica para extraer el esquema de la respuesta
      // Por ahora, devolvemos un esquema simulado
      
      if (dbType === 'SQL') {
        return {
          tables: [
            {
              name: 'users',
              fields: [
                { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'VARCHAR(100)', nullable: false },
                { name: 'email', type: 'VARCHAR(100)', nullable: false, unique: true },
                { name: 'password', type: 'VARCHAR(255)', nullable: false },
                { name: 'role', type: 'ENUM', values: ['user', 'admin'], default: 'user' },
                { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }
              ],
              indices: [
                { name: 'users_email_unique', fields: ['email'], unique: true }
              ]
            },
            {
              name: 'products',
              fields: [
                { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'VARCHAR(100)', nullable: false },
                { name: 'description', type: 'TEXT', nullable: true },
                { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
                { name: 'stock', type: 'INTEGER', default: 0 },
                { name: 'category_id', type: 'INTEGER', foreignKey: { table: 'categories', field: 'id' } },
                { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }
              ],
              indices: [
                { name: 'products_category_id', fields: ['category_id'] }
              ]
            }
          ],
          relations: [
            { from: { table: 'products', field: 'category_id' }, to: { table: 'categories', field: 'id' }, type: 'many-to-one' }
          ]
        };
      } else {
        return {
          collections: [
            {
              name: 'users',
              schema: {
                name: { type: 'String', required: true },
                email: { type: 'String', required: true, unique: true },
                password: { type: 'String', required: true },
                role: { type: 'String', enum: ['user', 'admin'], default: 'user' },
                createdAt: { type: 'Date', default: 'Date.now' },
                updatedAt: { type: 'Date', default: 'Date.now' }
              },
              indices: [
                { fields: { email: 1 }, options: { unique: true } }
              ]
            },
            {
              name: 'products',
              schema: {
                name: { type: 'String', required: true },
                description: { type: 'String' },
                price: { type: 'Number', required: true },
                stock: { type: 'Number', default: 0 },
                category: {
                  _id: { type: 'ObjectId', ref: 'Category' },
                  name: { type: 'String' }
                },
                createdAt: { type: 'Date', default: 'Date.now' },
                updatedAt: { type: 'Date', default: 'Date.now' }
              },
              indices: [
                { fields: { 'category._id': 1 } },
                { fields: { name: 'text', description: 'text' } }
              ]
            }
          ]
        };
      }
    }
    
    /**
     * Genera un diagrama ER para una base de datos SQL
     * @param schema Esquema de la base de datos
     * @returns Código PlantUML para el diagrama
     */
    generateERDiagram(schema: any): string {
      console.log('📊 Generando diagrama ER');
      
      let plantUML = `@startuml
  !define table(x) class x << (T,#FFAAAA) >>
  !define primary_key(x) <b>x</b>
  !define foreign_key(x) <u>x</u>
  hide methods
  hide stereotypes
  
  `;
      
      // Generar tablas
      for (const table of schema.tables) {
        plantUML += `table(${table.name}) {\n`;
        
        for (const field of table.fields) {
          let fieldStr = field.name;
          
          if (field.primaryKey) {
            fieldStr = `primary_key(${fieldStr})`;
          } else if (field.foreignKey) {
            fieldStr = `foreign_key(${fieldStr})`;
          }
          
          plantUML += `  ${fieldStr} : ${field.type}`;
          
          if (field.nullable === false) {
            plantUML += ' [NOT NULL]';
          }
          
          if (field.default) {
            plantUML += ` = ${field.default}`;
          }
          
          plantUML += '\n';
        }
        
        plantUML += '}\n\n';
      }
      
      // Generar relaciones
      for (const relation of schema.relations) {
        plantUML += `${relation.from.table} --> ${relation.to.table} : ${relation.type}\n`;
      }
      
      plantUML += '@enduml';
      
      return plantUML;
    }
    
    /**
     * Genera un diagrama de colecciones para una base de datos NoSQL
     * @param schema Esquema de la base de datos
     * @returns Código PlantUML para el diagrama
     */
    generateCollectionsDiagram(schema: any): string {
      console.log('📊 Generando diagrama de colecciones');
      
      let plantUML = `@startuml
  !define collection(x) class x << (C,#AAAAFF) >>
  hide methods
  hide stereotypes
  
  `;
      
      // Generar colecciones
      for (const collection of schema.collections) {
        plantUML += `collection(${collection.name}) {\n`;
        
        for (const [fieldName, fieldDef] of Object.entries(collection.schema)) {
          const field = fieldDef as any;
          let fieldStr = `  ${fieldName} : ${field.type}`;
          
          if (field.required) {
            fieldStr += ' [required]';
          }
          
          if (field.unique) {
            fieldStr += ' [unique]';
          }
          
          if (field.default) {
            fieldStr += ` = ${field.default}`;
          }
          
          plantUML += `${fieldStr}\n`;
        }
        
        plantUML += '}\n\n';
      }
      
      // Generar relaciones (referencias embebidas)
      for (const collection of schema.collections) {
        for (const [fieldName, fieldDef] of Object.entries(collection.schema)) {
          const field = fieldDef as any;
          
          if (field.ref) {
            plantUML += `${collection.name} --> ${field.ref} : references\n`;
          }
        }
      }
      
      plantUML += '@enduml';
      
      return plantUML;
    }
    
    /**
     * Genera un archivo de configuración para la base de datos
     * @param dbType Tipo de base de datos
     * @returns Código de configuración
     */
    generateDatabaseConfig(dbType: 'SQL' | 'NoSQL'): string {
      console.log('⚙️ Generando configuración de base de datos');
      
      if (dbType === 'SQL') {
        return `require('dotenv').config();
  
  module.exports = {
    development: {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'development_db',
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: console.log,
      define: {
        timestamps: true,
        underscored: true
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    test: {
      username: process.env.TEST_DB_USER || 'root',
      password: process.env.TEST_DB_PASSWORD || '',
      database: process.env.TEST_DB_NAME || 'test_db',
            host: process.env.TEST_DB_HOST || '127.0.0.1',
      port: process.env.TEST_DB_PORT || 3306,
      dialect: process.env.TEST_DB_DIALECT || 'mysql',
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      }
    },
    production: {
      username: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      database: process.env.PROD_DB_NAME,
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT || 3306,
      dialect: process.env.PROD_DB_DIALECT || 'mysql',
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      },
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      }
    }
  };`;
      } else {
        return `const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Opciones de conexión
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Usar IPv4, evitar problemas con IPv6
};

// Configuraciones para diferentes entornos
const config = {
  development: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dev_db',
    options: {
      ...options,
      // Opciones específicas para desarrollo
      debug: true
    }
  },
  test: {
    uri: process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/test_db',
    options: {
      ...options,
      // Opciones específicas para pruebas
      debug: false
    }
  },
  production: {
    uri: process.env.PROD_MONGO_URI,
    options: {
      ...options,
      // Opciones específicas para producción
      debug: false,
      // Configuración de replicaSet si está disponible
      ...(process.env.MONGO_REPLICA_SET ? {
        replicaSet: process.env.MONGO_REPLICA_SET,
        readPreference: 'secondaryPreferred'
      } : {})
    }
  }
};

// Obtener entorno actual
const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env];

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(currentConfig.uri, currentConfig.options);
    
    console.log(\`MongoDB conectado: \${conn.connection.host} (entorno: \${env})\`);
    return conn;
  } catch (error) {
    console.error(\`Error al conectar a MongoDB: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;`;
      }
    }
    
    /**
     * Genera modelos para ORM
     * @param schema Esquema de la base de datos
     * @param dbType Tipo de base de datos
     * @returns Código de los modelos
     */
    generateORMModels(schema: any, dbType: 'SQL' | 'NoSQL'): { [key: string]: string } {
      console.log('📝 Generando modelos ORM');
      
      const models: { [key: string]: string } = {};
      
      if (dbType === 'SQL') {
        // Generar modelos para Sequelize
        for (const table of schema.tables) {
          const modelName = this.toPascalCase(table.name);
          
          let modelCode = `const { Model, DataTypes } = require('sequelize');

/**
 * Modelo ${modelName}
 * @class
 */
module.exports = (sequelize) => {
  class ${modelName} extends Model {
    /**
     * Método auxiliar para definir asociaciones
     * @static
     */
    static associate(models) {
`;
          
          // Generar asociaciones
          for (const field of table.fields) {
            if (field.foreignKey) {
              const targetModel = this.toPascalCase(field.foreignKey.table);
              modelCode += `      // ${modelName} pertenece a ${targetModel}
      this.belongsTo(models.${targetModel}, {
        foreignKey: '${field.name}',
        as: '${this.toCamelCase(field.foreignKey.table)}'
      });\n`;
            }
          }
          
          // Buscar relaciones inversas (hasMany, hasOne)
          for (const relation of schema.relations) {
            if (relation.to.table === table.name && relation.type === 'many-to-one') {
              const sourceModel = this.toPascalCase(relation.from.table);
              modelCode += `      // ${modelName} tiene muchos ${sourceModel}
      this.hasMany(models.${sourceModel}, {
        foreignKey: '${relation.from.field}',
        as: '${this.toCamelCase(relation.from.table)}s'
      });\n`;
            } else if (relation.to.table === table.name && relation.type === 'one-to-one') {
              const sourceModel = this.toPascalCase(relation.from.table);
              modelCode += `      // ${modelName} tiene un ${sourceModel}
      this.hasOne(models.${sourceModel}, {
        foreignKey: '${relation.from.field}',
        as: '${this.toCamelCase(relation.from.table)}'
      });\n`;
            }
          }
          
          modelCode += `    }
  }
  
  ${modelName}.init({
`;
          
          // Generar definición de campos
          for (const field of table.fields) {
            if (!field.primaryKey || !field.autoIncrement) {
              modelCode += `    ${field.name}: {
      type: DataTypes.${field.type.toUpperCase().replace(/\(.*\)/, '')},`;
              
              if (field.type.includes('(')) {
                const size = field.type.match(/\(([^)]+)\)/)[1];
                modelCode += `
      ${field.type.toUpperCase().includes('VARCHAR') ? 'length' : 'precision'}: ${size},`;
              }
              
              if (field.nullable === false) {
                modelCode += `
      allowNull: false,`;
              }
              
              if (field.unique) {
                modelCode += `
      unique: true,`;
              }
              
              if (field.default) {
                modelCode += `
      defaultValue: ${field.default === 'CURRENT_TIMESTAMP' ? 'DataTypes.NOW' : `'${field.default}'`},`;
              }
              
              if (field.type.toUpperCase().includes('ENUM')) {
                modelCode += `
      values: ${JSON.stringify(field.values)},`;
              }
              
              modelCode += `
    },
`;
            }
          }
          
          modelCode += `  }, {
    sequelize,
    modelName: '${modelName}',
    tableName: '${table.name}',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return ${modelName};
};`;
          
          models[`${modelName}.js`] = modelCode;
        }
        
        // Generar archivo index.js para cargar todos los modelos
        let indexCode = `'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;`;
        
        models['index.js'] = indexCode;
      } else {
        // Generar modelos para Mongoose
        for (const collection of schema.collections) {
          const modelName = this.toPascalCase(collection.name);
          
          let modelCode = `const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema para ${modelName}
 * @type {Schema}
 */
const ${this.toCamelCase(collection.name)}Schema = new Schema({
`;
          
          // Generar definición de campos
          for (const [fieldName, fieldDef] of Object.entries(collection.schema)) {
            const field = fieldDef as any;
            
            modelCode += `  ${fieldName}: {
    type: ${field.type === 'ObjectId' ? 'Schema.Types.ObjectId' : field.type},`;
            
            if (field.required) {
              modelCode += `
    required: true,`;
            }
            
            if (field.unique) {
              modelCode += `
    unique: true,`;
            }
            
            if (field.default) {
              modelCode += `
    default: ${field.default === 'Date.now' ? 'Date.now' : `'${field.default}'`},`;
            }
            
            if (field.enum) {
              modelCode += `
    enum: ${JSON.stringify(field.enum)},`;
            }
            
            if (field.ref) {
              modelCode += `
    ref: '${field.ref}',`;
            }
            
            if (field.validate) {
              modelCode += `
    validate: {
      validator: function(v) {
        return ${field.validate};
      },
      message: props => '${field.validateMessage || `${fieldName} validation failed`}'
    },`;
            }
            
            modelCode += `
  },
`;
          }
          
          modelCode += `}, {
  timestamps: true,
  versionKey: false
});

// Índices
`;
          
          // Generar índices
          for (const index of collection.indices || []) {
            modelCode += `${this.toCamelCase(collection.name)}Schema.index(${JSON.stringify(index.fields)}, ${JSON.stringify(index.options || {})});\n`;
          }
          
          // Generar métodos estáticos
          modelCode += `
// Métodos estáticos
${this.toCamelCase(collection.name)}Schema.statics = {
  /**
   * Buscar por id
   * @param {ObjectId} id - El ObjectId del documento
   * @returns {Promise<Object>}
   */
  async findById(id) {
    return this.findOne({ _id: id });
  },
  
  /**
   * Listar documentos con paginación
   * @param {Object} [filter={}] - Filtro de búsqueda
   * @param {Object} [options={}] - Opciones de búsqueda (sort, limit, skip)
   * @returns {Promise<Array>}
   */
  async list({ filter = {}, options = {} }) {
    const { sort = { createdAt: -1 }, limit = 50, skip = 0 } = options;
    return this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  },
  
  /**
   * Contar documentos
   * @param {Object} [filter={}] - Filtro de búsqueda
   * @returns {Promise<Number>}
   */
  async count(filter = {}) {
    return this.countDocuments(filter);
  }
};

// Métodos de instancia
${this.toCamelCase(collection.name)}Schema.methods = {
  /**
   * Transformar a JSON
   * @returns {Object}
   */
  toJSON() {
    const obj = this.toObject();
    return obj;
  }
};

// Hooks
${this.toCamelCase(collection.name)}Schema.pre('save', function(next) {
  // Aquí puedes añadir lógica antes de guardar
  next();
});

/**
 * Modelo ${modelName}
 * @type {Model}
 */
const ${modelName} = mongoose.model('${modelName}', ${this.toCamelCase(collection.name)}Schema);

module.exports = ${modelName};`;
          
          models[`${modelName}.js`] = modelCode;
        }
        
        // Generar archivo index.js para exportar todos los modelos
        let indexCode = `'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const models = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    models[model.modelName] = model;
  });

module.exports = models;`;
        
        models['index.js'] = indexCode;
      }
      
      return models;
    }
    
    /**
     * Determina el tipo de base de datos basado en la especificación
     * @param dbSpec Especificación de la base de datos
     * @returns Tipo de base de datos (SQL o NoSQL)
     */
    private determineDbType(dbSpec: string): 'SQL' | 'NoSQL' {
      const sqlKeywords = ['relacional', 'sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'mariadb', 'oracle', 'mssql', 'sqlserver', 'tablas', 'joins', 'foreign key', 'primary key'];
      const noSqlKeywords = ['nosql', 'mongodb', 'mongo', 'documentos', 'colecciones', 'firebase', 'dynamodb', 'cassandra', 'couchdb', 'redis', 'neo4j', 'elasticsearch'];
      
      const dbSpecLower = dbSpec.toLowerCase();
      
      let sqlScore = 0;
      let noSqlScore = 0;
      
      // Contar ocurrencias de palabras clave
      for (const keyword of sqlKeywords) {
        if (dbSpecLower.includes(keyword)) {
          sqlScore++;
        }
      }
      
      for (const keyword of noSqlKeywords) {
        if (dbSpecLower.includes(keyword)) {
          noSqlScore++;
        }
      }
      
      // Si se menciona explícitamente un tipo, darle más peso
      if (dbSpecLower.includes('base de datos relacional') || dbSpecLower.includes('base de datos sql')) {
        sqlScore += 3;
      }
      
      if (dbSpecLower.includes('base de datos nosql') || dbSpecLower.includes('base de datos no relacional')) {
        noSqlScore += 3;
      }
      
      console.log(`🔍 Análisis de tipo de base de datos: SQL (${sqlScore}) vs NoSQL (${noSqlScore})`);
      
      return sqlScore >= noSqlScore ? 'SQL' : 'NoSQL';
    }
    
    /**
     * Convierte un string a formato PascalCase
     * @param str String a convertir
     * @returns String en formato PascalCase
     */
    private toPascalCase(str: string): string {
      return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }
    
    /**
     * Convierte un string a formato camelCase
     * @param str String a convertir
     * @returns String en formato camelCase
     */
    private toCamelCase(str: string): string {
      const pascal = this.toPascalCase(str);
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }
    
    /**
     * Genera un archivo README con documentación de la base de datos
     * @param schema Esquema de la base de datos
     * @param dbType Tipo de base de datos
     * @returns Contenido del README
     */
    generateDatabaseDocumentation(schema: any, dbType: 'SQL' | 'NoSQL'): string {
      console.log('📄 Generando documentación de la base de datos');
      
      let readme = `# Documentación de la Base de Datos

## Visión General

Este documento describe la estructura de la base de datos ${dbType === 'SQL' ? 'relacional' : 'NoSQL'} utilizada en el proyecto.

## Tecnología

${dbType === 'SQL' ? 'Base de datos relacional utilizando Sequelize como ORM.' : 'Base de datos NoSQL utilizando MongoDB con Mongoose como ODM.'}

## Estructura

`;
      
      if (dbType === 'SQL') {
        readme += `### Tablas\n\n`;
        
        for (const table of schema.tables) {
          readme += `#### ${this.toPascalCase(table.name)}\n\n`;
          readme += `| Campo | Tipo | Descripción | Restricciones |\n`;
          readme += `|-------|------|-------------|---------------|\n`;
          
          for (const field of table.fields) {
            const constraints = [];
            
            if (field.primaryKey) constraints.push('Clave primaria');
            if (field.autoIncrement) constraints.push('Auto incremento');
            if (field.nullable === false) constraints.push('NOT NULL');
            if (field.unique) constraints.push('Único');
            if (field.default) constraints.push(`Default: ${field.default}`);
            if (field.foreignKey) constraints.push(`FK -> ${field.foreignKey.table}.${field.foreignKey.field}`);
            
            readme += `| ${field.name} | ${field.type} | | ${constraints.join(', ')} |\n`;
          }
          
          readme += `\n`;
        }
        
        readme += `### Relaciones\n\n`;
        
        for (const relation of schema.relations) {
          readme += `- **${relation.from.table}.${relation.from.field}** -> **${relation.to.table}.${relation.to.field}** (${relation.type})\n`;
        }
      } else {
        readme += `### Colecciones\n\n`;
        
        for (const collection of schema.collections) {
          readme += `#### ${this.toPascalCase(collection.name)}\n\n`;
          readme += `| Campo | Tipo | Descripción | Restricciones |\n`;
          readme += `|-------|------|-------------|---------------|\n`;
          
          for (const [fieldName, fieldDef] of Object.entries(collection.schema)) {
            const field = fieldDef as any;
            const constraints = [];
            
            if (field.required) constraints.push('Requerido');
            if (field.unique) constraints.push('Único');
            if (field.default) constraints.push(`Default: ${field.default}`);
            if (field.enum) constraints.push(`Enum: ${field.enum.join(', ')}`);
            if (field.ref) constraints.push(`Ref: ${field.ref}`);
            
            readme += `| ${fieldName} | ${field.type} | | ${constraints.join(', ')} |\n`;
          }
          
          readme += `\n`;
          
          if (collection.indices && collection.indices.length > 0) {
            readme += `**Índices:**\n\n`;
            
            for (const index of collection.indices) {
              const options = [];
              
              if (index.options) {
                if (index.options.unique) options.push('único');
                if (index.options.sparse) options.push('sparse');
                if (index.options.background) options.push('background');
              }
              
              readme += `- ${JSON.stringify(index.fields)} ${options.length > 0 ? `(${options.join(', ')})` : ''}\n`;
            }
            
            readme += `\n`;
          }
        }
      }
      
      readme += `## Configuración

### Variables de Entorno

`;
      
      if (dbType === 'SQL') {
        readme += `- **DB_DIALECT**: Dialecto SQL (mysql, postgres, sqlite, etc.)
- **DB_HOST**: Host de la base de datos
- **DB_PORT**: Puerto de la base de datos
- **DB_NAME**: Nombre de la base de datos
- **DB_USER**: Usuario de la base de datos
- **DB_PASSWORD**: Contraseña de la base de datos

Para entornos de prueba y producción, usar los prefijos TEST_ y PROD_ respectivamente.
`;
      } else {
        readme += `- **MONGO_URI**: URI de conexión a MongoDB
- **MONGO_REPLICA_SET**: Nombre del replica set (opcional)

Para entornos de prueba y producción, usar los prefijos TEST_ y PROD_ respectivamente.
`;
      }
      
      readme += `## Migraciones y Seeds

${dbType === 'SQL' ? 'Las migraciones y seeds se gestionan con Sequelize CLI.' : 'Los scripts de inicialización se encuentran en la carpeta seeds.'}

### Comandos Útiles

`;
      
      if (dbType === 'SQL') {
        readme += `\`\`\`bash
# Crear una migración
npx sequelize-cli migration:generate --name create_users

# Ejecutar migraciones
npx sequelize-cli db:migrate

# Revertir última migración
npx sequelize-cli db:migrate:undo

# Crear un seed
npx sequelize-cli seed:generate --name demo-users

# Ejecutar seeds
npx sequelize-cli db:seed:all

# Revertir seeds
npx sequelize-cli db:seed:undo:all
\`\`\`
`;
      } else {
        readme += `\`\`\`bash
# Ejecutar script de inicialización
node seeds/init.js

# Ejecutar script de datos de prueba
node seeds/demo.js
\`\`\`
`;
      }
      
      readme += `## Consultas Optimizadas

Ver el archivo \`queries.js\` para ejemplos de consultas optimizadas.

## Consideraciones de Rendimiento

- ${dbType === 'SQL' ? 'Usar índices para campos frecuentemente consultados.' : 'Diseñar esquemas para minimizar la necesidad de joins (desnormalización estratégica).'}
- ${dbType === 'SQL' ? 'Optimizar consultas JOIN con índices adecuados.' : 'Usar índices compuestos para patrones de consulta comunes.'}
- ${dbType === 'SQL' ? 'Considerar particionamiento para tablas grandes.' : 'Considerar sharding para colecciones grandes.'}
- Implementar caché para consultas frecuentes.
- Monitorear y optimizar consultas lentas.

## Backups

${dbType === 'SQL' ? 'Configurar backups periódicos con mysqldump o herramientas equivalentes.' : 'Configurar backups periódicos con mongodump o servicios de backup de MongoDB Atlas.'}

## Seguridad

- Usar variables de entorno para credenciales.
- Implementar validación de entrada en modelos.
- Limitar permisos de usuario de base de datos.
- ${dbType === 'SQL' ? 'Usar prepared statements para prevenir SQL injection.' : 'Sanitizar entradas para prevenir NoSQL injection.'}
`;
      
      return readme;
    }
    
    /**
     * Genera un archivo .env de ejemplo
     * @param dbType Tipo de base de datos
     * @returns Contenido del archivo .env
     */
    generateEnvExample(dbType: 'SQL' | 'NoSQL'): string {
      console.log('📝 Generando archivo .env de ejemplo');
      
      if (dbType === 'SQL') {
        return `# Variables de entorno para la base de datos

# Entorno de desarrollo
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=development_db
DB_USER=root
DB_PASSWORD=

# Entorno de prueba
TEST_DB_DIALECT=mysql
TEST_DB_HOST=127.0.0.1
TEST_DB_PORT=3306
TEST_DB_NAME=test_db
TEST_DB_USER=root
TEST_DB_PASSWORD=

# Entorno de producción
PROD_DB_DIALECT=mysql
PROD_DB_HOST=your-production-host
PROD_DB_PORT=3306
PROD_DB_NAME=production_db
PROD_DB_USER=prod_user
PROD_DB_PASSWORD=secure_password

# Otras variables
NODE_ENV=development
`;
      } else {
        return `# Variables de entorno para la base de datos

# Entorno de desarrollo
MONGO_URI=mongodb://localhost:27017/dev_db

# Entorno de prueba
TEST_MONGO_URI=mongodb://localhost:27017/test_db

# Entorno de producción
PROD_MONGO_URI=mongodb://user:password@your-production-host:27017/production_db
MONGO_REPLICA_SET=rs0

# Otras variables
NODE_ENV=development
`;
      }
    }
    
    /**
     * Genera un archivo .sequelizerc (solo para SQL)
     * @returns Contenido del archivo .sequelizerc
     */
    generateSequelizeRC(): string {
      console.log('📝 Generando archivo .sequelizerc');
      
      return `const path = require('path');

module.exports = {
  'config': path.resolve('config', 'database.js'),
  'models-path': path.resolve('models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};
`;
    }
}