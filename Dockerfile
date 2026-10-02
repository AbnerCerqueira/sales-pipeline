# Imagem de desenvolvimento: o código vem do host por bind mount, então o
# objetivo não é empacotar a aplicação, e sim rodar o projeto inteiro em uma
# máquina sem Node instalado. `docker-compose.yml` sobe a API e o frontend a
# partir daqui, com hot reload.
#
# Sem `RUN --mount` de cache do pnpm de propósito: exigiria BuildKit, e a
# imagem precisa buildar num Docker mínimo também. O cache de camada na ordem
# dos COPY já evita reinstalar a cada mudança de código.
FROM node:24-bookworm-slim

# O pnpm chega pelo corepack, na versão fixada em `packageManager`.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH

WORKDIR /app

RUN corepack enable

# Manifests antes do código: a camada de dependências só é refeita quando eles
# mudam, e não a cada edição de arquivo.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3333 5173

# Fallback para `docker run` avulso; o compose troca o comando por serviço.
CMD ["pnpm", "dev"]
