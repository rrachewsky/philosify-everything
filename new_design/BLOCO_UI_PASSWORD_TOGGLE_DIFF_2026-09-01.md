# UI — Toggle "olho" (mostrar/ocultar senha) em todos os campos · diff para OK

**Data:** 2026-09-01 · **Status:** proposto. **Nada editado, sem build, sem commit.**
**Método i18n:** cirúrgico byte-estável CRLF (18 idiomas), como sempre.

---

## 1. Mapeamento — todos os campos de senha do site

| Onde | Campos | Toggle hoje |
|---|---|---|
| `components/auth/LoginModal.jsx:89` | senha (1) | ✅ via `PasswordInput` |
| `components/auth/SignupModal.jsx:175,186` | senha + confirmar (2) | ✅ via `PasswordInput` |
| `components/account/AccountModal.jsx:662,675` | nova senha + confirmar (Security) (2) | ✅ via `PasswordInput` |
| `pages/ResetPasswordPage.jsx:98,115` | nova senha + confirmar (página do link) (2) | ✅ via `PasswordInput` |
| **`pages/v2/SignInPage.jsx:103`** | **senha (1)** | ❌ `type="password"` cru |
| **`pages/v2/SignUpPage.jsx:140,152`** | **senha + confirmar (2)** | ❌ `type="password"` cru |

**Componentes vivos no v2:** SignIn/SignUp = `/signin` `/signup` (auth dedicada v2). LoginModal/SignupModal montados
nos sidebars de **todos os módulos** (cinema/news/literature/music/quiz/unsafe-zone). AccountModal via `NavAccount`
(Configurações → Security). ResetPasswordPage = rota do link de reset. **Nenhum outro `type="password"` no grep.**

## 2. Estado do `PasswordInput` atual (lacunas vs. pedido)

`components/common/PasswordInput.jsx` já alterna `password↔text` e tem SVG de olho, **mas**:
- `aria-label` **hardcoded em inglês** ("Show/Hide password") → precisa **i18n**.
- **sem `aria-pressed`**.
- `tabIndex={-1}` → o botão fica **fora da ordem de tab** → **não é operável por teclado** (o pedido quer tab+enter/espaço).
- **não preserva o foco** no input ao clicar.
- SVG `strokeWidth=2`, 20px → mais pesado que o traço fino do v2.

## 3. Abordagem — **um componente reutilizável** (recomendado)

Aprimorar o **próprio `PasswordInput`** e passar a usá-lo também nas páginas v2 (trocando os 3 `input type="password"`
crus). **Ganho de brinde:** modais + reset + account herdam a11y/i18n/traço-fino sem tocar em cada um. Sem duplicar
o toggle campo a campo.

### Diff 3.1 — `components/common/PasswordInput.jsx` (reescrita)
```jsx
// PasswordInput - Input field with show/hide password toggle
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function PasswordInput({
  id, value, onChange, placeholder, required, autoComplete, minLength, name,
  className = 'form-input',
  wrapperClassName = 'password-input-wrapper',
}) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const label = showPassword
    ? t('v2.auth.hidePassword', 'Hide password')
    : t('v2.auth.showPassword', 'Show password');

  return (
    <div className={wrapperClassName}>
      <input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        className={className}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
      />
      <button
        type="button"
        className="password-toggle-btn"
        // mousedown preventDefault → o clique NÃO rouba o foco do input (foco fica no campo)
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShowPassword((v) => !v)}
        aria-label={label}
        aria-pressed={showPassword}
        title={label}
      >
        {showPassword ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
export default PasswordInput;
```
**Por que resolve cada requisito:**
- **Teclado:** removido `tabIndex={-1}` → botão focável; `<button>` responde a **Enter/Espaço** nativamente.
- **Foco no input após clique (mouse):** `onMouseDown preventDefault` impede o botão de tomar o foco → o campo
  permanece focado. (No teclado o foco fica no botão, como esperado — padrão a11y.)
- **Autofill/gerenciadores:** só troca o **atributo** `type` no **mesmo** elemento (sem remontar); `id`/`name`/
  `autoComplete` preservados → managers e autofill continuam funcionando.
- **A11y:** `aria-label` i18n alternando + `aria-pressed`; SVGs `aria-hidden`.
- **Traço fino v2:** `strokeWidth 2→1.5`, `20→18` (aplica também aos modais → consistência).

**Não muda nomes de classe** → o CSS existente (`modal-cyberpunk.css` global `.password-toggle-btn`, override
`.v2.acct-surface` em `account.css`) segue valendo para modais/reset/account. **Nenhum** consumidor regride.

### Diff 3.2 — `pages/v2/SignInPage.jsx` e `SignUpPage.jsx`
Importar `PasswordInput` e trocar os 3 inputs de senha crus. Ex. (SignIn):
```jsx
// import { PasswordInput } from '@/components/common';   // topo
<label className="f" htmlFor="signinPassword">{t('v2.auth.password', 'Password')}</label>
<PasswordInput
  className="f"
  id="signinPassword"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
  autoComplete="current-password"
/>
```
SignUp idem nos dois campos (`autoComplete="new-password"`, ids `signupPassword`/`signupConfirmPassword`). Labels
permanecem (o `htmlFor` continua batendo com o `id`).

