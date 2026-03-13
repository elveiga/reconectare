# Reconectare - Plataforma de Equipamentos Odontológicos

## 🚀 Setup Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados MySQL

#### 2.1 Criar Usuário e Banco no MySQL Workbench

Abra o MySQL Workbench e execute:

```sql
CREATE USER 'reconectarehml'@'localhost' IDENTIFIED BY 'reconectarehml';
CREATE DATABASE reconectarehml CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON reconectarehml.* TO 'reconectarehml'@'localhost';
FLUSH PRIVILEGES;
```

#### 2.2 Executar Script de Inicialização

No MySQL Workbench, abra e execute o arquivo:
```
database/schema.sql
```

### 3. Configurar Variáveis de Ambiente

O arquivo `.env` já está configurado com as credenciais padrão:
- **Banco:** reconectarehml
- **Usuário:** reconectarehml
- **Senha:** reconectarehml

Se necessário, ajuste as configurações no arquivo `.env`.

### 4. Iniciar Aplicação

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` (ou porta configurada pelo Vite).

## 📊 Banco de Dados

### Estrutura das Tabelas

- **users** - Usuários (Admin e Seller)
- **listings** - Produtos/Equipamentos
- **brands** - Catálogo de Marcas
- **equipment_types** - Catálogo de Tipos de Equipamentos

### Credenciais de Teste

Após executar o script `schema.sql`, você terá 2 usuários de teste:

**Admin:**
- Email: `teste@example.com`
- Senha: `teste`

**Vendedor:**
- Email: `vendedor@example.com`
- Senha: `teste`

## 🔧 Tecnologias Utilizadas

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js (services layer)
- **Banco de Dados:** MySQL
- **Autenticação:** bcryptjs

## 📁 Estrutura do Projeto

```
LoopDigital/
├── database/
│   ├── schema.sql          # Script de inicialização do BD
│   └── README.md           # Documentação do banco
├── src/
│   ├── components/         # Componentes React
│   ├── contexts/           # Context API (conecta com services)
│   ├── lib/                # Utilitários (database.js)
│   ├── pages/              # Páginas da aplicação
│   └── services/           # Camada de acesso ao banco
├── .env                    # Variáveis de ambiente (NÃO versionar!)
├── .env.example            # Template das variáveis
└── package.json
```

## 🐛 Troubleshooting

### Erro de Conexão com MySQL

1. Verifique se o MySQL está rodando
2. Confirme as credenciais no `.env`
3. Teste a conexão:
   ```sql
   USE reconectarehml;
   SHOW TABLES;
   ```

### Porta em Uso

Se a porta 5173 estiver em uso, o Vite escolherá automaticamente outra porta.

## 📝 Próximos Passos

- [ ] Implementar upload de imagens
- [ ] Adicionar busca avançada
- [ ] Sistema de notificações
- [ ] Dashboard com estatísticas
- [ ] API REST completa para integrações

## 📄 Licença

Projeto privado - Todos os direitos reservados.
