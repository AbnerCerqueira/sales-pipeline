import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Input de texto controlado sincronizado com um param da URL.
 *
 * - o valor inicial vem da URL (deep link / refresh);
 * - a digitação é commitada com debounce via `commit`;
 * - mudança externa da URL ressincroniza o input e, pelo cleanup do efeito,
 *   cancela o debounce pendente — o timer velho nunca reescreve por cima do
 *   estado restaurado;
 * - em POP (voltar/avançar) o texto não commitado é descartado mesmo quando o
 *   param de texto não mudou, senão o timer pendente reescreveria a URL logo
 *   depois da navegação;
 * - `reset()` zera localmente para a página escrever a URL no mesmo clique
 *   (limpar busca/filtros) sem esperar o debounce.
 */
export function useSearchInput(
  urlValue: string,
  commit: (value: string) => void
) {
  const [value, setValue] = useState(urlValue);
  const urlRef = useRef(urlValue);
  // Ref do commit: evita reagendar o timer a cada render (o kanban
  // re-renderiza no polling de 10s e o timer recomeçaria do zero).
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (urlValue === urlRef.current) {
      return;
    }
    urlRef.current = urlValue;
    setValue(urlValue);
  }, [urlValue]);

  // Ex.: voltar de `?name=ada&page=2` para `?name=ada` — o param de texto não
  // muda, então o efeito de cima não cancela o timer; sem este descarte, a
  // digitação pendente reescreveria a URL logo após o POP.
  // biome-ignore lint/correctness/useExhaustiveDependencies: location.key força o efeito a rodar a cada navegação; dois POPs seguidos não mudam navigationType.
  useEffect(() => {
    if (navigationType !== "POP") {
      return;
    }
    urlRef.current = urlValue;
    setValue(urlValue);
  }, [location.key, navigationType, urlValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = value.trim();
      if (next === urlRef.current) {
        return;
      }
      urlRef.current = next;
      commitRef.current(next);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const reset = useCallback(() => {
    urlRef.current = "";
    setValue("");
  }, []);

  return { reset, setValue, value };
}
