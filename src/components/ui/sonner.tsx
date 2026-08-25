import { useEffect, useState } from "react";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

/**
 * TOAST — o canal de ERRO, OFFLINE e IA-INDISPONÍVEL do app inteiro (11
 * call-sites: App, ChatBox, OraclePage, PixelizerCard, GameStateContext…).
 *
 * O que estava aqui era o scaffold que veio do Figma, intacto, e ele tinha
 * dois defeitos que se somavam:
 *
 *  1. **Lia o tema do `next-themes`**, que este app NUNCA configura — ele
 *     alterna `[data-theme="light"|"dark"]` no `<html>` (script inline do
 *     `index.html`). Sem `<ThemeProvider>`, `useTheme()` devolvia sempre
 *     `"system"`, então o toast ficava idêntico nos dois temas.
 *  2. **Amarrava `--normal-bg` a `var(--popover)`** — justamente os tokens do
 *     scaffold shadcn que o footgun 10 do CLAUDE.md documenta como CONGELADOS
 *     no valor claro (só mudam sob `.dark`, classe que este app não aplica).
 *
 * Medido com o app em tema ESCURO (`body` = `rgb(14,35,35)`): creme `#FFFCF0`
 * com texto `#DC7609` a 13px — **3,08:1**. Abaixo de AA, e num texto que o
 * usuário PRECISA ler para decidir o que fazer.
 *
 * A correção é toda em `--sm2-*`, que são os tokens que respondem a
 * `[data-theme]` de verdade:
 *
 *  · fundo `--sm2-surface` e tinta `--sm2-ink` (par já medido em
 *    `src/styles/tokens.contrast.test.ts`);
 *  · `richColors` (que o `App.tsx` liga) NÃO é desligado — ele é REPINTADO:
 *    em vez do fundo saturado do sonner, o tipo do toast vira TINTA + BORDA
 *    (`--sm2-danger-ink` / `--sm2-gold-ink` / `--sm2-primary-ink` sobre
 *    `--sm2-surface`), que são pares medidos em AA nos DOIS temas;
 *  · 14px (`--sm2-text-sm`): o piso do sistema é 12, mas texto que o usuário
 *    precisa LER PARA DECIDIR é 14 (`src/styles/tokens.md`).
 *
 * `next-themes` fica sem consumidor nenhum no app depois desta troca.
 */

/** Tema ATIVO do app: `[data-theme]` no `<html>`, não `next-themes`. */
function useAppTheme(): "light" | "dark" {
  const ler = (): "light" | "dark" =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "light"
      ? "light"
      : "dark";

  const [tema, setTema] = useState<"light" | "dark">(ler);

  useEffect(() => {
    // O tema troca por mutação de atributo (SettingsPage escreve o dataset),
    // não por evento — sem o observer o toast aberto ficaria com a paleta
    // antiga até o próximo mount.
    const obs = new MutationObserver(() => setTema(ler()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    setTema(ler());
    return () => obs.disconnect();
  }, []);

  return tema;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useAppTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      // A classe entra por `toastOptions` porque o CSS do sonner é INJETADO em
      // runtime (um `<style>` no head, depois do nosso bundle): sem uma classe
      // própria no `<li>`, a regra dele venceria por ordem de documento. A
      // regra correspondente está no fim de `src/index.css`.
      toastOptions={{ className: "sm2-toast" }}
      style={
        {
          // Peça neutra
          "--normal-bg": "var(--sm2-surface)",
          "--normal-text": "var(--sm2-ink)",
          "--normal-border": "var(--sm2-line)",
          // richColors, repintado: TINTA + BORDA, nunca fundo saturado.
          "--success-bg": "var(--sm2-surface)",
          "--success-text": "var(--sm2-primary-ink)",
          "--success-border": "var(--sm2-primary-ink)",
          "--info-bg": "var(--sm2-surface)",
          "--info-text": "var(--sm2-primary-ink)",
          "--info-border": "var(--sm2-primary-ink)",
          "--warning-bg": "var(--sm2-surface)",
          "--warning-text": "var(--sm2-gold-ink)",
          "--warning-border": "var(--sm2-gold-ink)",
          "--error-bg": "var(--sm2-surface)",
          "--error-text": "var(--sm2-danger-ink)",
          "--error-border": "var(--sm2-danger-ink)",
          "--border-radius": "var(--sm2-radius-md)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
