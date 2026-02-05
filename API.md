# WCTraining Backend API

API REST desarrollada con NestJS + MongoDB para la plataforma de entrenamiento WCTraining.

## 🚀 Características

- **Autenticación con Tokens Opacos**: Sistema seguro de autenticación sin JWT, usando tokens aleatorios almacenados en base de datos
- **MongoDB con Mongoose**: Modelado de datos robusto con schemas y validación
- **Manejo de Sesiones**: Soporte para múltiples dispositivos con gestión de sesiones activas
- **Roles y Permisos**: Sistema de autorización basado en roles (User, Admin, Trainer)
- **Validación de DTOs**: Validación automática de datos de entrada
- **Manejo de Errores**: Filtro global para respuestas de error consistentes

## 📋 Requisitos Previos

- Node.js 18+
- MongoDB 6.0+
- pnpm (recomendado) o npm

## 🔧 Instalación

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Configurar MongoDB en .env
MONGODB_URI=mongodb://localhost:27017/wctraining
```

## ⚙️ Variables de Entorno

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wctraining
BCRYPT_SALT_ROUNDS=12
TOKEN_EXPIRATION_HOURS=24
```

## 🏃 Ejecutar

```bash
# Desarrollo
pnpm start:dev

# Producción
pnpm build
pnpm start:prod
```

## 📚 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint      | Descripción               | Auth |
| ------ | ------------- | ------------------------- | ---- |
| POST   | `/register`   | Registrar nuevo usuario   | ❌   |
| POST   | `/login`      | Iniciar sesión            | ❌   |
| POST   | `/logout`     | Cerrar sesión actual      | ✅   |
| POST   | `/logout-all` | Cerrar todas las sesiones | ✅   |
| POST   | `/refresh`    | Renovar token             | ✅   |
| GET    | `/me`         | Obtener perfil actual     | ✅   |
| GET    | `/sessions`   | Listar sesiones activas   | ✅   |
| GET    | `/health`     | Health check              | ❌   |

### Usuarios (`/api/users`)

| Método | Endpoint       | Descripción           | Auth | Rol   |
| ------ | -------------- | --------------------- | ---- | ----- |
| GET    | `/`            | Listar usuarios       | ✅   | Admin |
| GET    | `/me`          | Mi perfil             | ✅   | -     |
| GET    | `/:id`         | Obtener usuario       | ✅   | Admin |
| PUT    | `/me`          | Actualizar mi perfil  | ✅   | -     |
| PUT    | `/me/password` | Cambiar mi contraseña | ✅   | -     |
| PUT    | `/:id`         | Actualizar usuario    | ✅   | Admin |
| DELETE | `/:id`         | Desactivar usuario    | ✅   | Admin |

## 🔐 Autenticación

La API usa **tokens opacos** almacenados en MongoDB. Para endpoints protegidos, incluir el header:

```
Authorization: Bearer <token>
```

### Ejemplo de Registro

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "password": "Password123"
  }'
```

### Ejemplo de Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "Password123"
  }'
```

### Respuesta Exitosa

```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "_id": "...",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "role": "user",
    "status": "active"
  },
  "token": "abc123...",
  "expiresAt": "2026-02-05T..."
}
```

## 📁 Estructura del Proyecto

```
src/
├── auth/                    # Módulo de autenticación
│   ├── decorators/          # @CurrentUser, @Roles, @Public
│   ├── dto/                 # LoginDto, RegisterDto
│   ├── guards/              # AuthGuard, RolesGuard
│   ├── schemas/             # Session schema
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── token.service.ts     # Lógica de tokens opacos
├── users/                   # Módulo de usuarios
│   ├── dto/                 # CreateUserDto, UpdateUserDto
│   ├── schemas/             # User schema
│   ├── users.controller.ts
│   └── users.service.ts
├── common/                  # Utilidades compartidas
│   └── filters/             # Filtros de excepciones
├── config/                  # Configuración
│   └── configuration.ts
├── app.module.ts
└── main.ts
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Tokens opacos de 256 bits de entropía
- Sesiones con expiración automática (TTL index)
- Validación de estado de usuario en cada request
- CORS configurado para frontend

## 📝 Modelo de Usuario

```typescript
{
  firstName: string,      // 2-50 caracteres
  lastName: string,       // 2-50 caracteres
  email: string,          // único, lowercase
  password: string,       // min 8, mayúscula, minúscula, número
  role: 'user' | 'admin' | 'trainer',
  status: 'active' | 'inactive' | 'suspended',
  avatar: string | null,
  emailVerified: boolean,
  lastLoginAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

## 📝 Modelo de Sesión

```typescript
{
  userId: ObjectId,       // Referencia al usuario
  token: string,          // Token opaco (64 caracteres hex)
  expiresAt: Date,        // Fecha de expiración
  userAgent: string,      // Navegador/dispositivo
  ipAddress: string,      // IP del cliente
  isActive: boolean,      // Estado de la sesión
  lastActivityAt: Date,   // Última actividad
  createdAt: Date,
  updatedAt: Date
}
```
