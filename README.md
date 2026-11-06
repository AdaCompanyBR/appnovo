# Demandas

App de desktop para anotar as demandas do dia a dia em segundos. É local, funciona offline e fica protegido por usuário e senha.

Cada demanda vira uma comanda numerada. As que você está fazendo ficam presas no trilho **Na mesa**, as atrasadas e as que vencem hoje aparecem primeiro, e concluir uma demanda "arranca" a comanda do trilho.

## Como rodar no Windows

Pré-requisito: [Node.js 20 ou mais novo](https://nodejs.org/) (versão LTS).

```bash
git clone https://github.com/AdaCompanyBR/appnovo.git demandas
cd demandas
npm install
npm start
```

No primeiro uso o app pede para criar a conta (usuário e senha) e mostra um **código de recuperação**. Guarde esse código: sem ele não dá para recuperar as demandas se você esquecer a senha.

### Gerar o instalador (.exe)

```bash
npm run dist
```

O instalador (`Demandas-instalador-<versão>.exe`) e a versão portátil (`Demandas-portatil-<versão>.exe`) saem na pasta `dist/`. Como não são assinados digitalmente, o Windows mostra o aviso "O Windows protegeu o computador": clique em **Mais informações → Executar assim mesmo**. Depois de instalado, o app aparece no menu Iniciar como **Demandas**.

## Anotar rápido

De qualquer lugar do Windows, aperte **Ctrl + Shift + Espaço**, escreva e dê **Enter**. Só o título é obrigatório. Os detalhes vão na mesma linha:

| Você escreve | Vira |
|---|---|
| `!urgente` `!alta` `!baixa` (ou `!u` `!a` `!b`, `!!!` `!!`) | prioridade |
| `@carla` | quem pediu |
| `#checkout` | projeto ou cliente |
| `hoje` `amanhã` `sex` `segunda` `15/11` `15/11/2026` | prazo |
| `~fazendo` `~aguardando` | status |

Exemplo: `Corrigir timeout do /pedidos !urgente @carla #checkout hoje`

Fechar a janela só a esconde: o app continua no ícone da bandeja para o atalho funcionar. Para sair de vez, use **Sair** no menu da bandeja.

## Atalhos

| Ação | Tecla |
|---|---|
| Nova demanda (global) | Ctrl Shift Espaço |
| Campo de captura | N ou Ctrl N |
| Buscar | Ctrl F |
| Hoje · Fila · Aguardando · Feitas | Ctrl 1 – 4 |
| Próxima / anterior | ↓ ↑ ou J K |
| Abrir detalhes | Enter |
| Concluir / reabrir | Espaço ou X |
| Fazendo agora (vai para a mesa) | F |
| Aguardando alguém | W |
| Prioridade urgente · alta · normal · baixa | 1 – 4 |
| Excluir | Delete |
| Desfazer | Ctrl Z |
| Bloquear | Ctrl L |
| Lista de atalhos | ? |

## Segurança e dados

- A senha **nunca é gravada**. O app guarda só um sal e um verificador derivados com scrypt.
- As demandas ficam num arquivo cifrado com AES-256-GCM. A chave desse arquivo é protegida pela sua senha e, separadamente, pelo código de recuperação.
- Trocar a senha não recifra os dados, só troca a proteção da chave.
- Depois de 5 senhas erradas, o acesso pausa por 30 s, e a pausa dobra a cada novo erro (até 15 min).
- O app se bloqueia sozinho quando o Windows é bloqueado (Win + L) ou entra em suspensão.
- Os dados ficam em `%APPDATA%\Demandas\cofre\`. Antes de cada gravação o app guarda uma cópia do último estado (`.bak`).
- **Exportar demandas (JSON)**, no menu da conta, gera um arquivo **não cifrado** para backup ou migração.

## Estrutura

```
src/main/main.js      janela, bandeja, atalho global, IPC
src/main/preload.js   ponte segura (contextIsolation + sandbox)
src/main/vault.js     contas, senhas, cifragem e persistência
src/renderer/         interface (HTML, CSS, JS sem framework)
test/                 testes do cofre e da captura rápida
```

Para rodar os testes:

```bash
npm test
```

## Licenças de terceiros

Fontes Archivo e JetBrains Mono (SIL Open Font License) e ícones Lucide (ISC). Os arquivos de licença estão em `src/renderer/fonts/` e `src/renderer/assets/`.