### Diff 3.3 — CSS: `styles/v2-pages/auth.css` (escopar o toggle na superfície auth, RTL-safe)
As páginas v2 usam `input.f` (não `.form-input`), então o CSS global não cobre o padding/tokens. Adicionar:
```css
/* Password show/hide toggle (component: PasswordInput) */
.v2 .pg-auth .password-input-wrapper { position: relative; width: 100%; }
.v2 .pg-auth .password-input-wrapper input.f { padding-inline-end: 44px; }
.v2 .pg-auth .password-toggle-btn {
  position: absolute; inset-inline-end: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: 0; color: var(--ink-low); cursor: pointer;
  padding: 2px; display: flex; align-items: center; justify-content: center;
}
.v2 .pg-auth .password-toggle-btn:hover,
.v2 .pg-auth .password-toggle-btn:focus-visible { color: var(--ink-hi); outline: none; }
```
- **Tokens:** `--ink-low` (repouso) → `--ink-hi` (hover/foco) — **idêntico ao toggle que o `account.css` já usa**
  (o "olho" v2 canônico). Se preferir o repouso em `--ink-mid` (mais claro), troco 1 linha.
- **RTL:** `inset-inline-end`/`padding-inline-end` → vira sozinho nos idiomas ar/fa/he (o global usa `right:` físico;
  aqui fica correto).
- Foco visível via teclado: `:focus-visible` acende `--ink-hi` (não mostra outline em clique de mouse).

### Diff 3.4 — i18n (18 idiomas): `v2.auth.showPassword` / `v2.auth.hidePassword`
Chaves novas (o namespace `v2.auth` já existe nos 18). Traduções propostas:

| lang | showPassword | hidePassword |
|---|---|---|
| en | Show password | Hide password |
| pt | Mostrar senha | Ocultar senha |
| es | Mostrar contraseña | Ocultar contraseña |
| fr | Afficher le mot de passe | Masquer le mot de passe |
| de | Passwort anzeigen | Passwort verbergen |
| it | Mostra password | Nascondi password |
| nl | Wachtwoord tonen | Wachtwoord verbergen |
| pl | Pokaż hasło | Ukryj hasło |
| hu | Jelszó megjelenítése | Jelszó elrejtése |
| tr | Şifreyi göster | Şifreyi gizle |
| ru | Показать пароль | Скрыть пароль |
| ar | إظهار كلمة المرور | إخفاء كلمة المرور |
| fa | نمایش رمز عبور | پنهان کردن رمز عبور |
| he | הצג סיסמה | הסתר סיסמה |
| hi | पासवर्ड दिखाएं | पासवर्ड छिपाएं |
| zh | 显示密码 | 隐藏密码 |
| ja | パスワードを表示 | パスワードを非表示 |
| ko | 비밀번호 표시 | 비밀번호 숨기기 |

## 4. Arquivos tocados
- `components/common/PasswordInput.jsx` (reescrita) · `pages/v2/SignInPage.jsx` (1) · `pages/v2/SignUpPage.jsx` (2)
- `styles/v2-pages/auth.css` (bloco novo) · `i18n/translations/*.json` × **18** (2 chaves cada).

## 5. Aceite proposto
Em `/signin` e `/signup`: olho à direita do campo; clicar revela (foco continua no campo); tab alcança o olho e
Enter/Espaço alterna; autofill/1Password/gerenciador do browser ainda preenchem; RTL (árabe) com o olho à esquerda;
NVDA/VoiceOver anunciam "Mostrar senha"/"Ocultar senha" + estado. Modais/reset/account seguem OK (traço mais fino).

**Deploy:** entra no **mesmo deploy do próximo ciclo do site** (sem deploy dedicado, salvo ordem). **Sem commit até ordem.**

**Preciso de você:** OK no approach (componente único reusado) + nos 4 diffs. Um ponto aberto: repouso do olho em
**`--ink-low`** (recomendo, = padrão do account) ou **`--ink-mid`**?

---

## EXECUTADO (2026-09-01)

**OK do Bob** no approach + 4 diffs; olho em repouso **`--ink-low`** (padrão do account).

- **`components/common/PasswordInput.jsx`** — reescrito (numstat 26/12): `useTranslation`, `aria-label` i18n +
  `aria-pressed`, `tabIndex={-1}` **removido** (teclado ok), `onMouseDown preventDefault` (foco fica no campo),
  SVG `1.5`/`18px`, props `name`/`wrapperClassName`.
- **`pages/v2/SignInPage.jsx`** (2/2) + **`SignUpPage.jsx`** (3/4) — import de `PasswordInput` (`../../components/common`)
  e os **3** inputs de senha trocados; labels/ids/autocomplete preservados.
- **`styles/v2-pages/auth.css`** (+15) — bloco do toggle escopado em `.v2 .pg-auth`, `--ink-low`→`--ink-hi`,
  logical props (`inset-inline-end`/`padding-inline-end`) para RTL.
- **i18n × 18** — `v2.auth.showPassword`/`hidePassword` via método byte-estável com **guard** (round-trip canônico ==
  original): **todos os 18 passaram**, numstat +3/-1 por arquivo (vírgula na chave anterior + 2 linhas).
- **Build:** `✓ 40.39s`. Verificado no bundle: CSS `pg-auth .password-toggle-btn` (chunk AuthShell),
  `Mostrar senha` (pt), `Show password` (en/index).

**Sem deploy dedicado** — entra no **próximo ciclo de deploy do site**. **Sem commit até ordem.**
