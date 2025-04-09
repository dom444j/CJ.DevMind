# ⚖️ CJ.DevMind - Reglas Arquitectónicas

## 📏 Reglas Globales

- **No Duplicación**: Componentes, lógica y datos deben ser únicos en todo el sistema
- **Modularidad**: Cada módulo debe tener responsabilidad única y bien definida
- **Documentación**: Todo código debe estar documentado (JSDoc, README, comentarios)
- **Pruebas**: Componentes críticos requieren pruebas unitarias y de integración
- **Seguridad**: Implementar protección en cada capa (frontend, backend, datos)
- **Consistencia**: Seguir patrones establecidos en naming, estructura y estilos

## 🎨 Frontend

### Estructura
- **App Router**: Usar el patrón `app/` de Next.js 14+
- **Páginas Completas**: Cada ruta debe tener `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **Componentes**: Organizar en `components/[dominio]/[componente]`
- **Shared**: Componentes compartidos en `components/shared` o `components/ui`

### Estilos
- **Tailwind**: Usar clases de Tailwind para todos los estilos
- **Variables CSS**: Definir colores y tamaños en `tailwind.config.js`
- **Responsive**: Diseñar mobile-first con breakpoints consistentes
- **Accesibilidad**: Cumplir WCAG 2.1 AA como mínimo

### Estado
- **Server Components**: Preferir Server Components cuando sea posible
- **Client Components**: Usar "use client" solo cuando sea necesario
- **Fetching**: Usar Tanstack Query para datos remotos
- **Forms**: Implementar con React Hook Form + Zod

## 🔧 Backend

### Estructura
- **Modular**: Cada dominio funcional en su propia carpeta
- **Capas**: Controlador → Servicio → Repositorio
- **Validación**: Schemas Zod para todas las entradas
- **Errores**: Manejo centralizado con códigos HTTP apropiados

### APIs
- **REST**: Seguir convenciones RESTful para endpoints
- **GraphQL/tRPC**: Opcional para operaciones complejas
- **Versioning**: Incluir versión en rutas `/api/v1/...`
- **Rate Limiting**: Implementar para prevenir abusos

### Seguridad
- **Autenticación**: JWT con expiración corta + refresh tokens
- **Autorización**: RBAC (Role-Based Access Control)
- **Sanitización**: Validar y sanitizar todas las entradas
- **Logs**: Registrar accesos y operaciones sensibles

## 💾 Datos

### Esquema
- **Prisma**: Definir modelos en `schema.prisma`
- **Migraciones**: Generar para cada cambio en el esquema
- **Relaciones**: Definir claramente con cardinalidad apropiada
- **Índices**: Crear para campos de búsqueda frecuente

### Operaciones
- **Transacciones**: Usar para operaciones multi-tabla
- **N+1**: Evitar con `include` y consultas optimizadas
- **Soft Delete**: Preferir sobre eliminación permanente
- **Backups**: Configurar respaldo automático

## 🚀 Infraestructura

### Entornos
- **Development**: Local con Docker Compose
- **Staging**: Idéntico a producción pero aislado
- **Production**: Configuración optimizada y segura

### CI/CD
- **Tests**: Ejecutar antes de cada despliegue
- **Build**: Optimizar para producción
- **Deploy**: Zero-downtime con rollback automático
- **Monitoreo**: Implementar alertas para errores críticos

## 🤖 Agentes IA

### Comunicación
- **Formato**: JSON estructurado para mensajes entre agentes
- **Contexto**: Incluir referencias a archivos y decisiones previas
- **Conflictos**: Escalar a Architect Agent para resolución
- **Logs**: Registrar todas las decisiones importantes

### Autonomía
- **Aprobación**: Cambios críticos requieren confirmación humana
- **Límites**: Definir claramente qué puede modificar cada agente
- **Explicabilidad**: Justificar decisiones con referencias a reglas
- **Reversibilidad**: Permitir deshacer cambios automáticos
