# Etapa 1: Compilar la aplicación React con Node (v22)
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servir los estáticos compilados usando Nginx
FROM nginx:alpine
# Copiar configuración con soporte de plantilla de envsubst para sustitución dinámica de BACKEND_URL
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Copiar archivos compilados en la etapa de construcción
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
