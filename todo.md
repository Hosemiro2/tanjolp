# TANJŌ Studio — Todo

## Banco de Dados
- [x] Schema: tabela `leads` com campos nome, email, whatsapp, cnpj, empresa, sessionToken, imagesGenerated
- [x] Schema: tabela `chat_messages` com leadId, role, content, imageUrls (JSON)
- [x] Executar migration SQL

## Design Global
- [x] Tema dark mode com CSS variables (fundo #0a0a0a, terracota #B5522A)
- [x] Tipografia Montserrat + Cormorant Garamond via Google Fonts
- [x] Animações e micro-interações premium (partículas, glow, float)

## Landing Page
- [x] Seção Hero: headline, subheadline, CTA, partículas/efeito visual, stats
- [x] Seção Pilares: Excelência, Tecnologia, Parceria, Confiança
- [x] Seção Sobre a TANJŌ: texto + grid de ícones
- [x] Seção Linha do Tempo: 4 passos do processo de produção
- [x] Seção Estúdio Danya AI: headline + formulário de captação
- [x] Footer: logo, links, contato, redes sociais
- [x] Navbar fixa com efeito de scroll

## Formulário de Captação B2B
- [x] Campos: Nome, E-mail, WhatsApp, CNPJ, Empresa (opcional)
- [x] Validação de CNPJ no frontend (algoritmo completo)
- [x] Validação de CNPJ no backend (server-side)
- [x] Formatação automática de CNPJ e WhatsApp
- [x] Salvar lead no banco de dados com sessionToken único
- [x] Notificação ao proprietário a cada novo lead
- [x] Redirect automático para /studio após cadastro validado

## Backend (tRPC)
- [x] Procedure `leads.register`: salvar lead + validar CNPJ + notificar proprietário
- [x] Procedure `leads.getSession`: recuperar sessão por sessionToken
- [x] Procedure `danya.chat`: conversa com LLM (System Prompt Danya AI completo)
- [x] Procedure `danya.generateImages`: engenharia de prompt + geração de imagens (limite 3)
- [x] Procedure `danya.getHistory`: histórico de mensagens por sessão

## Chat Danya AI (/studio)
- [x] Interface de chat premium dark mode
- [x] Proteção de sessão (redirect para / se sem token)
- [x] Carregamento do histórico de mensagens
- [x] Mensagem de boas-vindas automática na primeira visita
- [x] Typing indicator animado
- [x] Exibição de imagens geradas no chat (sem opção de download)
- [x] Contador visual de renders (0/3 → 3/3)
- [x] Mensagem de fechamento B2B após 3 imagens
- [x] Engenharia de prompt automática (briefing → prompt técnico)
- [x] Detecção de <image_prompt> na resposta da IA

## Testes
- [x] Vitest: validação de CNPJ (7 casos: válido, formatado, dígitos iguais, dígito errado, tamanho errado, vazio, 00000000000000)
- [x] Vitest: procedure leads.register rejeita CNPJ inválido
- [x] Vitest: auth.logout limpa cookie de sessão

## Visual Redesign (Navbar + Hero)
- [x] Redesenhar navbar: logo oficial (imagem) no canto superior esquerdo, nome TANJŌ centralizado com Cormorant Garamond, links "A Fábrica" e "Processo" à esquerda do nome, links "Qualidade" e "Contato" à direita do nome
- [x] Background Hero futurista 3D: efeito tridimensional com perspectiva CSS 3D, malha de grade animada, orbes/anéis luminosos com gradiente terracota, profundidade de campo visual
- [x] Aplicar mesmo logo fix na navbar do DanyaStudio.tsx
