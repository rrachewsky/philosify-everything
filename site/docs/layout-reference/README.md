# 📸 Layout Reference Screenshots

Este diretório contém screenshots de referência do layout correto do Philosify.

**Use estes screenshots para comparar antes de fazer qualquer alteração no CSS.**

## 📁 Estrutura

```
layout-reference/
├── desktop/
│   ├── logged-out.png      # Tela inicial sem login
│   ├── logged-in.png       # Tela com usuário logado
│   ├── user-menu.png       # Detalhe do menu do usuário
│   └── payment-modal.png   # Modal de pagamento
│
├── mobile/
│   ├── logged-out.png      # Mobile sem login
│   ├── logged-in.png       # Mobile com usuário logado
│   ├── user-menu.png       # Menu do usuário no mobile
│   └── payment-modal.png   # Modal de pagamento mobile
│
└── README.md               # Este arquivo
```

## 📏 Como tirar screenshots de referência

### Desktop (1920x1080)
1. Abra https://philosify.org no Chrome
2. Pressione F12 para abrir DevTools
3. Clique no ícone de dispositivo (Toggle device toolbar)
4. Selecione "Responsive" e defina 1920x1080
5. Tire screenshot com Ctrl+Shift+P > "Capture screenshot"

### Mobile (375x812 - iPhone X)
1. Abra https://philosify.org no Chrome
2. Pressione F12 para abrir DevTools
3. Clique no ícone de dispositivo
4. Selecione "iPhone X" ou defina 375x812
5. Tire screenshot

## ✅ Checklist de Screenshots Necessários

### Desktop:
- [ ] `desktop/logged-out.png` - Página inicial sem login
- [ ] `desktop/logged-in.png` - Página com usuário logado (mostrando username, balance, etc)
- [ ] `desktop/user-menu.png` - Close-up do menu do usuário

### Mobile:
- [ ] `mobile/logged-out.png` - Página inicial sem login
- [ ] `mobile/logged-in.png` - Página com usuário logado
- [ ] `mobile/user-menu.png` - Close-up do menu do usuário

## 🔄 Quando Atualizar

Atualize os screenshots sempre que:
1. Uma alteração de layout for **aprovada** e **commitada**
2. O layout atual estiver diferente dos screenshots de referência

## ⚠️ Importante

**NUNCA delete screenshots antigos sem ter novos aprovados.**

Se precisar atualizar, crie uma pasta `archive/` e mova os antigos para lá com a data.







