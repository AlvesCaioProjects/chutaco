# Chutaço - Palpites Copa 2026

Plataforma responsiva de palpites para Copa do Mundo 2026.

## 🚀 Início Rápido

### Prerequisites
- Node.js 16+ e npm

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Abrirá em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

## 📁 Estrutura

```
chutaço/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Páginas principais
│   ├── utils/          # Helpers e funções auxiliares
│   ├── App.jsx         # Componente raiz
│   └── main.jsx        # Ponto de entrada
├── public/             # Ativos públicos
├── package.json        # Dependências
└── README.md          # Esta documentação
```

## 🔧 Configuração

1. Crie um projeto em [Supabase](https://supabase.com)
2. Configure as variáveis em `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_FOOTBALL_DATA_API_KEY` (de https://www.football-data.org/)

## 📦 Dependências

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend + Database + Auth
- **React Router** - Navigation

## 📝 Licença

MIT
